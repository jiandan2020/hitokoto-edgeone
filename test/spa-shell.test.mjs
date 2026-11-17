// SPA 外壳函数测试（v5.0 阶段 4）：/、/docs、/stats 改由 Vue SPA 承载，
// 三个页面函数同源取回 dist/index.html 后返回；路由由前端 Vue Router 处理。
// 旧的服务端渲染页面测试（homepage/docs-page/stats-page）随页面下线而移除，
// 前端行为改由 Vitest 组件测试覆盖（src/**/*.test.js）。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import indexHandler from "../edge-functions/index.js";
import docsHandler from "../edge-functions/docs.js";
import statsHandler from "../edge-functions/stats.js";

const spaHtml = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");

function mockFetchOk() {
    return async (input) => {
        const url = new URL(input);
        assert.equal(url.pathname, "/dist/index.html");
        return new Response(spaHtml, { headers: { "Content-Type": "text/html" } });
    };
}

test("首页函数返回 dist/index.html 的 SPA 外壳", async () => {
    globalThis.fetch = mockFetchOk();
    const res = await indexHandler({ request: new Request("https://hitokoto.xzccs.top/") });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("Content-Type"), /text\/html/);
    assert.equal(res.headers.get("Cache-Control"), "no-store");
    const html = await res.text();
    assert.ok(html.includes("<div id=\"app\">"), "应包含 Vue 挂载点");
    assert.ok(html.includes("/dist/assets/"), "应引用 /dist/assets 下的构建产物");
});

test("/docs 与 /stats 函数同样返回 SPA 外壳", async () => {
    globalThis.fetch = mockFetchOk();
    const docs = await docsHandler({ request: new Request("https://hitokoto.xzccs.top/docs") });
    assert.equal(docs.status, 200);
    assert.ok((await docs.text()).includes("<div id=\"app\">"));
    const stats = await statsHandler({ request: new Request("https://hitokoto.xzccs.top/stats") });
    assert.equal(stats.status, 200);
    assert.ok((await stats.text()).includes("<div id=\"app\">"));
});

test("取回入口失败时返回 503 而不是空页面", async () => {
    globalThis.fetch = async () => new Response("not found", { status: 404 });
    const res = await indexHandler({ request: new Request("https://hitokoto.xzccs.top/") });
    assert.equal(res.status, 503);
    assert.match(await res.text(), /暂时不可用/);
});
