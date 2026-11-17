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
