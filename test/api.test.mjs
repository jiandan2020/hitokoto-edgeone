// API 单元测试：用本地文件模拟 EdgeOne 的同源静态资源请求，用 Map 模拟 KV。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import handler from "../edge-functions/api.js";

const root = new URL("..", import.meta.url);
const indexData = JSON.parse(readFileSync(new URL("../sentence-index.json", import.meta.url), "utf8"));

const staticFetch = async (input) => {
    const url = new URL(input);
    const body = readFileSync(new URL(`.${url.pathname}`, root));
    return new Response(body, { headers: { "Content-Type": "application/json" } });
};
globalThis.fetch = staticFetch;

function req(path, method = "GET") {
    return handler({ request: new Request(`https://hitokoto.xzccs.top${path}`, { method }) });
}

// KV 模拟：get 返回字符串或 null，put 存字符串，和 EdgeOne KV 的文本模式一致。
function makeKv() {
    const store = new Map();
    return {
        store,
        async get(key) { return store.has(key) ? store.get(key) : null; },
        async put(key, value) { store.set(key, value); },
        async delete(key) { store.delete(key); },
    };
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

test("invalid mode returns 400", async () => {
    const res = await req("/api?mode=random");
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.code, 400);
});

test("mode=category with a single category returns that type", async () => {
    const res = await req("/api?c=a&mode=category");
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, "a");
});

test("mode=category respects the length filter", async () => {
    for (let i = 0; i < 5; i++) {
        const res = await req("/api?mode=category&min_length=10&max_length=20");
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.length >= 10 && data.length <= 20);
    }
});

test("mode=category draws from many categories, not just the biggest", async () => {
    const seen = new Set();
    for (let i = 0; i < 60; i++) {
        const res = await req("/api?mode=category");
        const data = await res.json();
        seen.add(data.type);
    }
    // 12 个分类等概率抽 60 次，抽到少于 3 个分类的概率可忽略不计。
    assert.ok(seen.size >= 3, `只抽到 ${[...seen].join(",")}`);
});

test("mode=balanced is an alias for category", async () => {
    const seen = new Set();
    for (let i = 0; i < 30; i++) {
        const res = await req("/api?mode=balanced");
        const data = await res.json();
        seen.add(data.type);
    }
    assert.ok(seen.size >= 2, `只抽到 ${[...seen].join(",")}`);
});

test("KV miss populates KV from static files", async () => {
    const kv = makeKv();
    globalThis.hitokoto_kv = kv;
    // 用带查询参数的新模块实例：实例内缓存是空的，必须走 KV 再走静态文件。
    const fresh = (await import("../edge-functions/api.js?kv-miss")).default;
    try {
        const res = await fresh({ request: new Request("https://hitokoto.xzccs.top/api?c=b") });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.type, "b");
        // 索引已内联进 api.js，不再经过 KV；句子仍按分类写回 KV。
        assert.ok(!kv.store.has(`sentence_index_${indexData.version}`));
        assert.ok(kv.store.has(`sentences_b_${indexData.version}`));
        const cached = JSON.parse(kv.store.get(`sentences_b_${indexData.version}`));
        assert.ok(Array.isArray(cached) && cached.length > 0);
    } finally {
        delete globalThis.hitokoto_kv;
    }
});

test("embedded index serves without fetching sentence-index.json", async () => {
    // 新模块实例 + 只拦截索引文件请求：证明冷启动不再取 sentence-index.json。
    const fresh = (await import("../edge-functions/api.js?embedded-index")).default;
    const noIndexFetch = async (input) => {
        const url = new URL(input);
        if (url.pathname === "/sentence-index.json") {
            throw new Error("索引文件不应被请求（已内联）");
        }
        return staticFetch(input);
    };
    globalThis.fetch = noIndexFetch;
    try {
        const res = await fresh({ request: new Request("https://hitokoto.xzccs.top/api") });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(typeof data.hitokoto, "string");
        assert.ok(data.hitokoto.length > 0);
    } finally {
        globalThis.fetch = staticFetch;
    }
});

test("generated api.js embeds the sentence index", async () => {
    const source = readFileSync(new URL("../edge-functions/api.js", import.meta.url), "utf8");
    const prefix = "const embeddedSentenceIndex = ";
    const start = source.indexOf(prefix);
    assert.ok(start >= 0, "api.js 应包含内嵌索引");
    const end = source.indexOf(";\n", start);
    assert.ok(end > start);
    const embedded = JSON.parse(source.slice(start + prefix.length, end));
    assert.deepEqual(embedded, indexData.index);
});

test("KV hit serves without fetching static files", async () => {
    const kv = makeKv();
    kv.store.set(`sentence_index_${indexData.version}`, JSON.stringify(indexData));
    const sentencesA = JSON.parse(readFileSync(new URL("../sentences/a.json", import.meta.url), "utf8"));
    kv.store.set(`sentences_a_${indexData.version}`, JSON.stringify(sentencesA));
    globalThis.hitokoto_kv = kv;
    // 用带查询参数的新模块实例：实例内缓存是空的，只能走 KV，静态请求会抛错。
    const fresh = (await import("../edge-functions/api.js?kv-hit")).default;
    const throwingFetch = async () => { throw new Error("静态文件不应被请求"); };
    globalThis.fetch = throwingFetch;
    try {
        const res = await fresh({ request: new Request("https://hitokoto.xzccs.top/api?c=a") });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.type, "a");
    } finally {
        globalThis.fetch = staticFetch;
        delete globalThis.hitokoto_kv;
    }
});
