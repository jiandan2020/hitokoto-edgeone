// EdgeOne 边缘函数 - GitHub 托管版本
// JSON 数据从 GitHub Raw URL 读取，适合从 GitHub 直接导入部署

// 通用响应标头
const responseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "X-Source-Code": "https://github.com/jiandan2020/hitokoto-cloudflare",
};

// 统一返回函数
function createResponse(code, message, extraData = {}, extraHeaders = {}) {
    return new Response(JSON.stringify({
        code: code,
        message: message,
        timestamp: Date.now(),
        ...extraData,
    }), {
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
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

// 从 GitHub 读取句子数据
async function getSentencesFromGitHub(category, baseUrl) {
    try {
        const url = `${baseUrl}/sentences/${category}.json`;
        const response = await fetch(url, {
            cf: {
                cacheTtl: 3600, // 缓存 1 小时
                cacheEverything: true,
            }
        });
        
        if (!response.ok) {
            console.error(`Failed to fetch ${category}.json:`, response.status);
            return [];
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${category}.json:`, error);
        return [];
    }
}

async function handleRequest(request, env) {
    try {
        // 处理 OPTIONS 请求
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    ...responseHeaders,
                },
            });
        }

        // GitHub Raw URL 基础地址
        // 从 edgeone-support 分支读取
        const githubRawUrl = env.GITHUB_RAW_URL || 'https://raw.githubusercontent.com/jiandan2020/hitokoto-cloudflare/edgeone-support';

        const url = new URL(request.url);
        const categoryKey = url.searchParams.get("c");
        const encodeType = url.searchParams.get("encode");
        const callback = url.searchParams.get("callback");
        const select = url.searchParams.get("select");

        const minLength = url.searchParams.has("min_length")
            ? parseInt(url.searchParams.get("min_length"), 10) 
            : 0;

        const maxLength = url.searchParams.has("max_length")
            ? parseInt(url.searchParams.get("max_length"), 10) 
            : 30;

        // 参数验证
        if (url.searchParams.has("min_length") && (minLength <= 0 || !Number.isInteger(minLength))) {
            return createResponse(400, "min_length 必须是正整数");
        }

        if (url.searchParams.has("max_length") && (maxLength <= 0 || !Number.isInteger(maxLength))) {
            return createResponse(400, "max_length 必须是正整数");
        }

        if (maxLength < minLength) {
            return createResponse(400, "max_length 不能小于 min_length");
        }

        let sentences = [];
        const categories = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

        // 选择句子分类
        if (categoryKey) {
            sentences = await getSentencesFromGitHub(categoryKey, githubRawUrl);
            if (sentences.length === 0) {
                sentences = await getSentencesFromGitHub('a', githubRawUrl); // 默认使用 a 类别
            }
        } else {
            // 随机选择一个类别
            const randomKey = categories[Math.floor(Math.random() * categories.length)];
            sentences = await getSentencesFromGitHub(randomKey, githubRawUrl);
        }

        // 长度筛选
        if (minLength || maxLength) {
            if (categoryKey) {
                sentences = await getSentencesFromGitHub(categoryKey, githubRawUrl);
            } else {
                // 聚合所有分类
                const allSentences = await Promise.all(
                    categories.map(cat => getSentencesFromGitHub(cat, githubRawUrl))
                );
                sentences = allSentences.flat();
            }

            sentences = sentences.filter(sentence => {
                const isMinLengthValid = !minLength || sentence.length >= minLength;
                const isMaxLengthValid = !maxLength || sentence.length <= maxLength;
                return isMinLengthValid && isMaxLengthValid;
            });

            if (sentences.length === 0) {
                if (categoryKey) {
                    return createResponse(404, "没有在该类别找到符合长度条件的一言");
                }
                return createResponse(404, "没有找到符合长度条件的一言");
            }
        }

        // 随机选择一条
        const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];

        // 构造响应数据
        const response = {
            id: randomSentence.id,
            uuid: randomSentence.uuid,
            hitokoto: randomSentence.hitokoto,
            type: randomSentence.type,
            from: randomSentence.from,
            from_who: randomSentence.from_who,
            creator: randomSentence.creator,
            creator_uid: randomSentence.creator_uid,
            reviewer: randomSentence.reviewer,
            commit_from: randomSentence.commit_from,
            created_at: randomSentence.created_at,
            length: randomSentence.length,
        };

        // 根据 encode 参数返回不同格式
        if (encodeType === "text") {
            const responseContent = callback 
                ? `;${callback}("${randomSentence.hitokoto.replace(/"/g, '\\"')}");` 
                : randomSentence.hitokoto;

            const contentType = callback ? "application/javascript" : "text/plain";
            return new Response(responseContent, {
                headers: {
                    "Content-Type": `${contentType}; charset=UTF-8`,
                    ...responseHeaders,
                },
            });
        } else if (encodeType === "js") {
            const jsContent = `(function hitokoto(){var hitokoto="${randomSentence.hitokoto.replace(/"/g, '\\"')}";var dom=document.querySelector('${select || ".hitokoto"}');Array.isArray(dom)?dom[0].innerText=hitokoto:dom.innerText=hitokoto;})()`;

            const finalContent = callback 
                ? `;${callback}("${jsContent}");` 
                : jsContent;

            return new Response(finalContent, {
                headers: {
                    "Content-Type": "application/javascript; charset=UTF-8",
                    ...responseHeaders,
                },
            });
        } else if ((!encodeType || encodeType === "json") && callback) {
            const jsonResponse = JSON.stringify(response);
            const jsonCallbackContent = `;${callback}("${jsonResponse.replace(/"/g, '\\"')}");`;

            return new Response(jsonCallbackContent, {
                headers: {
                    "Content-Type": "application/javascript; charset=UTF-8",
                    ...responseHeaders,
                },
            });
        } else {
            return new Response(JSON.stringify(response), {
                headers: {
                    "Content-Type": "application/json; charset=UTF-8",
                    ...responseHeaders,
                },
            });
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return handleError(500, error, env?.DEV_ENV || "false");
    }
}

// EdgeOne 边缘函数入口
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request, event.env || {}));
});
