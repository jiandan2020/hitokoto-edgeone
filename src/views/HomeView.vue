<template>
    <div class="home-view">
        <section class="hero">
            <div class="container">
                <p class="eyebrow">HITOKOTO · API</p>
                <h1>每一次刷新，遇见一句新的文字</h1>
                <p class="subtitle">一个简单、快速、免费的随机一言 API</p>
                <div class="hero-actions">
                    <a class="btn btn-primary" href="#quote" @click.prevent="scrollToQuote">开始使用</a>
                    <RouterLink class="btn btn-outline" to="/docs">接口文档</RouterLink>
                </div>
            </div>
        </section>

        <section id="quote" class="quote-section">
            <div class="container quote-wrap">
                <QuoteCard
                    :quote="quote"
                    :loading="loading"
                    :error="error"
                    :copied="copied"
                    @refresh="refresh"
                    @copy="copyQuote"
                    @share="shareQuote"
                    @retry="refresh"
                />
                <QuoteFilters
                    :category="category"
                    :min-length="minLength"
                    :max-length="maxLength"
                    @update:category="category = $event"
                    @update:min-length="minLength = $event"
                    @update:max-length="maxLength = $event"
                    @change="fetchQuote"
                />
                <p class="api-url">
                    当前请求：<code>{{ buildUrl() }}</code>
                    <button type="button" class="url-copy" @click="copyUrl">复制</button>
                    <span v-if="urlCopied" class="url-copied">已复制</span>
                </p>
            </div>
        </section>

        <div class="container">
            <ApiExamples />
        </div>

        <section class="intro-section">
            <div class="container intro-grid">
                <div class="intro-item">
                    <h3>稳定轻量</h3>
                    <p>边缘函数直出，KV 三层缓存，冷热请求都快。</p>
                </div>
                <div class="intro-item">
                    <h3>筛选自由</h3>
                    <p>12 个分类、长度范围、三种返回格式，按需取句。</p>
                </div>
                <div class="intro-item">
                    <h3>随取随用</h3>
                    <p>无需注册与密钥，GET 一下就返回一句好话。</p>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import QuoteCard from "../components/QuoteCard.vue";
import QuoteFilters from "../components/QuoteFilters.vue";
import ApiExamples from "../components/ApiExamples.vue";
import { useHitokoto } from "../composables/useHitokoto.js";

const {
    quote,
    loading,
    error,
    category,
    minLength,
    maxLength,
    copied,
    buildUrl,
    fetchQuote,
    refresh,
    copyQuote,
    shareQuote,
} = useHitokoto();

const urlCopied = ref(false);
let urlTimer = null;

function scrollToQuote() {
    const el = document.getElementById("quote");
    if (el) {
        el.scrollIntoView({ behavior: "smooth" });
    }
}

async function copyUrl() {
    const url = `${window.location.origin}${buildUrl()}`;
    try {
        await navigator.clipboard.writeText(url);
    } catch {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    }
    urlCopied.value = true;
    if (urlTimer) {
        clearTimeout(urlTimer);
    }
    urlTimer = setTimeout(() => {
        urlCopied.value = false;
    }, 2000);
}

onMounted(() => {
    fetchQuote();
});

onUnmounted(() => {
    if (urlTimer) {
        clearTimeout(urlTimer);
    }
});
</script>

<style scoped>
.home-view {
    padding-bottom: 64px;
}

.hero {
    text-align: center;
    padding: 64px 0 40px;
}

.eyebrow {
    margin: 0 0 14px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--color-primary);
}

.hero h1 {
    margin: 0 auto 14px;
    max-width: 640px;
    font-size: clamp(30px, 5.4vw, 48px);
    line-height: 1.25;
    letter-spacing: -0.01em;
}

.subtitle {
    margin: 0 0 28px;
    font-size: 17px;
    color: var(--color-text-secondary);
}

.hero-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
}

.btn {
    display: inline-block;
    padding: 12px 28px;
    border-radius: var(--radius-full);
    font-size: 15px;
    font-weight: 600;
    border: 1px solid transparent;
    transition: all var(--transition-fast);
}

.btn-primary {
    background: var(--color-primary);
    color: #fff;
}

.btn-primary:hover {
    background: var(--color-primary-hover);
    text-decoration: none;
}

.btn-outline {
    background: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text);
}

.btn-outline:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    text-decoration: none;
}

.quote-section {
    padding: 8px 0 16px;
}

.quote-wrap {
    max-width: 760px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.api-url {
    margin: 0;
    font-size: 13.5px;
    color: var(--color-text-secondary);
    text-align: center;
}

.api-url code {
    padding: 3px 8px;
    background: var(--color-surface-variant);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    word-break: break-all;
}

.url-copy {
    margin-left: 8px;
    padding: 3px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 12.5px;
}

.url-copy:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.url-copied {
    margin-left: 6px;
    color: var(--color-success);
    font-size: 12.5px;
}

.intro-section {
    padding: 48px 0 8px;
}

.intro-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.intro-item {
    padding: 22px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
}

.intro-item h3 {
    margin: 0 0 6px;
    font-size: 16px;
}

.intro-item p {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
}

@media (max-width: 640px) {
    .intro-grid {
        grid-template-columns: 1fr;
    }

    .hero {
        padding: 44px 0 32px;
    }
}
</style>
