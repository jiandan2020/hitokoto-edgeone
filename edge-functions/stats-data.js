// 固定域名的公开汇总数据；密钥只存在于服务端环境变量。
const host = "teo.tencentcloudapi.com";
const zone = "zone-3ry57u0agvak";
const domain = "hitokoto.xzccs.top";
const FETCH_TIMEOUT_MS = 10000;

// EdgeOne 运行时可能没有 AbortSignal.timeout（较新的静态方法），
// 用 AbortController + setTimeout 兜底；两者都没有时返回 undefined（不设超时）。
// 整个函数绝不抛错，最坏情况就是退回 4.9.8 之前的无超时行为。
function timeoutSignal(ms) {
    try {
        if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
            return AbortSignal.timeout(ms);
        }
        if (typeof AbortController === "function") {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), ms);
            return controller.signal;
        }
    } catch {
        // 超时机制不可用时不设超时，请求照常发出。
    }
    return undefined;
}
const encoder = new TextEncoder();
let cached;
let pending;

// 统计缓存也放 KV 跨实例共享：L1 实例内缓存 → L2 KV → 腾讯云 API。
// KV 键 stats_data_cache，值里带 expires，过期即重新查询；KV 未绑定或
// 读写失败时退回原有实例内缓存逻辑。绑定变量名与 /api 共用 hitokoto_kv。
const STATS_KV_KEY = "stats_data_cache";
// 上游失败时允许返回过期不久的缓存，避免短暂抖动直接 503。
const STALE_GRACE_MS = 60 * 60 * 1000;
// SWR 陈旧窗口：缓存过期 30 分钟内，立即返回旧数据并后台刷新；
// 过期更久则同步加载。统计缓存新鲜期 10 分钟。
const STATS_TTL_MS = 10 * 60 * 1000;
const SWR_STALE_MS = 30 * 60 * 1000;
function resolveStatsKv(env) {
    const fromGlobal = globalThis.hitokoto_kv;
    if (fromGlobal && typeof fromGlobal.get === "function") {return fromGlobal;}
    const fromEnv = env && env.hitokoto_kv;
    if (fromEnv && typeof fromEnv.get === "function") {return fromEnv;}
    return null;
}
async function readStatsKv(kv) {
    try {
        const raw = await kv.get(STATS_KV_KEY);
        if (raw && typeof raw === "object") {return raw;}
        if (typeof raw !== "string" || !raw) {return null;}
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
async function writeStatsKv(kv, entry) {
    try {
        await kv.put(STATS_KV_KEY, JSON.stringify(entry));
    } catch (error) {
        console.error("统计 KV 写入失败:", error);
    }
}

function jsonResponse(data) {
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

// 返回过期不久的缓存（实例内或 KV），过期太久或没有则返回 null。
async function readStaleStats(env) {
    if (cached && cached.data && Number.isFinite(cached.expires) && cached.expires > Date.now() - STALE_GRACE_MS) {
        return cached.data;
    }
    const kv = resolveStatsKv(env);
    if (kv) {
        const fromKv = await readStatsKv(kv);
        if (fromKv && fromKv.data && Number.isFinite(fromKv.expires) && fromKv.expires > Date.now() - STALE_GRACE_MS) {
            return fromKv.data;
        }
    }
    return null;
}

// 从腾讯云加载并更新 L1 + KV；失败返回 null（只记日志，不抛），
// 供 SWR 后台刷新和同步加载共用。
async function refreshStats(env) {
    try {
        const data = await load(env);
        cached = { data, expires: Date.now() + STATS_TTL_MS };
        const kv = resolveStatsKv(env);
        if (kv) { await writeStatsKv(kv, cached); }
        return data;
    } catch (error) {
        console.warn("统计刷新失败:", error);
        return null;
    }
}

// 把刷新放到响应之后跑（context.waitUntil 已验证支持）。
// 已有刷新在跑时不重复触发；waitUntil 不可用时返回 false，
// 调用方回落到同步加载，保证不出错。
function scheduleRefresh(context, env) {
    if (pending) { return true; }
    if (typeof context.waitUntil !== "function") { return false; }
    pending = refreshStats(env).finally(() => { pending = undefined; });
    context.waitUntil(pending);
    return true;
}

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
        signal: timeoutSignal(FETCH_TIMEOUT_MS),
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
export { query, load };
export default async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== "GET") {return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });}
    try {
        const now = Date.now();
        // L1：新鲜直接返回；过期不久（SWR 窗口内）立即返回旧数据并后台刷新。
        if (cached && cached.data && Number.isFinite(cached.expires)) {
            if (cached.expires > now) {
                return jsonResponse(cached.data);
            }
            if (cached.expires > now - SWR_STALE_MS && scheduleRefresh(context, env)) {
                return jsonResponse(cached.data);
            }
        }
        // L2 KV：新鲜直接返回；过期不久同样 SWR。
        const kv = resolveStatsKv(env);
        if (kv) {
            const fromKv = await readStatsKv(kv);
            if (fromKv && fromKv.data && Number.isFinite(fromKv.expires)) {
                if (fromKv.expires > Date.now()) {
                    cached = fromKv;
                    return jsonResponse(fromKv.data);
                }
                if (fromKv.expires > Date.now() - SWR_STALE_MS && scheduleRefresh(context, env)) {
                    cached = fromKv;
                    return jsonResponse(fromKv.data);
                }
            }
        }
        // 没有可用缓存，或过期太久：同步加载（与后台刷新合并，不重复查）。
        if (!pending) {
            pending = refreshStats(env).finally(() => { pending = undefined; });
        }
        const data = await pending;
        if (!data) { throw new Error("统计服务请求失败"); }
        return jsonResponse(data);
    } catch (error) {
        const stale = await readStaleStats(env);
        if (stale) {
            console.warn("统计服务失败，返回过期不久的缓存:", error);
            return jsonResponse(stale);
        }
        return new Response(JSON.stringify({ error: "统计数据暂不可用" }), { status: 503, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store" } });
    }
}
