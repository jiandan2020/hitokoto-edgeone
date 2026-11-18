<template>
    <div class="quote-filters">
        <div class="filter-row" role="group" aria-label="分类筛选">
            <button
                v-for="cat in quickCategories"
                :key="cat.key"
                type="button"
                class="chip"
                :class="{ active: modelCategory === cat.key }"
                :aria-pressed="modelCategory === cat.key"
                @click="onSelectCategory(cat.key)"
            >
                {{ cat.key === modelCategory ? "✓ " : "" }}{{ cat.label }}
            </button>
            <select
                class="category-select"
                :value="modelCategory"
                aria-label="全部分类"
                @change="onSelectCategory($event.target.value)"
            >
                <option v-for="cat in categories" :key="cat.key" :value="cat.key">
                    {{ cat.label }}
                </option>
            </select>
        </div>
        <div class="filter-row length-row">
            <label class="length-field">
                最短
                <input
                    type="number"
                    min="1"
                    inputmode="numeric"
                    :value="modelMinLength"
                    placeholder="不限"
                    aria-label="最短长度"
                    @change="onMinLength($event.target.value)"
                />
            </label>
            <span class="length-sep">—</span>
            <label class="length-field">
                最长
                <input
                    type="number"
                    min="1"
                    inputmode="numeric"
                    :value="modelMaxLength"
                    placeholder="不限"
                    aria-label="最长长度"
                    @change="onMaxLength($event.target.value)"
                />
            </label>
            <span v-if="lengthError" class="length-error">{{ lengthError }}</span>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { CATEGORIES, QUICK_CATEGORIES } from "../constants/index.js";

const props = defineProps({
    category: { type: String, default: "" },
    minLength: { type: [String, Number], default: "" },
    maxLength: { type: [String, Number], default: "" },
});

const emit = defineEmits(["update:category", "update:minLength", "update:maxLength", "change"]);

const categories = CATEGORIES;
const quickCategories = computed(() => CATEGORIES.filter((c) => QUICK_CATEGORIES.includes(c.key)));
const modelCategory = computed(() => props.category);
const modelMinLength = computed(() => props.minLength);
const modelMaxLength = computed(() => props.maxLength);
const lengthError = ref("");

function onSelectCategory(key) {
    emit("update:category", key);
    emit("change");
}

function parseLength(value) {
    if (value === "" || value === null || value === undefined) {
        return "";
    }
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) {
        return null;
    }
    return n;
}

function onMinLength(value) {
    const parsed = parseLength(value);
    if (parsed === null) {
        lengthError.value = "长度须为正整数";
        return;
    }
    lengthError.value = "";
    emit("update:minLength", parsed);
    emit("change");
}

function onMaxLength(value) {
    const parsed = parseLength(value);
    if (parsed === null) {
        lengthError.value = "长度须为正整数";
        return;
    }
    lengthError.value = "";
    emit("update:maxLength", parsed);
    emit("change");
}
</script>

<style scoped>
.quote-filters {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.filter-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.chip {
    padding: 6px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-size: 14px;
    transition: all var(--transition-fast);
}

.chip:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.chip.active {
    border-color: var(--color-primary);
    background: var(--color-primary-container);
    color: var(--color-primary-text);
    font-weight: 600;
}

.category-select {
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 14px;
    font-family: inherit;
}

.length-row {
    gap: 10px;
    font-size: 14px;
    color: var(--color-text-secondary);
}

.length-field {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.length-field input {
    width: 84px;
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 14px;
    font-family: inherit;
}

.length-field input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
    border-color: var(--color-primary);
}

.length-sep {
    color: var(--color-text-muted);
}

.length-error {
    color: var(--color-error);
    font-size: 13px;
}
</style>
