// API 单元测试：用本地文件模拟 EdgeOne 的同源静态资源请求。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import handler from "../edge-functions/api.js";

const root = new URL("..", import.meta.url);

globalThis.fetch = async (input) => {
    const url = new URL(input);
    const body = readFileSync(new URL(`.${url.pathname}`, root));
    return new Response(body, { headers: { "Content-Type": "application/json" } });
};

function req(path, method = "GET") {
    return handler({ request: new Request(`https://hitokoto.xzccs.top${path}`, { method }) });
}

test("GET /api returns a random sentence as JSON", async () => {
    const res = await req("/api");
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("Cache-Control"), "no-store");
    const data = await res.json();
    assert.equal(typeof data.hitokoto, "string");
    assert.ok(data.hitokoto.length > 0);
    assert.equal(typeof data.id, "number");
});

test("category filter returns the requested type", async () => {
    const res = await req("/api?c=a");
    const data = await res.json();
    assert.equal(data.type, "a");
});

test("strict length parsing rejects 12abc", async () => {
    const res = await req("/api?min_length=12abc");
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.code, 400);
});

test("max_length smaller than min_length is rejected", async () => {
    const res = await req("/api?min_length=10&max_length=5");
    assert.equal(res.status, 400);
});

test("callback injection is rejected", async () => {
    const res = await req("/api?callback=x%22%3Balert(1)%2F%2F");
    assert.equal(res.status, 400);
});

test("valid callback is safely escaped", async () => {
    const res = await req("/api?callback=show");
    const text = await res.text();
    assert.ok(text.startsWith(";show("));
    assert.ok(!text.includes("alert"));
});

test("select injection is rejected for encode=js", async () => {
    const res = await req("/api?encode=js&select=%27%3Balert(1)%2F%2F");
    assert.equal(res.status, 400);
});

test("encode=text returns plain text", async () => {
    const res = await req("/api?encode=text");
    assert.equal(res.status, 200);
    assert.match(res.headers.get("Content-Type"), /text\/plain/);
    assert.ok((await res.text()).length > 0);
});

test("POST is rejected with 405", async () => {
    const res = await req("/api", "POST");
    assert.equal(res.status, 405);
    assert.equal(res.headers.get("Allow"), "GET, OPTIONS");
});

test("unsupported host is rejected with 403, not 500", async () => {
    const res = await handler({
        request: new Request("https://example.com/api"),
    });
    assert.equal(res.status, 403);
});

test("unknown category returns 404", async () => {
    const res = await req("/api?c=z");
    assert.equal(res.status, 404);
});
