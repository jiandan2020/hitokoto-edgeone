// 运行状态探针：/status。公开接口，不含密钥。
// 检查 KV 到底生没生效，而不是只看请求成不成功：
//   1. KV 是否绑定（变量名 hitokoto_kv）；
//   2. 写读是否通：往 KV 写一个很小的探针键 status_probe 再读回，比对内容并计时；
//   3. 索引和 12 个分类是否已在 KV 里（按语料版本分键核对），以及统计缓存是否在 KV 里。
// 默认每次打开都会做一次探针写入（固定键、很小的值）；加 ?probe=read 只读不写，
// 适合监控定时拉取；加 ?format=json 返回 JSON，否则返回 HTML 页面。
// 注意：本函数与 /api 不共享实例内缓存，查到的是跨实例共享的 KV 真实状态。
const STATUS_PROBE_KEY = "status_probe";
const STATS_KV_KEY = "stats_data_cache";

function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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
        const result = await fetch(url, { headers: cookie ? { cookie } : {}, redirect: "manual" });
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

function badge(label, good) {
    const style = good
        ? "background:#e6f6e8;color:#22733a"
        : "background:#fdeaea;color:#a83232";
    return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font:600 13px/1.8 system-ui,sans-serif;${style}">${escapeHtml(label)}</span>`;
}

function renderPage(status) {
    const kv = status.kv;
    const rows = [
        ["API 版本", escapeHtml(status.version || "未知")],
        ["语料版本", escapeHtml(status.sentenceVersion ? status.sentenceVersion.slice(0, 12) : "未知")],
        ["KV 绑定", kv.bound ? badge("已绑定", true) : badge("未绑定", false)],
        ["KV 写入读取", kv.writeRead === "ok" ? badge(`正常（写 ${kv.writeMs}ms / 读 ${kv.readMs}ms）`, true) : kv.writeRead === "failed" ? badge("失败", false) : badge("未检测（只读模式）", false)],
        ["索引缓存", kv.indexCached ? badge("已缓存", true) : badge("未缓存", false)],
        ["分类缓存", `${kv.categoriesCached} / ${kv.categoriesTotal} 个分类（${kv.sentencesCached} 条） ${kv.categoriesCached === kv.categoriesTotal && kv.categoriesTotal > 0 ? badge("齐全", true) : badge("不全", false)}`],
        ["统计缓存", kv.statsCached ? badge("已缓存", true) : badge("无 / 已过期", false)],
        ["检查时间", escapeHtml(new Date(status.timestamp).toISOString())],
    ];
    const body = rows.map(([name, value]) => `<tr><th>${escapeHtml(name)}</th><td>${value}</td></tr>`).join("");
    return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>运行状态 · 一言 API</title>
  <style>
    body{margin:0;min-height:100vh;color:#30283f;background:linear-gradient(155deg,#fff7e8,#fffdf9 55%,#fff0f5);font-family:"Songti SC","Noto Serif SC",Georgia,serif;line-height:1.85}
    main{max-width:720px;margin:auto;padding:64px 24px}
    h1{font-size:32px;margin:0 0 8px}.note{color:#6d6279;font-size:14px}
    table{border-collapse:collapse;width:100%;background:rgba(255,255,255,.76);border-radius:16px;overflow:hidden}
    th,td{padding:12px 16px;border-bottom:1px solid #ebdfe5;text-align:left;vertical-align:top}
    th{color:#6d6279;font-weight:600;width:130px}tr:last-child th,tr:last-child td{border-bottom:0}
    a{color:#a83d5c;text-underline-offset:4px}
  </style>
</head>
<body>
<main>
  <h1>运行状态 ${status.ok ? badge("正常", true) : badge("异常", false)}</h1>
  <p class="note">检查 KV 缓存是否真正生效：绑定、写读、索引与分类缓存。${status.error ? `错误：${escapeHtml(status.error)}。` : ""}</p>
  <table><tbody>${body}</tbody></table>
  <p class="note"><a href="/status">刷新</a> · <a href="/status?format=json">JSON</a> · <a href="/status?probe=read">只读检测</a> · <a href="/api">一言接口</a> · <a href="/stats">站点统计</a> · <a href="https://github.com/jiandan2020/hitokoto-edgeone/blob/main/docs/kv-setup.md" target="_blank" rel="noopener">KV 设置文档</a></p>
  <p class="note">默认每次打开会往 KV 写一个很小的探针键 <code>status_probe</code> 并读回；只读检测不写入。KV 未绑定或未预热时分类缓存会显示不全，跑 <code>node scripts/warm-kv.mjs</code> 预热一次即可。</p>
</main>
</body>
</html>`;
}

export default async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
    }
    const url = new URL(request.url);
    const readOnly = url.searchParams.get("probe") === "read";
    const asJson = url.searchParams.get("format") === "json";
    const cookie = (request.headers.get("cookie") || "").split(";").map(part => part.trim())
        .filter(part => /^(eo_token|eo_time)=/.test(part)).join("; ");

    const packageData = await fetchJson(new URL("/package.json", url.origin).toString(), cookie);
    const indexData = await fetchJson(new URL("/sentence-index.json", url.origin).toString(), cookie);
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
    };

    if (kv) {
        // 写读探针：写固定小键再读回，比对内容；失败也不影响接口，只如实报告。
        if (!readOnly) {
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
    }

    const writeOk = readOnly ? true : result.writeRead === "ok";
    const ok = result.bound && writeOk && result.indexCached
        && result.categoriesTotal > 0 && result.categoriesCached === result.categoriesTotal;
    const status = {
        ok,
        timestamp: Date.now(),
        version,
        sentenceVersion,
        error: index ? null : "句子索引不可用",
        kv: result,
    };
    if (asJson) {return jsonResponse(status);}
    return new Response(renderPage(status), {
        headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
}
