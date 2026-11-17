// v5.0：首页改为 Vue SPA。入口 HTML 由 Vite 构建到 dist/index.html，
// 本函数同源取回后返回；路由由前端 Vue Router 按 URL 渲染。
// /api、/stats-data、/stats-daily、/status 仍由各自的边缘函数处理，不会被改写。
const SPA_ENTRY = "/dist/index.html";
const FETCH_TIMEOUT_MS = 10000;

function timeoutSignal(ms) {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        return AbortSignal.timeout(ms);
    }
    if (typeof AbortController !== "undefined") {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    }
    return undefined;
}

export default async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const asset = new URL(SPA_ENTRY, url.origin);
    try {
        const response = await fetch(asset.toString(), { redirect: "manual", signal: timeoutSignal(FETCH_TIMEOUT_MS) });
        if (!response.ok) {
            throw new Error(`SPA 入口不可用: ${response.status}`);
        }
        const html = await response.text();
        return new Response(html, {
            headers: {
                "Content-Type": "text/html; charset=UTF-8",
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "no-store",
            },
        });
    } catch {
        return new Response("页面暂时不可用，请稍后再试。", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=UTF-8" },
        });
    }
}
