// EdgeOne 运行时可能没有 AbortSignal.timeout（较新的静态方法），
// 用 AbortController + setTimeout 兜底；两者都没有时返回 undefined（不设超时）。
// 整个函数绝不抛错，最坏情况就是退回 4.9.8 之前的无超时行为。
export function timeoutSignal(ms) {
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
