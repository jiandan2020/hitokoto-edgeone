// 统计链路单元测试：TC3 签名向量与 load() 桶校验（M1）。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { query, load } from "../edge-functions/stats-data.js";

const HOST = "teo.tencentcloudapi.com";
const ZONE = "zone-3ry57u0agvak";
const DOMAIN = "hitokoto.xzccs.top";
const SECRET_ID = "AKIDTEST";
const SECRET_KEY = "SECRETTEST";
const START = "2026-11-16T09:00:00Z";
const END = "2026-11-17T09:00:00Z";
// 固定时间 2026-11-17T10:00:00Z：load() 由此算出 start=11-16T09:00Z、end=11-17T09:00Z。
const FIXED_NOW = Date.UTC(2026, 10, 17, 10, 0, 0);
const START_MS = Date.UTC(2026, 10, 16, 9, 0, 0);
const TIMESTAMP = Math.floor(FIXED_NOW / 1000);
const DATE = new Date(TIMESTAMP * 1000).toISOString().slice(0, 10);
const ENV = { TENCENT_SECRET_ID: SECRET_ID, TENCENT_SECRET_KEY: SECRET_KEY };

const realDateNow = Date.now;

async function withStubs(fetchStub, fn) {
    const prevFetch = globalThis.fetch;
    Date.now = () => FIXED_NOW;
    globalThis.fetch = fetchStub;
    try {
        return await fn();
    } finally {
        Date.now = realDateNow;
        globalThis.fetch = prevFetch;
    }
}

// 用 node:crypto 独立复算 TC3 签名（与实现用的 crypto.subtle 交叉验证）。
function tc3Signature(secretKey, timestamp, date, body) {
    const hash = (value) => createHash("sha256").update(value).digest("hex");
    const hmac = (key, value) => createHmac("sha256", key).update(value).digest();
    const contentType = "application/json; charset=utf-8";
    const headers = `content-type:${contentType}\nhost:${HOST}\n`;
    const request = `POST\n/\n\n${headers}\ncontent-type;host\n${hash(body)}`;
    const scope = `${date}/teo/tc3_request`;
    const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${scope}\n${hash(request)}`;
    const signingKey = hmac(hmac(hmac(`TC3${secretKey}`, date), "teo"), "tc3_request");
    return hmac(signingKey, stringToSign).toString("hex");
}

function okResponse(data) {
    return { ok: true, json: async () => ({ Response: { Data: data } }) };
}

function totalData(detail, total = 12090, bytes = 50000000) {
    return [{ TypeValue: [
        { MetricName: "l7Flow_request", Sum: total, Detail: detail },
        { MetricName: "l7Flow_outFlux", Sum: bytes },
    ] }];
}

function singleData(sum) {
    return [{ TypeValue: [{ MetricName: "l7Flow_request", Sum: sum }] }];
}

// 按 body 里的 MetricNames / Filters 把三路查询分发到不同的 canned 响应。
function routeFetch({ total, errors, api }) {
    return async (url, init) => {
        const body = JSON.parse(init.body);
        const names = body.MetricNames || [];
        const filters = body.Filters || [];
        if (names.includes("l7Flow_outFlux")) { return okResponse(total); }
        if (filters.some((f) => f.Key === "statusCode")) { return okResponse(errors); }
        if (filters.some((f) => f.Key === "url")) {
            if (api === null) { return { ok: false, status: 500, json: async () => ({}) }; }
            return okResponse(api);
        }
        throw new Error("unexpected query: " + init.body);
    };
}

function buckets24(value = 100) {
    return Array.from({ length: 24 }, (_, i) => ({ Timestamp: START_MS / 1000 + i * 3600, Value: value }));
}

function expectedBody(kind) {
    const filters = [{ Key: "domain", Operator: "equals", Value: [DOMAIN] }];
    if (kind === "errors") { filters.push({ Key: "statusCode", Operator: "equals", Value: ["5xx"] }); }
    if (kind === "api") { filters.push({ Key: "url", Operator: "equals", Value: ["/api"] }); }
    return JSON.stringify({
        ZoneIds: [ZONE], StartTime: START, EndTime: END, Interval: "hour",
        MetricNames: kind === "total" ? ["l7Flow_request", "l7Flow_outFlux"] : ["l7Flow_request"],
        Filters: filters,
    });
}

test("query() TC3 签名向量：固定时间戳下签名与独立复算一致", async () => {
    let captured;
    await withStubs(async (url, init) => {
        captured = { url, init };
        return okResponse(singleData(100));
    }, async () => {
        const result = await query(SECRET_ID, SECRET_KEY, START, END, "total");
        assert.equal(result.metrics.l7Flow_request, 100);
    });
    assert.equal(captured.url, `https://${HOST}`);
    assert.equal(captured.init.method, "POST");
    assert.equal(captured.init.body, expectedBody("total"));
    const auth = captured.init.headers.Authorization;
    const match = auth.match(/Signature=([0-9a-f]{64})$/);
    assert.ok(match, "Authorization must carry a 64-hex signature: " + auth);
    assert.equal(match[1], tc3Signature(SECRET_KEY, TIMESTAMP, DATE, captured.init.body));
    assert.equal(captured.init.headers["X-TC-Timestamp"], String(TIMESTAMP));
    assert.equal(captured.init.headers["X-TC-Action"], "DescribeTimingL7AnalysisData");
});

