<template>
    <div class="stats-view">
        <div class="container">
            <header class="stats-header">
                <p class="eyebrow">HITOKOTO · STATUS</p>
                <h1>运行状况</h1>
                <p class="intro">hitokoto.xzccs.top · 运行状态、一言与访问统计</p>
            </header>

            <section class="card hero" aria-label="运行状态总览">
                <div class="hero-main">
                    <span class="pill" :class="healthState">{{ healthPillText }}</span>
                    <div class="hero-title">{{ healthTitle }}</div>
                    <div class="meta">{{ healthVersion }}</div>
                    <div class="meta">{{ healthTime }}</div>
                </div>
                <div class="hero-side">
                    <button class="btn ghost" type="button" :disabled="refreshing" @click="loadAll">刷新数据</button>
                    <div class="meta">{{ updatedText }}</div>
                </div>
            </section>

            <div class="cards">
                <div class="card">
                    <div class="label">昨日请求</div>
                    <div class="value" :class="{ loading: !dailyLoaded }">{{ yesterdayText }}</div>
                    <div class="sub">{{ yesterdayDate }}</div>
                </div>
                <div class="card">
                    <div class="label">24 小时请求</div>
                    <div class="value" :class="{ loading: !liveLoaded }">{{ requests24hText }}</div>
                    <div class="sub">最近 24 个完整小时</div>
                </div>
                <div class="card">
                    <div class="label">5xx 错误率</div>
                    <div class="value" :class="{ loading: !liveLoaded }">{{ errorRateText }}</div>
                    <div class="sub">{{ errorCountText }}</div>
                </div>
                <div class="card">
                    <div class="label">接口往返</div>
                    <div class="value" :class="{ loading: latencyMs === null }">{{ latencyText }}</div>
                    <div class="sub">最近一次状态探针的往返耗时</div>
                </div>
            </div>

            <p v-if="statsError" id="status" class="error" role="status">统计数据暂不可用，请稍后再试。</p>
            <p v-else-if="statsRange" id="status" role="status">{{ statsRange }}</p>
            <p v-else id="status" role="status">正在加载统计数据…</p>

            <section class="card">
                <h2>KV 缓存状态</h2>
                <p class="note">KV 状态由运行状态探针提供。</p>
                <p v-if="statusError" class="note error" role="status">运行状态暂不可用，请稍后再试。</p>
                <div v-else class="kv-grid">
                    <div v-for="card in kvCards" :key="card.label" class="kv-card">
                        <div class="kv-head">
                            <span class="kv-dot" :class="card.state"></span>
                            <span class="kv-label">{{ card.label }}</span>
                        </div>
                        <div class="kv-value">{{ card.value }}</div>
                        <div class="kv-sub">{{ card.sub }}</div>
                    </div>
                </div>
            </section>

            <section class="card">
                <h2>每小时访问量</h2>
                <p class="note">域名请求数 · 最近 24 个完整小时 · 北京时间；缺失数据处折线断开，金色点为峰值小时。</p>
                <div class="mini-row">
                    <div class="mini"><div class="label">EdgeOne 响应流量</div><div class="num">{{ trafficText }}</div></div>
                    <div class="mini"><div class="label">/api 请求数</div><div class="num">{{ apiRequestsText }}</div></div>
                    <div class="mini"><div class="label">/api 请求占比</div><div class="num">{{ apiShareText }}</div></div>
                    <div class="mini"><div class="label">小时均值</div><div class="num">{{ hourlyAvgText }}</div></div>
                </div>
                <p class="note" role="status">{{ hourlyStatusText }}</p>
                <LineChart
                    v-if="hourlyPoints"
                    :points="hourlyPoints"
                    gradient-id="hourly-gradient"
                    aria-label="每小时域名请求数折线图，鼠标移动或触摸查看详情"
                    :x-label-indices="[0, 6, 12, 18, 23]"
                    :x-label-for="hourlyXLabel"
                    :tooltip-for="hourlyTooltip"
                    :item-time-for="hourlyItemTime"
                />
                <p v-if="hourlySummary" class="note">{{ hourlySummary }}</p>
            </section>

            <section class="card">
                <div class="label">自 2026-11-15 起累计请求数</div>
                <div class="value" :class="{ loading: !dailyLoaded }">{{ cumulativeText }}</div>
                <p class="note" role="status">{{ dailyStatusText || "正在加载每日汇总…" }}</p>
                <h2>每日请求趋势</h2>
                <p class="note">最近 30 个北京时间自然日；缺失数据处折线断开，不代表零，金色点为最高单日。</p>
                <div class="mini-row">
                    <div class="mini"><div class="label">近 7 日合计</div><div class="num">{{ weekTotalText }}</div></div>
                    <div class="mini"><div class="label">已采集日均</div><div class="num">{{ dayAverageText }}</div></div>
                    <div class="mini"><div class="label">最高单日</div><div class="num">{{ bestDayText }}</div></div>
                </div>
                <p v-if="weekCoverageText" class="note" role="status">{{ weekCoverageText }}（近 7 个北京时间自然日，缺失天数不计入合计）</p>
                <LineChart
                    v-if="dailyPoints"
                    :points="dailyPoints"
                    gradient-id="daily-gradient"
                    aria-label="每日请求数折线图，鼠标移动或触摸查看详情"
                    :x-label-indices="[0, 6, 12, 18, 24, 29]"
                    :x-label-for="dailyXLabel"
                    :tooltip-for="dailyTooltip"
                    :item-time-for="dailyItemTime"
                />
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import LineChart from "../components/LineChart.vue";
import { useStats } from "../composables/useStats.js";

