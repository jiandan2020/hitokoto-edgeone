// 部署后预热 KV：逐分类请求 /api，触发边缘函数的懒写入，把索引和
// 12 个分类的句子写进 KV；再请求一次 /stats-data 预热统计缓存，
// 请求一次 /stats-daily 预热每日汇总缓存。
// KV 未绑定时脚本照常返回 200，只是不会写入 KV，不报错。
// 用法：node scripts/warm-kv.mjs [baseUrl]
// 默认：https://hitokoto.xzccs.top
const base = (process.argv[2] || "https://hitokoto.xzccs.top").replace(/\/$/, "");
const paths = [..."abcdefghijkl"].map(category => `/api?c=${category}`);
paths.push("/api?mode=category", "/stats-data", "/stats-daily");
let failed = 0;
for (const path of paths) {
    try {
        const response = await fetch(`${base}${path}`);
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
