// 每日采集单元测试：fetchDay() 24 桶严格校验（M1）。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collect, fetchDay } from "../collect-stats.js";

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

// ---- collect() 历史缺口与重跑补采 ----

async function makeStatsFile(days) {
    const dir = await mkdtemp(join(tmpdir(), "collect-stats-"));
    const statsPath = join(dir, "daily-stats.json");
    await writeFile(statsPath, JSON.stringify({ domain: "hitokoto.xzccs.top", startDate: "2026-11-15", days }, null, 2));
    return { dir, statsPath };
}

function makeDayFetcher(failDays = new Set()) {
    return async (url, init) => {
        const body = JSON.parse(init.body);
        const startMs = Date.parse(body.StartTime);
        const day = new Date(startMs + 8 * 3600000).toISOString().slice(0, 10);
        if (failDays.has(day)) {
            return { ok: false, status: 500, json: async () => ({}) };
        }
        const detail = Array.from({ length: 24 }, (_, i) => ({ Timestamp: startMs / 1000 + i * 3600, Value: 100 }));
        return { ok: true, status: 200, json: async () => ({ Response: { Data: [{ TypeValue: [{ MetricName: "l7Flow_request", Detail: detail }] }] } }) };
    };
}

// 固定现在为北京时间 2026-12-20 10:00：昨日 12-19，29 天窗口起点 11-21。
const NOW = Date.parse("2026-12-20T02:00:00Z");

function filledDays(except = []) {
    const days = {};
    for (let ms = Date.parse("2026-11-15T00:00:00+08:00"); ms <= Date.parse("2026-12-18T00:00:00+08:00"); ms += 86400000) {
        const day = new Date(ms + 8 * 3600000).toISOString().slice(0, 10);
        if (!except.includes(day)) { days[day] = 100; }
    }
    return days;
}

test("collect() 历史缺口不计失败，当日采集成功时返回 0", async () => {
    // 11-16 至 11-20 缺失（在 29 天窗口外，是历史缺口）；12-19 缺失（窗口内，待采）。
    const { dir, statsPath } = await makeStatsFile(filledDays(["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-12-19"]));
    try {
        const failures = await collect({ secretId: SECRET_ID, secretKey: SECRET_KEY, now: NOW, fetcher: makeDayFetcher(), statsPath });
        assert.equal(failures, 0);
        const saved = JSON.parse(await readFile(statsPath, "utf8"));
        assert.equal(saved.days["2026-12-19"], 2400);
        assert.ok(!Object.hasOwn(saved.days, "2026-11-16"));
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
});

test("collect() 本轮查询失败计入失败，重跑成功后补采", async () => {
    const { dir, statsPath } = await makeStatsFile(filledDays(["2026-12-19"]));
    try {
        const failures = await collect({ secretId: SECRET_ID, secretKey: SECRET_KEY, now: NOW, fetcher: makeDayFetcher(new Set(["2026-12-19"])), statsPath });
        assert.equal(failures, 1);
        const afterFail = JSON.parse(await readFile(statsPath, "utf8"));
        assert.ok(!Object.hasOwn(afterFail.days, "2026-12-19"));
        const retry = await collect({ secretId: SECRET_ID, secretKey: SECRET_KEY, now: NOW, fetcher: makeDayFetcher(), statsPath });
        assert.equal(retry, 0);
        const saved = JSON.parse(await readFile(statsPath, "utf8"));
        assert.equal(saved.days["2026-12-19"], 2400);
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
});
