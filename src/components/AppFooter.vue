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
            <p v-if="apiVersion || bundleVersion" class="version-info" aria-busy="false">
                <template v-if="apiVersion">
                    当前 API 版本：v{{ apiVersion }}<template v-if="apiUpdated"> · 更新时间：{{ apiUpdated }}</template><br />
                </template>
                <template v-if="bundleVersion">
                    当前句子库版本：{{ bundleVersion }}<template v-if="bundleUpdated"> · 上游更新时间：{{ bundleUpdated }}</template>
                </template>
            </p>
            <a class="icp-link" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener"><img src="/icp-beian.png" alt="备案" class="icp-icon" />赣ICP备2025074916号-1</a>
        </div>
    </footer>
</template>

<script setup>
import { ref, onMounted } from "vue";

const apiVersion = ref("");
const apiUpdated = ref("");
const bundleVersion = ref("");
const bundleUpdated = ref("");

function formatTime(value) {
    if ((typeof value !== "number" && typeof value !== "string") || value === "") {
        return "";
    }
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
        return "";
    }
    return new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(date) + "（北京时间）";
}

async function loadApiVersion() {
    try {
        const response = await fetch("/package.json");
        if (!response.ok) {
            return;
        }
        const data = await response.json();
        if (data && typeof data.version === "string" && data.version) {
            apiVersion.value = data.version;
        }
        apiUpdated.value = formatTime(data && data.apiUpdatedAt);
    } catch {
        // 拉不到时不显示，不影响页脚其他内容
    }
}

async function loadBundleVersion() {
    try {
        const response = await fetch("/version.json");
        if (!response.ok) {
            return;
        }
        const data = await response.json();
        if (data && typeof data.bundle_version === "string" && data.bundle_version) {
            bundleVersion.value = data.bundle_version;
        }
        bundleUpdated.value = formatTime(data && data.updated_at);
    } catch {
        // 拉不到时不显示，不影响页脚其他内容
    }
}

onMounted(() => {
    loadApiVersion();
    loadBundleVersion();
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

.version-info {
    margin: 0;
    font-size: 13px;
    line-height: 1.7;
    color: var(--color-text-muted);
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
</style>
