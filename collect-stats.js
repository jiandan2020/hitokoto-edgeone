// 按北京时间自然日采集完整小时数据；缺失小时不写入，后续运行继续补采。
import { readFile, writeFile } from "node:fs/promises";
import { createHash, createHmac } from "node:crypto";
import { pathToFileURL } from "node:url";

const zone = "zone-3ry57u0agvak";
const domain = "hitokoto.xzccs.top";
const startDate = "2026-11-15";
const dayMs = 86400000;
const path = "daily-stats.json";
const hash = value => createHash("sha256").update(value).digest("hex");
const hmac = (key, value) => createHmac("sha256", key).update(value).digest();
const instant = day => Date.parse(`${day}T00:00:00+08:00`);
const dayText = ms => new Date(ms + 8 * 3600000).toISOString().slice(0, 10);

export async function fetchDay(day, secretId, secretKey, fetcher = fetch) {
    const start = instant(day);
    const end = start + dayMs;
    // 查询到次日零点，随后严格按 [start, end) 筛选小时桶。
    const body = JSON.stringify({ ZoneIds: [zone], StartTime: new Date(start).toISOString().replace(".000Z", "Z"), EndTime: new Date(end).toISOString().replace(".000Z", "Z"), Interval: "hour", MetricNames: ["l7Flow_request"], Filters: [{ Key: "domain", Operator: "equals", Value: [domain] }] });
    const now = Math.floor(Date.now() / 1000);
    const date = new Date(now * 1000).toISOString().slice(0, 10);
    const host = "teo.tencentcloudapi.com";
    const contentType = "application/json; charset=utf-8";
    const headers = `content-type:${contentType}\nhost:${host}\n`;
    const canonical = `POST\n/\n\n${headers}\ncontent-type;host\n${hash(body)}`;
    const scope = `${date}/teo/tc3_request`;
    const stringToSign = `TC3-HMAC-SHA256\n${now}\n${scope}\n${hash(canonical)}`;
    const signingKey = hmac(hmac(hmac(`TC3${secretKey}`, date), "teo"), "tc3_request");
    const signature = hmac(signingKey, stringToSign).toString("hex");
    const response = await fetcher(`https://${host}`, { method: "POST", headers: { "Content-Type": contentType, "Authorization": `TC3-HMAC-SHA256 Credential=${secretId}/${scope}, SignedHeaders=content-type;host, Signature=${signature}`, "X-TC-Action": "DescribeTimingL7AnalysisData", "X-TC-Version": "2022-09-01", "X-TC-Timestamp": String(now) }, body });
    if (!response.ok) {throw new Error(`EdgeOne 返回 HTTP ${response.status}`);}
    const result = (await response.json()).Response;
    if (!result || result.Error || !Array.isArray(result.Data)) {throw new Error(`EdgeOne 查询失败: ${result?.Error?.Code || "响应格式错误"}`);}
    const metrics = result.Data.flatMap(row => row.TypeValue || []).filter(item => item.MetricName === "l7Flow_request");
    if (metrics.length !== 1 || !Array.isArray(metrics[0].Detail)) {throw new Error("请求数数据缺失");}
    const buckets = new Map();
    for (const { Timestamp, Value } of metrics[0].Detail) {
        const ms = Timestamp * 1000;
        if (ms < start || ms >= end) {continue;}
        if (!Number.isInteger(Timestamp) || ms % 3600000 !== 0 || !Number.isSafeInteger(Value) || Value < 0 || buckets.has(ms)) {throw new Error("小时数据格式错误");}
        buckets.set(ms, Value);
    }
    if (buckets.size !== 24) {throw new Error(`请求数小时数据不完整：${buckets.size}/24`);}
    return [...buckets.values()].reduce((sum, n) => sum + n, 0);
}

export async function collect({ secretId, secretKey, now = Date.now(), fetcher = fetch } = {}) {
    if (!secretId || !secretKey) {throw new Error("缺少腾讯云凭证");}
    const existing = JSON.parse(await readFile(path, "utf8"));
    if (existing.startDate !== startDate || existing.domain !== domain || !existing.days || Array.isArray(existing.days) || typeof existing.days !== "object") {throw new Error("统计文件格式不兼容");}
    for (const [day, count] of Object.entries(existing.days)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || dayText(instant(day)) !== day || day < startDate || !Number.isSafeInteger(count) || count < 0) {throw new Error("统计文件包含无效记录");}
    }
    // 至少等待前一天结束后 1 小时，以规避常见统计延迟。
    const latest = dayText(now - 3600000 - dayMs);
    const minimum = dayText(now - 29 * dayMs);
    let failures = 0;
    for (let day = startDate; day <= latest; day = dayText(instant(day) + dayMs)) {
        if (Object.hasOwn(existing.days, day)) {continue;}
        if (day < minimum) { failures++; continue; }
        try {
            existing.days[day] = await fetchDay(day, secretId, secretKey, fetcher);
            console.log(`${day}: ${existing.days[day]} 次`);
        } catch (error) {
            failures++;
            console.error(`${day}: ${error.message}`);
        }
    }
    existing.days = Object.fromEntries(Object.entries(existing.days).sort(([a], [b]) => a.localeCompare(b)));
    await writeFile(path, `${JSON.stringify(existing, null, 2)}\n`);
    if (failures) {console.error(`仍有 ${failures} 天缺失，请检查 Actions 日志；超过可查询范围的日期不能自动补齐。`);}
    return failures;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        const failures = await collect({ secretId: process.env.TENCENT_SECRET_ID, secretKey: process.env.TENCENT_SECRET_KEY });
        if (failures) {process.exitCode = 1;}
    } catch (error) { console.error(error.message); process.exitCode = 1; }
}
