<template>
    <section class="playground" aria-labelledby="playground-title">
        <h2 id="playground-title">在线调试</h2>
        <p class="section-intro">选一个预设，或自己调参数，实时发请求看结果。</p>
        <div class="pg-grid">
            <div class="pg-controls">
                <label class="field">
                    <span class="field-label">功能预设</span>
                    <select v-model="preset" @change="applyPreset">
                        <option v-for="p in presets" :key="p.key" :value="p.key">{{ p.label }}</option>
                    </select>
                </label>
                <label class="field">
                    <span class="field-label">分类</span>
                    <select v-model="category">
                        <option v-for="cat in categories" :key="cat.key" :value="cat.key">{{ cat.label }}</option>
                    </select>
                </label>
                <div class="field-row">
                    <label class="field">
                        <span class="field-label">最短长度</span>
                        <input type="number" min="1" inputmode="numeric" v-model="minLength" placeholder="不限" />
                    </label>
                    <label class="field">
                        <span class="field-label">最长长度</span>
                        <input type="number" min="1" inputmode="numeric" v-model="maxLength" placeholder="不限" />
                    </label>
                </div>
                <label class="field">
                    <span class="field-label">返回格式</span>
                    <select v-model="encode">
                        <option value="json">JSON</option>
                        <option value="text">纯文本</option>
                        <option value="js">JavaScript</option>
                    </select>
                </label>
                <label class="field" v-if="encode === 'js'">
                    <span class="field-label">回调函数</span>
                    <input type="text" v-model="callback" placeholder="如 show" />
                </label>
                <label class="field">
                    <span class="field-label">抽取模式</span>
                    <select v-model="mode">
                        <option value="weighted">weighted（默认）</option>
                        <option value="category">category（均衡）</option>
                        <option value="balanced">balanced（同 category）</option>
                    </select>
                </label>
                <p v-if="paramError" class="param-error">{{ paramError }}</p>
            </div>
            <div class="pg-result">
                <div class="url-preview">
                    <code>{{ previewUrl }}</code>
                    <button type="button" class="copy-btn" @click="copyUrl">{{ urlCopied ? "已复制" : "复制" }}</button>
                </div>
                <button type="button" class="btn btn-primary send-btn" :disabled="sending" @click="sendRequest">
                    {{ sending ? "请求中…" : "发送请求" }}
                </button>
                <div v-if="result" class="result-box">
                    <div class="result-meta">
                        <span class="status" :class="result.ok ? 'ok' : 'bad'">{{ result.status }} {{ result.statusText }}</span>
                        <span class="timing">{{ result.ms }} ms</span>
                        <button type="button" class="copy-btn" @click="copyResult">{{ resultCopied ? "已复制" : "复制响应" }}</button>
                    </div>
                    <pre class="result-body"><code>{{ result.body }}</code></pre>
                </div>
                <div class="curl-block">
                    <div class="curl-head">
                        <span class="curl-title">curl</span>
                        <button type="button" class="copy-btn" @click="copyCurl">{{ curlCopied ? "已复制" : "复制" }}</button>
                    </div>
                    <pre class="curl-body"><code>{{ curlCommand }}</code></pre>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref, computed } from "vue";
import { CATEGORIES } from "../constants/index.js";

const categories = CATEGORIES;
const origin = typeof window !== "undefined" ? window.location.origin : "https://hitokoto.xzccs.top";

const presets = [
    { key: "random", label: "随机一言", params: {} },
    { key: "category", label: "分类筛选", params: { category: "a" } },
    { key: "length", label: "长度筛选", params: { minLength: "10", maxLength: "20" } },
    { key: "text", label: "纯文本", params: { encode: "text" } },
    { key: "js", label: "JSONP 回调", params: { encode: "js", callback: "cb" } },
    { key: "balanced", label: "均衡抽取", params: { mode: "category" } },
];

const preset = ref("random");
const category = ref("");
const minLength = ref("");
const maxLength = ref("");
const encode = ref("json");
const callback = ref("");
const mode = ref("weighted");
const paramError = ref("");
const sending = ref(false);
const result = ref(null);
const urlCopied = ref(false);
const resultCopied = ref(false);
const curlCopied = ref(false);
let controller = null;
let timer = null;

const previewUrl = computed(() => {
    const params = new URLSearchParams();
    if (category.value) {
        params.set("c", category.value);
    }
    if (minLength.value !== "" && minLength.value !== null) {
        params.set("min_length", String(minLength.value));
    }
    if (maxLength.value !== "" && maxLength.value !== null) {
        params.set("max_length", String(maxLength.value));
    }
    if (encode.value && encode.value !== "json") {
        params.set("encode", encode.value);
    }
    if (encode.value === "js" && callback.value) {
        params.set("callback", callback.value);
    }
    if (mode.value && mode.value !== "weighted") {
        params.set("mode", mode.value);
    }
    const query = params.toString();
    return query ? `/api?${query}` : "/api";
});

