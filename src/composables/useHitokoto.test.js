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

    it("copyQuote 复制成功后 2 秒恢复", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText } });
        const { quote, copied, copyQuote } = useHitokoto();
        quote.value = { hitokoto: "测试句子", from: "测试", from_who: "作者" };
        await copyQuote();
        expect(writeText).toHaveBeenCalledWith("测试句子 —— 测试 · 作者");
        expect(copied.value).toBe(true);
        vi.advanceTimersByTime(2000);
        expect(copied.value).toBe(false);
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
});
