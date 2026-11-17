import { describe, it, expect } from "vitest";
import router from "./index.js";

describe("router", () => {
    it("解析 / 为首页", async () => {
        const resolved = router.resolve("/");
        expect(resolved.name).toBe("home");
        expect(resolved.matched.length).toBe(1);
    });

    it("解析 /docs 为文档页", async () => {
        const resolved = router.resolve("/docs");
        expect(resolved.name).toBe("docs");
        expect(resolved.matched.length).toBe(1);
    });

    it("解析 /stats 为统计页", async () => {
        const resolved = router.resolve("/stats");
        expect(resolved.name).toBe("stats");
        expect(resolved.matched.length).toBe(1);
    });

    it("未知路径重定向到首页", async () => {
        const routes = router.getRoutes();
        const catchAll = routes.find((r) => r.path === "/:pathMatch(.*)*");
        expect(catchAll).toBeDefined();
        expect(catchAll.redirect).toBe("/");
        const resolved = router.resolve("/not-a-page");
        expect(resolved.matched[0].redirect).toBe("/");
    });

    it("三条命名路由均为懒加载", async () => {
        const routes = router.getRoutes().filter((r) => r.name);
        expect(routes).toHaveLength(3);
        for (const route of routes) {
            expect(typeof route.components.default).toBe("function");
        }
    });
});
