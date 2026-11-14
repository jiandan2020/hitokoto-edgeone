// 独立的域名统计页面；数据由同源服务端接口提供。
const page = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>站点统计 · 一言 API</title><link rel="icon" href="/favicon.svg"><style>
:root{color-scheme:light;font-family:system-ui,sans-serif;color:#30283f;background:#fff8f7}body{margin:0;background:radial-gradient(ellipse at top,#ffe6ed,transparent 60%);min-height:100vh}main{max-width:900px;margin:auto;padding:60px 24px}a{color:#a83d5c}h1{font-size:clamp(32px,6vw,48px);margin:22px 0 8px}p{line-height:1.8;color:#6d6279}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;margin:28px 0}.card{padding:24px;border:1px solid #f0dfe5;border-radius:20px;background:rgba(255,255,255,.85);box-shadow:0 12px 36px -28px #6d6279}.label{font-size:14px;color:#6d6279}.value{font-size:30px;font-weight:700;margin:12px 0 0;overflow-wrap:anywhere;color:#a83d5c}.note{font-size:13px}.error{color:#a83d5c}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:12px 4px;border-bottom:1px solid #f0dfe5}th{color:#6d6279;font-weight:500}.chart{display:flex;align-items:end;gap:6px;height:200px;overflow-x:auto;padding:12px 0}.bar-wrap{flex:1 0 22px;min-width:22px;display:flex;flex-direction:column;align-items:center;justify-content:end;height:100%}.bar{width:80%;min-height:2px;background:linear-gradient(#f198ad,#b65e88);border-radius:5px 5px 0 0}.missing{background:repeating-linear-gradient(45deg,#ddd,#ddd 3px,#f4f4f4 3px,#f4f4f4 6px)}.chart-label{font-size:10px;color:#6d6279;writing-mode:vertical-rl;margin-top:5px}
</style></head><body><main><a href="/">← 返回首页</a><h1>站点访问统计</h1><p>hitokoto.xzccs.top · 最近 24 个完整小时</p><div class="cards"><div class="card"><div class="label">请求数</div><div class="value" id="requests">—</div></div><div class="card"><div class="label">EdgeOne 响应流量</div><div class="value" id="traffic">—</div></div><div class="card"><div class="label">5xx 错误率</div><div class="value" id="rate">—</div></div></div><p id="status" role="status">正在加载统计数据…</p><section class="card"><h2>请求数详细数据</h2><p class="note">最近 24 个完整小时，仅统计路径完全为 /api 的请求（不区分查询参数）。</p><table><thead><tr><th scope="col">路由地址</th><th scope="col">请求数</th></tr></thead><tbody><tr><td><code>/api</code></td><td id="api-requests">加载中…</td></tr></tbody></table></section><section class="card"><div class="label">自 2026-11-15 起累计请求数</div><div class="value" id="cumulative">—</div><p class="note" id="history-status" role="status">正在加载每日汇总…</p><h2>每日请求趋势</h2><p class="note">最近 30 个北京时间自然日，灰色表示尚未采集，不代表零。</p><div id="chart" class="chart" role="img" aria-label="每日请求数柱状图"></div><details><summary>查看每日数据</summary><div id="history-list"></div></details></section><p class="note">统计包含该域名的首页、静态资源和 API；错误率按 EdgeOne 5xx 响应数除以请求总数计算。默认不包含 Web 防护缓释的请求。数据约有 10 分钟延迟，实例缓存最多 10 分钟；数据不足或查询失败时不显示为零。</p><p class="note">数据来源：腾讯云 EdgeOne 流量分析</p></main><script>
const dateFormat = new Intl.DateTimeFormat('zh-CN', { timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false });
fetch('/stats-data', {cache:'no-store'}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
  document.getElementById('requests').textContent = data.requests.toLocaleString('zh-CN') + ' 次';
  document.getElementById('api-requests').textContent = Number.isSafeInteger(data.apiRequests) && data.apiRequests >= 0 ? data.apiRequests.toLocaleString('zh-CN') : '暂无数据';
  document.getElementById('traffic').textContent = (data.bytes / 1048576).toFixed(2) + ' MiB';
  document.getElementById('rate').textContent = data.errorRate === null ? '暂无数据' : (data.errorRate * 100).toFixed(2) + '%';
  document.getElementById('status').textContent = '统计范围：' + dateFormat.format(new Date(data.start)) + ' 至 ' + dateFormat.format(new Date(data.end)) + '（北京时间） · 获取时间：' + dateFormat.format(new Date(data.fetchedAt)) + '（北京时间）';
}).catch(() => { document.getElementById('status').textContent = '统计数据暂不可用，请稍后再试。'; document.getElementById('status').className = 'error'; document.getElementById('api-requests').textContent = '暂不可用'; });
fetch('/daily-stats.json', {cache:'no-store'}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
  const start = Date.parse(data.startDate + 'T00:00:00+08:00');
  const today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0,10);
  const end = Date.parse(today + 'T00:00:00+08:00');
  if (!Number.isFinite(start) || !data.days || typeof data.days !== 'object' || Array.isArray(data.days)) throw new Error('invalid');
  const entries = []; let total = 0; let missing = 0;
  for (let day = start; day < end; day += 86400000) {
    const key = new Date(day + 8 * 3600000).toISOString().slice(0,10);
    const value = data.days[key];
    if (Number.isSafeInteger(value) && value >= 0) total += value; else missing++;
    entries.push({key, value: Number.isSafeInteger(value) && value >= 0 ? value : null});
  }
  const known = entries.length - missing;
  document.getElementById('cumulative').textContent = known ? total.toLocaleString('zh-CN') + ' 次' : '暂无数据';
  document.getElementById('history-status').textContent = known ? '已采集 ' + known + ' 天，缺失 ' + missing + ' 天；缺失天数不计入累计值。统计截至昨天（北京时间），不含今天。' : '尚无已采集的完整日数据，缺失天数不会按零计算。';
  const recent = entries.slice(-30), max = Math.max(1, ...recent.map(e => e.value || 0));
  const chart = document.getElementById('chart'), list = document.getElementById('history-list');
  for (const e of recent) {
    const wrap = document.createElement('div'), bar = document.createElement('div'), label = document.createElement('span'), row = document.createElement('div');
    wrap.className = 'bar-wrap'; bar.className = e.value === null ? 'bar missing' : 'bar'; bar.style.height = e.value === null ? '8px' : Math.max(2, e.value / max * 155) + 'px';
    wrap.title = e.key + '：' + (e.value === null ? '未采集' : e.value.toLocaleString('zh-CN') + ' 次'); label.className = 'chart-label'; label.textContent = e.key.slice(5);
    wrap.append(bar, label); chart.append(wrap); row.textContent = wrap.title; list.append(row);
  }
}).catch(() => { document.getElementById('history-status').textContent = '每日汇总暂不可用。'; });
</script></body></html>`;
export default function onRequest() {
    return new Response(page, { headers: { "Content-Type": "text/html; charset=UTF-8", "X-Content-Type-Options": "nosniff" } });
}
