<template>
    <div class="line-chart" :class="{ empty: !hasData }">
        <div class="chart-container" ref="chartRef">
            <svg
                class="chart-svg"
                viewBox="0 0 680 220"
                role="img"
                :aria-label="ariaLabel"
                @pointermove="onPointerMove"
                @pointerdown="onPointerDown"
                @pointerleave="onPointerLeave"
                @pointercancel="onPointerLeave"
            >
                <defs>
                    <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" style="stop-color: var(--color-primary)" stop-opacity="0.18" />
                        <stop offset="100%" style="stop-color: var(--color-primary)" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <line
                    v-for="row in gridRows"
                    :key="row.y"
                    :x1="50"
                    :y1="row.y"
                    :x2="655"
                    :y2="row.y"
                    class="chart-grid"
                />
                <text
                    v-for="row in gridRows"
                    :key="'label-' + row.y"
                    :x="45"
                    :y="row.y + 4"
                    text-anchor="end"
                    class="axis-label"
                >
                    {{ row.label }}
                </text>
                <path
                    v-for="(segment, index) in segments"
                    :key="'area-' + index"
                    :d="segment.areaPath"
                    class="chart-area"
                    :fill="`url(#${gradientId})`"
                />
                <polyline
                    v-for="(segment, index) in segments"
                    :key="'line-' + index"
                    :points="segment.points"
                    class="chart-line"
                />
                <circle
                    v-for="point in plotPoints"
                    :key="point.index"
                    :cx="point.x"
                    :cy="point.y"
                    :r="point.isPeak ? 5 : 3"
                    :class="point.isPeak ? 'chart-peak' : 'chart-dot'"
                >
                    <title>{{ point.title }}</title>
                </circle>
                <line
                    :x1="hoverX"
                    :y1="15"
                    :x2="hoverX"
                    :y2="165"
                    class="chart-crosshair"
                    :visibility="hoverIndex === null ? 'hidden' : 'visible'"
                />
                <rect x="37" y="0" width="631" height="175" class="chart-hit" />
                <text
                    v-for="label in xLabels"
                    :key="'x-' + label.index"
                    :x="label.x"
                    :y="188"
                    :text-anchor="label.anchor"
                    class="axis-label"
                >
                    {{ label.text }}
                </text>
            </svg>
            <div v-if="hoverIndex !== null && hoverLabel" class="chart-tooltip" :style="tooltipStyle" role="tooltip">
                {{ hoverLabel }}
            </div>
        </div>
        <details v-if="hasData" class="data-details">
            <summary>查看数据</summary>
            <div class="data-grid">
                <div
                    v-for="point in plotPoints"
                    :key="'item-' + point.index"
                    class="data-item"
                    :class="{ peak: point.isPeak, empty: point.value === null }"
                >
                    <div class="data-time">{{ point.itemTime }}</div>
                    <div class="data-value">{{ point.value === null ? "暂无数据" : point.value.toLocaleString("zh-CN") + " 次" }}</div>
                </div>
            </div>
        </details>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps({
    points: { type: Array, default: () => [] },
    ariaLabel: { type: String, default: "折线图" },
    gradientId: { type: String, required: true },
    xLabelIndices: { type: Array, default: () => [] },
    xLabelFor: { type: Function, default: null },
    tooltipFor: { type: Function, default: null },
    itemTimeFor: { type: Function, default: null },
});

const hoverIndex = ref(null);
const hoverLabel = ref("");
const tooltipLeft = ref(0);
// 触屏点选后提示钉住：抬起手指不消失，点图表外面才关闭；鼠标仍是悬停即显、移开即藏。
const touchPinned = ref(false);
const chartRef = ref(null);

const hasData = computed(() => props.points && props.points.length > 0);
const count = computed(() => (props.points ? props.points.length : 0));

const maxValue = computed(() => {
    const values = props.points.filter((p) => p.value !== null).map((p) => p.value);
    return values.length ? Math.max(1, ...values) : 1;
});

const peakValue = computed(() => {
    const values = props.points.filter((p) => p.value !== null).map((p) => p.value);
    return values.length ? Math.max(...values) : null;
});

function pointX(index) {
    if (count.value <= 1) {
        return 50;
    }
    return 50 + (index * 605) / (count.value - 1);
}

function pointY(value) {
    return 165 - (value / maxValue.value) * 150;
}

const plotPoints = computed(() => {
    if (!hasData.value) {
        return [];
    }
    return props.points.map((p, index) => {
        const value = p.value;
        const isPeak = peakValue.value !== null && value === peakValue.value && peakValue.value > 0;
        return {
            index,
            value,
            x: pointX(index),
            y: value === null ? null : pointY(value),
            isPeak,
            title: props.tooltipFor ? props.tooltipFor(p, index, isPeak) : "",
            itemTime: props.itemTimeFor ? props.itemTimeFor(p, index) : "",
        };
    });
});

