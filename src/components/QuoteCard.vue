<template>
    <article class="quote-card" aria-live="polite">
        <div v-if="loading && !quote" class="skeleton" aria-label="加载中">
            <div class="skeleton-line long"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-source"></div>
        </div>
        <div v-else-if="error && !quote" class="error-state">
            <p class="error-text">{{ error }}</p>
            <button type="button" class="btn btn-primary" @click="$emit('retry')">重新获取</button>
        </div>
        <template v-else-if="quote">
            <span class="quote-mark" aria-hidden="true">❝</span>
            <p class="quote-text" :class="{ fading: loading }">{{ quote.hitokoto }}</p>
            <p class="quote-source">
                <span v-if="quote.from_who">{{ quote.from }} · {{ quote.from_who }}</span>
                <span v-else>{{ quote.from }}</span>
            </p>
            <p v-if="error" class="inline-error">{{ error }}，显示的是上一条。</p>
        </template>
        <div class="quote-actions">
            <button
                type="button"
                class="btn btn-primary"
                :disabled="loading"
                @click="$emit('refresh')"
            >
                {{ loading ? "获取中…" : "换一句" }}
            </button>
            <button
                type="button"
                class="btn btn-outline"
                :disabled="!quote"
                @click="$emit('copy')"
            >
                {{ copied ? "已复制" : "复制" }}
            </button>
            <button
                type="button"
                class="btn btn-outline"
                :disabled="!quote"
                @click="$emit('share')"
            >
                分享
            </button>
        </div>
    </article>
</template>

<script setup>
defineProps({
    quote: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
    copied: { type: Boolean, default: false },
});

defineEmits(["refresh", "copy", "share", "retry"]);
</script>

<style scoped>
.quote-card {
    position: relative;
    padding: 36px 32px 28px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
    text-align: center;
    overflow: hidden;
}

.quote-mark {
    display: block;
    font-size: 40px;
    line-height: 1;
    color: var(--color-primary);
    opacity: 0.35;
    margin-bottom: 8px;
}

.quote-text {
    margin: 0 0 16px;
    font-size: clamp(20px, 3.4vw, 28px);
    font-weight: 600;
    line-height: 1.6;
    letter-spacing: 0.01em;
    transition: opacity var(--transition-fast);
}

.quote-text.fading {
    opacity: 0.45;
}

.quote-source {
    margin: 0 0 24px;
    font-size: 15px;
    color: var(--color-text-secondary);
    text-align: right;
}

.inline-error {
    margin: -12px 0 16px;
    font-size: 13px;
    color: var(--color-warning);
}

.quote-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
}

.btn {
    padding: 10px 22px;
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

.btn-outline {
    background: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text);
}

.btn-outline:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.skeleton {
    min-height: 132px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 12px 0 24px;
}

.skeleton-line,
.skeleton-source {
    border-radius: var(--radius-sm);
    background: var(--color-surface-variant);
    animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton-line.long {
    width: 82%;
    height: 26px;
}

.skeleton-line.short {
    width: 56%;
    height: 26px;
}

.skeleton-source {
    width: 140px;
    height: 16px;
    align-self: flex-end;
}

@keyframes skeleton-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.45;
    }
}

.error-state {
    min-height: 132px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 12px 0 24px;
}

.error-text {
    margin: 0;
    font-size: 16px;
    color: var(--color-text-secondary);
}

@media (prefers-reduced-motion: reduce) {
    .skeleton-line,
    .skeleton-source {
        animation: none;
    }
}
</style>
