import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import LineChart from "./LineChart.vue";

describe("LineChart", () => {
    const points = [
        { value: 10, time: "00:00" },
        { value: 20, time: "01:00" },
        { value: 30, time: "02:00" },
    ];

    function mountChart() {
        const wrapper = mount(LineChart, {
            props: {
                points,
                gradientId: "test-gradient",
                xLabelIndices: [0, 1, 2],
                xLabelFor: (p) => p.time,
                tooltipFor: (p) => `${p.time}：${p.value} 次`,
                itemTimeFor: (p) => p.time,
            },
        });
        // jsdom 的 getBoundingClientRect 全是 0，手动给一个尺寸。
        const svg = wrapper.find(".chart-svg").element;
        svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 680, height: 220, right: 680, bottom: 220, x: 0, y: 0 });
        return wrapper;
    }

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("鼠标悬停显示提示，移开隐藏", async () => {
        const wrapper = mountChart();
        const svg = wrapper.find(".chart-svg");
        await svg.trigger("pointermove", { pointerType: "mouse", clientX: 100 });
        await flushPromises();
        expect(wrapper.find(".chart-tooltip").exists()).toBe(true);
        await svg.trigger("pointerleave");
        await flushPromises();
        expect(wrapper.find(".chart-tooltip").exists()).toBe(false);
    });

    it("触屏点选后提示保留，抬起手指不消失", async () => {
        const wrapper = mountChart();
        const svg = wrapper.find(".chart-svg");
        await svg.trigger("pointerdown", { pointerType: "touch", clientX: 100 });
        await flushPromises();
        expect(wrapper.find(".chart-tooltip").exists()).toBe(true);
        // 抬起手指（pointerleave / pointercancel）也不藏。
        await svg.trigger("pointerleave");
        await flushPromises();
        expect(wrapper.find(".chart-tooltip").exists()).toBe(true);
        await svg.trigger("pointercancel");
        await flushPromises();
        expect(wrapper.find(".chart-tooltip").exists()).toBe(true);
    });

    it("触屏点选后点图表外面关闭提示", async () => {
        const wrapper = mountChart();
        const svg = wrapper.find(".chart-svg");
        await svg.trigger("pointerdown", { pointerType: "touch", clientX: 100 });
        await flushPromises();
        expect(wrapper.find(".chart-tooltip").exists()).toBe(true);
        document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        await flushPromises();
        expect(wrapper.find(".chart-tooltip").exists()).toBe(false);
    });

    it("数据明细用键盘可展开的 details", () => {
        const wrapper = mountChart();
        const details = wrapper.find(".data-details");
        expect(details.exists()).toBe(true);
        expect(details.element.tagName).toBe("DETAILS");
        expect(details.find("summary").text()).toBe("查看数据");
    });
});
