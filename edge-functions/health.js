// 与句子库无关的轻量探针，用于区分平台路由与 API 初始化问题。
export default function onRequest() {
    return new Response("ok", {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
}
