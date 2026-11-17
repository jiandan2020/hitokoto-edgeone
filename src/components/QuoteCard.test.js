import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import QuoteCard from "./QuoteCard.vue";

describe("QuoteCard", () => {
    it("加载且无句子时显示骨架屏", () => {
        const wrapper = mount(QuoteCard, {
            props: { quote: null, loading: true, error: null, copied: false },
        });
        expect(wrapper.find(".skeleton").exists()).toBe(true);
        expect(wrapper.find(".quote-text").exists()).toBe(false);
    });

    it("有句子时显示正文与出处", () => {
        const quote = { hitokoto: "测试句子", from: "测试出处", from_who: "作者", type: "a" };
        const wrapper = mount(QuoteCard, {
            props: { quote, loading: false, error: null, copied: false },
        });
        expect(wrapper.find(".quote-text").text()).toBe("测试句子");
        expect(wrapper.find(".quote-source").text()).toContain("测试出处");
        expect(wrapper.find(".quote-source").text()).toContain("作者");
    });

    it("无作者时只显示出处", () => {
        const quote = { hitokoto: "测试句子", from: "测试出处", from_who: null, type: "a" };
        const wrapper = mount(QuoteCard, {
            props: { quote, loading: false, error: null, copied: false },
        });
        expect(wrapper.find(".quote-source").text()).toBe("测试出处");
    });

    it("出错且无句子时显示错误与重试", () => {
        const wrapper = mount(QuoteCard, {
            props: { quote: null, loading: false, error: "暂时无法获取一言", copied: false },
        });
        expect(wrapper.find(".error-text").text()).toBe("暂时无法获取一言");
        expect(wrapper.find(".error-state .btn").exists()).toBe(true);
    });

    it("点击换一句触发 refresh", async () => {
        const quote = { hitokoto: "测试句子", from: "测试", from_who: null, type: "a" };
        const wrapper = mount(QuoteCard, {
            props: { quote, loading: false, error: null, copied: false },
        });
        const buttons = wrapper.findAll(".quote-actions .btn");
        await buttons[0].trigger("click");
        expect(wrapper.emitted("refresh")).toBeTruthy();
    });

    it("复制后按钮显示已复制", () => {
        const quote = { hitokoto: "测试句子", from: "测试", from_who: null, type: "a" };
        const wrapper = mount(QuoteCard, {
            props: { quote, loading: false, error: null, copied: true, copyFailed: false },
        });
        const buttons = wrapper.findAll(".quote-actions .btn");
        expect(buttons[1].text()).toBe("已复制");
    });

    it("复制失败时按钮显示复制失败", () => {
        const quote = { hitokoto: "测试句子", from: "测试", from_who: null, type: "a" };
        const wrapper = mount(QuoteCard, {
            props: { quote, loading: false, error: null, copied: false, copyFailed: true },
        });
        const buttons = wrapper.findAll(".quote-actions .btn");
        expect(buttons[1].text()).toBe("复制失败");
    });

    it("加载中换一句按钮禁用", () => {
        const quote = { hitokoto: "测试句子", from: "测试", from_who: null, type: "a" };
        const wrapper = mount(QuoteCard, {
            props: { quote, loading: true, error: null, copied: false },
        });
        const buttons = wrapper.findAll(".quote-actions .btn");
        expect(buttons[0].attributes("disabled")).toBeDefined();
        expect(buttons[0].text()).toBe("获取中…");
    });
});
