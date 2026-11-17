import { ref } from "vue";

const FETCH_TIMEOUT_MS = 10000;

export function useHitokoto() {
    const quote = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const category = ref("");
    const minLength = ref("");
    const maxLength = ref("");
    const copied = ref(false);
    let controller = null;
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
        controller = new AbortController();
        const signal = controller.signal;
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        loading.value = true;
        error.value = null;
        try {
            const response = await fetch(buildUrl(), { signal });
            if (!response.ok) {
                throw new Error(`请求失败：${response.status}`);
            }
            const data = await response.json();
            if (!data || typeof data.hitokoto !== "string") {
                throw new Error("返回数据格式错误");
            }
            quote.value = data;
        } catch (err) {
            if (err && err.name === "AbortError") {
                return;
            }
            error.value = "暂时无法获取一言";
            console.error("获取一言失败:", err);
        } finally {
            clearTimeout(timeoutId);
            loading.value = false;
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
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
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

    return {
        quote,
        loading,
        error,
        category,
        minLength,
        maxLength,
        copied,
        buildUrl,
        fetchQuote,
        refresh,
        setCategory,
        setLength,
        copyQuote,
        shareQuote,
    };
}
