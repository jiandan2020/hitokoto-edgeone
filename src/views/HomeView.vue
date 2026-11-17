<template>
    <div class="container home-view">
        <section class="hero">
            <p class="eyebrow">HITOKOTO · API</p>
            <h1>每一次刷新，遇见一句新的文字</h1>
            <p class="subtitle">一个简单、快速、免费的随机一言 API。</p>
        </section>
        <section class="quote-placeholder">
            <p class="quote-text">生活不止眼前的苟且，还有诗和远方。</p>
            <p class="quote-source">— 示例语录</p>
            <p class="note">首页完整实现见阶段 2：随机一言卡片、分类筛选、长度设置、复制、刷新与 API 调用示例。</p>
        </section>
    </div>
</template>

<script setup>
</script>

<style scoped>
.home-view {
    padding-top: 48px;
    padding-bottom: 64px;
}

.hero {
    text-align: center;
    padding: 32px 0;
}

.eyebrow {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--color-primary);
}

.hero h1 {
    margin: 0 0 12px;
    font-size: clamp(28px, 5vw, 44px);
    line-height: 1.25;
    letter-spacing: -0.01em;
}

.subtitle {
    margin: 0;
    font-size: 17px;
    color: var(--color-text-secondary);
}

.quote-placeholder {
    max-width: 680px;
    margin: 24px auto 0;
    padding: 32px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
    text-align: center;
}

.quote-text {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.5;
}

.quote-source {
    margin: 0 0 16px;
    color: var(--color-text-secondary);
}

.note {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted);
}
</style>
