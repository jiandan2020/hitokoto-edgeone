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
    for (const id of ["quote-text", "quote-source", "quote-meta", "quote-chips", "quote-next", "quote-body", "quote-copy", "quote-share", "quote-error", "quote-retry"]) {
        assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
    }
    assert.ok(html.includes("<h2>随机一言</h2>"), "quote heading missing");
    assert.ok(html.includes("换一句"), "quote-next button missing");
    assert.ok(html.includes("复制"), "quote copy button missing");
    assert.ok(html.includes("分享"), "quote share button missing");
    assert.ok(html.includes("暂时无法获取一言"), "quote error state missing");
    assert.ok(html.includes("quote-mark"), "decorative quote mark missing");
    assert.ok(html.includes("skeleton-pulse"), "skeleton loading styles missing");
    assert.ok(html.includes("QUICK_CATEGORIES"), "quick category list missing");
    for (const name of ["全部", "动画", "诗词", "哲学", "网易云"]) {
        assert.ok(html.includes(`"${name}"`), `missing quick category ${name}`);
    }
});

test("homepage no longer explains API usage, links to /docs instead", async () => {
    const html = await render();
    for (const heading of ["<h2>快速开始</h2>", "<h2>请求参数</h2>", "<h2>分类</h2>", "<h2>返回格式与字段</h2>", "<h2>状态码与错误</h2>", "<h2>请求示例</h2>"]) {
        assert.ok(!html.includes(heading), `usage section must be gone: ${heading}`);
    }
    assert.ok(html.includes("href=\"/docs\""), "docs link missing");
    assert.ok(html.includes(">接口文档</a>"), "docs button missing");
    assert.ok(!html.includes("运行状态数据（JSON）"), "status JSON link must be hidden");
});

test("hero has a headline, subtitle and two actions", async () => {
    const html = await render();
    assert.ok(html.includes("<h1>让每一次请求，都遇见一句好话</h1>"), "hero headline missing");
    assert.ok(html.includes("稳定、轻量的中文语录开放接口，支持多维度筛选与多种返回格式。"), "hero subtitle missing");
    assert.ok(html.includes("href=\"#api-grid\""), "quick-access button must scroll to the API grid");
    assert.ok(html.includes(">快速接入</a>"), "quick-access button missing");
    assert.ok(html.includes("id=\"api-grid\""), "API grid anchor missing");
    assert.ok(!html.includes("试试接口"), "old try-the-API button must be gone from the hero");
});

test("homepage quotes come from /api same-origin", async () => {
    const html = await render();
    assert.ok(html.includes("'/api?c='"), "quotes must come from /api");
    assert.ok(html.includes("fetch(url, {cache:'no-store', signal: AbortSignal.timeout(10000)})"), "quotes must bypass cache");
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

test("mobile menu button and dropdown exist with current page highlighted", async () => {
    const html = await render();
    assert.ok(html.includes("id=\"menu-btn\""), "menu button missing");
    assert.ok(html.includes("id=\"menu-dropdown\""), "menu dropdown missing");
    for (const href of ["href=\"/\"", "href=\"/docs\"", "href=\"/stats\""]) {
        assert.ok(html.includes(href), `menu link missing: ${href}`);
    }
    assert.ok(html.includes("<a href=\"/\" class=\"active\">首页</a>"), "current page must be highlighted");
    assert.ok(html.includes(".app-menu-dropdown"), "menu dropdown styles missing");
    assert.ok(html.includes("@media(max-width:600px){.app-nav-links{display:none}.app-menu{display:block}"), "menu must show only on mobile");
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

test("API cards use inline SVG icons and offer a copy-URL button", async () => {
    const html = await render();
    for (const feature of ["random", "category", "length", "format", "jsonp", "balanced"]) {
        assert.ok(html.includes(`data-feature="${feature}"`), `missing API card feature ${feature}`);
    }
    assert.ok(html.includes("<svg"), "API cards must use inline SVG icons");
    assert.ok(html.includes("card-copy"), "API cards must have a copy-URL button");
    for (const url of ["/api", "/api?c=a", "/api?encode=text", "/api?callback=cb", "/api?mode=category"]) {
        assert.ok(html.includes(`data-url="${url}"`), `missing copy URL ${url}`);
    }
    assert.ok(!html.includes("<span class=\"api-icon\">❝</span>"), "old quote-char icon must be gone");
    assert.ok(!html.includes("<span class=\"api-icon\">类</span>"), "old Chinese-char icons must be gone");
});

test("playground section exists with parameters, URL preview and send", async () => {
    const html = await render();
    assert.ok(html.includes("id=\"playground\""), "playground section missing");
    assert.ok(html.includes("API 在线调试"), "playground heading missing");
    for (const id of ["pg-features", "pg-c", "pg-min", "pg-max", "pg-encode", "pg-callback", "pg-mode", "pg-error", "pg-url", "pg-copy-url", "pg-send", "pg-copy-curl", "pg-result", "pg-status", "pg-response", "pg-copy-resp"]) {
        assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
    }
    assert.ok(html.includes("PG_FEATURES"), "playground feature presets missing");
    assert.ok(html.includes("只请求本站 /api"), "playground must state it only requests same-origin /api");
    assert.ok(html.includes("curl"), "playground must offer a curl command");
});

test("footer version info loads with a placeholder and hides on failure", async () => {
    const html = await render();
    assert.ok(html.includes("id=\"version-info\""), "version info group missing");
    assert.ok(html.includes("aria-busy"), "version info must expose a loading state");
    assert.ok(html.includes("加载中…"), "version placeholders must show a loading state");
    assert.ok(!html.includes("暂不可用"), "footer must not show 暂不可用 placeholders");
    assert.ok(html.includes("onVersionPart"), "version failure must hide the whole group");
});

test("theme toggle exists on desktop and in the mobile menu", async () => {
    const html = await render();
    assert.ok(html.includes("id=\"theme-btn\""), "desktop theme button missing");
    assert.ok(html.includes("id=\"theme-btn-menu\""), "mobile menu theme button missing");
    assert.ok(html.includes("[data-theme=\"dark\"]"), "dark theme variables missing");
    assert.ok(html.includes("#ffb08a"), "dark theme primary missing");
    assert.ok(html.includes("hitokoto-theme"), "theme preference key missing");
    assert.ok(html.includes("prefers-color-scheme"), "theme must follow the system by default");
});

test("page scripts parse without a syntax error", async () => {
    const html = await render();
    const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    assert.ok(blocks.length >= 2, "page must have a head theme script and a body script");
    for (const block of blocks) {
        assert.doesNotThrow(() => new Function(block), "page script must parse");
    }
});
