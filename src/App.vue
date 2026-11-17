<template>
    <div class="app">
        <AppHeader />
        <main class="app-main">
            <RouterView />
        </main>
        <AppFooter />
    </div>
</template>

<script setup>
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
</script>

<style scoped>
.app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.app-main {
    flex: 1;
    padding-top: var(--header-height);
}
</style>
