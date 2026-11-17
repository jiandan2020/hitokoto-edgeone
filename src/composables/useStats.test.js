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
        expect(stats.kvCards.value).toHaveLength(5);
        expect(stats.kvCards.value[0].value).toBe("已绑定");
        expect(stats.kvCards.value[2].value).toBe("12 / 12 类");
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

    it("loadDaily 域名不符时 entries 为 null", async () => {
        mockFetchByUrl({
            "/stats-daily": { domain: "other.example.com", startDate: "2026-11-15", days: {} },
        });
        const stats = useStats();
        await stats.loadDaily();
        expect(stats.dailyEntries.value).toBeNull();
    });
});