const {
    statusError,
    statsData,
    statsError,
    dailyData,
    dailyError,
    latencyMs,
    lastUpdated,
    refreshing,
    healthState,
    healthTitle,
    healthVersion,
    healthTime,
    kvCards,
    requests24h,
    errorRate,
    errorCount,
    trafficMiB,
    apiRequests,
    apiShare,
    statsRange,
    hourlyPoints,
    hourlyAvg,
    hourlySummary,
    hourlyMissing,
    dailyEntries,
    dailyCollected,
    cumulative,
    dailyStatusText,
    yesterday,
    weekTotal,
    weekCoverageText,
    dayAverage,
    bestDay,
    dailyPoints,
    loadStatus,
    loadAll,
    formatDate,
} = useStats();

const healthPillText = computed(() => {
    if (statusError.value) {
        return "● 状态暂不可用";
    }
    return healthState.value === "ok" ? "● 运行正常" : "● 运行异常";
});

const updatedText = computed(() => {
    if (refreshing.value) {
        return "正在刷新…";
    }
    if (!lastUpdated.value) {
        return "统计每 10 分钟自动刷新一次，运行状态每分钟刷新一次。";
    }
    return `更新于 ${formatDate(lastUpdated.value)}（北京时间）· 统计每 10 分钟、运行状态每分钟自动刷新一次。`;
});

const liveLoaded = computed(() => statsData.value !== null);
const dailyLoaded = computed(() => dailyData.value !== null);

const yesterdayText = computed(() => {
    if (dailyError.value) {
        return "暂无数据";
    }
    if (!yesterday.value) {
        return "—";
    }
    if (yesterday.value.value === null) {
        return "待采集";
    }
    return `${yesterday.value.value.toLocaleString("zh-CN")} 次`;
});
const yesterdayDate = computed(() => {
    if (!yesterday.value) {
        return "";
    }
    return yesterday.value.key.slice(5).replace("-", " 月 ") + " 日";
});
const requests24hText = computed(() => {
    if (statsError.value) {
        return "暂无数据";
    }
    return requests24h.value === null ? "—" : `${requests24h.value.toLocaleString("zh-CN")} 次`;
});
const errorRateText = computed(() => {
    if (statsError.value) {
        return "暂无数据";
    }
    return errorRate.value === null ? "暂无数据" : `${(errorRate.value * 100).toFixed(2)}%`;
});
const errorCountText = computed(() => {
    if (errorCount.value === null) {
        return "";
    }
    return `约 ${errorCount.value.toLocaleString("zh-CN")} 次 5xx`;
});
const latencyText = computed(() => (latencyMs.value === null ? "暂无数据" : `${latencyMs.value} ms`));
const trafficText = computed(() => (trafficMiB.value === null ? "暂无数据" : `${trafficMiB.value} MiB`));
const apiRequestsText = computed(() => (apiRequests.value === null ? "暂无数据" : `${apiRequests.value.toLocaleString("zh-CN")} 次`));
const apiShareText = computed(() => (apiShare.value === null ? "暂无数据" : `${apiShare.value}%`));
const hourlyAvgText = computed(() => (hourlyAvg.value === null ? "暂无数据" : `${hourlyAvg.value.toLocaleString("zh-CN")} 次`));
const hourlyStatusText = computed(() => {
    if (!hourlyPoints.value) {
        return "每小时数据暂不可用。";
    }
    if (hourlyMissing.value === 24) {
        return "每小时数据暂不可用。";
    }
    if (hourlyMissing.value) {
        return `有 ${hourlyMissing.value} 个小时缺少数据，未按零计算。`;
    }
    return "每个点代表该小时内的域名请求数。";
});
const cumulativeText = computed(() => {
    if (dailyError.value) {
        return "暂无数据";
    }
    return cumulative.value === null ? "—" : `${cumulative.value.toLocaleString("zh-CN")} 次`;
});
const weekTotalText = computed(() => (weekTotal.value === null ? "暂无数据" : `${weekTotal.value.toLocaleString("zh-CN")} 次`));
const dayAverageText = computed(() => (dayAverage.value === null ? "暂无数据" : `${dayAverage.value.toLocaleString("zh-CN")} 次`));
const bestDayText = computed(() => {
    if (!bestDay.value) {
        return "暂无数据";
    }
    return `${bestDay.value.key.slice(5)} · ${bestDay.value.value.toLocaleString("zh-CN")} 次`;
});

function hourlyXLabel(point) {
    return formatDate(point.time).slice(-5);
}

