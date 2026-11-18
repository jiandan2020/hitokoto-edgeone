import { ref, computed } from "vue";

const dateFormat = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

function formatDate(value) {
    return dateFormat.format(new Date(value));
}

// 北京时间今天（YYYY-MM-DD），与 dailyEntries 共用同一口径。
function beijingTodayKey(nowMs = Date.now()) {
    return new Date(nowMs + 8 * 3600000).toISOString().slice(0, 10);
}

// 日期键按北京时间自然日平移。
function shiftDateKey(key, days) {
    const ms = Date.parse(`${key}T00:00:00+08:00`) + days * 86400000;
    return new Date(ms + 8 * 3600000).toISOString().slice(0, 10);
}

function fetchJson(url, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { cache: "no-store", signal: controller.signal })
        .then((response) => {
            if (!response.ok) {
                throw new Error("unavailable");
            }
            return response.json();
        })
        .finally(() => clearTimeout(timer));
}

export function useStats() {
    const status = ref(null);
    const statusError = ref(false);
    const statsData = ref(null);
    const statsError = ref(false);
    const dailyData = ref(null);
    const dailyError = ref(false);
    const latencyMs = ref(null);
    const lastUpdated = ref(null);
    const refreshing = ref(false);
    const statusBusy = ref(false);
    const allBusy = ref(false);

    const healthOk = computed(() => Boolean(status.value && status.value.ok));
    const healthState = computed(() => {
        if (statusError.value) {
            return "unknown";
        }
        return healthOk.value ? "ok" : "bad";
    });
    const healthTitle = computed(() => {
        if (statusError.value) {
            return "运行状态暂不可用，请稍后再试。";
        }
        return healthOk.value ? "一切正常，缓存已生效" : "有项目异常，请查看下方 KV 状态";
    });
    const healthVersion = computed(() => {
        if (!status.value) {
            return "";
        }
        const version = status.value.version || "未知";
        const sentence = status.value.sentenceVersion ? ` · 语料 ${status.value.sentenceVersion.slice(0, 12)}` : "";
        return `API v${version}${sentence}`;
    });
    const healthTime = computed(() => {
        if (!status.value || !status.value.timestamp) {
            return "";
        }
        return `检查于 ${formatDate(status.value.timestamp)}（北京时间）`;
    });

    const kvCards = computed(() => {
        const kv = (status.value && status.value.kv) || {};
        const catOk = (kv.categoriesTotal || 0) > 0 && kv.categoriesCached === kv.categoriesTotal;
        return [
            { label: "KV 绑定", state: kv.bound ? "ok" : "bad", value: kv.bound ? "已绑定" : "未绑定", sub: kv.bound ? "变量 hitokoto_kv" : "请在控制台绑定" },
            { label: "分类缓存", state: catOk ? "ok" : "bad", value: `${kv.categoriesCached || 0} / ${kv.categoriesTotal || 0} 类`, sub: `${(kv.sentencesCached || 0).toLocaleString("zh-CN")} 条句子` },
            { label: "统计缓存", state: kv.statsCached ? "ok" : "idle", value: kv.statsCached ? "已缓存" : "无 / 已过期", sub: "10 分钟缓存" },
            { label: "每日汇总缓存", state: kv.dailyStatsCached ? "ok" : "idle", value: kv.dailyStatsCached ? "已缓存" : "无 / 已过期", sub: "1 小时缓存" },
        ];
    });

    const requests24h = computed(() => {
        if (!statsData.value) {
            return null;
        }
        return statsData.value.requests;
    });
    const errorRate = computed(() => {
        if (!statsData.value) {
            return null;
        }
        return statsData.value.errorRate;
    });
    const errorCount = computed(() => {
        if (!statsData.value || statsData.value.errorRate === null) {
            return null;
        }
        return Math.round(statsData.value.errorRate * statsData.value.requests);
    });
    const trafficMiB = computed(() => {
        if (!statsData.value || !Number.isFinite(statsData.value.bytes)) {
            return null;
        }
        return (statsData.value.bytes / 1048576).toFixed(2);
    });
    const apiRequests = computed(() => {
        if (!statsData.value) {
            return null;
        }
        return Number.isSafeInteger(statsData.value.apiRequests) && statsData.value.apiRequests >= 0 ? statsData.value.apiRequests : null;
    });
    const apiShare = computed(() => {
        if (apiRequests.value === null || !statsData.value || !statsData.value.requests) {
            return null;
        }
        return ((apiRequests.value / statsData.value.requests) * 100).toFixed(1);
    });
    const statsRange = computed(() => {
        if (!statsData.value) {
            return "";
        }
        return `统计范围：${formatDate(statsData.value.start)} 至 ${formatDate(statsData.value.end)}（北京时间） · 获取时间：${formatDate(statsData.value.fetchedAt)}（北京时间）`;
    });
    const hourlyPoints = computed(() => {
        if (!statsData.value || !Array.isArray(statsData.value.hourly) || statsData.value.hourly.length !== 24) {
            return null;
        }
        if (statsData.value.hourly.some((p) => !p || !Number.isFinite(Date.parse(p.time)))) {
            return null;
        }
        return statsData.value.hourly.map((p) => ({
            time: p.time,
            value: Number.isSafeInteger(p.requests) && p.requests >= 0 ? p.requests : null,
        }));
    });
    const hourlyAvg = computed(() => {
        if (!hourlyPoints.value) {
            return null;
        }
        const known = hourlyPoints.value.filter((p) => p.value !== null).map((p) => p.value);
        if (!known.length) {
            return null;
        }
        return Math.round(known.reduce((sum, v) => sum + v, 0) / known.length);
    });
    const hourlySummary = computed(() => {
        if (!hourlyPoints.value) {
            return "";
        }
        const known = hourlyPoints.value.filter((p) => p.value !== null).map((p) => p.value);
        if (!known.length) {
            return "";
        }
        const total = known.reduce((sum, v) => sum + v, 0);
        const peak = Math.max(...known);
        const peakIndex = hourlyPoints.value.findIndex((p) => p.value === peak);
        return `平均每小时 ${Math.round(total / known.length).toLocaleString("zh-CN")} 次 · 峰值 ${formatDate(hourlyPoints.value[peakIndex].time)}（北京时间）${peak.toLocaleString("zh-CN")} 次。`;
    });
    const hourlyMissing = computed(() => {
        if (!hourlyPoints.value) {
            return 0;
        }
        return hourlyPoints.value.filter((p) => p.value === null).length;
    });

    const dailyEntries = computed(() => {
        if (!dailyData.value) {
            return null;
        }
        const data = dailyData.value;
        const start = Date.parse(`${data.startDate}T00:00:00+08:00`);
        const today = beijingTodayKey();
        const end = Date.parse(`${today}T00:00:00+08:00`);
        if (data.domain !== "hitokoto.xzccs.top" || data.startDate !== "2026-11-15" || !Number.isFinite(start) || !data.days || typeof data.days !== "object" || Array.isArray(data.days)) {
            return null;
        }
        const entries = [];
        for (let day = start; day < end; day += 86400000) {
            const key = new Date(day + 8 * 3600000).toISOString().slice(0, 10);
            const value = data.days[key];
            entries.push({ key, value: Number.isSafeInteger(value) && value >= 0 ? value : null });
        }
        return entries;
    });
    const dailyCollected = computed(() => (dailyEntries.value ? dailyEntries.value.filter((e) => e.value !== null) : []));
    const cumulative = computed(() => {
        if (!dailyCollected.value.length) {
            return null;
        }
        return dailyCollected.value.reduce((sum, e) => sum + e.value, 0);
    });
    const dailyStatusText = computed(() => {
        if (!dailyEntries.value) {
            return "";
        }
        const known = dailyCollected.value.length;
        const missing = dailyEntries.value.length - known;
        if (!known) {
            return "尚无已采集的完整日数据，缺失天数不会按零计算。";
        }
        return `已采集 ${known} 天，缺失 ${missing} 天；缺失天数不计入累计值。统计截至昨天（北京时间），不含今天。`;
    });
    // 北京时间昨日：按自然日取键，不是最后一条已采集的日期。
    // 缺失时返回该日期的条目（value 为 null），由界面显示「待采集」；
    // 真实采集到的 0 仍是 0，显示「0 次」。
    const yesterdayKey = computed(() => (dailyEntries.value ? shiftDateKey(beijingTodayKey(), -1) : null));
    const yesterday = computed(() => {
        if (!dailyEntries.value || !yesterdayKey.value) {
            return null;
        }
        return dailyEntries.value.find((e) => e.key === yesterdayKey.value) || null;
    });
    // 近七个北京时间自然日（昨日往前推 6 天），只累计窗口内已采集的日期。
    const weekEntries = computed(() => {
        if (!dailyEntries.value || !yesterdayKey.value) {
            return [];
        }
        const startKey = shiftDateKey(yesterdayKey.value, -6);
        return dailyEntries.value.filter((e) => e.key >= startKey && e.key <= yesterdayKey.value);
    });
    const weekCollected = computed(() => weekEntries.value.filter((e) => e.value !== null));
    const weekTotal = computed(() => {
        if (!weekCollected.value.length) {
            return null;
        }
        return weekCollected.value.reduce((sum, e) => sum + e.value, 0);
    });
    // 近七日覆盖情况：已采集 X/7 天（窗口外的旧记录不计入）。
    const weekCoverageText = computed(() => {
        if (!dailyEntries.value) {
            return "";
        }
        return `已采集 ${weekCollected.value.length}/7 天`;
    });
    const dayAverage = computed(() => {
        if (!dailyCollected.value.length || cumulative.value === null) {
            return null;
        }
        return Math.round(cumulative.value / dailyCollected.value.length);
    });
    const bestDay = computed(() => {
        if (!dailyCollected.value.length) {
            return null;
        }
        return dailyCollected.value.reduce((a, b) => (!a || b.value > a.value ? b : a), null);
    });
    const dailyPoints = computed(() => {
        if (!dailyEntries.value) {
            return null;
        }
        return dailyEntries.value.slice(-30).map((e) => ({ time: e.key, value: e.value }));
    });

    async function loadStatus() {
        if (statusBusy.value) {
            return;
        }
        statusBusy.value = true;
        const start = performance.now();
        try {
            const data = await fetchJson("/status?format=json&probe=read");
            status.value = data;
            statusError.value = false;
            latencyMs.value = Math.round(performance.now() - start);
        } catch {
            status.value = null;
            statusError.value = true;
            latencyMs.value = null;
        } finally {
            statusBusy.value = false;
        }
    }

    async function loadLive() {
        try {
            const data = await fetchJson("/stats-data");
            statsData.value = data;
            statsError.value = false;
        } catch {
            statsData.value = null;
            statsError.value = true;
        }
    }

    async function loadDaily() {
        try {
            const data = await fetchJson("/stats-daily");
            dailyData.value = data;
            dailyError.value = false;
        } catch {
            dailyData.value = null;
            dailyError.value = true;
        }
    }

    async function loadAll() {
        if (allBusy.value) {
            return;
        }
        allBusy.value = true;
        refreshing.value = true;
        try {
            await Promise.all([loadStatus(), loadLive(), loadDaily()]);
            lastUpdated.value = new Date();
        } finally {
            allBusy.value = false;
            refreshing.value = false;
        }
    }

    return {
        status,
        statusError,
        statsData,
        statsError,
        dailyData,
        dailyError,
        latencyMs,
        lastUpdated,
        refreshing,
        healthOk,
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
        loadLive,
        loadDaily,
        loadAll,
        formatDate,
    };
}
