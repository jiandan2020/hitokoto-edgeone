import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    // EdgeOne Pages 以 dist/ 为静态根目录；产物与静态数据文件都输出到 dist/，
    // 页面入口 dist/index.html 由 SPA fallback 在 /、/docs、/stats 返回，
    // /api 等接口仍由 edge-functions 处理，不会被改写。
    base: "/",
    plugins: [vue()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap: false,
        chunkSizeWarningLimit: 200,
        rollupOptions: {
            output: {
                manualChunks: {
                    vue: ["vue", "vue-router"],
                },
            },
        },
    },
});
