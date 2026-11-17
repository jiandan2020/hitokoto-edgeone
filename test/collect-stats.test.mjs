// 每日采集单元测试：fetchDay() 24 桶严格校验（M1）。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { fetchDay } from "../collect-stats.js";

const DAY = "2026-11-16";
const START_MS = Date.parse(`${DAY}T00:00:00+08:00`);
const SECRET_ID = "AKIDTEST";
const SECRET_KEY = "SECRETTEST";

function detail24(value = 100) {
    return Array.from({ length: 24 }, (_, i) => ({ Timestamp: START_MS / 1000 + i * 3600, Value: value }));
}

function makeFetcher(detail, ok = true, status = 200) {
    return async () => ({
        ok,
        status,
        json: async () => ({ Response: { Data: [{ TypeValue: [{ MetricName: "l7Flow_request", Detail: detail }] }] } }),
    });
}

test("fetchDay() 24 桶齐全时返回当日总和，且查询窗口是该自然日", async () => {
    let captured;
    const fetcher = async (url, init) => {
        captured = { url, init };
        return makeFetcher(detail24(100))(url, init);
    };
    const total = await fetchDay(DAY, SECRET_ID, SECRET_KEY, fetcher);
    assert.equal(total, 2400);
    assert.equal(captured.url, "https://teo.tencentcloudapi.com");
    const body = JSON.parse(captured.init.body);
    assert.equal(body.StartTime, "2026-11-15T16:00:00Z");
    assert.equal(body.EndTime, "2026-11-16T16:00:00Z");
    assert.equal(body.Interval, "hour");
});

test("fetchDay() 缺桶时抛错并报出缺失数", async () => {
    const detail = detail24(100).slice(0, 23);
    await assert.rejects(
        () => fetchDay(DAY, SECRET_ID, SECRET_KEY, makeFetcher(detail)),
        /请求数小时数据不完整：23\/24/,
    );
});

test("fetchDay() 重复桶时抛错", async () => {
    const detail = detail24(100);
    detail.push({ Timestamp: START_MS / 1000 + 3 * 3600, Value: 999 });
    await assert.rejects(
        () => fetchDay(DAY, SECRET_ID, SECRET_KEY, makeFetcher(detail)),
        /小时数据格式错误/,
    );
});

test("fetchDay() 越界桶被忽略，不影响 24 桶齐全的判断", async () => {
    const detail = detail24(100);
    detail.push({ Timestamp: START_MS / 1000 - 3600, Value: 777 });
    detail.push({ Timestamp: START_MS / 1000 + 24 * 3600, Value: 888 });
    const total = await fetchDay(DAY, SECRET_ID, SECRET_KEY, makeFetcher(detail));
    assert.equal(total, 2400);
});

test("fetchDay() 非整点桶抛错", async () => {
    const detail = detail24(100);
    detail[5] = { Timestamp: START_MS / 1000 + 5 * 3600 + 1800, Value: 100 };
    await assert.rejects(
        () => fetchDay(DAY, SECRET_ID, SECRET_KEY, makeFetcher(detail)),
        /小时数据格式错误/,
    );
});

test("fetchDay() 非 200 时抛错", async () => {
    await assert.rejects(
        () => fetchDay(DAY, SECRET_ID, SECRET_KEY, makeFetcher(detail24(100), false, 500)),
        /EdgeOne 返回 HTTP 500/,
    );
});

test("fetchDay() 无请求数数据时抛错", async () => {
    const fetcher = async () => ({
        ok: true,
        status: 200,
        json: async () => ({ Response: { Data: [{ TypeValue: [] }] } }),
    });
    await assert.rejects(
        () => fetchDay(DAY, SECRET_ID, SECRET_KEY, fetcher),
        /请求数数据缺失/,
    );
});
