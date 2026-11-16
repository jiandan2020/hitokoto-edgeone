// 固定域名的公开汇总数据；密钥只存在于服务端环境变量。
const host = "teo.tencentcloudapi.com";
const zone = "zone-3ry57u0agvak";
const domain = "hitokoto.xzccs.top";
const encoder = new TextEncoder();
let cached;
let pending;

function hex(bytes) {
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}
async function hash(value) {
    return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}
async function hmac(key, value) {
    const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value)));
}
async function query(secretId, secretKey, start, end, kind) {
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const filters = [{ Key: "domain", Operator: "equals", Value: [domain] }];
    if (kind === "errors") {filters.push({ Key: "statusCode", Operator: "equals", Value: ["5xx"] });}
    if (kind === "api") {filters.push({ Key: "url", Operator: "equals", Value: ["/api"] });}
    const body = JSON.stringify({ ZoneIds: [zone], StartTime: start, EndTime: end, Interval: "hour", MetricNames: kind === "total" ? ["l7Flow_request", "l7Flow_outFlux"] : ["l7Flow_request"], Filters: filters });
    const contentType = "application/json; charset=utf-8";
    const headers = `content-type:${contentType}\nhost:${host}\n`;
    const signedHeaders = "content-type;host";
    const request = `POST\n/\n\n${headers}\n${signedHeaders}\n${await hash(body)}`;
    const scope = `${date}/teo/tc3_request`;
    const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${scope}\n${await hash(request)}`;
    const dateKey = await hmac(encoder.encode(`TC3${secretKey}`), date);
    const serviceKey = await hmac(dateKey, "teo");
    const signingKey = await hmac(serviceKey, "tc3_request");
    const signature = hex(await hmac(signingKey, stringToSign));
    const response = await fetch(`https://${host}`, {
        method: "POST",
        headers: {
            "Content-Type": contentType,
            "Authorization": `TC3-HMAC-SHA256 Credential=${secretId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
            "X-TC-Action": "DescribeTimingL7AnalysisData",
            "X-TC-Version": "2022-09-01",
            "X-TC-Timestamp": String(timestamp),
        },
        body,
    });
    if (!response.ok) {throw new Error("统计服务请求失败");}
    const result = (await response.json()).Response;
    if (!result || result.Error || !Array.isArray(result.Data)) {throw new Error("统计服务返回错误");}
    const metrics = {};
    let requestDetail = null;
    for (const row of result.Data) {
        for (const item of row.TypeValue || []) {
            if (!Number.isFinite(item.Sum) || item.Sum < 0 || metrics[item.MetricName] !== undefined) {throw new Error("统计数据格式错误");}
            metrics[item.MetricName] = item.Sum;
            if (item.MetricName === "l7Flow_request") {requestDetail = item.Detail;}
        }
    }
    return { metrics, requestDetail };
}
async function load(env) {
    if (!env?.TENCENT_SECRET_ID || !env?.TENCENT_SECRET_KEY) {throw new Error("统计服务未配置");}
    // 保守取整到上一个完整小时，并预留 10 分钟的数据延迟。
    const end = new Date(Math.floor((Date.now() - 10 * 60 * 1000) / 3600000) * 3600000);
    const start = new Date(end.getTime() - 24 * 3600000);
    const startTime = start.toISOString().replace(".000Z", "Z");
    const endTime = end.toISOString().replace(".000Z", "Z");
    const [total, errors, api] = await Promise.all([
        query(env.TENCENT_SECRET_ID, env.TENCENT_SECRET_KEY, startTime, endTime, "total"),
        query(env.TENCENT_SECRET_ID, env.TENCENT_SECRET_KEY, startTime, endTime, "errors"),
        query(env.TENCENT_SECRET_ID, env.TENCENT_SECRET_KEY, startTime, endTime, "api").catch(() => null),
    ]);
    const requests = total.metrics.l7Flow_request;
    const bytes = total.metrics.l7Flow_outFlux;
    if (!Number.isFinite(requests) || !Number.isFinite(bytes)) {throw new Error("统计数据不完整");}
    const errorCount = errors.metrics.l7Flow_request ?? null;
    if (errorCount !== null && errorCount > requests) {throw new Error("统计数据不一致");}
    const apiRequests = api?.metrics.l7Flow_request ?? null;
    const buckets = new Map();
    if (Array.isArray(total.requestDetail)) {
        for (const item of total.requestDetail) {
            const time = item?.Timestamp * 1000;
            if (!Number.isInteger(item?.Timestamp) || time < start.getTime() || time >= end.getTime() || time % 3600000 !== 0) {continue;}
            const valid = Number.isSafeInteger(item.Value) && item.Value >= 0;
            buckets.set(time, buckets.has(time) ? null : (valid ? item.Value : null));
        }
    }
    const hourly = Array.from({ length: 24 }, (_, index) => {
        const time = start.getTime() + index * 3600000;
        return { time: new Date(time).toISOString(), requests: buckets.get(time) ?? null };
    });
    return { domain, start: start.toISOString(), end: end.toISOString(), fetchedAt: new Date().toISOString(), requests, bytes, errorCount, errorRate: errorCount !== null && requests > 0 ? errorCount / requests : null, apiRequests: apiRequests !== null && apiRequests <= requests ? apiRequests : null, hourly };
}
export default async function onRequest({ request, env }) {
    if (request.method !== "GET") {return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });}
    try {
        if (!cached || cached.expires <= Date.now()) {
            if (!pending) {pending = load(env).then(data => { cached = { data, expires: Date.now() + 10 * 60 * 1000 }; return data; }).finally(() => { pending = undefined; });}
            await pending;
        }
        return new Response(JSON.stringify(cached.data), { headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    } catch {
        return new Response(JSON.stringify({ error: "统计数据暂不可用" }), { status: 503, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store" } });
    }
}
