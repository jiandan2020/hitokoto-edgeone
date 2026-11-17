import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    // 产物部署在 /dist/ 子路径下（EdgeOne 静态根目录为仓库根目录），
    // 页面入口由 edge-functions/index.js、docs.js、stats.js 同源取回 dist/index.html。
    base: "/dist/",
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
