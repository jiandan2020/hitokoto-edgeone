<template>
    <section class="api-examples" aria-labelledby="api-examples-title">
        <h2 id="api-examples-title">接口一览</h2>
        <p class="section-intro">六种常用调用方式，点卡片复制完整 URL。</p>
        <div class="api-grid">
            <article
                v-for="card in cards"
                :key="card.path"
                class="api-card"
                tabindex="0"
                role="button"
                :aria-label="`复制 ${card.title} 的 URL`"
                @click="copyCard(card)"
                @keydown.enter="copyCard(card)"
                @keydown.space.prevent="copyCard(card)"
            >
                <span class="api-icon" aria-hidden="true" v-html="card.icon"></span>
                <h3>{{ card.title }}</h3>
                <p>{{ card.description }}</p>
                <code class="api-path"><span class="method">GET</span> {{ card.path }}</code>
                <span class="copy-hint">{{ copiedPath === card.path ? "已复制" : "点按复制" }}</span>
            </article>
        </div>
        <div class="code-example">
            <div class="code-head">
                <span class="code-title">请求示例</span>
                <button type="button" class="copy-btn" @click="copyExample">
                    {{ exampleCopied ? "已复制" : "复制" }}
                </button>
            </div>
            <pre class="code-block"><code>{{ exampleText }}</code></pre>
        </div>
    </section>
</template>

<script setup>
import { ref } from "vue";
import { copyText } from "../utils/copy.js";

const origin = typeof window !== "undefined" ? window.location.origin : "https://hitokoto.xzccs.top";

const cards = [
    {
        title: "随机一言",
        description: "从全部 11,277 句中随机返回一句。",
        path: "/api",
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.5 4v2c0 1 0 1 1 1z"/></svg>',
    },
    {
        title: "分类筛选",
        description: "只返回指定分类的句子，如动画。",
        path: "/api?c=a",
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    },
    {
        title: "长度筛选",
        description: "按句子长度筛选，包含边界。",
        path: "/api?min_length=10&max_length=20",
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 8.7 15.3 2.7a1 1 0 0 0-1.4 0L2.7 13.9a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0L21.3 10a1 1 0 0 0 0-1.4z"/><path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/></svg>',
    },
    {
        title: "多种返回格式",
        description: "JSON、纯文本、JS 代码三种编码。",
        path: "/api?encode=text",
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    },
    {
        title: "JSONP 回调",
        description: "跨域场景用回调函数包裹结果。",
        path: "/api?callback=cb",
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1"/></svg>',
    },
    {
        title: "均衡抽取",
        description: "先等概率选分类，再在分类内抽一句。",
        path: "/api?mode=category",
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
    },
];

const copiedPath = ref("");
const exampleCopied = ref(false);
let copyTimer = null;

const exampleText = `GET ${origin}/api?c=a

{
  "id": 4838,
  "hitokoto": "示例句子",
  "type": "a",
  "from": "《白箱》",
  "from_who": null,
  "length": 12,
  "timestamp": 1794938934411
}`;

async function copyCard(card) {
    const ok = await copyText(`${origin}${card.path}`);
    if (!ok) {
        return;
    }
    copiedPath.value = card.path;
    if (copyTimer) {
        clearTimeout(copyTimer);
    }
    copyTimer = setTimeout(() => {
        copiedPath.value = "";
    }, 2000);
}

async function copyExample() {
    const ok = await copyText(exampleText);
    if (!ok) {
        return;
    }
    exampleCopied.value = true;
    if (copyTimer) {
        clearTimeout(copyTimer);
    }
    copyTimer = setTimeout(() => {
        exampleCopied.value = false;
    }, 2000);
}
</script>

<style scoped>
.api-examples {
    padding: 48px 0 8px;
}

.api-examples h2 {
    margin: 0 0 8px;
    font-size: 26px;
    text-align: center;
}

.section-intro {
    margin: 0 0 28px;
    text-align: center;
    color: var(--color-text-secondary);
}

.api-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.api-card {
    padding: 22px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.api-card:hover,
.api-card:focus-visible {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.api-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-bottom: 14px;
    border-radius: var(--radius-md);
    background: var(--color-primary-container);
    color: var(--color-primary-text);
}

.api-card h3 {
    margin: 0 0 6px;
    font-size: 17px;
}

.api-card p {
    margin: 0 0 14px;
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.55;
}

.api-path {
    display: block;
    padding: 8px 10px;
    background: var(--color-surface-variant);
    border-radius: var(--radius-sm);
    font-size: 13px;
    word-break: break-all;
    color: var(--color-text);
}

.method {
    color: var(--color-primary);
    font-weight: 700;
}

.copy-hint {
    display: block;
    margin-top: 10px;
    font-size: 13px;
    color: var(--color-text-muted);
    text-align: right;
}

.code-example {
    margin-top: 28px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
}

.code-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
}

.code-title {
    font-size: 14px;
    font-weight: 600;
}

.copy-btn {
    padding: 6px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 13px;
    transition: all var(--transition-fast);
}

.copy-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.code-block {
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    font-size: 13.5px;
    line-height: 1.7;
    background: var(--color-surface-variant);
}

.code-block code {
    white-space: pre;
}

@media (max-width: 860px) {
    .api-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 560px) {
    .api-grid {
        grid-template-columns: 1fr;
    }
}
</style>
