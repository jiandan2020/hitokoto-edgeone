// /docs 接口文档页单元测试：只检查服务端渲染出的页面结构，
// 不跑浏览器。重点是：文档内容与本项目 /api 的实际实现一致，
// 不照搬官方文档里本接口没有的参数与字段。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import handler from "../edge-functions/docs.js";

async function render() {
    const res = await handler();
    assert.equal(res.status, 200);
    assert.match(res.headers.get("Content-Type"), /text\/html/);
    return res.text();
}

test("docs page has the numbered reference sections", async () => {
    const html = await render();
    for (const heading of ["<h2>1. 概述</h2>", "<h2>2. 请求地址</h2>", "<h2>3. 请求参数</h2>", "<h2>4. 句子分类</h2>", "<h2>5. 返回编码</h2>", "<h2>6. 回调</h2>", "<h2>7. 返回字段</h2>", "<h2>8. 状态码与错误</h2>", "<h2>9. 示例</h2>", "<h2>10. 注意事项</h2>"]) {
        assert.ok(html.includes(heading), `missing section ${heading}`);
    }
    assert.ok(html.includes("<title>接口文档"), "title must be 接口文档");
    assert.ok(html.includes("HITOKOTO · 接口文档"), "eyebrow must be 接口文档");
});

test("docs page documents our /api endpoint and parameters", async () => {
    const html = await render();
    assert.ok(html.includes("GET https://hitokoto.xzccs.top/api"), "endpoint missing");
    for (const param of ["<code>c</code>", "<code>mode</code>", "<code>encode</code>", "<code>min_length</code>", "<code>max_length</code>", "<code>select</code>", "<code>callback</code>"]) {
        assert.ok(html.includes(param), `missing parameter ${param}`);
    }
    assert.ok(html.includes("weighted"), "mode=weighted missing");
    assert.ok(html.includes("category"), "mode=category missing");
});

test("docs page lists return fields and status codes of our API", async () => {
    const html = await render();
    for (const field of ["<code>id</code>", "<code>hitokoto</code>", "<code>type</code>", "<code>from</code>", "<code>from_who</code>", "<code>length</code>", "<code>timestamp</code>"]) {
        assert.ok(html.includes(field), `missing return field ${field}`);
    }
    for (const code of ["<code>400</code>", "<code>404</code>", "<code>405</code>", "<code>500</code>"]) {
        assert.ok(html.includes(code), `missing status code ${code}`);
    }
    assert.ok(html.includes("min_length 必须是正整数"), "error example missing");
});

test("mobile menu button and dropdown exist with current page highlighted", async () => {
    const html = await render();
    assert.ok(html.includes("id=\"menu-btn\""), "menu button missing");
    assert.ok(html.includes("id=\"menu-dropdown\""), "menu dropdown missing");
    for (const href of ["href=\"/\"", "href=\"/docs\"", "href=\"/stats\""]) {
        assert.ok(html.includes(href), `menu link missing: ${href}`);
    }
    assert.ok(html.includes("<a href=\"/docs\" class=\"active\">接口文档</a>"), "current page must be highlighted");
});

test("docs page links back to the homepage and the API", async () => {
    const html = await render();
    assert.ok(html.includes("href=\"/\""), "homepage link missing");
    assert.ok(html.includes("href=\"/api\""), "try-the-API link missing");
    assert.ok(!html.includes("运行状态数据（JSON）"), "status JSON link must be hidden");
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
});

test("page script parses without a syntax error", async () => {
    const html = await render();
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, "page script missing");
    assert.doesNotThrow(() => new Function(match[1]), "page script must parse");
});

test("docs page has a table of contents linking to all ten sections", async () => {
    const html = await render();
    assert.ok(html.includes("id=\"toc\""), "TOC missing");
    assert.ok(html.includes("class=\"docs-layout\""), "docs layout missing");
    for (let i = 1; i <= 10; i++) {
        assert.ok(html.includes(`id="sec-${i}"`), `section sec-${i} missing`);
        assert.ok(html.includes(`href="#sec-${i}"`), `TOC link to sec-${i} missing`);
    }
    assert.equal((html.match(/href="#sec-/g) || []).length, 10, "TOC must have exactly 10 section links");
    assert.ok(html.includes(".toc a.active"), "TOC active-link style missing");
    assert.ok(html.includes("scroll-margin-top:80px"), "section scroll margin missing");
});

test("code blocks get a copy button", async () => {
    const html = await render();
    assert.ok(html.includes("code-copy"), "copy button logic missing");
    assert.ok(html.includes("navigator.clipboard"), "Clipboard API copy missing");
    assert.ok(html.includes("execCommand"), "copy fallback missing");
    assert.ok(html.includes("已复制"), "copied feedback text missing");
});

test("theme toggle is a single standalone button next to the nav bar", async () => {
    const html = await render();
    assert.equal((html.match(/id="theme-btn"/g) || []).length, 1, "exactly one theme button");
    assert.ok(!html.includes("theme-btn-menu"), "menu theme button must be gone");
    assert.ok(!html.includes(".theme-btn{display:none}"), "theme button must not be hidden on mobile");
});

test("dark theme variables match the homepage and stats pages", async () => {
    const html = await render();
    assert.ok(html.includes("[data-theme=\"dark\"]"), "dark theme block missing");
    assert.ok(html.includes("#ffb08a"), "dark primary color missing");
    assert.ok(html.includes("--md-hover"), "hover variable missing");
    assert.ok(html.includes("var(--md-hover)"), "hover must use the variable");
});

test("head anti-flash script restores the saved theme before paint", async () => {
    const html = await render();
    assert.ok(html.includes("hitokoto-theme"), "anti-flash theme script missing");
    assert.ok(html.includes("prefers-color-scheme"), "system theme detection missing");
});
