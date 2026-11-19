import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useStats } from "./useStats.js";

describe("useStats", () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    function mockFetchByUrl(handlers) {
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            for (const [prefix, data] of Object.entries(handlers)) {
                if (url.startsWith(prefix)) {
                    return Promise.resolve({ ok: true, json: async () => data });
                }
            }
            return Promise.resolve({ ok: false, status: 404 });
        });
    }

    it("loadStatus 解析 KV 卡片与健康状态", async () => {
        mockFetchByUrl({
            "/status": {
                ok: true,
                version: "5.0.0",
                sentenceVersion: "abc123",
                timestamp: 1794938934000,
                kv: { bound: true, indexCached: false, categoriesCached: 12, categoriesTotal: 12, sentencesCached: 11277, statsCached: true, dailyStatsCached: true },
            },
        });
        const stats = useStats();
        await stats.loadStatus();
        expect(stats.healthState.value).toBe("ok");
        expect(stats.healthTitle.value).toBe("一切正常，缓存已生效");
        expect(stats.healthVersion.value).toContain("5.0.0");
        expect(stats.kvCards.value).toHaveLength(4);
        expect(stats.kvCards.value[0].value).toBe("已绑定");
        expect(stats.kvCards.value[1].value).toBe("12 / 12 类");
        expect(stats.latencyMs.value).not.toBeNull();
    });

    it("loadStatus 失败时健康状态为未知", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
        const stats = useStats();
        await stats.loadStatus();
        expect(stats.statusError.value).toBe(true);
        expect(stats.healthState.value).toBe("unknown");
        expect(stats.healthTitle.value).toContain("暂不可用");
    });

    it("loadLive 计算 24h 请求、错误率与小时均值", async () => {
        const hourly = Array.from({ length: 24 }, (_, i) => ({
            time: new Date(Date.UTC(2026, 10, 17, i, 0, 0)).toISOString(),
            requests: 100 + i,
        }));
        mockFetchByUrl({
            "/stats-data": {
                requests: 2664,
                apiRequests: 2000,
                errorRate: 0.001,
                bytes: 10485760,
                start: "2026-11-16T16:00:00.000Z",
                end: "2026-11-17T16:00:00.000Z",
                fetchedAt: "2026-11-17T16:05:00.000Z",
                hourly,
            },
        });
        const stats = useStats();
        await stats.loadLive();
        expect(stats.requests24h.value).toBe(2664);
        expect(stats.errorRate.value).toBe(0.001);
        expect(stats.errorCount.value).toBe(3);
        expect(stats.trafficMiB.value).toBe("10.00");
        expect(stats.apiRequests.value).toBe(2000);
        expect(stats.apiShare.value).toBe("75.1");
        expect(stats.hourlyPoints.value).toHaveLength(24);
        expect(stats.hourlyAvg.value).toBe(112);
        expect(stats.hourlySummary.value).toContain("平均每小时");
    });

    it("loadDaily 计算累计、昨日与近 7 日", async () => {
        const today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
        const dayMs = 86400000;
        const todayStart = Date.parse(`${today}T00:00:00+08:00`);
        const keyFor = (offsetDays) => new Date(todayStart + offsetDays * dayMs + 8 * 3600000).toISOString().slice(0, 10);
        const days = {};
        days[keyFor(-3)] = 100;
        days[keyFor(-2)] = 200;
        days[keyFor(-1)] = 300;
        mockFetchByUrl({
            "/stats-daily": { domain: "hitokoto.xzccs.top", startDate: "2026-11-15", days },
        });
        const stats = useStats();
        await stats.loadDaily();
        expect(stats.dailyEntries.value).not.toBeNull();
        expect(stats.cumulative.value).toBe(600);
        expect(stats.yesterday.value.key).toBe(keyFor(-1));
        expect(stats.weekTotal.value).toBe(600);
        expect(stats.dayAverage.value).toBe(200);
        expect(stats.bestDay.value.key).toBe(keyFor(-1));
    });

    // 固定北京时间 2026-11-19 10:00：昨日为 11-18，近七日窗口为 11-12 至 11-18。
    const fixedNow = Date.UTC(2026, 10, 19, 2, 0, 0);
    function mockNow() {
        vi.spyOn(Date, "now").mockReturnValue(fixedNow);
    }

    it("昨日缺失时昨日为待采集，近七日只计已采集", async () => {
        mockNow();
        mockFetchByUrl({
            "/stats-daily": {
                domain: "hitokoto.xzccs.top",
                startDate: "2026-11-15",
                days: { "2026-11-15": 369, "2026-11-16": 11311, "2026-11-17": 3475 },
            },
        });
        const stats = useStats();
        await stats.loadDaily();
        expect(stats.yesterday.value.key).toBe("2026-11-18");
        expect(stats.yesterday.value.value).toBeNull();
        expect(stats.weekTotal.value).toBe(369 + 11311 + 3475);
        expect(stats.weekCoverageText.value).toBe("已采集 3/7 天");
        expect(stats.cumulative.value).toBe(369 + 11311 + 3475);
    });

    it("七日中途缺失时合计跳过缺失日", async () => {
        mockNow();
        mockFetchByUrl({
            "/stats-daily": {
                domain: "hitokoto.xzccs.top",
                startDate: "2026-11-15",
                days: { "2026-11-15": 100, "2026-11-16": 200, "2026-11-18": 400 },
            },
        });
        const stats = useStats();
        await stats.loadDaily();
        expect(stats.yesterday.value.value).toBe(400);
        expect(stats.weekTotal.value).toBe(700);
        expect(stats.weekCoverageText.value).toBe("已采集 3/7 天");
    });

    it("窗口外旧记录不计入近七日", async () => {
        mockNow();
        mockFetchByUrl({
            "/stats-daily": {
                domain: "hitokoto.xzccs.top",
                startDate: "2026-11-15",
                days: { "2026-11-15": 100, "2026-11-16": 200, "2026-11-17": 300, "2026-11-18": 400 },
            },
        });
        const stats = useStats();
        await stats.loadDaily();
        // 11-15 在窗口内（11-12 至 11-18），11-15 之前的数据不在 dailyEntries 中。
        // 若误取最后 7 条已采集，会把窗口外更早的记录也算进来；这里窗口内共 4 天。
        expect(stats.weekTotal.value).toBe(1000);
        expect(stats.weekCoverageText.value).toBe("已采集 4/7 天");
    });

    it("近七日全部缺失时合计为暂无数据", async () => {
        mockNow();
        mockFetchByUrl({
            "/stats-daily": { domain: "hitokoto.xzccs.top", startDate: "2026-11-15", days: {} },
        });
        const stats = useStats();
        await stats.loadDaily();
        expect(stats.yesterday.value.key).toBe("2026-11-18");
        expect(stats.yesterday.value.value).toBeNull();
        expect(stats.weekTotal.value).toBeNull();
        expect(stats.weekCoverageText.value).toBe("已采集 0/7 天");
        expect(stats.cumulative.value).toBeNull();
    });

    it("昨日真实零值显示 0 而不是待采集", async () => {
        mockNow();
        mockFetchByUrl({
            "/stats-daily": {
                domain: "hitokoto.xzccs.top",
                startDate: "2026-11-15",
                days: { "2026-11-17": 100, "2026-11-18": 0 },
            },
        });
        const stats = useStats();
        await stats.loadDaily();
        expect(stats.yesterday.value.value).toBe(0);
        expect(stats.weekTotal.value).toBe(100);
        expect(stats.weekCoverageText.value).toBe("已采集 2/7 天");
    });

    it("北京时间午夜时昨日仍为前一日", async () => {
        // 北京时间 2026-11-19 00:00（UTC 11-18 16:00）：今天是 11-19，昨日是 11-18。
        vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 10, 18, 16, 0, 0));
        mockFetchByUrl({
            "/stats-daily": {
                domain: "hitokoto.xzccs.top",
                startDate: "2026-11-15",
                days: { "2026-11-17": 3475, "2026-11-18": 500 },
            },
        });
        const stats = useStats();
        await stats.loadDaily();
        expect(stats.yesterday.value.key).toBe("2026-11-18");
        expect(stats.yesterday.value.value).toBe(500);
        expect(stats.weekTotal.value).toBe(3975);
    });

    it("loadDaily 域名不符时 entries 为 null", async () => {
        mockFetchByUrl({
            "/stats-daily": { domain: "other.example.com", startDate: "2026-11-15", days: {} },
        });
        const stats = useStats();
        await stats.loadDaily();
        expect(stats.dailyEntries.value).toBeNull();
    });

    it("KV 未绑定但 API 正常：API 与 KV 分开显示", async () => {
        mockFetchByUrl({
            "/status": {
                ok: false,
                version: "5.0.2",
                sentenceVersion: "abc123",
                timestamp: 1794938934000,
                kv: { bound: false, indexCached: false, categoriesCached: 0, categoriesTotal: 12, sentencesCached: 0, statsCached: false, dailyStatsCached: false },
            },
            "/api": { id: 1, hitokoto: "测试句子", type: "a", from: "测试", from_who: null, length: 4, timestamp: 1794938934000 },
        });
        const stats = useStats();
        await stats.loadStatus();
        await stats.loadApiHealth();
        expect(stats.healthState.value).toBe("bad");
        expect(stats.apiState.value).toBe("ok");
        expect(stats.apiTitle.value).toBe("API 正常，可以取一言");
    });

    it("缓存齐全但 API 失败：API 与 KV 分开显示", async () => {
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.startsWith("/status")) {
                return Promise.resolve({ ok: true, json: async () => ({
                    ok: true,
                    version: "5.0.2",
                    sentenceVersion: "abc123",
                    timestamp: 1794938934000,
                    kv: { bound: true, indexCached: false, categoriesCached: 12, categoriesTotal: 12, sentencesCached: 11277, statsCached: true, dailyStatsCached: true },
                }) });
            }
            return Promise.resolve({ ok: false, status: 500 });
        });
        const stats = useStats();
        await stats.loadStatus();
        await stats.loadApiHealth();
        expect(stats.healthState.value).toBe("ok");
        expect(stats.apiState.value).toBe("bad");
        expect(stats.apiTitle.value).toBe("API 异常，请查看下方详情");
    });

    it("API 探针请求失败时状态为未知", async () => {
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.startsWith("/status")) {
                return Promise.resolve({ ok: true, json: async () => ({ ok: true, kv: { bound: true, categoriesCached: 12, categoriesTotal: 12 } }) });
            }
            return Promise.reject(new Error("network error"));
        });
        const stats = useStats();
        await stats.loadStatus();
        await stats.loadApiHealth();
        expect(stats.apiState.value).toBe("unknown");
        expect(stats.apiTitle.value).toContain("暂不可用");
    });

    it("API 返回数据无效时状态为异常", async () => {
        mockFetchByUrl({
            "/api": { id: 1, type: "a" },
        });
        const stats = useStats();
        await stats.loadApiHealth();
        expect(stats.apiState.value).toBe("bad");
    });
});
