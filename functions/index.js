// 通用响应标头
const responseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "X-Source-Code": "https://github.com/jiandan2020/hitokoto-edgeone",
};
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

// 回调名只允许合法的 JS 标识符路径，如 show / App.onHitokoto；其余一律拒绝，
// 防止 callback 被拼成任意 JS 代码执行。
const CALLBACK_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/;
// select 只允许简单的 #id / .class / 标签名，encode=js 时才校验。
const SELECTOR_PATTERN = /^(?:[#.][A-Za-z0-9_-]+|[A-Za-z][A-Za-z0-9_-]*)$/;
// 严格正整数：只接受纯数字字符串，12abc / 0x10 / 1.5 / 空格等一律无效。
function parsePositiveInt(value) {
    if (!/^\d+$/.test(value)) {
        return Number.NaN;
    }
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : Number.NaN;
}

// EdgeOne KV：三层缓存，L1 实例内 Map → L2 KV（跨实例共享）→ L3 同源静态文件。
// KV 是可选的缓存层，不是主数据源：未绑定、读取失败或写入失败时一律退回
// 静态文件，接口照常工作。控制台需先开通 KV、创建命名空间，再绑定到项目，
// 绑定变量名必须为 hitokoto_kv。KV 键只允许字母、数字、下划线，所以用下划线
// 拼接；索引和句子按语料版本分键，版本更新即换键，旧键自然失效，不怕 KV
// 最长 60 秒的最终一致性读到旧数据。单值上限 25MB，最大分类文件约 366KB。
// 不同运行时的绑定注入位置不同：Pages/Makers 文档用全局变量，Cloudflare
// 风格用 env，所以按 globalThis → env 依次找。
function resolveKv(env) {
    const fromGlobal = globalThis.hitokoto_kv;
    if (fromGlobal && typeof fromGlobal.get === "function") {return fromGlobal;}
    const fromEnv = env && env.hitokoto_kv;
    if (fromEnv && typeof fromEnv.get === "function") {return fromEnv;}
    return null;
}
function indexKvKey() {
    return `sentence_index_${sentenceVersion}`;
}
function sentencesKvKey(category) {
    return `sentences_${category}_${sentenceVersion}`;
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
async function kvPutJson(kv, key, value) {
    try {
        await kv.put(key, JSON.stringify(value));
    } catch (error) {
        console.error("KV 写入失败，退回静态文件:", error);
    }
}

// 使用标准 Response 构造 JSON，避免依赖运行时的 Response.json 支持。
// /api 是随机接口，显式 no-store，避免 CDN/浏览器缓存某一条随机结果。
function jsonResponse(data, options = {}) {
    return new Response(JSON.stringify(data), {
        ...options,
        headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", ...options.headers },
    });
}

// 每个实例按需缓存最多 12 个分类，1 小时后重新读取；不缓存失败结果。
const sentenceCache = new Map();
const CACHE_LIMIT = 12;
const CACHE_TTL_MS = 60 * 60 * 1000;
const sentencePending = new Map();

function cacheSentences(key, records) {
    sentenceCache.delete(key);
    sentenceCache.set(key, { records, expires: Date.now() + CACHE_TTL_MS });
    while (sentenceCache.size > CACHE_LIMIT) {sentenceCache.delete(sentenceCache.keys().next().value);}
}

// KV 里的句子必须结构完整才可用：数组非空，每个元素是对象且
// id/hitokoto/type/from/from_who/length 字段齐全、类型正确、
// type 与分类一致。验不过就当 KV 未命中，回退到静态文件，
// 读到正确数据后会顺手写回 KV 修好它。
function isValidSentenceRecords(records, category) {
    if (!Array.isArray(records) || records.length === 0) {return false;}
    for (const record of records) {
        if (!record || typeof record !== "object") {return false;}
        if (!Number.isSafeInteger(record.id)) {return false;}
        if (typeof record.hitokoto !== "string" || !record.hitokoto) {return false;}
        if (record.type !== category) {return false;}
        if (typeof record.from !== "string") {return false;}
        if (record.from_who !== null && typeof record.from_who !== "string") {return false;}
        if (!Number.isSafeInteger(record.length) || record.length < 0) {return false;}
    }
    return true;
}

async function loadSentences(asset, cookie, kv, category, waitUntil) {
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
        // L3：静态文件是数据源；读到后顺手写回 KV，下一实例就不用再取了。
        // 回填放后台跑（waitUntil 已验证支持），响应不等它；没有 waitUntil 时同步写。
        const records = await fetchSentences(asset, cookie);
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
async function loadIndex(asset, cookie, kv, waitUntil) {
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

async function fetchSentences(asset, cookie) {
    const result = await fetch(asset.toString(), { headers: cookie ? { cookie } : {}, redirect: "manual", signal: timeoutSignal(FETCH_TIMEOUT_MS) });
    if (!result.ok) {throw new Error(`句子库读取失败: ${result.status}`);}
    const records = await result.json();
    if (!Array.isArray(records)) {throw new Error("句子库格式错误");}
    return records;
}

// 统一返回函数
function createResponse(code, message, extraData = {}, extraHeaders = {}) {
    return jsonResponse({
        code: code,
        message: message,
        timestamp: Date.now(),
        ...extraData,
    }, {
        headers: {
            ...extraHeaders,
            ...responseHeaders,
        },
        status: code,
    });
}

// 通用错误处理函数
function handleError(code, error, devEnv, customMessage = "服务器内部错误") {
    if (devEnv === "true") {
        return createResponse(code, error.message);
    } else {
        return createResponse(code, customMessage);
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    // KV 回填放后台跑（waitUntil 已验证支持）；没有时回落到同步写。
    const waitUntil = typeof context.waitUntil === "function" ? context.waitUntil.bind(context) : null;

    try {
        // 处理 OPTIONS 请求；除 GET / OPTIONS 外一律 405。
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    ...responseHeaders,
                },
            });
        }
        if (request.method !== "GET") {
            return createResponse(405, "仅支持 GET 请求", {}, { "Allow": "GET, OPTIONS" });
        }

        const url = new URL(request.url); // 获取请求的 URL
        const categoryKey = url.searchParams.get("c"); // 从 URL 中获取 c 参数，一言类型
        const encodeType = url.searchParams.get("encode"); // 从 URL 中获取 encode 参数，返回编码
        const callback = url.searchParams.get("callback"); // 从 URL 中获取 callback 参数，调用的异步函数
        const select = url.searchParams.get("select"); // 从 URL 中获取 select 参数，选择器。配合 encode=js 使用

        if (callback && !CALLBACK_PATTERN.test(callback)) {
            return createResponse(400, "callback 必须是合法的 JavaScript 函数名");
        }
        if (encodeType === "js" && select && !SELECTOR_PATTERN.test(select)) {
            return createResponse(400, "select 必须是合法的 CSS 选择器");
        }

        // mode=weighted（默认）：全库等概率，即大分类更容易被抽中；
        // mode=category（别名 balanced）：先在符合条件的分类中等概率抽一个
        // 分类，再在该分类内等概率抽一句，小分类和大分类机会均等。
        // 只指定一个分类时两种模式结果相同。
        const modeParam = url.searchParams.get("mode");
        const mode = modeParam === null || modeParam === "" ? "weighted" : modeParam;
        if (mode !== "weighted" && mode !== "category" && mode !== "balanced") {
            return createResponse(400, "mode 必须是 weighted、category 或 balanced 之一");
        }
        const balancedMode = mode === "category" || mode === "balanced";

        const minLength = url.searchParams.has("min_length") // 从 URL 中获取 min_length 参数，返回一言的最小长度（包含）
            ? parsePositiveInt(url.searchParams.get("min_length"))
            : 0;

        const maxLength = url.searchParams.has("max_length") // 从 URL 中获取 max_length 参数，返回一言的最大长度（包含）
            ? parsePositiveInt(url.searchParams.get("max_length"))
            : Infinity;

        // 在 minLength 被传入时进行正整数检查
        if (url.searchParams.has("min_length") && (minLength <= 0 || !Number.isInteger(minLength))) {
            return createResponse(400, "min_length 必须是正整数");
        }

        // 在 maxLength 被传入时进行正整数检查
        if (url.searchParams.has("max_length") && (maxLength <= 0 || !Number.isInteger(maxLength))) {
            return createResponse(400, "max_length 必须是正整数");
        }

        // 确保 maxLength 不小于 minLength
        if (maxLength < minLength) {
            return createResponse(400, "max_length 不能小于 min_length");
        }

        const hostname = url.hostname.toLowerCase();
        if (!["http:", "https:"].includes(url.protocol) || !(hostname === "hitokoto.xzccs.top" || hostname.endsWith(".edgeone.cool"))) {
            return createResponse(403, "不支持的部署域名");
        }
        const cookie = (request.headers.get("cookie") || "").split(";").map(part => part.trim())
            .filter(part => /^(eo_token|eo_time)=/.test(part)).join("; ");
        const kv = resolveKv(env);
        const indexAsset = new URL(`/sentence-index.json?v=${encodeURIComponent(sentenceVersion)}`, url.origin);
        const sentenceIndex = await loadIndex(indexAsset, cookie, kv, waitUntil);

        // 使用构建时生成的长度索引，等概率选出匹配的句子，再读取所在分类。
        // 先按分类汇总候选，两种模式共用同一份候选表，只是抽取方式不同。
        const keys = categoryKey ? [categoryKey] : Object.keys(sentenceIndex);
        const perCategory = [];
        let total = 0;
        for (const key of keys) {
            if (!Object.prototype.hasOwnProperty.call(sentenceIndex, key)) {continue;}
            const buckets = [];
            let categoryTotal = 0;
            for (const [length, indexes] of Object.entries(sentenceIndex[key])) {
                if (Number(length) < minLength || Number(length) > maxLength) {continue;}
                buckets.push({ indexes });
                categoryTotal += indexes.length;
            }
            if (categoryTotal > 0) {
                perCategory.push({ key, buckets, total: categoryTotal });
                total += categoryTotal;
            }
        }
        if (!total) {return createResponse(404, categoryKey
            ? "没有在该类别找到符合长度条件的一言" : "没有找到符合长度条件的一言");}
        let chosen;
        let selected;
        if (balancedMode && perCategory.length > 1) {
            const category = perCategory[Math.floor(Math.random() * perCategory.length)];
            selected = Math.floor(Math.random() * category.total);
            for (const bucket of category.buckets) {
                if (selected < bucket.indexes.length) {chosen = { key: category.key, indexes: bucket.indexes }; break;}
                selected -= bucket.indexes.length;
            }
        } else {
            selected = Math.floor(Math.random() * total);
            for (const category of perCategory) {
                for (const bucket of category.buckets) {
                    if (selected < bucket.indexes.length) {chosen = { key: category.key, indexes: bucket.indexes }; break;}
                    selected -= bucket.indexes.length;
                }
                if (chosen) {break;}
            }
        }
        const asset = new URL(`/sentences/${chosen.key}.json?v=${encodeURIComponent(sentenceVersion)}`, url.origin);
        const records = await loadSentences(asset, cookie, kv, chosen.key, waitUntil);
        const randomSentence = records[chosen.indexes[selected]];
        if (!randomSentence || randomSentence.type !== chosen.key) {
            sentenceCache.delete(asset.toString());
            throw new Error("句子库与索引不一致");
        }

        // 构造响应数据
        const response = {
            id: randomSentence.id, // 一言的唯一标识符
            hitokoto: randomSentence.hitokoto, // 一言内容
            type: randomSentence.type, // 一言类型
            from: randomSentence.from, // 一言的来源
            from_who: randomSentence.from_who, // 一言的作者
            length: randomSentence.length, // 一言的长度
            timestamp: Date.now(), // 响应生成时的 Unix 毫秒时间戳
        };

        // 如果有 encodeType、callback、select 参数则处理并返回相应的内容
        if (encodeType === "text") {
            // 用 JSON.stringify 生成字符串字面量，避免只转义双引号导致的注入。
            const responseContent = callback
                ? `;${callback}(${JSON.stringify(randomSentence.hitokoto)});`
                : randomSentence.hitokoto;

            // 返回响应
            const contentType = callback ? "application/javascript" : "text/plain";
            return new Response(responseContent, {
                headers: {
                    "Content-Type": `${contentType}; charset=UTF-8`,
                    "Cache-Control": "no-store",
                    ...responseHeaders,
                },
            });
        } else if (encodeType === "js") {
            // 句子和选择器都用 JSON.stringify 生成字面量；querySelector 返回单个元素或 null，
            // 原来的 Array.isArray 判断是错的，改为判空后赋值。
            const jsContent = `(function hitokoto(){var hitokoto=${JSON.stringify(randomSentence.hitokoto)};var dom=document.querySelector(${JSON.stringify(select || ".hitokoto")});if(dom){dom.innerText=hitokoto;}})()`;

            // 如果有 callback 参数，则包裹为回调形式
            const finalContent = callback
                ? `;${callback}(${JSON.stringify(jsContent)});`
                : jsContent;

            // 返回最终的 JS 内容
            return new Response(finalContent, {
                headers: {
                    "Content-Type": "application/javascript; charset=UTF-8",
                    "Cache-Control": "no-store",
                    ...responseHeaders,
                },
            });
        } else if ((!encodeType || encodeType === "json") && callback) {
            // 保持原有约定：回调收到的是 JSON 字符串而非对象，但用 JSON.stringify
            // 做两层转义，避免手动 replace 只转义双引号导致的注入。
            const jsonCallbackContent = `;${callback}(${JSON.stringify(JSON.stringify(response))});`;

            // 返回响应
            return new Response(jsonCallbackContent, {
                headers: {
                    "Content-Type": "application/javascript; charset=UTF-8",
                    "Cache-Control": "no-store",
                    ...responseHeaders,
                },
            });
        } else {
            // 默认返回 JSON 格式数据
            return jsonResponse(response, {
                headers: {
                    "Content-Type": "application/json; charset=UTF-8",
                    ...responseHeaders,
                },
            });
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return handleError(500, error, env?.DEV_ENV);
    }
}
