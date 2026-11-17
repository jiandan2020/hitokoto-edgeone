// 部署后预热 KV：逐分类请求 /api，触发边缘函数的懒写入，把索引和
// 12 个分类的句子写进 KV；再请求一次 /stats-data 预热统计缓存，
// 请求一次 /stats-daily 预热每日汇总缓存。
// KV 未绑定时脚本照常返回 200，只是不会写入 KV，不报错。
// 用法：node scripts/warm-kv.mjs [baseUrl] [sentenceVersion]
//   baseUrl：默认 https://hitokoto.xzccs.top
//   sentenceVersion：可选；传了就先轮询 /status，等线上版本对上
//     （新版本已上线）再预热，最多等 15 分钟；不传则直接预热。
const base = (process.argv[2] || "https://hitokoto.xzccs.top").replace(/\/$/, "");
const expectedVersion = process.argv[3] || null;

// 等待新版本上线：轮询 /status，直到 sentenceVersion 对上，或超时。
// 返回 true 表示已上线，false 表示超时。
async function waitForVersion(expected, timeoutMs = 15 * 60 * 1000, intervalMs = 30 * 1000) {
    const deadline = Date.now() + timeoutMs;
    while (true) {
        try {
            const response = await fetch(`${base}/status?format=json&probe=read`, { signal: AbortSignal.timeout(10000) });
            if (response.ok) {
                const data = await response.json();
                if (data.sentenceVersion === expected) {
                    console.log(`新版本已上线：${expected.slice(0, 12)}`);
                    return true;
                }
                console.log(`等待上线中，当前版本：${String(data.sentenceVersion || "未知").slice(0, 12)}，目标：${expected.slice(0, 12)}`);
            } else {
                console.log(`等待上线中，/status 返回 ${response.status}`);
            }
        } catch (error) {
            console.log(`等待上线中，/status 请求失败：${error.message}`);
        }
        if (Date.now() >= deadline) {
            console.error(`等待超时（${timeoutMs / 60000} 分钟），新版本未上线`);
            return false;
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
}

if (expectedVersion) {
    const live = await waitForVersion(expectedVersion);
    if (!live) {process.exit(1);}
}

const paths = [..."abcdefghijkl"].map(category => `/api?c=${category}`);
paths.push("/api?mode=category", "/stats-data", "/stats-daily");
let failed = 0;
for (const path of paths) {
    try {
        const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(10000) });
        console.log(`${response.status} ${path}`);
        if (!response.ok) {failed += 1;}
    } catch (error) {
        console.error(`失败 ${path}: ${error.message}`);
        failed += 1;
    }
}
if (failed > 0) {
    console.error(`预热完成，${failed} 个请求失败`);
    process.exit(1);
}
console.log("预热完成，索引、12 个分类、统计缓存和每日汇总缓存已写入 KV（若已绑定）。");