const segments = computed(() => {
    const result = [];
    let current = [];
    function flush() {
        if (current.length > 1) {
            const pointsStr = current.map((pt) => `${pt.x},${pt.y}`).join(" ");
            const first = current[0];
            const last = current[current.length - 1];
            const areaPath = `M${pointsStr} L${last.x},165 L${first.x},165 Z`;
            result.push({ points: pointsStr, areaPath });
        }
        current = [];
    }
    plotPoints.value.forEach((pt) => {
        if (pt.value === null || pt.y === null) {
            flush();
            return;
        }
        current.push(pt);
    });
    flush();
    return result;
});

const gridRows = computed(() => {
    const rows = [];
    for (let i = 0; i <= 2; i++) {
        const y = 15 + i * 75;
        const label = Math.round((maxValue.value * (2 - i)) / 2).toLocaleString("zh-CN");
        rows.push({ y, label });
    }
    return rows;
});

const xLabels = computed(() => {
    return props.xLabelIndices
        .filter((index) => index >= 0 && index < count.value)
        .map((index) => {
            const anchor = index === 0 ? "start" : index === count.value - 1 ? "end" : "middle";
            return {
                index,
                x: pointX(index),
                anchor,
                text: props.xLabelFor ? props.xLabelFor(props.points[index], index) : "",
            };
        });
});

const hoverX = computed(() => (hoverIndex.value === null ? 50 : pointX(hoverIndex.value)));
const tooltipStyle = computed(() => ({ left: `${tooltipLeft.value}px` }));

function onPointerMove(event) {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !count.value) {
        return;
    }
    const viewX = ((event.clientX - rect.left) * 680) / rect.width;
    const index = Math.max(0, Math.min(count.value - 1, Math.round(((viewX - 50) * (count.value - 1)) / 605)));
    const point = props.points[index];
    if (!point) {
        return;
    }
    hoverIndex.value = index;
    hoverLabel.value = props.tooltipFor ? props.tooltipFor(point, index, point.value === peakValue.value && peakValue.value > 0) : "";
    const x = pointX(index);
    const anchor = (x / 680) * rect.width;
    const tooltipEl = event.currentTarget.parentElement.querySelector(".chart-tooltip");
    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 0;
    tooltipLeft.value = Math.max(0, Math.min(rect.width - tooltipWidth, anchor - tooltipWidth / 2));
}

function onPointerDown(event) {
    onPointerMove(event);
    // 触屏点选：把提示钉住，抬起手指后不消失。
    if (event.pointerType === "touch") {
        touchPinned.value = true;
    }
}

function onPointerLeave() {
    // 钉住时移开也不藏，点图表外面才关。
    if (touchPinned.value) {
        return;
    }
    hoverIndex.value = null;
    hoverLabel.value = "";
}

function onPointerOutside(event) {
    if (touchPinned.value && chartRef.value && !chartRef.value.contains(event.target)) {
        touchPinned.value = false;
        hoverIndex.value = null;
        hoverLabel.value = "";
    }
}

onMounted(() => {
    document.addEventListener("pointerdown", onPointerOutside);
});

onUnmounted(() => {
    document.removeEventListener("pointerdown", onPointerOutside);
});
</script>

<style scoped>
.chart-container {
    position: relative;
    min-height: 180px;
}

.chart-svg {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
    touch-action: pan-y;
}

.chart-grid {
    stroke: var(--color-border);
    stroke-width: 1;
}

.chart-area {
    stroke: none;
}

.chart-line {
    fill: none;
    stroke: var(--color-primary);
    stroke-width: 3;
    stroke-linejoin: round;
    stroke-linecap: round;
}

.chart-dot {
    fill: var(--color-primary);
}

.chart-peak {
    fill: var(--color-tertiary);
    stroke: #fff;
    stroke-width: 1.5;
}

.axis-label {
    font-size: 12px;
    fill: var(--color-text-secondary);
}

.chart-crosshair {
    stroke: var(--color-primary);
    stroke-width: 1;
    stroke-dasharray: 4 4;
    pointer-events: none;
}

.chart-hit {
    fill: transparent;
    pointer-events: all;
    cursor: crosshair;
}

.chart-tooltip {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    max-width: 85%;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--color-inverse-surface);
    color: var(--color-inverse-on-surface);
    font-size: 13px;
    line-height: 1.5;
    pointer-events: none;
    box-shadow: var(--shadow-md);
}

.data-details {
    margin-top: 16px;
}

.data-details summary {
    cursor: pointer;
    color: var(--color-primary);
    font-size: 14px;
    font-weight: 500;
}

.data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
    gap: 10px;
    margin-top: 14px;
}

.data-item {
    padding: 12px;
    border-radius: 16px;
    background: var(--color-surface-variant);
}

.data-item .data-time {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.data-item .data-value {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.5;
    font-variant-numeric: tabular-nums;
}

.data-item.peak {
    background: var(--color-tertiary-container);
}

.data-item.peak .data-value {
    color: var(--color-on-tertiary-container);
}

.data-item.empty .data-value {
    color: var(--color-text-secondary);
    font-weight: 400;
}
</style>
