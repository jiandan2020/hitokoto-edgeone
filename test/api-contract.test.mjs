// API 契约测试（v5.0 阶段 4）：Vue 重构不得改变后端 API 的返回格式。
// 锁定 7 个响应字段、错误体结构与关键行为；前端迁移只动页面，不动接口。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import handler from "../edge-functions/api.js";

const root = new URL("..", import.meta.url);

const staticFetch = async (input) => {
    const url = new URL(input);
    const body = readFileSync(new URL(`.${url.pathname}`, root));
    return new Response(body, { headers: { "Content-Type": "application/json" } });
};
globalThis.fetch = staticFetch;

function req(path, method = "GET") {
    return handler({ request: new Request(`https://hitokoto.xzccs.top${path}`, { method }) });
}

const EXPECTED_FIELDS = ["from", "from_who", "hitokoto", "id", "length", "timestamp", "type"];

test("契约：成功响应恰好 7 个字段，类型符合约定", async () => {
    const res = await req("/api");
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.deepEqual(Object.keys(data).sort(), EXPECTED_FIELDS);
    assert.equal(typeof data.id, "number");
    assert.equal(typeof data.hitokoto, "string");
    assert.ok(data.hitokoto.length > 0);
    assert.equal(typeof data.type, "string");
    assert.equal(typeof data.from, "string");
    assert.ok(data.from_who === null || typeof data.from_who === "string");
    assert.equal(typeof data.length, "number");
    assert.equal(typeof data.timestamp, "number");
});

test("契约：分类、长度、模式参数行为不变", async () => {
    const byCategory = await (await req("/api?c=i")).json();
    assert.equal(byCategory.type, "i");
    const byLength = await (await req("/api?min_length=10&max_length=20")).json();
    assert.ok(byLength.length >= 10 && byLength.length <= 20);
    const balanced = await (await req("/api?mode=category")).json();
    assert.equal(typeof balanced.hitokoto, "string");
});

test("契约：三种返回格式不变", async () => {
    const json = await req("/api?encode=json");
    assert.equal(json.headers.get("Content-Type"), "application/json; charset=UTF-8");
    const text = await req("/api?encode=text");
    assert.equal(text.headers.get("Content-Type"), "text/plain; charset=UTF-8");
    assert.ok((await text.text()).length > 0);
    const js = await req("/api?encode=js");
    assert.equal(js.headers.get("Content-Type"), "application/javascript; charset=UTF-8");
    assert.match(await js.text(), /document\.querySelector/);
});

test("契约：错误体为 {code, message, timestamp}", async () => {
    const res = await req("/api?min_length=abc");
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.deepEqual(Object.keys(data).sort(), ["code", "message", "timestamp"]);
    assert.equal(data.code, 400);
    assert.equal(typeof data.message, "string");
    assert.equal(typeof data.timestamp, "number");
});

test("契约：非法方法 405、非法域名 403、未知分类 404", async () => {
    const post = await req("/api", "POST");
    assert.equal(post.status, 405);
    const foreign = await handler({ request: new Request("https://evil.example.com/api") });
    assert.equal(foreign.status, 403);
    const unknown = await req("/api?c=z");
    assert.equal(unknown.status, 404);
});
