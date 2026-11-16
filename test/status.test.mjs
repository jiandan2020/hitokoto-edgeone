// 运行状态探针单元测试：模拟同源静态文件和 KV。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import handler from "../edge-functions/status.js";

const root = new URL("..", import.meta.url);
const indexData = JSON.parse(readFileSync(new URL("../sentence-index.json", import.meta.url), "utf8"));

globalThis.fetch = async (input) => {
    const url = new URL(input);
    const body = readFileSync(new URL(`.${url.pathname}`, root));
    return new Response(body, { headers: { "Content-Type": "application/json" } });
};

function makeKv() {
    const store = new Map();
    return {
        store,
        async get(key) { return store.has(key) ? store.get(key) : null; },
        async put(key, value) { store.set(key, value); },
        async delete(key) { store.delete(key); },
    };
}

function req(path, method = "GET") {
    return handler({ request: new Request(`https://hitokoto.xzccs.top${path}`, { method }) });
}

function populateKv(kv) {
    kv.store.set(`sentence_index_${indexData.version}`, JSON.stringify(indexData));
    for (const category of Object.keys(indexData.index)) {
        const records = JSON.parse(readFileSync(new URL(`../sentences/${category}.json`, import.meta.url), "utf8"));
        kv.store.set(`sentences_${category}_${indexData.version}`, JSON.stringify(records));
    }
    kv.store.set("stats_data_cache", JSON.stringify({ data: { requests: 1 }, expires: Date.now() + 600000 }));
}

test("KV unbound reports not bound and ok false", async () => {
    delete globalThis.hitokoto_kv;
    const res = await req("/status?format=json&probe=read");
    assert.equal(res.status, 200);
    assert.match(res.headers.get("Content-Type"), /application\/json/);
    const data = await res.json();
    assert.equal(data.kv.bound, false);
    assert.equal(data.kv.writeRead, "skipped");
    assert.equal(data.ok, false);
    assert.equal(data.version, "4.3.0");
});

test("KV unbound HTML page shows 未绑定", async () => {
    delete globalThis.hitokoto_kv;
    const res = await req("/status?probe=read");
    assert.equal(res.status, 200);
    assert.match(res.headers.get("Content-Type"), /text\/html/);
    assert.match(await res.text(), /未绑定/);
});

test("KV bound but empty: write-read ok, nothing cached yet", async () => {
    const kv = makeKv();
    globalThis.hitokoto_kv = kv;
    try {
        const res = await req("/status?format=json");
        const data = await res.json();
        assert.equal(data.kv.bound, true);
        assert.equal(data.kv.writeRead, "ok");
        assert.equal(data.kv.indexCached, false);
        assert.equal(data.kv.categoriesCached, 0);
        assert.equal(data.kv.statsCached, false);
        assert.equal(data.ok, false);
        assert.ok(kv.store.has("status_probe"));
    } finally {
        delete globalThis.hitokoto_kv;
    }
});

test("KV bound and populated: ok true, 12 categories, 11269 sentences", async () => {
    const kv = makeKv();
    populateKv(kv);
    globalThis.hitokoto_kv = kv;
    try {
        const res = await req("/status?format=json");
        const data = await res.json();
        assert.equal(data.ok, true);
        assert.equal(data.kv.writeRead, "ok");
        assert.equal(data.kv.indexCached, true);
        assert.equal(data.kv.categoriesCached, 12);
        assert.equal(data.kv.categoriesTotal, 12);
        assert.equal(data.kv.sentencesCached, 11269);
        assert.equal(data.kv.statsCached, true);
    } finally {
        delete globalThis.hitokoto_kv;
    }
});

test("read-only probe does not write to KV", async () => {
    const kv = makeKv();
    globalThis.hitokoto_kv = kv;
    try {
        const res = await req("/status?format=json&probe=read");
        const data = await res.json();
        assert.equal(data.kv.writeRead, "skipped");
        assert.equal(kv.store.has("status_probe"), false);
    } finally {
        delete globalThis.hitokoto_kv;
    }
});

test("POST is rejected with 405", async () => {
    const res = await req("/status?format=json", "POST");
    assert.equal(res.status, 405);
    assert.equal(res.headers.get("Allow"), "GET");
});
