// 临时探针：验证 EdgeOne Pages Functions 是否支持 context.waitUntil，
// 以及 waitUntil 注册的后台任务是否真能在响应返回后跑完。
// 用法：
//   GET /waituntil-probe
//     → 返回 { hasWaitUntil: true/false }
//   GET /waituntil-probe?run=write&key=<key>
//     → 用 waitUntil 在后台写一个 KV 键，立即返回 { scheduled: true/false, key }
//   GET /waituntil-probe?check=<key>
//     → 读 KV 键，返回 { exists: true/false, key }
// 验证完即删除本文件，不要留在仓库里。
function resolveKv(env) {
    const fromGlobal = globalThis.hitokoto_kv;
    if (fromGlobal && typeof fromGlobal.get === "function") {return fromGlobal;}
    const fromEnv = env && env.hitokoto_kv;
    if (fromEnv && typeof fromEnv.get === "function") {return fromEnv;}
    return null;
}

export default async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const hasWaitUntil = typeof context.waitUntil === "function";
    const kv = resolveKv(env);
    const headers = { "Content-Type": "application/json; charset=UTF-8" };
    const run = url.searchParams.get("run");
    const check = url.searchParams.get("check");
    if (run === "write") {
        const key = url.searchParams.get("key") || `waituntil_probe_${Date.now()}`;
        if (!hasWaitUntil || !kv) {
            return new Response(JSON.stringify({ hasWaitUntil, kvBound: !!kv, scheduled: false, key }), { headers });
        }
        // 后台写 KV，不 await；响应立即返回。
        context.waitUntil((async () => {
            try {
                await kv.put(key, JSON.stringify({ done: true, at: new Date().toISOString() }));
            } catch (error) {
                console.error("probe KV write failed:", error);
            }
        })());
        return new Response(JSON.stringify({ hasWaitUntil, kvBound: true, scheduled: true, key }), { headers });
    }
    if (check) {
        let exists = false;
        let value = null;
        if (kv) {
            try {
                value = await kv.get(check);
                exists = value !== null && value !== undefined;
            } catch {
                exists = false;
            }
        }
        return new Response(JSON.stringify({ hasWaitUntil, kvBound: !!kv, exists, key: check, value }), { headers });
    }
    return new Response(JSON.stringify({ hasWaitUntil, kvBound: !!kv }), { headers });
}
