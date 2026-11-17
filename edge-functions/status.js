// 运行状态探针：/status，只返回 JSON 数据，不渲染 HTML 页面。
// 可视化的运行状况见 /stats。公开接口，不含密钥。
// 检查 KV 到底生没生效，而不是只看请求成不成功：
//   1. KV 是否绑定（变量名 hitokoto_kv）；
//   2. 写读是否通：往 KV 写一个很小的探针键 status_probe 再读回，比对内容并计时；
//   3. 索引和 12 个分类是否已在 KV 里（按语料版本分键核对），以及统计缓存是否在 KV 里。
// 默认只读不写 KV；加 ?probe=write 才做一次探针写入（固定键、很小的值），
// 适合主动检查；?probe=read 与默认相同（只读），?format=json 仍可加，但返回一直是 JSON。
// 注意：本函数与 /api 不共享实例内缓存，查到的是跨实例共享的 KV 真实状态。
const STATUS_PROBE_KEY = "status_probe";
const STATS_KV_KEY = "stats_data_cache";
const DAILY_KV_KEY = "daily_stats_cache";
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

function resolveKv(env) {
    const fromGlobal = globalThis.hitokoto_kv;
    if (fromGlobal && typeof fromGlobal.get === "function") {return fromGlobal;}
    const fromEnv = env && env.hitokoto_kv;
    if (fromEnv && typeof fromEnv.get === "function") {return fromEnv;}
    return null;
}

async function kvGetJson(kv, key) {
    try {
        const raw = await kv.get(key);
        if (raw && typeof raw === "object") {return raw;}
        if (typeof raw !== "string" || !raw) {return null;}
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

async function fetchJson(url, cookie) {
    try {
        const result = await fetch(url, { headers: cookie ? { cookie } : {}, redirect: "manual", signal: timeoutSignal(FETCH_TIMEOUT_MS) });
        if (!result.ok) {return null;}
        return await result.json();
    } catch {
        return null;
    }
}

function jsonResponse(data) {
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
}

export default async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
    }
    const url = new URL(request.url);
    const doWrite = url.searchParams.get("probe") === "write";
    const cookie = (request.headers.get("cookie") || "").split(";").map(part => part.trim())
        .filter(part => /^(eo_token|eo_time)=/.test(part)).join("; ");

    const [packageData, indexData] = await Promise.all([
        fetchJson(new URL("/package.json", url.origin).toString(), cookie),
        fetchJson(new URL("/sentence-index.json", url.origin).toString(), cookie),
    ]);
    const version = typeof packageData?.version === "string" ? packageData.version : null;
    const sentenceVersion = typeof indexData?.version === "string" ? indexData.version : null;
    const index = indexData?.index && typeof indexData.index === "object" ? indexData.index : null;

    const kv = resolveKv(env);
    const result = {
        bound: kv !== null,
        writeRead: "skipped",
        writeMs: null,
        readMs: null,
        indexCached: false,
        categoriesCached: 0,
        categoriesTotal: 0,
        sentencesCached: 0,
        statsCached: false,
        dailyStatsCached: false,
    };

    if (kv) {
        // 写读探针：写固定小键再读回，比对内容；失败也不影响接口，只如实报告。
        if (doWrite) {
            const probeValue = JSON.stringify({ checkedAt: new Date().toISOString(), version: sentenceVersion });
            try {
                const writeStart = Date.now();
                await kv.put(STATUS_PROBE_KEY, probeValue);
                result.writeMs = Date.now() - writeStart;
                const readStart = Date.now();
                const back = await kv.get(STATUS_PROBE_KEY);
                result.readMs = Date.now() - readStart;
                result.writeRead = back === probeValue ? "ok" : "failed";
            } catch {
                result.writeRead = "failed";
            }
        }
        if (sentenceVersion && index) {
            const categories = Object.keys(index);
            result.categoriesTotal = categories.length;
            const stored = await kvGetJson(kv, `sentence_index_${sentenceVersion}`);
            result.indexCached = stored !== null && stored.version === sentenceVersion && stored.index && typeof stored.index === "object";
            const checks = await Promise.all(categories.map(async (category) => {
                const records = await kvGetJson(kv, `sentences_${category}_${sentenceVersion}`);
                return Array.isArray(records) ? records.length : 0;
            }));
            result.categoriesCached = checks.filter(count => count > 0).length;
            result.sentencesCached = checks.reduce((sum, count) => sum + count, 0);
        }
        const stats = await kvGetJson(kv, STATS_KV_KEY);
        result.statsCached = stats !== null && stats.data !== undefined && Number.isFinite(stats.expires) && stats.expires > Date.now();
        const daily = await kvGetJson(kv, DAILY_KV_KEY);
        result.dailyStatsCached = daily !== null && daily.data !== undefined && daily.data.domain === "hitokoto.xzccs.top"
            && daily.data.days !== undefined && typeof daily.data.days === "object" && Number.isFinite(daily.expires) && daily.expires > Date.now();
    }

    const writeOk = doWrite ? result.writeRead === "ok" : true;
    // 索引自 4.9.5 起嵌在 api.js 里，不再写入 KV，ok 不再要求索引在 KV 中。
    const ok = result.bound && writeOk
        && result.categoriesTotal > 0 && result.categoriesCached === result.categoriesTotal;
    const status = {
        ok,
        timestamp: Date.now(),
        version,
        sentenceVersion,
        error: index ? null : "句子索引不可用",
        kv: result,
    };
    return jsonResponse(status);
}
