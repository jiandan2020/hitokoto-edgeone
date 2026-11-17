<template>
    <div class="code-example">
        <div class="code-head" v-if="title || showCopy">
            <span class="code-title" v-if="title">{{ title }}</span>
            <button v-if="showCopy" type="button" class="copy-btn" @click="copy">
                {{ copied ? "已复制" : "复制" }}
            </button>
        </div>
        <pre class="code-block"><code>{{ code }}</code></pre>
    </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
    code: { type: String, required: true },
    title: { type: String, default: "" },
    showCopy: { type: Boolean, default: true },
});

const copied = ref(false);
let timer = null;

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        return true;
    }
}

async function copy() {
    await copyText(props.code);
    copied.value = true;
    if (timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(() => {
        copied.value = false;
    }, 1500);
}
</script>

<style scoped>
.code-example {
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
    padding: 10px 14px;
    border-bottom: 1px solid var(--color-border);
}

.code-title {
    font-size: 14px;
    font-weight: 600;
}

.copy-btn {
    padding: 5px 12px;
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
    padding: 14px 16px;
    overflow-x: auto;
    font-size: 13.5px;
    line-height: 1.7;
    background: var(--color-surface-variant);
}

.code-block code {
    white-space: pre;
}

@media (max-width: 600px) {
    .code-block {
        overflow-x: visible;
        padding: 12px 14px;
    }

    .code-block code {
        white-space: pre-wrap;
        word-break: break-word;
    }
}
</style>