const curlCommand = computed(() => `curl "${origin}${previewUrl.value}"`);

function applyPreset() {
    const p = presets.find((x) => x.key === preset.value) || presets[0];
    category.value = p.params.category || "";
    minLength.value = p.params.minLength || "";
    maxLength.value = p.params.maxLength || "";
    encode.value = p.params.encode || "json";
    callback.value = p.params.callback || "";
    mode.value = p.params.mode || "weighted";
    paramError.value = "";
    result.value = null;
}

function validateParams() {
    const min = minLength.value === "" || minLength.value === null ? null : Number(minLength.value);
    const max = maxLength.value === "" || maxLength.value === null ? null : Number(maxLength.value);
    if ((min !== null && (!Number.isInteger(min) || min < 1)) || (max !== null && (!Number.isInteger(max) || max < 1))) {
        paramError.value = "长度须为正整数";
        return false;
    }
    if (min !== null && max !== null && max < min) {
        paramError.value = "最长长度不能小于最短长度";
        return false;
    }
    paramError.value = "";
    return true;
}

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

function flash(refValue, setter) {
    setter(true);
    if (timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(() => setter(false), 1500);
}

async function copyUrl() {
    await copyText(`${origin}${previewUrl.value}`);
    flash(urlCopied, (v) => { urlCopied.value = v; });
}

async function copyResult() {
    if (!result.value) {
        return;
    }
    await copyText(result.value.body);
    flash(resultCopied, (v) => { resultCopied.value = v; });
}

async function copyCurl() {
    await copyText(curlCommand.value);
    flash(curlCopied, (v) => { curlCopied.value = v; });
}

async function sendRequest() {
    if (!validateParams() || sending.value) {
        return;
    }
    if (controller) {
        controller.abort();
    }
    controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    sending.value = true;
    const start = performance.now();
    try {
        const response = await fetch(previewUrl.value, { signal });
        const text = await response.text();
        let body = text;
        try {
            body = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
            body = text;
        }
        result.value = {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText || "",
            ms: Math.round(performance.now() - start),
            body,
        };
    } catch (err) {
        if (err && err.name === "AbortError") {
            return;
        }
        result.value = {
            ok: false,
            status: 0,
            statusText: "请求失败",
            ms: Math.round(performance.now() - start),
            body: String(err && err.message ? err.message : err),
        };
    } finally {
        clearTimeout(timeoutId);
        sending.value = false;
    }
}
</script>

<style scoped>
.playground {
    padding: 8px 0;
}

.playground h2 {
    margin: 0 0 8px;
    font-size: 26px;
}

.section-intro {
    margin: 0 0 24px;
    color: var(--color-text-secondary);
}

.pg-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 20px;
    align-items: start;
}

.pg-controls,
.pg-result {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.field-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
}

.field select,
.field input {
    padding: 9px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 14px;
    font-family: inherit;
}

.field select:focus,
.field input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
    border-color: var(--color-primary);
}

.field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.param-error {
    margin: 0;
    font-size: 13px;
    color: var(--color-error);
}

.url-preview {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.url-preview code {
    flex: 1;
    font-size: 13.5px;
    word-break: break-all;
    color: var(--color-text);
}

.copy-btn {
    flex: none;
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

.btn {
    padding: 11px 24px;
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

.btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
}

.send-btn {
    align-self: flex-start;
}

.result-box {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--color-surface);
}

.result-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--color-border);
    font-size: 13.5px;
}

.status {
    font-weight: 700;
}

.status.ok {
    color: var(--color-success);
}

.status.bad {
    color: var(--color-error);
}

.timing {
    color: var(--color-text-secondary);
}

.result-meta .copy-btn {
    margin-left: auto;
}

.result-body {
    margin: 0;
    padding: 14px 16px;
    max-height: 320px;
    overflow: auto;
    font-size: 13.5px;
    line-height: 1.7;
    background: var(--color-surface-variant);
    white-space: pre-wrap;
    word-break: break-word;
}

.curl-block {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--color-surface);
}

.curl-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--color-border);
}

.curl-title {
    font-size: 14px;
    font-weight: 600;
}

.curl-body {
    margin: 0;
    padding: 12px 14px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.6;
    background: var(--color-surface-variant);
    white-space: pre;
}

@media (max-width: 860px) {
    .pg-grid {
        grid-template-columns: 1fr;
    }
}
</style>
