import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useHitokoto } from "./useHitokoto.js";

describe("useHitokoto", () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        vi.useFakeTimers();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("buildUrl 拼接分类与长度参数", () => {
        const { category, minLength, maxLength, buildUrl } = useHitokoto();
        expect(buildUrl()).toBe("/api");
        category.value = "a";
        minLength.value = 10;
        maxLength.value = 20;
        expect(buildUrl()).toBe("/api?c=a&min_length=10&max_length=20");
    });

    it("fetchQuote 成功时设置 quote 并清除 loading", async () => {
        const payload = { id: 1, hitokoto: "测试句子", type: "a", from: "测试", from_who: null, length: 4, timestamp: 1 };
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => payload,
        });
        const { quote, loading, error, fetchQuote } = useHitokoto();
        const promise = fetchQuote();
        expect(loading.value).toBe(true);
        await promise;
        expect(quote.value).toEqual(payload);
        expect(loading.value).toBe(false);
        expect(error.value).toBeNull();
        expect(globalThis.fetch).toHaveBeenCalledWith("/api", expect.any(Object));
    });

    it("fetchQuote 失败时设置 error", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
        const { quote, loading, error, fetchQuote } = useHitokoto();
        await fetchQuote();
        expect(quote.value).toBeNull();
        expect(loading.value).toBe(false);
        expect(error.value).toBe("暂时无法获取一言");
    });

    it("返回 HTTP 500 时显示错误并允许重试", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
        const { error, loading, fetchQuote } = useHitokoto();
        await fetchQuote();
        expect(error.value).toBe("暂时无法获取一言");
        expect(loading.value).toBe(false);
    });

    it("连续 fetchQuote 时取消前一次请求", async () => {
        let abortCount = 0;
        globalThis.fetch = vi.fn().mockImplementation((url, options) => {
            options.signal.addEventListener("abort", () => {
                abortCount++;
            });
            return new Promise(() => {});
        });
        const { fetchQuote } = useHitokoto();
        fetchQuote();
        fetchQuote();
        expect(abortCount).toBe(1);
    });

    it("旧请求完成后不改变新请求的加载状态", async () => {
        let resolvers = [];
        globalThis.fetch = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                resolvers.push(resolve);
            });
        });
        const { quote, loading, fetchQuote } = useHitokoto();
        const first = fetchQuote();
        const second = fetchQuote();
        expect(loading.value).toBe(true);
        resolvers[0]({ ok: true, json: async () => ({ id: 1, hitokoto: "旧句子", type: "a", from: "旧", from_who: null, length: 3, timestamp: 1 }) });
        await first;
        expect(loading.value).toBe(true);
        expect(quote.value).toBeNull();
        resolvers[1]({ ok: true, json: async () => ({ id: 2, hitokoto: "新句子", type: "a", from: "新", from_who: null, length: 3, timestamp: 2 }) });
        await second;
        expect(loading.value).toBe(false);
        expect(quote.value.hitokoto).toBe("新句子");
    });

    it("仅最新请求更新语录", async () => {
        let resolvers = [];
        globalThis.fetch = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                resolvers.push(resolve);
            });
        });
        const { quote, fetchQuote } = useHitokoto();
        const first = fetchQuote();
        const second = fetchQuote();
        resolvers[1]({ ok: true, json: async () => ({ id: 2, hitokoto: "新句子", type: "a", from: "新", from_who: null, length: 3, timestamp: 2 }) });
        await second;
        expect(quote.value.hitokoto).toBe("新句子");
        resolvers[0]({ ok: true, json: async () => ({ id: 1, hitokoto: "旧句子", type: "a", from: "旧", from_who: null, length: 3, timestamp: 1 }) });
        await first;
        expect(quote.value.hitokoto).toBe("新句子");
    });

    it("请求超过 10 秒显示超时提示", async () => {
        globalThis.fetch = vi.fn().mockImplementation((url, options) => {
            return new Promise((resolve, reject) => {
                options.signal.addEventListener("abort", () => {
                    const err = new Error("aborted");
                    err.name = "AbortError";
                    reject(err);
                });
            });
        });
        const { error, loading, fetchQuote } = useHitokoto();
        const promise = fetchQuote();
        vi.advanceTimersByTime(10000);
        await promise;
        expect(error.value).toBe("请求超时，请重试");
        expect(loading.value).toBe(false);
    });

    it("返回非法 JSON 不覆盖上次有效语录", async () => {
        const good = { id: 1, hitokoto: "有效句子", type: "a", from: "测试", from_who: null, length: 4, timestamp: 1 };
        globalThis.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => good })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, type: "a" }) });
        const { quote, error, fetchQuote } = useHitokoto();
        await fetchQuote();
        expect(quote.value.hitokoto).toBe("有效句子");
        await fetchQuote();
        expect(quote.value.hitokoto).toBe("有效句子");
        expect(error.value).toBe("暂时无法获取一言");
    });

    it("copyQuote 复制成功后 2 秒恢复", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText } });
        const { quote, copied, copyQuote } = useHitokoto();
        quote.value = { hitokoto: "测试句子", from: "测试", from_who: "作者" };
        const ok = await copyQuote();
        expect(ok).toBe(true);
        expect(writeText).toHaveBeenCalledWith("测试句子 —— 测试 · 作者");
        expect(copied.value).toBe(true);
        vi.advanceTimersByTime(2000);
        expect(copied.value).toBe(false);
    });

    it("复制失败时不显示成功并标记 copyFailed", async () => {
        Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
        document.execCommand = vi.fn().mockReturnValue(false);
        const { quote, copied, copyFailed, copyQuote } = useHitokoto();
        quote.value = { hitokoto: "测试句子", from: "测试", from_who: null };
        const ok = await copyQuote();
        expect(ok).toBe(false);
        expect(copied.value).toBe(false);
        expect(copyFailed.value).toBe(true);
        vi.advanceTimersByTime(2000);
        expect(copyFailed.value).toBe(false);
    });

    it("setCategory 切换分类并重新拉取", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ id: 2, hitokoto: "x", type: "i", from: "y", from_who: null, length: 1, timestamp: 1 }),
        });
        const { category, setCategory } = useHitokoto();
        await setCategory("i");
        expect(category.value).toBe("i");
        expect(globalThis.fetch).toHaveBeenCalledWith("/api?c=i", expect.any(Object));
    });

    it("dispose 取消未完成请求并清理状态", async () => {
        let abortCount = 0;
        globalThis.fetch = vi.fn().mockImplementation((url, options) => {
            options.signal.addEventListener("abort", () => {
                abortCount++;
            });
            return new Promise(() => {});
        });
        const { loading, fetchQuote, dispose } = useHitokoto();
        fetchQuote();
        expect(loading.value).toBe(true);
        dispose();
        expect(abortCount).toBe(1);
        expect(loading.value).toBe(false);
    });
});
