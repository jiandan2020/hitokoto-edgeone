// 响应封装：JSON、错误体。
import { responseHeaders } from "./constants.js";

// 使用标准 Response 构造 JSON，避免依赖运行时的 Response.json 支持。
// /api 是随机接口，显式 no-store，避免 CDN/浏览器缓存某一条随机结果。
export function jsonResponse(data, options = {}) {
    return new Response(JSON.stringify(data), {
        ...options,
        headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", ...options.headers },
    });
}

// 统一返回函数
export function createResponse(code, message, extraData = {}, extraHeaders = {}) {
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
export function handleError(code, error, devEnv, customMessage = "服务器内部错误") {
    if (devEnv === "true") {
        return createResponse(code, error.message);
    } else {
        return createResponse(code, customMessage);
    }
}
