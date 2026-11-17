import { ref } from "vue";
import { copyText } from "../utils/copy.js";

const FETCH_TIMEOUT_MS = 10000;

export function useHitokoto() {
    const quote = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const category = ref("");
    const minLength = ref("");
    const maxLength = ref("");
    const copied = ref(false);
    const copyFailed = ref(false);
    let controller = null;
    let requestId = 0;
    let copyTimer = null;

    function buildUrl() {
        const params = new URLSearchParams();
        if (category.value) {
            params.set("c", category.value);
        }
        if (minLength.value !== "" && minLength.value !== null) {
            params.set("min_length", String(minLength.value));
        }
        if (maxLength.value !== "" && maxLength.value !== null) {
            params.set("max_length", String(maxLength.value));
        }
        const query = params.toString();
        return query ? `/api?${query}` : "/api";
    }

    async function fetchQuote() {
        if (controller) {
            controller.abort();
        }
        const currentId = ++requestId;
        const currentController = new AbortController();
        controller = currentController;
        let timedOut = false;
        const timeoutId = setTimeout(() => {
            timedOut = true;
            currentController.abort();
        }, FETCH_TIMEOUT_MS);
        loading.value = true;
        error.value = null;
        try {
            const response = await fetch(buildUrl(), { signal: currentController.signal });
            if (!response.ok) {
                throw new Error(`请求失败：${response.status}`);
            }
            const data = await response.json();
            if (!data || typeof data.hitokoto !== "string") {
                throw new Error("返回数据格式错误");
            }
            if (currentId === requestId) {
                quote.value = data;
            }
        } catch (err) {
            if (currentId !== requestId) {
                return;
            }
            if (timedOut) {
                error.value = "请求超时，请重试";
            } else if (err && err.name !== "AbortError") {
                error.value = "暂时无法获取一言";
                console.error("获取一言失败:", err);
            }
        } finally {
            clearTimeout(timeoutId);
            if (currentId === requestId) {
                loading.value = false;
                controller = null;
            }
        }
    }

    function refresh() {
        fetchQuote();
    }

    function setCategory(key) {
        category.value = key;
        fetchQuote();
    }

    function setLength(min, max) {
        minLength.value = min;
        maxLength.value = max;
        fetchQuote();
    }

    function quoteText() {
        if (!quote.value) {
            return "";
        }
        const source = quote.value.from_who
            ? `${quote.value.from} · ${quote.value.from_who}`
            : quote.value.from;
        return `${quote.value.hitokoto} —— ${source}`;
    }

    async function copyQuote() {
        const text = quoteText();
        if (!text) {
            return false;
        }
        const ok = await copyText(text);
        if (!ok) {
            copyFailed.value = true;
            if (copyTimer) {
                clearTimeout(copyTimer);
            }
            copyTimer = setTimeout(() => {
                copyFailed.value = false;
            }, 2000);
            return false;
        }
        copyFailed.value = false;
        copied.value = true;
        if (copyTimer) {
            clearTimeout(copyTimer);
        }
        copyTimer = setTimeout(() => {
            copied.value = false;
        }, 2000);
        return true;
    }

    async function shareQuote() {
        const text = quoteText();
        if (!text) {
            return false;
        }
        if (navigator.share) {
            try {
                await navigator.share({ title: "小周的一言 API", text });
                return true;
            } catch {
                return copyQuote();
            }
        }
        return copyQuote();
    }

    function dispose() {
        requestId++;
        if (controller) {
            controller.abort();
            controller = null;
        }
        if (copyTimer) {
            clearTimeout(copyTimer);
            copyTimer = null;
        }
        loading.value = false;
    }

    return {
        quote,
        loading,
        error,
        category,
        minLength,
        maxLength,
        copied,
        copyFailed,
        buildUrl,
        fetchQuote,
        refresh,
        setCategory,
        setLength,
        copyQuote,
        shareQuote,
        dispose,
    };
}
