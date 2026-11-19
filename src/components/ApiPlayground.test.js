import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ApiPlayground from "./ApiPlayground.vue";

vi.mock("../utils/copy.js", () => ({
    copyText: vi.fn().mockResolvedValue(true),
}));

describe("ApiPlayground", () => {
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

    function jsonResponse(body, status = 200) {
        return { ok: status >= 200 && status < 300, status, statusText: status === 200 ? "OK" : "Error", text: async () => JSON.stringify(body) };
    }

    function sendButton(wrapper) {
        return wrapper.find(".send-btn");
    }

    async function clickSend(wrapper) {
        await sendButton(wrapper).trigger("click");
        await flushPromises();
    }

    it("结果区显示发送时的 URL 快照，改参数后不跟预览走", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ hitokoto: "测试句子" }));
        const wrapper = mount(ApiPlayground);
        await clickSend(wrapper);
        expect(wrapper.find(".result-box").exists()).toBe(true);
        expect(wrapper.find(".result-url code").text()).toBe("/api");
        // 发完再改分类：预览 URL 变了，结果区仍是发送时的快照。
        const selects = wrapper.findAll("select");
        await selects[1].setValue("a");
        expect(wrapper.find(".url-preview code").text()).toBe("/api?c=a");
        expect(wrapper.find(".result-url code").text()).toBe("/api");
    });

    it("慢响应返回后结果与快照 URL 对应", async () => {
        let resolveFetch;
        globalThis.fetch = vi.fn().mockImplementation(() => new Promise((resolve) => { resolveFetch = resolve; }));
        const wrapper = mount(ApiPlayground);
        await sendButton(wrapper).trigger("click");
        await flushPromises();
        expect(wrapper.find(".result-box").exists()).toBe(false);
        resolveFetch(jsonResponse({ hitokoto: "慢响应句子" }));
        await flushPromises();
        expect(wrapper.find(".result-url code").text()).toBe("/api");
        expect(wrapper.find(".result-body").text()).toContain("慢响应句子");
    });

    it("10 秒超时有明确提示", async () => {
        // 模拟挂起的请求：监听 signal，abort 时按 AbortError 拒绝。
        globalThis.fetch = vi.fn().mockImplementation((url, init) => new Promise((resolve, reject) => {
            init.signal.addEventListener("abort", () => {
                const error = new Error("The operation was aborted.");
                error.name = "AbortError";
                reject(error);
            });
        }));
        const wrapper = mount(ApiPlayground);
        await sendButton(wrapper).trigger("click");
        await flushPromises();
        expect(wrapper.find(".result-box").exists()).toBe(false);
        await vi.advanceTimersByTimeAsync(10000);
        await flushPromises();
        expect(wrapper.find(".result-box").exists()).toBe(true);
        expect(wrapper.find(".status").text()).toContain("请求超时");
        expect(wrapper.find(".result-body").text()).toContain("请求超时（10 秒），请重试。");
    });

    it("切预设取消旧请求，晚到结果被忽略", async () => {
        let resolveFetch;
        globalThis.fetch = vi.fn().mockImplementation(() => new Promise((resolve) => { resolveFetch = resolve; }));
        const wrapper = mount(ApiPlayground);
        await sendButton(wrapper).trigger("click");
        await flushPromises();
        // 切到"分类筛选"预设：旧请求被取消，结果区清空。
        const presetSelect = wrapper.findAll("select")[0];
        await presetSelect.setValue("category");
        expect(wrapper.find(".result-box").exists()).toBe(false);
        // 旧请求此时才返回：序号已变，结果不应出现。
        resolveFetch(jsonResponse({ hitokoto: "晚到句子" }));
        await flushPromises();
        expect(wrapper.find(".result-box").exists()).toBe(false);
    });

    it("卸载组件取消进行中的请求", async () => {
        globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
        const wrapper = mount(ApiPlayground);
        await sendButton(wrapper).trigger("click");
        await flushPromises();
        expect(() => wrapper.unmount()).not.toThrow();
    });

    it("连续点两个复制按钮，各自独立恢复", async () => {
        const wrapper = mount(ApiPlayground);
        const copyButtons = wrapper.findAll(".copy-btn");
        // 初始只有两个复制按钮：第 0 个是预览 URL，第 1 个是 curl。
        await copyButtons[0].trigger("click");
        await flushPromises();
        expect(copyButtons[0].text()).toBe("已复制");
        await copyButtons[1].trigger("click");
        await flushPromises();
        expect(copyButtons[1].text()).toBe("已复制");
        // 只过 1500ms：两个都应恢复，不会因为共用 timer 卡住。
        await vi.advanceTimersByTimeAsync(1500);
        await flushPromises();
        expect(copyButtons[0].text()).toBe("复制");
        expect(copyButtons[1].text()).toBe("复制");
    });
});
