// 通用响应标头
const responseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "X-Source-Code": "https://github.com/molikai-work/hitokoto-cloudflare",
};

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

async function loadSentences(asset, cookie) {
    const key = asset.toString();
    const cached = sentenceCache.get(key);
    if (cached && cached.expires > Date.now()) {
        sentenceCache.delete(key);
        sentenceCache.set(key, cached);
        return cached.records;
    }
    if (cached) {sentenceCache.delete(key);}
    const records = await fetchSentences(asset, cookie);
    sentenceCache.delete(key);
    sentenceCache.set(key, { records, expires: Date.now() + CACHE_TTL_MS });
    while (sentenceCache.size > CACHE_LIMIT) {sentenceCache.delete(sentenceCache.keys().next().value);}
    return records;
}

// 索引独立保存，按部署域名缓存；缓存中不保存预览凭据。
const indexCache = new Map();
async function loadIndex(asset, cookie) {
    const key = asset.toString();
    const cached = indexCache.get(key);
    if (cached && cached.expires > Date.now()) {return cached.index;}
    const result = await fetch(key, { headers: cookie ? { cookie } : {}, redirect: "manual" });
    if (!result.ok) {throw new Error(`索引读取失败: ${result.status}`);}
    const data = await result.json();
    if (data.version !== sentenceVersion || !data.index || typeof data.index !== "object") {
        throw new Error("句子索引版本不一致或格式错误");
    }
    indexCache.set(key, { index: data.index, expires: Date.now() + CACHE_TTL_MS });
    return data.index;
}

async function fetchSentences(asset, cookie) {
    const result = await fetch(asset.toString(), { headers: cookie ? { cookie } : {}, redirect: "manual" });
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
        const indexAsset = new URL(`/sentence-index.json?v=${encodeURIComponent(sentenceVersion)}`, url.origin);
        const sentenceIndex = await loadIndex(indexAsset, cookie);

        // 使用构建时生成的长度索引，等概率选出匹配的句子，再读取所在分类。
        const keys = categoryKey ? [categoryKey] : Object.keys(sentenceIndex);
        const candidates = [];
        let total = 0;
        for (const key of keys) {
            if (!Object.prototype.hasOwnProperty.call(sentenceIndex, key)) {continue;}
            for (const [length, indexes] of Object.entries(sentenceIndex[key])) {
                if (Number(length) < minLength || Number(length) > maxLength) {continue;}
                candidates.push({ key, indexes });
                total += indexes.length;
            }
        }
        if (!total) {return createResponse(404, categoryKey
            ? "没有在该类别找到符合长度条件的一言" : "没有找到符合长度条件的一言");}
        let selected = Math.floor(Math.random() * total);
        let chosen;
        for (const candidate of candidates) {
            if (selected < candidate.indexes.length) { chosen = candidate; break; }
            selected -= candidate.indexes.length;
        }
        const asset = new URL(`/sentences/${chosen.key}.json?v=${encodeURIComponent(sentenceVersion)}`, url.origin);
        const records = await loadSentences(asset, cookie);
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
