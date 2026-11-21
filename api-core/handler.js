// /api 入口编排：参数解析与校验 → 域名检查 → 选句 → 取数 → 核对 → 响应。
// 本模块引用构建时注入的全局量 sentenceVersion（见 build.js 前缀的常量声明），
// 运行时由打包产物提供。
import { responseHeaders } from "./constants.js";
import { clearSentenceCache, loadIndex, loadSentences } from "./corpus.js";
import { resolveKv } from "./kv.js";
import { log } from "./log.js";
import { CALLBACK_PATTERN, SELECTOR_PATTERN, parsePositiveInt } from "./parse.js";
import { createResponse, handleError, jsonResponse } from "./response.js";
import { selectSentence } from "./select.js";

export default async function onRequest(context) {
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
        const picked = selectSentence(sentenceIndex, { categoryKey, balancedMode, minLength, maxLength });
        if (!picked) {
            return createResponse(404, categoryKey
                ? "没有在该类别找到符合长度条件的一言" : "没有找到符合长度条件的一言");
        }
        const asset = new URL(`/sentences/${picked.key}.json?v=${encodeURIComponent(sentenceVersion)}`, url.origin);
        const records = await loadSentences(asset, cookie, kv, picked.key, waitUntil);
        const randomSentence = records[picked.indexes[picked.selected]];
        // 选中后再核对：分类、索引长度、请求范围三者都对不上就当数据错版，
        // 清掉实例缓存并走 500，不把错版句子返回给调用方。
        if (!randomSentence || randomSentence.type !== picked.key || randomSentence.length !== picked.length || randomSentence.length < minLength || randomSentence.length > maxLength) {
            clearSentenceCache(asset);
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
        log("error", "unexpected_error", { error });
        return handleError(500, error, env?.DEV_ENV);
    }
}
