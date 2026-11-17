import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import onRequest from "../edge-functions/stats.js";

// 回归测试：每日数据不足 30 天时，每日折线图不能因为横轴标签越界而
// 抛错（曾经导致整段脚本中断，页面显示“每日汇总暂不可用”但数据已出）。
async function renderWith(days) {
    const html = await (await onRequest()).text();
    const hourly = Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.UTC(2026, 10, 16, i)).toISOString(),
        requests: 100 + i,
    }));
    const dom = new JSDOM(html, {
        url: "https://hitokoto.xzccs.top/stats",
        runScripts: "dangerously",
        pretendToBeVisual: true,
        beforeParse(window) {
            window.fetch = async (url) => {
                const u = String(url);
                let body;
                if (u.includes("/stats-daily")) {
                    body = { domain: "hitokoto.xzccs.top", startDate: "2026-11-15", days };
                } else if (u.includes("/stats-data")) {
                    body = {
                        requests: 12090, apiRequests: 11000, bytes: 50000000, errorRate: 0,
                        start: Date.UTC(2026, 10, 15), end: Date.UTC(2026, 10, 16),
                        fetchedAt: Date.UTC(2026, 10, 16, 1), hourly,
                    };
                } else {
                    body = {
                        ok: true, version: "4.9.4", sentenceVersion: "abc123456789",
                        timestamp: Date.UTC(2026, 10, 16, 1),
                        kv: { bound: true, indexCached: true, categoriesCached: 12, categoriesTotal: 12, sentencesCached: 11276, statsCached: true, dailyStatsCached: true },
                    };
                }
                return { ok: true, status: 200, json: async () => body };
            };
        },
    });
    await new Promise((r) => setTimeout(r, 500));
    const doc = dom.window.document;
    const text = (id) => doc.getElementById(id)?.textContent ?? "";
    const result = {
        historyStatus: text("history-status"),
        cumulative: text("cumulative"),
        yesterday: text("yesterday-requests"),
        yesterdayDate: text("yesterday-date"),
        dailyChartChildren: doc.getElementById("daily-chart")?.children.length ?? 0,
    };
    dom.window.close();
    return result;
}

test("daily section renders with only 2 days of data (no unavailable error)", async () => {
    const r = await renderWith({ "2026-11-15": 369, "2026-11-16": 11311 });
    assert.ok(!r.historyStatus.includes("暂不可用"), "history-status must not show the unavailable error: " + r.historyStatus);
    assert.ok(r.historyStatus.includes("已采集 2 天"), "history-status must report 2 collected days: " + r.historyStatus);
    assert.equal(r.cumulative, "11,680 次");
    assert.equal(r.yesterday, "11,311 次");
    assert.equal(r.yesterdayDate, "11 月 16 日");
    assert.ok(r.dailyChartChildren > 0, "daily chart must render");
});

test("daily section renders with a single day of data", async () => {
    const r = await renderWith({ "2026-11-15": 369 });
    assert.ok(!r.historyStatus.includes("暂不可用"), "history-status must not show the unavailable error: " + r.historyStatus);
    assert.ok(r.historyStatus.includes("已采集 1 天"), "history-status must report 1 collected day: " + r.historyStatus);
    assert.equal(r.cumulative, "369 次");
});
