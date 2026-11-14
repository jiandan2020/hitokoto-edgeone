// EdgeOne 边缘函数 - 简化版
// GitHub Raw URL 基础地址
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/jiandan2020/hitokoto-cloudflare/edgeone-support';

// 通用响应标头
const responseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json; charset=UTF-8",
};

// 从 GitHub 读取句子数据
async function getSentencesFromGitHub(category) {
    try {
        const url = `${GITHUB_RAW_URL}/sentences/${category}.json`;
        const response = await fetch(url);
        
        if (!response.ok) {
            return [];
        }
        
        return await response.json();
    } catch (error) {
        return [];
    }
}

async function handleRequest(request) {
    try {
        // 处理 OPTIONS 请求
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: responseHeaders });
        }

        const url = new URL(request.url);
        const categoryKey = url.searchParams.get("c");
        const encodeType = url.searchParams.get("encode");

        const categories = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
        
        // 选择分类
        let targetCategory = categoryKey || categories[Math.floor(Math.random() * categories.length)];
        
        // 获取句子
        let sentences = await getSentencesFromGitHub(targetCategory);
        
        // 如果获取失败，使用默认分类
        if (sentences.length === 0) {
            sentences = await getSentencesFromGitHub('a');
        }
        
        // 如果还是空，返回错误
        if (sentences.length === 0) {
            return new Response(JSON.stringify({
                code: 500,
                message: "无法获取数据"
            }), {
                status: 500,
                headers: responseHeaders
            });
        }

        // 随机选择一条
        const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];

        // 根据 encode 参数返回不同格式
        if (encodeType === "text") {
            return new Response(randomSentence.hitokoto, {
                headers: {
                    ...responseHeaders,
                    "Content-Type": "text/plain; charset=UTF-8"
                }
            });
        }

        // 默认返回 JSON
        return new Response(JSON.stringify({
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
            length: randomSentence.length
        }), {
            headers: responseHeaders
        });

    } catch (error) {
        return new Response(JSON.stringify({
            code: 500,
            message: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: responseHeaders
        });
    }
}

// EdgeOne 边缘函数入口
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
