import { createRouter, createWebHistory } from "vue-router";

const routes = [
    { path: "/", name: "home", component: () => import("../views/HomeView.vue"), meta: { title: "小周的一言 API" } },
    { path: "/docs", name: "docs", component: () => import("../views/DocsView.vue"), meta: { title: "接口文档 · 小周的一言 API" } },
    { path: "/stats", name: "stats", component: () => import("../views/StatsView.vue"), meta: { title: "运行状况 · 小周的一言 API" } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 };
    },
});

router.afterEach((to) => {
    if (to.meta.title) {
        document.title = to.meta.title;
    }
});

export default router;
