<template>
    <footer class="app-footer">
        <div class="container footer-inner">
            <nav class="footer-links" aria-label="页脚导航">
                <RouterLink to="/docs">接口文档</RouterLink>
                <span class="sep">·</span>
                <RouterLink to="/stats">运行状况</RouterLink>
                <span class="sep">·</span>
                <a href="https://github.com/hitokoto-osc/sentences-bundle" target="_blank" rel="noopener">语句数据</a>
                <span class="sep">·</span>
                <a href="https://github.com/jiandan2020/hitokoto-edgeone" target="_blank" rel="noopener">项目源码</a>
            </nav>
            <a class="edgeone-badge" href="https://edgeone.ai/" target="_blank" rel="noopener">
                本站由 <img src="/edgeone-logo.png" alt="EdgeOne" class="edgeone-logo" /> 提供加速服务
            </a>
            <div class="footer-meta">
                <a class="icp-link" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener"><img src="/icp-beian.png" alt="备案" class="icp-icon" />赣ICP备2025074916号-1</a>
                <span class="sep" v-if="version">·</span>
                <span class="footer-version" v-if="version">v{{ version }}</span>
            </div>
        </div>
    </footer>
</template>

<script setup>
import { ref, onMounted } from "vue";

const version = ref("");

onMounted(async () => {
    try {
        const response = await fetch("/package.json");
        if (!response.ok) {
            return;
        }
        const data = await response.json();
        if (data && typeof data.version === "string" && data.version) {
            version.value = data.version;
        }
    } catch {
        // 拉不到版本号时不显示，不影响页脚其他内容
    }
});
</script>

<style scoped>
.app-footer {
    padding: 32px 0 28px;
    border-top: 1px solid var(--color-border);
}

.footer-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
}

.footer-links {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
    font-size: 14px;
}

.footer-links a {
    color: var(--color-text-secondary);
}

.footer-links a:hover {
    color: var(--color-primary);
}

.sep {
    color: var(--color-text-muted);
}

.edgeone-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--color-text-muted);
}

.edgeone-badge:hover {
    color: var(--color-primary);
    text-decoration: none;
}

.edgeone-logo {
    height: 20px;
    width: auto;
}

.footer-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
}

.icp-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--color-text-muted);
    padding: 4px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
}

.icp-link:hover {
    color: var(--color-primary);
    text-decoration: none;
}

.icp-icon {
    height: 15px;
    width: auto;
}

.footer-version {
    font-size: 12px;
    color: var(--color-text-muted);
}
</style>
