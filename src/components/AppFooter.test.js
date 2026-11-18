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

function mockVersionFetches(pkg, bundle) {
    globalThis.fetch = vi.fn().mockImplementation((url) => {
        if (url === "/package.json") {
            return Promise.resolve({ ok: true, json: async () => pkg });
        }
        if (url === "/version.json") {
            return Promise.resolve({ ok: true, json: async () => bundle });
        }
        return Promise.resolve({ ok: false, status: 404 });
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
        mockVersionFetches({ version: "5.0.0" }, { bundle_version: "1.0.1382" });
        const wrapper = mount(AppFooter, { global: { plugins: [makeRouter()] } });
        await flushPromises();
        const icpLink = wrapper.find(".icp-link");
        expect(icpLink.exists()).toBe(true);
        expect(icpLink.text()).toContain("赣ICP备2025074916号-1");
        const icon = icpLink.find("img.icp-icon");
        expect(icon.exists()).toBe(true);
        expect(icon.attributes("src")).toBe("/icp-beian.png");
    });

    it("显示 API 版本与句子库版本，不显示更新时间", async () => {
        mockVersionFetches(
            { version: "5.0.0", apiUpdatedAt: "2026-11-18T02:39:23+08:00" },
            { bundle_version: "1.0.1382", updated_at: 1794917954795 },
        );
        const wrapper = mount(AppFooter, { global: { plugins: [makeRouter()] } });
        await flushPromises();
        expect(globalThis.fetch).toHaveBeenCalledWith("/package.json");
        expect(globalThis.fetch).toHaveBeenCalledWith("/version.json");
        const info = wrapper.find(".version-info");
        expect(info.exists()).toBe(true);
        const text = info.text();
        expect(text).toContain("API 版本：v5.0.0");
        expect(text).toContain("句子库版本：1.0.1382");
        expect(text).not.toContain("当前");
        expect(text).not.toContain("更新时间");
        expect(text).not.toContain("北京时间");
    });

    it("只拉到 API 版本时只显示 API 那行", async () => {
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url === "/package.json") {
                return Promise.resolve({ ok: true, json: async () => ({ version: "5.0.0", apiUpdatedAt: "2026-11-18T02:39:23+08:00" }) });
            }
            return Promise.resolve({ ok: false, status: 404 });
        });
        const wrapper = mount(AppFooter, { global: { plugins: [makeRouter()] } });
        await flushPromises();
        const info = wrapper.find(".version-info");
        expect(info.exists()).toBe(true);
        expect(info.text()).toContain("API 版本：v5.0.0");
        expect(info.text()).not.toContain("句子库");
    });

    it("两处都拉不到时不显示版本信息", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
        const wrapper = mount(AppFooter, { global: { plugins: [makeRouter()] } });
        await flushPromises();
        expect(wrapper.find(".version-info").exists()).toBe(false);
    });
});
