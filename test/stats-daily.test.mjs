// 每日汇总接口单元测试：模拟 jsDelivr 和 KV。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";

const DAILY_URL = "https://cdn.jsdelivr.net/gh/jiandan2020/hitokoto-edgeone@stats-data/daily-stats.json";
const SAMPLE = { domain: "hitokoto.xzccs.top", startDate: "2026-11-15", days: { "2026-11-15": 120, "2026-11-16": 340 } };

function makeKv() {
    const store = new Map();
    return {
        store,
        async get(key) { return store.has(key) ? store.get(key) : null; },
        async put(key, value) { store.set(key, value); },
        async delete(key) { store.delete(key); },
    };
}

async function importHandler(tag) {
    return (await import(`../edge-functions/stats-daily.js?${tag}`)).default;
}

function req(handler, path, method = "GET") {
    return handler({ request: new Request(`https://hitokoto.xzccs.top${path}`, { method }) });
}

test("KV miss fetches jsDelivr, validates and populates KV", async () => {
    const kv = makeKv();
    globalThis.hitokoto_kv = kv;
    globalThis.fetch = async (input) => {
        assert.equal(String(input), DAILY_URL);
        return new Response(JSON.stringify(SAMPLE), { headers: { "Content-Type": "application/json" } });
    };
    try {
        const handler = await importHandler("daily-miss");
        const res = await req(handler, "/stats-daily");
        assert.equal(res.status, 200);
        assert.match(res.headers.get("Content-Type"), /application\/json/);
        assert.deepEqual(await res.json(), SAMPLE);
        const entry = JSON.parse(kv.store.get("daily_stats_cache"));
        assert.deepEqual(entry.data, SAMPLE);
        assert.ok(entry.expires > Date.now());
    } finally {
        delete globalThis.hitokoto_kv;
    }
});

test("KV hit serves data without fetching jsDelivr", async () => {
    const kv = makeKv();
    kv.store.set("daily_stats_cache", JSON.stringify({ data: SAMPLE, expires: Date.now() + 3600000 }));
    globalThis.hitokoto_kv = kv;
    globalThis.fetch = async () => { throw new Error("must not fetch"); };
    try {
        const handler = await importHandler("daily-hit");
        const res = await req(handler, "/stats-daily");
        assert.equal(res.status, 200);
        assert.deepEqual(await res.json(), SAMPLE);
    } finally {
        delete globalThis.hitokoto_kv;
    }
});

test("expired KV entry falls back to jsDelivr", async () => {
    const kv = makeKv();
    kv.store.set("daily_stats_cache", JSON.stringify({ data: SAMPLE, expires: Date.now() - 1000 }));
    globalThis.hitokoto_kv = kv;
    globalThis.fetch = async () => new Response(JSON.stringify(SAMPLE), { headers: { "Content-Type": "application/json" } });
    try {
        const handler = await importHandler("daily-expired");
        const res = await req(handler, "/stats-daily");
        assert.equal(res.status, 200);
        assert.deepEqual(await res.json(), SAMPLE);
        const entry = JSON.parse(kv.store.get("daily_stats_cache"));
        assert.ok(entry.expires > Date.now());
    } finally {
        delete globalThis.hitokoto_kv;
    }
});

test("invalid daily data returns 503 and is not cached", async () => {
    const kv = makeKv();
    globalThis.hitokoto_kv = kv;
    globalThis.fetch = async () => new Response(JSON.stringify({ domain: "example.com", startDate: "2026-11-15", days: {} }), { headers: { "Content-Type": "application/json" } });
    try {
        const handler = await importHandler("daily-invalid");
        const res = await req(handler, "/stats-daily");
        assert.equal(res.status, 503);
        assert.equal(kv.store.has("daily_stats_cache"), false);
    } finally {
        delete globalThis.hitokoto_kv;
    }
});

test("jsDelivr failure returns 503", async () => {
    const kv = makeKv();
    globalThis.hitokoto_kv = kv;
    globalThis.fetch = async () => { throw new Error("network down"); };
    try {
        const handler = await importHandler("daily-fail");
        const res = await req(handler, "/stats-daily");
        assert.equal(res.status, 503);
    } finally {
        delete globalThis.hitokoto_kv;
    }
});

test("unbound KV still serves from jsDelivr", async () => {
    delete globalThis.hitokoto_kv;
    globalThis.fetch = async () => new Response(JSON.stringify(SAMPLE), { headers: { "Content-Type": "application/json" } });
    const handler = await importHandler("daily-unbound");
    const res = await req(handler, "/stats-daily");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), SAMPLE);
});

test("POST is rejected with 405", async () => {
    const handler = await importHandler("daily-post");
    const res = await req(handler, "/stats-daily", "POST");
    assert.equal(res.status, 405);
    assert.equal(res.headers.get("Allow"), "GET");
});
