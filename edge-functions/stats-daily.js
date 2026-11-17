// 每日汇总接口：/stats-daily。把 GitHub Actions 每天采集的 daily-stats.json
// 放进 KV 跨实例共享，浏览器不再直接请求 jsDelivr。
// 三层缓存：L1 实例内缓存 → L2 KV（daily_stats_cache，1 小时）→ L3 jsDelivr
// （stats-data 分支的 daily-stats.json，仍是数据源，采集流程不变）。
// 每天只更新一次，1 小时过期后重新拉取，最多延迟 1 小时可以接受。
// KV 未绑定时退回实例内缓存 + jsDelivr，照常工作。
const DAILY_STATS_URL = "https://cdn.jsdelivr.net/gh/jiandan2020/hitokoto-edgeone@stats-data/daily-stats.json";
const DAILY_KV_KEY = "daily_stats_cache";
const DAILY_TTL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10000;
// 上游失败时允许返回过期不久的缓存，避免短暂抖动直接 503。
const DAILY_STALE_GRACE_MS = 24 * 60 * 60 * 1000;
let cached;
let pending;

function resolveKv(env) {
    const fromGlobal = globalThis.hitokoto_kv;
    if (fromGlobal && typeof fromGlobal.get === "function") {return fromGlobal;}
    const fromEnv = env && env.hitokoto_kv;
    if (fromEnv && typeof fromEnv.get === "function") {return fromEnv;}
    return null;
}
async function readDailyKv(kv) {
    try {
        const raw = await kv.get(DAILY_KV_KEY);
        if (raw && typeof raw === "object") {return raw;}
        if (typeof raw !== "string" || !raw) {return null;}
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
async function writeDailyKv(kv, entry) {
    try {
        await kv.put(DAILY_KV_KEY, JSON.stringify(entry));
    } catch (error) {
        console.error("每日汇总 KV 写入失败:", error);
    }
}

// 与采集脚本和统计页保持一致的校验：域名、起始日、每天的记录格式；
// 空 days 合法（采集尚未产出数据时），无效数据不缓存，直接返回 503。
function validateDaily(data) {
    if (!data || data.domain !== "hitokoto.xzccs.top" || data.startDate !== "2026-11-15") {return false;}
    if (!data.days || typeof data.days !== "object" || Array.isArray(data.days)) {return false;}
    for (const [day, count] of Object.entries(data.days)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isSafeInteger(count) || count < 0) {return false;}
    }
    return true;
}
async function loadDaily() {
    const response = await fetch(DAILY_STATS_URL, { redirect: "manual", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) {throw new Error("每日汇总请求失败");}
    const data = await response.json();
    if (!validateDaily(data)) {throw new Error("每日汇总格式错误");}
    return data;
}

// 返回过期不久的缓存（实例内或 KV），过期太久或没有则返回 null。
// KV 的旧数据也要过 validateDaily，避免把坏数据当兜底。
async function readStaleDaily(env) {
    if (cached && cached.data && validateDaily(cached.data) && Number.isFinite(cached.expires) && cached.expires > Date.now() - DAILY_STALE_GRACE_MS) {
        return cached.data;
    }
    const kv = resolveKv(env);
    if (kv) {
        const fromKv = await readDailyKv(kv);
        if (fromKv && fromKv.data && validateDaily(fromKv.data) && Number.isFinite(fromKv.expires) && fromKv.expires > Date.now() - DAILY_STALE_GRACE_MS) {
            return fromKv.data;
        }
    }
    return null;
}
export default async function onRequest({ request, env }) {
    if (request.method !== "GET") {return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });}
    try {
        if (!cached || cached.expires <= Date.now()) {
            const kv = resolveKv(env);
            if (kv) {
                const fromKv = await readDailyKv(kv);
                if (fromKv && fromKv.data && validateDaily(fromKv.data) && Number.isFinite(fromKv.expires) && fromKv.expires > Date.now()) {
                    cached = fromKv;
                }
            }
        }
        if (!cached || cached.expires <= Date.now()) {
            if (!pending) {pending = loadDaily().then(async (data) => { cached = { data, expires: Date.now() + DAILY_TTL_MS }; const kv = resolveKv(env); if (kv) {await writeDailyKv(kv, cached);} return data; }).finally(() => { pending = undefined; });}
            await pending;
        }
        return new Response(JSON.stringify(cached.data), { headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    } catch (error) {
        const stale = await readStaleDaily(env);
        if (stale) {
            console.warn("每日汇总失败，返回过期不久的缓存:", error);
            return new Response(JSON.stringify(stale), { headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
        }
        return new Response(JSON.stringify({ error: "每日汇总暂不可用" }), { status: 503, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store" } });
    }
}
