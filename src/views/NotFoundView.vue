<template>
    <div class="not-found-view">
        <div class="container not-found-wrap">
            <p class="not-found-code">404</p>
            <h1>页面不存在</h1>
            <p class="not-found-desc">
                你访问的地址 <code>{{ $route.path }}</code> 不存在，可能是链接写错了，或者页面已经移动了。
            </p>
            <div class="not-found-actions">
                <RouterLink class="btn btn-primary" to="/">回首页</RouterLink>
                <RouterLink class="btn btn-outline" to="/docs">接口文档</RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup>
</script>

<style scoped>
.not-found-view {
    padding: 96px 0 80px;
    text-align: center;
}

.not-found-wrap {
    max-width: 560px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.not-found-code {
    margin: 0;
    font-size: clamp(72px, 16vw, 120px);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--color-primary);
    opacity: 0.9;
}

.not-found-wrap h1 {
    margin: 0;
    font-size: clamp(24px, 4vw, 32px);
    line-height: 1.3;
}

.not-found-desc {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: var(--color-text-secondary);
}

.not-found-desc code {
    padding: 2px 8px;
    background: var(--color-surface-variant);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    word-break: break-all;
}

.not-found-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 8px;
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
</style>
