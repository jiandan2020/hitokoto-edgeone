<template>
    <header class="app-header">
        <div class="container header-inner">
            <RouterLink to="/" class="brand" @click="closeMenu">
                <img src="/favicon.svg" alt="" class="brand-logo" />
                <span class="brand-name">小周的一言 API</span>
            </RouterLink>
            <nav class="nav-desktop" aria-label="主导航">
                <RouterLink to="/" class="nav-link" active-class="active">首页</RouterLink>
                <RouterLink to="/docs" class="nav-link" active-class="active">接口文档</RouterLink>
                <RouterLink to="/stats" class="nav-link" active-class="active">运行状况</RouterLink>
            </nav>
            <div class="header-actions">
                <button
                    type="button"
                    class="theme-btn"
                    :aria-label="theme === 'dark' ? '切换到浅色' : '切换到深色'"
                    @click="toggleTheme"
                >
                    {{ theme === "dark" ? "☀️" : "🌙" }}
                </button>
                <button
                    type="button"
                    class="menu-btn"
                    ref="menuButtonRef"
                    aria-label="打开菜单"
                    :aria-expanded="menuOpen"
                    @click="toggleMenu"
                >
                    ☰
                </button>
            </div>
        </div>
        <transition name="menu-fade">
            <nav v-if="menuOpen" class="nav-mobile" aria-label="移动端导航">
                <RouterLink to="/" class="nav-link" active-class="active" @click="closeMenu">首页</RouterLink>
                <RouterLink to="/docs" class="nav-link" active-class="active" @click="closeMenu">接口文档</RouterLink>
                <RouterLink to="/stats" class="nav-link" active-class="active" @click="closeMenu">运行状况</RouterLink>
            </nav>
        </transition>
    </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useTheme } from "../composables/useTheme.js";

const { theme, toggleTheme } = useTheme();
const menuOpen = ref(false);
const menuButtonRef = ref(null);

function toggleMenu() {
    menuOpen.value = !menuOpen.value;
}

function closeMenu() {
    menuOpen.value = false;
}

function onKeydown(event) {
    if (event.key === "Escape" && menuOpen.value) {
        closeMenu();
        // Esc 关闭后把焦点还给菜单按钮，键盘用户不丢位置。
        if (menuButtonRef.value) {
            menuButtonRef.value.focus();
        }
    }
}

function onClickOutside(event) {
    if (menuOpen.value && !event.target.closest(".app-header")) {
        closeMenu();
    }
}

onMounted(() => {
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onClickOutside);
});

onUnmounted(() => {
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("click", onClickOutside);
});
</script>

<style scoped>
.app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: var(--header-height);
    background: color-mix(in srgb, var(--color-surface) 88%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
}

.header-inner {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 24px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--color-text);
    font-weight: 700;
    font-size: 17px;
    white-space: nowrap;
}

.brand:hover {
    text-decoration: none;
}

.brand-logo {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
}

.nav-desktop {
    display: flex;
    gap: 4px;
    margin-left: 8px;
}

.nav-link {
    padding: 8px 14px;
    border-radius: var(--radius-full);
    color: var(--color-text-secondary);
    font-size: 15px;
    transition: color var(--transition-fast), background-color var(--transition-fast);
}

.nav-link:hover {
    color: var(--color-text);
    background: var(--color-surface-variant);
    text-decoration: none;
}

.nav-link.active {
    color: var(--color-primary-text);
    background: var(--color-primary-container);
    font-weight: 600;
}

.header-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
}

.theme-btn,
.menu-btn {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 17px;
    transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.theme-btn:hover,
.menu-btn:hover {
    background: var(--color-surface-variant);
}

.menu-btn {
    display: none;
}

.nav-mobile {
    display: none;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
    transition: opacity var(--transition-base), transform var(--transition-base);
}

.menu-fade-enter-from,
.menu-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

@media (max-width: 640px) {
    .nav-desktop {
        display: none;
    }

    .menu-btn {
        display: inline-flex;
    }

    .nav-mobile {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 16px 12px;
        background: var(--color-surface);
        border-bottom: 1px solid var(--color-border);
        box-shadow: var(--shadow-md);
    }

    .nav-mobile .nav-link {
        padding: 10px 14px;
        border-radius: var(--radius-md);
    }
}
</style>
