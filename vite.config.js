import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
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
