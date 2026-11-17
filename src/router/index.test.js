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

    it("未知路径渲染 404 页", async () => {
        const routes = router.getRoutes();
        const catchAll = routes.find((r) => r.path === "/:pathMatch(.*)*");
        expect(catchAll).toBeDefined();
        expect(catchAll.name).toBe("not-found");
        expect(catchAll.redirect).toBeUndefined();
        const resolved = router.resolve("/not-a-page");
        expect(resolved.name).toBe("not-found");
        expect(resolved.matched.length).toBe(1);
    });

    it("四条命名路由均为懒加载", async () => {
        const routes = router.getRoutes().filter((r) => r.name);
        expect(routes).toHaveLength(4);
        for (const route of routes) {
            expect(typeof route.components.default).toBe("function");
        }
    });
});