function hourlyTooltip(point, index, isPeak) {
    const time = new Date(point.time);
    const label = `${formatDate(time)} 至 ${formatDate(new Date(time.getTime() + 3600000))}：${point.value === null ? "暂无数据" : point.value.toLocaleString("zh-CN") + " 次"}`;
    return label + (isPeak ? "（峰值）" : "");
}

function hourlyItemTime(point) {
    return formatDate(point.time).slice(5);
}

function dailyXLabel(point) {
    return point.time.slice(5);
}

function dailyTooltip(point, index, isPeak) {
    const label = `${point.time}：${point.value === null ? "未采集" : point.value.toLocaleString("zh-CN") + " 次"}`;
    return label + (isPeak ? "（最高单日）" : "");
}

function dailyItemTime(point) {
    return point.time.slice(5);
}

let allTimer = null;
let statusTimer = null;

onMounted(() => {
    loadAll();
    allTimer = setInterval(loadAll, 600000);
    statusTimer = setInterval(loadStatus, 60000);
});

onUnmounted(() => {
    if (allTimer) {
        clearInterval(allTimer);
    }
    if (statusTimer) {
        clearInterval(statusTimer);
    }
});
</script>

<style scoped>
.stats-view {
    padding-bottom: 64px;
}

.stats-header {
    padding: 56px 0 8px;
}

.eyebrow {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--color-primary);
}

.stats-header h1 {
    margin: 0 0 8px;
    font-size: clamp(30px, 5vw, 42px);
}

.intro {
    margin: 0;
    font-size: 16px;
    color: var(--color-text-secondary);
}

.card {
    padding: 24px 28px;
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    margin-bottom: 20px;
}

.card h2 {
    margin: 0 0 8px;
    font-size: 20px;
}

.label {
    font-size: 14px;
    color: var(--color-text-secondary);
}

.value {
    font-size: 40px;
    font-weight: 500;
    line-height: 1.2;
    margin: 12px 0 0;
    overflow-wrap: anywhere;
    color: var(--color-primary);
    font-variant-numeric: tabular-nums;
}

.value.loading {
    color: transparent;
    background: linear-gradient(90deg, var(--color-surface-variant), var(--color-border), var(--color-surface-variant));
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
    border-radius: 8px;
    min-height: 44px;
}

@keyframes shimmer {
    to {
        background-position: -200% 0;
    }
}

.sub {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 6px;
    min-height: 20px;
}

.note {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.6;
}

.error {
    color: var(--color-error);
}

.pill {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 16px;
    border-radius: var(--radius-full);
    font-size: 14px;
    font-weight: 500;
}

.pill.ok {
    background: var(--color-success-container);
    color: var(--color-on-success-container);
}

.pill.bad {
    background: var(--color-error-container);
    color: var(--color-on-error-container);
}

.pill.unknown {
    background: var(--color-surface-variant);
    color: var(--color-text-secondary);
}

.hero {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 24px;
    align-items: center;
    justify-content: space-between;
    margin: 28px 0;
}

.hero-main {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.hero-title {
    font-size: 22px;
    font-weight: 500;
    line-height: 1.3;
}

.hero-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}

.hero-side .meta {
    font-size: 13px;
    color: var(--color-text-secondary);
    text-align: right;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    padding: 0 24px;
    border-radius: var(--radius-full);
    font-size: 14px;
    font-weight: 500;
    border: 1px solid transparent;
    transition: all var(--transition-fast);
}

.btn.ghost {
    background: transparent;
    color: var(--color-primary);
    border-color: var(--color-border);
}

.btn.ghost:hover:not(:disabled) {
    background: var(--color-primary-container);
}

.btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 16px;
    margin: 28px 0;
}

.cards .card {
    margin-bottom: 0;
}

.kv-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-top: 16px;
}

.kv-card {
    padding: 16px 18px;
    border-radius: 16px;
    background: var(--color-surface-variant);
}

.kv-head {
    display: flex;
    align-items: center;
    gap: 8px;
}

.kv-dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.kv-dot.ok {
    background: #2e7d32;
}

.kv-dot.bad {
    background: #c62828;
}

.kv-dot.idle {
    background: #9c8a8f;
}

.kv-label {
    font-size: 13px;
    color: var(--color-text-secondary);
}

.kv-value {
    font-size: 22px;
    font-weight: 500;
    line-height: 1.4;
    margin-top: 8px;
    font-variant-numeric: tabular-nums;
}

.kv-sub {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-top: 2px;
}

.mini-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    margin: 16px 0 4px;
}

.mini {
    padding: 16px;
    border-radius: 16px;
    background: var(--color-surface-variant);
}

.mini .label {
    font-size: 13px;
}

.mini .num {
    font-size: 22px;
    font-weight: 500;
    line-height: 1.5;
    margin-top: 4px;
    font-variant-numeric: tabular-nums;
}

@media (max-width: 600px) {
    .card {
        padding: 20px;
    }

    .hero-side {
        align-items: flex-start;
    }

    .hero-side .meta {
        text-align: left;
    }

    .kv-grid {
        grid-template-columns: 1fr;
    }
}

@media (prefers-reduced-motion: reduce) {
    .value.loading {
        animation: none;
    }
}
</style>
