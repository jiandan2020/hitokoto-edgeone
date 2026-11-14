// 独立的域名统计页面；数据由同源服务端接口提供。
const page = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>站点统计 · 一言 API</title><link rel="icon" href="/favicon.svg"><style>
:root{color-scheme:light;font-family:system-ui,sans-serif;color:#30283f;background:#fff8f7}body{margin:0;background:radial-gradient(ellipse at top,#ffe6ed,transparent 60%);min-height:100vh}main{max-width:900px;margin:auto;padding:60px 24px}a{color:#a83d5c}h1{font-size:clamp(32px,6vw,48px);margin:22px 0 8px}p{line-height:1.8;color:#6d6279}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;margin:28px 0}.card{padding:24px;border:1px solid #f0dfe5;border-radius:20px;background:rgba(255,255,255,.85);box-shadow:0 12px 36px -28px #6d6279}.label{font-size:14px;color:#6d6279}.value{font-size:30px;font-weight:700;margin:12px 0 0;overflow-wrap:anywhere;color:#a83d5c}.note{font-size:13px}.error{color:#a83d5c}
</style></head><body><main><a href="/">← 返回首页</a><h1>站点访问统计</h1><p>hitokoto.xzccs.top · 最近 24 个完整小时</p><div class="cards"><div class="card"><div class="label">请求数</div><div class="value" id="requests">—</div></div><div class="card"><div class="label">EdgeOne 响应流量</div><div class="value" id="traffic">—</div></div><div class="card"><div class="label">5xx 错误率</div><div class="value" id="rate">—</div></div></div><p id="status" role="status">正在加载统计数据…</p><p class="note">统计包含该域名的首页、静态资源和 API；错误率按 EdgeOne 5xx 响应数除以请求总数计算。默认不包含 Web 防护缓释的请求。数据约有 10 分钟延迟，实例缓存最多 10 分钟；数据不足或查询失败时不显示为零。</p><p class="note">数据来源：腾讯云 EdgeOne 流量分析</p></main><script>
const dateFormat = new Intl.DateTimeFormat('zh-CN', { timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false });
fetch('/stats-data', {cache:'no-store'}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
  document.getElementById('requests').textContent = data.requests.toLocaleString('zh-CN') + ' 次';
  document.getElementById('traffic').textContent = (data.bytes / 1048576).toFixed(2) + ' MiB';
  document.getElementById('rate').textContent = data.errorRate === null ? '暂无数据' : (data.errorRate * 100).toFixed(2) + '%';
  document.getElementById('status').textContent = '统计范围：' + dateFormat.format(new Date(data.start)) + ' 至 ' + dateFormat.format(new Date(data.end)) + '（北京时间） · 获取时间：' + dateFormat.format(new Date(data.fetchedAt)) + '（北京时间）';
}).catch(() => { document.getElementById('status').textContent = '统计数据暂不可用，请稍后再试。'; document.getElementById('status').className = 'error'; });
</script></body></html>`;
export default function onRequest() {
    return new Response(page, { headers: { "Content-Type": "text/html; charset=UTF-8", "X-Content-Type-Options": "nosniff" } });
}
