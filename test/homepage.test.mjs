// 首页随机一言区单元测试：只检查服务端渲染出的页面结构，
// 不跑浏览器。重点是：一言区在首页、同源请求 /api、不写 KV。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import handler from "../edge-functions/index.js";

async function render() {
    const res = await handler();
    assert.equal(res.status, 200);
    assert.match(res.headers.get("Content-Type"), /text\/html/);
    return res.text();
}

test("homepage shows the random quote section", async () => {
    const html = await render();
    for (const id of ["quote-text", "quote-source", "quote-meta", "quote-chips", "quote-next"]) {
        assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
    }
    assert.ok(html.includes("<h2>随机一言</h2>"), "quote heading missing");
    assert.ok(html.includes("换一句"), "quote-next button missing");
});

test("homepage no longer explains API usage, links to /docs instead", async () => {
    const html = await render();
    for (const heading of ["<h2>快速开始</h2>", "<h2>请求参数</h2>", "<h2>分类</h2>", "<h2>返回格式与字段</h2>", "<h2>状态码与错误</h2>", "<h2>请求示例</h2>"]) {
        assert.ok(!html.includes(heading), `usage section must be gone: ${heading}`);
    }
    assert.ok(html.includes("href=\"/docs\""), "docs link missing");
    assert.ok(html.includes("查看接口文档"), "docs button missing");
    assert.ok(!html.includes("运行状态数据（JSON）"), "status JSON link must be hidden");
});

test("homepage quotes come from /api same-origin", async () => {
    const html = await render();
    assert.ok(html.includes("'/api?c='"), "quotes must come from /api");
    assert.ok(html.includes("fetch(url, {cache:'no-store'})"), "quotes must bypass cache");
    assert.ok(!html.includes("status_probe"), "must not write the probe key from the homepage");
});

test("homepage shows all twelve category names", async () => {
    const html = await render();
    for (const name of ["动画", "漫画", "游戏", "文学", "原创", "网络", "其他", "影视", "诗词", "网易云", "哲学", "抖机灵"]) {
        assert.ok(html.includes(`"${name}"`), `missing category ${name}`);
    }
});

test("footer shows the EdgeOne acceleration badge", async () => {
    const html = await render();
    assert.ok(html.includes("/edgeone-logo.png"), "EdgeOne logo missing");
    assert.ok(html.includes("本站由 <img src=\"/edgeone-logo.png\""), "EdgeOne badge logo must sit between 本站由 and 提供加速服务");
    assert.ok(html.includes("提供加速服务"), "EdgeOne badge text missing");
    assert.ok(html.includes("https://edgeone.ai/"), "EdgeOne badge link missing");
});

test("page uses Material Design styles", async () => {
    const html = await render();
    assert.ok(html.includes("Google Sans"), "Material font missing");
    assert.ok(html.includes("--md-primary"), "Material tokens missing");
    assert.ok(!html.includes("Songti"), "old serif font must be gone");
    assert.ok(!html.includes("bubbles"), "old bubbles must be gone");
    assert.ok(html.includes("app-bar"), "app bar missing");
    assert.ok(html.includes("api-grid"), "API card grid missing");
    assert.ok(html.includes("接口一览"), "API list heading missing");
});
