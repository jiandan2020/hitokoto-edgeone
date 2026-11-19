import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import AppHeader from "./AppHeader.vue";

describe("AppHeader", () => {
    let wrapper;

    beforeEach(() => {
        // jsdom 没有 matchMedia，useTheme 初始化会用到，先 stub。
        window.matchMedia = vi.fn().mockImplementation(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }));
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
            wrapper = null;
        }
    });

    function mountHeader() {
        // focus() 只在元素挂进 document 时才生效，测试里显式 attach。
        wrapper = mount(AppHeader, {
            attachTo: document.body,
            global: {
                stubs: {
                    RouterLink: { template: "<a><slot /></a>" },
                },
            },
        });
        return wrapper;
    }

    it("点菜单按钮打开移动端菜单", async () => {
        const wrapper = mountHeader();
        expect(wrapper.find(".nav-mobile").exists()).toBe(false);
        await wrapper.find(".menu-btn").trigger("click");
        expect(wrapper.find(".nav-mobile").exists()).toBe(true);
        expect(wrapper.find(".menu-btn").attributes("aria-expanded")).toBe("true");
    });

    it("Esc 关闭菜单后焦点回到菜单按钮", async () => {
        const wrapper = mountHeader();
        const menuButton = wrapper.find(".menu-btn");
        await menuButton.trigger("click");
        expect(wrapper.find(".nav-mobile").exists()).toBe(true);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await flushPromises();
        expect(wrapper.find(".nav-mobile").exists()).toBe(false);
        expect(document.activeElement).toBe(menuButton.element);
    });

    it("菜单关闭时按 Esc 不抢焦点", async () => {
        const wrapper = mountHeader();
        expect(wrapper.find(".nav-mobile").exists()).toBe(false);
        const other = document.createElement("button");
        document.body.appendChild(other);
        other.focus();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await flushPromises();
        expect(document.activeElement).toBe(other);
        document.body.removeChild(other);
    });
});
