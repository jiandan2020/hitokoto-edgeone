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
    for (const id of ["health-banner", "health-pill", "health-version", "kv-list", "kv-status", "quote-text", "quote-source", "quote-meta", "quote-chips", "quote-next", "requests", "traffic", "rate", "api-share", "hourly-chart", "cumulative", "week-total", "day-average", "best-day", "chart", "refresh", "updated"]) {
        assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
    }
});

test("stats page fetches status with read-only probe only", async () => {
    const html = await render();
    assert.ok(html.includes("/status?format=json&probe=read"), "read-only probe missing");
    assert.ok(!html.includes("status_probe"), "must not write the probe key from the public page");
    assert.ok(!html.includes("全面检查"), "must not offer a public write-probe button");
});

test("stats page fetches daily stats and quotes same-origin", async () => {
    const html = await render();
    assert.ok(html.includes("fetch('/stats-daily'"), "daily stats must come from /stats-daily");
    assert.ok(html.includes("fetch('/stats-data'"), "live stats must come from /stats-data");
    assert.ok(html.includes("'/api?c='"), "quotes must come from /api");
    assert.ok(!html.includes("cdn.jsdelivr.net"), "must not fetch jsDelivr from the browser");
    assert.ok(!html.includes("检查记录"), "space-only snapshot history must not be ported");
});

test("stats page shows all twelve category names", async () => {
    const html = await render();
    for (const name of ["动画", "漫画", "游戏", "文学", "原创", "网络", "其他", "影视", "诗词", "网易云", "哲学", "抖机灵"]) {
        assert.ok(html.includes(`"${name}"`), `missing category ${name}`);
    }
});

test("stats page keeps hourly average and weekly summaries", async () => {
    const html = await render();
    assert.ok(html.includes("平均每小时"), "hourly average summary missing");
    assert.ok(html.includes("近 7 日合计"), "7-day total missing");
    assert.ok(html.includes("最高单日"), "best day missing");
});
