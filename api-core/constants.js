// 共享常量：响应头、超时、缓存上限。
// 构建时注入的全局量（sentenceVersion、embeddedSentenceIndex、
// embeddedSentenceHashes）不在这里定义，见 build.js 前缀的常量声明。
const responseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "X-Source-Code": "https://github.com/jiandan2020/hitokoto-edgeone",
};
const FETCH_TIMEOUT_MS = 10000;
// 每个实例按需缓存最多 12 个分类，1 小时后重新读取；不缓存失败结果。
const CACHE_LIMIT = 12;
const CACHE_TTL_MS = 60 * 60 * 1000;

export { CACHE_LIMIT, CACHE_TTL_MS, FETCH_TIMEOUT_MS, responseHeaders };
