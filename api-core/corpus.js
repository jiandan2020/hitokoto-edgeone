// 语料读取：三层缓存 L1 实例内 Map → L2 KV → L3 同源静态文件。
// 本模块引用构建时注入的全局量 embeddedSentenceIndex 与 sentenceVersion
//（见 build.js 前缀的常量声明），运行时由打包产物提供。
import { CACHE_LIMIT, CACHE_TTL_MS, FETCH_TIMEOUT_MS } from "./constants.js";
import { expectedSentenceHash, indexKvKey, kvGetJson, kvPutJson, sentencesKvKey, sha256Hex } from "./kv.js";
import { timeoutSignal } from "./timeout.js";
import { isValidSentenceRecords } from "./validate.js";

// 每个实例按需缓存最多 12 个分类，1 小时后重新读取；不缓存失败结果。
const sentenceCache = new Map();
const sentencePending = new Map();

function cacheSentences(key, records) {
    sentenceCache.delete(key);
    sentenceCache.set(key, { records, expires: Date.now() + CACHE_TTL_MS });
    while (sentenceCache.size > CACHE_LIMIT) {sentenceCache.delete(sentenceCache.keys().next().value);}
}

// 选中核对失败时清掉该分类的实例缓存，不把错版句子留在缓存里。
export function clearSentenceCache(asset) {
    sentenceCache.delete(asset.toString());
}

export async function loadSentences(asset, cookie, kv, category, waitUntil) {
    const key = asset.toString();
    const cached = sentenceCache.get(key);
    if (cached && cached.expires > Date.now()) {
        sentenceCache.delete(key);
        sentenceCache.set(key, cached);
        return cached.records;
    }
    if (cached) {sentenceCache.delete(key);}
    const pending = sentencePending.get(key);
    if (pending) {return pending;}
    const task = (async () => {
        // L2：KV 命中且结构完整才用，不再取静态文件；跨实例共享，一次写入全网受益。
        // 结构不完整（损坏数据）时当作未命中，回退到静态文件并顺手修好 KV。
        if (kv && category) {
            const fromKv = await kvGetJson(kv, sentencesKvKey(category));
            if (isValidSentenceRecords(fromKv, category)) {
                cacheSentences(key, fromKv);
                return fromKv;
            }
        }
        // L3：静态文件是数据源；先按内容摘要校验，通过才进缓存与 KV，
        // 摘要不符（错版/截断）时不缓存、不回填，直接抛错走 500。
        // 回填放后台跑（waitUntil 已验证支持），响应不等它；没有 waitUntil 时同步写。
        const records = await fetchSentences(asset, cookie, category);
        cacheSentences(key, records);
        if (kv && category) {
            if (waitUntil) { waitUntil(kvPutJson(kv, sentencesKvKey(category), records)); }
            else { await kvPutJson(kv, sentencesKvKey(category), records); }
        }
        return records;
    })();
    sentencePending.set(key, task);
    try {
        return await task;
    } finally {
        if (sentencePending.get(key) === task) {sentencePending.delete(key);}
    }
}

// 索引独立保存，按部署域名缓存；缓存中不保存预览凭据。
const indexCache = new Map();
const indexPending = new Map();
export async function loadIndex(asset, cookie, kv, waitUntil) {
    // 生成时已把完整索引内联进 api.js，冷启动直接用内嵌索引，不用再取一次
    // sentence-index.json；内嵌索引缺失时才走下面的 KV / 静态文件后备。
    if (typeof embeddedSentenceIndex !== "undefined" && embeddedSentenceIndex && typeof embeddedSentenceIndex === "object") {
        return embeddedSentenceIndex;
    }
    const key = asset.toString();
    const cached = indexCache.get(key);
    if (cached && cached.expires > Date.now()) {return cached.index;}
    const pending = indexPending.get(key);
    if (pending) {return pending;}
    const task = (async () => {
        if (kv) {
            const fromKv = await kvGetJson(kv, indexKvKey());
            if (fromKv && fromKv.version === sentenceVersion && fromKv.index && typeof fromKv.index === "object") {
                indexCache.set(key, { index: fromKv.index, expires: Date.now() + CACHE_TTL_MS });
                return fromKv.index;
            }
        }
        const result = await fetch(key, { headers: cookie ? { cookie } : {}, redirect: "manual", signal: timeoutSignal(FETCH_TIMEOUT_MS) });
        if (!result.ok) {throw new Error(`索引读取失败: ${result.status}`);}
        const data = await result.json();
        if (data.version !== sentenceVersion || !data.index || typeof data.index !== "object") {
            throw new Error("句子索引版本不一致或格式错误");
        }
        indexCache.set(key, { index: data.index, expires: Date.now() + CACHE_TTL_MS });
        if (kv) {
            if (waitUntil) { waitUntil(kvPutJson(kv, indexKvKey(), data)); }
            else { await kvPutJson(kv, indexKvKey(), data); }
        }
        return data.index;
    })();
    indexPending.set(key, task);
    try {
        return await task;
    } finally {
        if (indexPending.get(key) === task) {indexPending.delete(key);}
    }
}

async function fetchSentences(asset, cookie, category) {
    const result = await fetch(asset.toString(), { headers: cookie ? { cookie } : {}, redirect: "manual", signal: timeoutSignal(FETCH_TIMEOUT_MS) });
    if (!result.ok) {throw new Error(`句子库读取失败: ${result.status}`);}
    // 按原始字节核验内容摘要：摘要不符说明文件错版或损坏，不解析、不缓存。
    const buf = await result.arrayBuffer();
    const expected = category ? expectedSentenceHash(category) : null;
    if (expected) {
        const actual = await sha256Hex(buf);
        if (actual && actual !== expected) {throw new Error("句子库内容校验失败");}
    }
    const records = JSON.parse(new TextDecoder("utf-8").decode(buf));
    if (!Array.isArray(records)) {throw new Error("句子库格式错误");}
    if (category && !isValidSentenceRecords(records, category)) {throw new Error("句子库结构校验失败");}
    return records;
}