test("query() 三种 kind 的 Filters 各不相同", async () => {
    const bodies = [];
    await withStubs(async (url, init) => {
        bodies.push(init.body);
        return okResponse(singleData(1));
    }, async () => {
        await query(SECRET_ID, SECRET_KEY, START, END, "total");
        await query(SECRET_ID, SECRET_KEY, START, END, "errors");
        await query(SECRET_ID, SECRET_KEY, START, END, "api");
    });
    assert.equal(bodies[0], expectedBody("total"));
    assert.equal(bodies[1], expectedBody("errors"));
    assert.equal(bodies[2], expectedBody("api"));
});

test("query() 非 200 / 返回 Error / 重复指标都抛错", async () => {
    await withStubs(async () => ({ ok: false, status: 500, json: async () => ({}) }), async () => {
        await assert.rejects(() => query(SECRET_ID, SECRET_KEY, START, END, "total"), /统计服务请求失败/);
    });
    await withStubs(async () => ({ ok: true, json: async () => ({ Response: { Error: { Code: "AuthFailure" } } }) }), async () => {
        await assert.rejects(() => query(SECRET_ID, SECRET_KEY, START, END, "total"), /统计服务返回错误/);
    });
    await withStubs(async () => okResponse([{ TypeValue: [
        { MetricName: "l7Flow_request", Sum: 1 },
        { MetricName: "l7Flow_request", Sum: 2 },
    ] }]), async () => {
        await assert.rejects(() => query(SECRET_ID, SECRET_KEY, START, END, "total"), /统计数据格式错误/);
    });
});

test("load() 24 桶齐全时聚合正确", async () => {
    const result = await withStubs(routeFetch({
        total: totalData(buckets24(100)),
        errors: singleData(12),
        api: singleData(11000),
    }), async () => load(ENV));
    assert.equal(result.requests, 12090);
    assert.equal(result.bytes, 50000000);
    assert.equal(result.errorCount, 12);
    assert.equal(result.errorRate, 12 / 12090);
    assert.equal(result.apiRequests, 11000);
    assert.equal(result.hourly.length, 24);
    assert.equal(result.hourly[0].time, "2026-11-16T09:00:00.000Z");
    assert.equal(result.hourly[0].requests, 100);
    assert.equal(result.hourly[23].requests, 100);
});

test("load() 缺桶的那小时为 null，其余正常", async () => {
    const detail = buckets24(100).filter((_, i) => i !== 5);
    const result = await withStubs(routeFetch({
        total: totalData(detail),
        errors: singleData(0),
        api: singleData(1),
    }), async () => load(ENV));
    assert.equal(result.hourly[5].requests, null);
    assert.equal(result.hourly[4].requests, 100);
    assert.equal(result.hourly[6].requests, 100);
});

test("load() 重复桶的那小时为 null", async () => {
    const detail = buckets24(100);
    detail.push({ Timestamp: START_MS / 1000 + 3 * 3600, Value: 999 });
    const result = await withStubs(routeFetch({
        total: totalData(detail),
        errors: singleData(0),
        api: singleData(1),
    }), async () => load(ENV));
    assert.equal(result.hourly[3].requests, null);
    assert.equal(result.hourly[2].requests, 100);
});

test("load() 越界与非整点桶被忽略", async () => {
    const detail = buckets24(100);
    detail.push({ Timestamp: START_MS / 1000 - 3600, Value: 777 });
    detail.push({ Timestamp: START_MS / 1000 + 1800, Value: 888 });
    const result = await withStubs(routeFetch({
        total: totalData(detail),
        errors: singleData(0),
        api: singleData(1),
    }), async () => load(ENV));
    assert.ok(result.hourly.every((h) => h.requests === 100));
});

test("load() /api 查询失败时 apiRequests 为 null，其余照常", async () => {
    const result = await withStubs(routeFetch({
        total: totalData(buckets24(100)),
        errors: singleData(0),
        api: null,
    }), async () => load(ENV));
    assert.equal(result.apiRequests, null);
    assert.equal(result.requests, 12090);
});

test("load() 错误数超过请求数时抛错", async () => {
    await withStubs(routeFetch({
        total: totalData(buckets24(100)),
        errors: singleData(99999),
        api: singleData(1),
    }), async () => {
        await assert.rejects(() => load(ENV), /统计数据不一致/);
    });
});

test("load() 未配置凭证时抛错", async () => {
    await withStubs(async () => { throw new Error("must not fetch"); }, async () => {
        await assert.rejects(() => load({}), /统计服务未配置/);
    });
});
