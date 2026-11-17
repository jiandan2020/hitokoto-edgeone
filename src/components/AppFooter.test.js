import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createWebHistory } from "vue-router";
import AppFooter from "./AppFooter.vue";

function makeRouter() {
    return createRouter({
        history: createWebHistory(),
        routes: [
            { path: "/", component: { template: "<div />" } },
            { path: "/docs", component: { template: "<div />" } },
            { path: "/stats", component: { template: "<div />" } },
        ],
    });
}

describe("AppFooter", () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it("备案链接带备案图标", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: "5.0.0" }) });
        const wrapper = mount(AppFooter, { global: { plugins: [makeRouter()] } });
        await flushPromises();
        const icpLink = wrapper.find(".icp-link");
        expect(icpLink.exists()).toBe(true);
        expect(icpLink.text()).toContain("赣ICP备2025074916号-1");
        const icon = icpLink.find("img.icp-icon");
        expect(icon.exists()).toBe(true);
        expect(icon.attributes("src")).toBe("/icp-beian.png");
    });

    it("拉到 package.json 后显示版本号", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: "5.0.0" }) });
        const wrapper = mount(AppFooter, { global: { plugins: [makeRouter()] } });
        await flushPromises();
        expect(globalThis.fetch).toHaveBeenCalledWith("/package.json");
        const version = wrapper.find(".footer-version");
        expect(version.exists()).toBe(true);
        expect(version.text()).toBe("v5.0.0");
    });

    it("拉不到版本号时不显示版本号", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
        const wrapper = mount(AppFooter, { global: { plugins: [makeRouter()] } });
        await flushPromises();
        expect(wrapper.find(".footer-version").exists()).toBe(false);
    });
});
