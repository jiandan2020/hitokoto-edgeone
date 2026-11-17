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

test("docs page states official-only parameters and fields are not supported", async () => {
    const html = await render();
    assert.ok(html.includes("没有 <code>charset</code> 参数"), "must state charset is not supported");
    assert.ok(html.includes("不包含 <code>uuid</code>、<code>creator</code> 等字段"), "must state uuid/creator are not fields");
});

test("docs page links back to the homepage and the API", async () => {
    const html = await render();
    assert.ok(html.includes("href=\"/\""), "homepage link missing");
    assert.ok(html.includes("href=\"/api\""), "try-the-API link missing");
});
