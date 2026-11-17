// 新版 /stats 页（监控面板移植）单元测试：只检查服务端渲染出的页面结构，
// 不跑浏览器。重点是：只读探针、不写 KV、不含空间独有的快照逻辑。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import handler from "../edge-functions/stats.js";

async function render() {
    const res = await handler();
    assert.equal(res.status, 200);
    assert.match(res.headers.get("Content-Type"), /text\/html/);
    return res.text();
}

test("stats page contains panel sections", async () => {
    const html = await render();
    for (const id of ["health-banner", "health-pill", "health-title", "health-version", "kv-grid", "kv-status", "yesterday-requests", "requests", "traffic", "rate", "api-share", "api-requests", "latency", "hourly-chart", "hourly-avg", "cumulative", "week-total", "day-average", "best-day", "daily-chart", "refresh", "updated"]) {
        assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
    }
});

test("stats page does not link the raw status JSON", async () => {
    const html = await render();
    assert.ok(!html.includes("运行状态数据（JSON）"), "status JSON link must be hidden");
    assert.ok(html.includes("/status?format=json&probe=read"), "read-only probe fetch must stay");
    assert.ok(html.includes("KV 状态由运行状态探针提供。"), "KV note must state the probe provides the status");
    assert.equal((html.match(/KV 状态由运行状态探针提供。/g) || []).length, 1, "KV note must appear exactly once");
    assert.ok(html.includes("kvStatus.hidden = true"), "status line must hide on success instead of repeating the note");
    assert.ok(!html.includes("完整写读检测"), "write-read probe link must be gone");
    assert.ok(!html.includes("统计包含该域名的首页"), "stats scope note must be gone");
    assert.ok(!html.includes("数据来源：腾讯云 EdgeOne 流量分析"), "data source note must be gone");
});

test("daily trend renders as a line chart like the hourly one", async () => {
    const html = await render();
    assert.ok(html.includes("id=\"daily-chart\""), "daily line chart missing");
    assert.ok(html.includes("id=\"daily-tooltip\""), "daily tooltip missing");
    assert.ok(html.includes("daily-gradient"), "daily gradient missing");
    assert.ok(html.includes("每日请求数折线图"), "daily chart label must say line chart");
    assert.ok(!html.includes("柱状图"), "bar chart must be gone");
    assert.ok(!html.includes("bar-wrap"), "bar chart code must be gone");
    assert.ok(html.includes("id=\"history-list\" class=\"data-grid\""), "daily list must use the data grid");
});

test("hourly data list renders as a compact grid", async () => {
    const html = await render();
    assert.ok(html.includes("id=\"hourly-list\" class=\"data-grid\""), "hourly list must use the data grid");
    assert.ok(html.includes(".data-grid"), "data grid styles missing");
    assert.ok(html.includes("data-item"), "hourly list must use compact data cards");
    assert.ok(html.includes("data-time"), "data cards must show the hour");
});

test("stats page shows KV status as cards, not a table", async () => {
    const html = await render();
    assert.ok(html.includes("id=\"kv-grid\""), "KV cards grid missing");
    assert.ok(!html.includes("<table class=\"kv\""), "KV table must be gone");
    assert.ok(!html.includes("id=\"kv-list\""), "kv-list must be gone");
});

test("overview cards include yesterday requests and live latency", async () => {
    const html = await render();
    assert.ok(html.includes("id=\"yesterday-requests\""), "yesterday requests card missing");
    assert.ok(html.includes("id=\"latency\""), "latency card missing");
    assert.ok(html.includes("最近一次状态探针的往返耗时"), "latency sublabel missing");
});

test("stats page fetches status with read-only probe only", async () => {
    const html = await render();
    assert.ok(html.includes("/status?format=json&probe=read"), "read-only probe missing");
    assert.ok(!html.includes("status_probe"), "must not write the probe key from the public page");
    assert.ok(!html.includes("全面检查"), "must not offer a public write-probe button");
});

test("stats page fetches daily and live stats same-origin", async () => {
    const html = await render();
    assert.ok(html.includes("fetch('/stats-daily'"), "daily stats must come from /stats-daily");
    assert.ok(html.includes("fetch('/stats-data'"), "live stats must come from /stats-data");
    assert.ok(!html.includes("cdn.jsdelivr.net"), "must not fetch jsDelivr from the browser");
    assert.ok(!html.includes("检查记录"), "space-only snapshot history must not be ported");
});

test("stats page keeps hourly average and weekly summaries", async () => {
    const html = await render();
    assert.ok(html.includes("平均每小时"), "hourly average summary missing");
    assert.ok(html.includes("近 7 日合计"), "7-day total missing");
    assert.ok(html.includes("最高单日"), "best day missing");
});

test("stats page uses the homepage palette, not the panel palette", async () => {
    const html = await render();
    for (const token of ["#fff7e8", "#a83d5c", "#30283f", "HITOKOTO · STATUS", "bubbles"]) {
        assert.ok(html.includes(token), `homepage style token missing: ${token}`);
    }
    for (const token of ["#edf2ee", "#0c8a5f"]) {
        assert.ok(!html.includes(token), `panel palette token must be gone: ${token}`);
    }
});

test("stats page is titled 运行状况", async () => {
    const html = await render();
    assert.ok(html.includes("<title>运行状况"), "title must be 运行状况");
    assert.ok(html.includes(">运行状况</h1>"), "heading must be 运行状况");
    assert.ok(html.includes("HITOKOTO · STATUS"), "eyebrow must be STATUS");
    assert.ok(!html.includes("站点访问统计"), "old stats title must be gone");
    assert.ok(!html.includes("HITOKOTO · STATS"), "old stats eyebrow must be gone");
});

test("footer shows the EdgeOne acceleration badge", async () => {
    const html = await render();
    assert.ok(html.includes("/edgeone-logo.png"), "EdgeOne logo missing");
    assert.ok(html.includes("本站由 EdgeOne 提供加速服务"), "EdgeOne badge text missing");
    assert.ok(html.includes("https://edgeone.ai/"), "EdgeOne badge link missing");
});
