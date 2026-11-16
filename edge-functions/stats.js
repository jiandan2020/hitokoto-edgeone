// 运行状况页：重新设计的一览式仪表盘（4.7.0）。
// 顶部是运行状态总览（健康状态、版本、刷新），接着是四张关键数字卡
// （昨日请求、24 小时请求、5xx 错误率、接口往返），然后是 KV 状态卡片、
// 随机一言、每小时趋势（含流量与 /api 小计）与每日趋势。
// 样式与首页统一（暖底、玫瑰红强调、金色峰值、漂浮气泡）。
// 数据全部由同源服务端接口提供：运行状态走 /status（只读探针，不写 KV），
// 每日汇总走 /stats-daily（KV 缓存），一言走 /api；访客浏览器不直接访问第三方。
// 公开页上没有写 KV 的按钮，完整写读探针请去 /status（JSON）。
const page = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>运行状况 · 一言 API</title><link rel="icon" href="/favicon.svg"><style>
:root{color-scheme:light;--ink:#30283f;--muted:#6d6279;--line:#ebdfe5;--accent:#a83d5c;--accent-soft:#f8edf0;--gold:#b97622;--card:rgba(255,255,255,.76);--danger:#a83232}
*{box-sizing:border-box}body{margin:0;min-height:100vh;color:var(--ink);background:radial-gradient(ellipse at 10% 0%,#ffe6ed 0,transparent 42%),radial-gradient(ellipse at 90% 20%,#e3f3ff 0,transparent 42%),linear-gradient(155deg,#fff7e8,#fffdf9 55%,#fff0f5);font-family:"Songti SC","Noto Serif SC",Georgia,serif;line-height:1.85}main{max-width:960px;margin:auto;padding:56px 24px;position:relative;z-index:1}a{color:var(--accent);text-underline-offset:4px}.eyebrow{font:700 12px/1.5 system-ui,sans-serif;letter-spacing:.32em;color:#806b7d}h1{font-family:"Songti SC","Noto Serif SC",Georgia,serif;font-size:clamp(34px,6vw,52px);line-height:1.2;margin:20px 0 8px;background:linear-gradient(100deg,#b97622,#c64e55 40%,#b83f80 70%,#367db3);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#a83d5c}h2{font-size:23px;margin:0 0 6px;font-family:"Songti SC","Noto Serif SC",Georgia,serif}h2:before{content:'✦';font-size:13px;color:#d25a7e;margin-right:12px}p{line-height:1.8;color:var(--muted)}p.note{font-size:14px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;margin:28px 0}.card{padding:26px 28px;border:1px solid rgba(255,255,255,.95);border-radius:22px;background:var(--card);box-shadow:0 16px 45px -30px rgba(90,55,80,.3);margin-bottom:22px}.cards .card{margin-bottom:0}.label{font-size:14px;color:var(--muted)}.value{font-size:32px;font-weight:700;margin:12px 0 0;overflow-wrap:anywhere;color:var(--accent);font-variant-numeric:tabular-nums}.value.loading{color:transparent;background:linear-gradient(90deg,#f3e9ec,#eadde2,#f3e9ec);background-size:200% 100%;animation:shimmer 1.4s linear infinite;border-radius:8px;min-height:40px}@keyframes shimmer{to{background-position:-200% 0}}.sub{font-size:13px;color:var(--muted);margin-top:6px;min-height:20px}.note{font-size:13px}.error{color:var(--danger)}.pill{display:inline-block;padding:3px 12px;border-radius:999px;font:600 13px/1.8 system-ui,sans-serif}.pill.ok{background:#e6f6e8;color:#22733a}.pill.bad{background:#fdeaea;color:#a83232}.pill.idle{background:#f3ecef;color:var(--muted)}.hero{display:flex;flex-wrap:wrap;gap:16px 24px;align-items:center;justify-content:space-between}.hero-main{display:flex;flex-direction:column;gap:6px}.hero-title{font-size:21px;font-weight:700;line-height:1.4}.hero-side{display:flex;flex-direction:column;align-items:flex-end;gap:8px}.hero-side .meta{font-size:13px;color:var(--muted);text-align:right}.kv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:16px}.kv-card{padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:#fbf2f4}.kv-head{display:flex;align-items:center;gap:8px}.kv-dot{flex:none;width:9px;height:9px;border-radius:50%}.kv-dot.ok{background:#2e9e4f}.kv-dot.bad{background:#c0392b}.kv-dot.idle{background:#b9aab2}.kv-label{font-size:13px;color:var(--muted)}.kv-value{font:700 20px/1.4 system-ui,sans-serif;margin-top:8px;font-variant-numeric:tabular-nums}.kv-sub{font-size:12px;color:var(--muted);margin-top:2px}.quote{font-family:"Songti SC","Noto Serif SC",Georgia,serif;font-size:clamp(24px,4vw,32px);line-height:1.6;margin:8px 0;color:var(--ink)}.quote-source{text-align:right;color:var(--muted);font-size:15px}.quote-meta{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}.chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.chip{padding:6px 14px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.8);color:var(--ink);font:600 13px/1.6 system-ui,sans-serif;cursor:pointer}.chip:hover{border-color:var(--accent)}.chip.active{background:var(--accent);border-color:var(--accent);color:#fff}.btn{display:inline-block;margin-top:8px;padding:9px 22px;border:0;border-radius:999px;background:linear-gradient(110deg,#cc5a48,#c44d7c);color:#fff;font:600 14px/1.5 system-ui,sans-serif;cursor:pointer;box-shadow:0 12px 24px -12px #d16b82}.btn:hover{filter:brightness(1.08)}.btn.ghost{background:rgba(255,255,255,.8);color:var(--accent);border:1px solid rgba(255,255,255,.9);box-shadow:none}.mini-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:16px 0 4px}.mini{padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:#fbf2f4}.mini .label{font-size:13px}.mini .num{font:700 20px/1.5 system-ui,sans-serif;color:var(--ink);margin-top:4px;font-variant-numeric:tabular-nums}.hourly-container{position:relative}.hourly-svg{width:100%;height:auto;display:block;overflow:visible;touch-action:pan-y}.hourly-tooltip{position:absolute;top:0;left:0;z-index:2;max-width:85%;padding:8px 11px;border-radius:8px;background:#30283f;color:#fff;font-size:13px;line-height:1.5;pointer-events:none;box-shadow:0 4px 14px rgba(48,40,63,.3)}.hourly-crosshair{stroke:var(--accent);stroke-width:1;stroke-dasharray:4 4;pointer-events:none}.hourly-hit{fill:transparent;pointer-events:all;cursor:crosshair}.hourly-grid{stroke:#ece2e6;stroke-width:1}.hourly-area{stroke:none}.hourly-line{fill:none;stroke:var(--accent);stroke-width:3;stroke-linejoin:round;stroke-linecap:round}.hourly-dot{fill:var(--accent)}.hourly-peak{fill:var(--gold);stroke:#fff;stroke-width:1.5}.axis-label{font-size:11px;fill:var(--muted)}.chart{display:flex;align-items:end;gap:6px;height:200px;overflow-x:auto;padding:12px 0}.bar-wrap{flex:1 0 22px;min-width:22px;display:flex;flex-direction:column;align-items:center;justify-content:end;height:100%}.bar{width:80%;min-height:2px;background:linear-gradient(#e88aa5,#a83d5c);border-radius:5px 5px 0 0}.bar.max{background:linear-gradient(#f6c453,#b97622)}.bar-value{font:700 11px/1.4 system-ui,sans-serif;color:var(--gold);margin-bottom:2px;white-space:nowrap}.missing{background:repeating-linear-gradient(45deg,#ddd,#ddd 3px,#f4f4f4 3px,#f4f4f4 6px)}.chart-label{font-size:10px;color:var(--muted);writing-mode:vertical-rl;margin-top:5px}details summary{cursor:pointer;color:var(--accent)}.bubbles{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}.bubble{position:absolute;bottom:-70px;border-radius:50%;opacity:0;animation:rise var(--duration) linear var(--delay) infinite;background:var(--color);width:var(--size);height:var(--size);left:var(--left)}@keyframes rise{0%{transform:translateY(0) scale(.8);opacity:0}10%{opacity:.35}100%{transform:translateY(-115vh) scale(1.15);opacity:0}}@media(max-width:600px){main{padding:40px 18px}.card{padding:20px}.hero-side{align-items:flex-start}.hero-side .meta{text-align:left}.kv-grid{grid-template-columns:repeat(2,1fr)}}@media(prefers-reduced-motion:reduce){.bubble{animation:none;display:none}}
</style></head><body><div class="bubbles" aria-hidden="true"><span class="bubble" style="--left:8%;--size:28px;--duration:16s;--delay:-3s;--color:#ffb2c8"></span><span class="bubble" style="--left:23%;--size:18px;--duration:19s;--delay:-11s;--color:#facf80"></span><span class="bubble" style="--left:39%;--size:36px;--duration:22s;--delay:-7s;--color:#b8dfff"></span><span class="bubble" style="--left:58%;--size:22px;--duration:18s;--delay:-14s;--color:#ffb2c8"></span><span class="bubble" style="--left:77%;--size:30px;--duration:21s;--delay:-5s;--color:#facf80"></span><span class="bubble" style="--left:93%;--size:19px;--duration:17s;--delay:-12s;--color:#b8dfff"></span></div><main><a href="/">← 返回首页</a><div class="eyebrow">HITOKOTO · STATUS</div><h1>运行状况</h1><p>hitokoto.xzccs.top · 运行状态、一言与访问统计</p><section class="card hero" id="health-banner"><div class="hero-main"><span class="pill idle" id="health-pill">检查中…</span><div class="hero-title" id="health-title">正在检查运行状态…</div><div class="meta" id="health-version" style="font-size:14px;color:var(--muted)"></div><div class="meta" id="health-time" style="font-size:14px;color:var(--muted)"></div></div><div class="hero-side"><button class="btn ghost" id="refresh" type="button">刷新数据</button><div class="meta" id="updated">统计每 10 分钟自动刷新一次，运行状态每分钟刷新一次。</div></div></section><div class="cards"><div class="card"><div class="label">昨日请求</div><div class="value loading" id="yesterday-requests">—</div><div class="sub" id="yesterday-date"></div></div><div class="card"><div class="label">24 小时请求</div><div class="value loading" id="requests">—</div><div class="sub" id="requests-sub"></div></div><div class="card"><div class="label">5xx 错误率</div><div class="value loading" id="rate">—</div><div class="sub" id="rate-sub"></div></div><div class="card"><div class="label">接口往返</div><div class="value loading" id="latency">—</div><div class="sub">最近一次换一句的耗时</div></div></div><p id="status" role="status">正在加载统计数据…</p><section class="card"><h2>KV 缓存状态</h2><p class="note">只读探针，每分钟自动刷新，不写 KV；完整写读检测见<a href="/status">运行状态 JSON</a>。</p><p id="kv-status" class="note" role="status">正在加载 KV 状态…</p><div class="kv-grid" id="kv-grid"></div></section><section class="card"><h2>随机一言</h2><div class="chips" id="quote-chips"></div><p class="quote" id="quote-text">正在取一句…</p><p class="quote-source" id="quote-source"></p><p class="quote-meta" id="quote-meta"></p><button class="btn" id="quote-next" type="button">换一句</button></section><section class="card"><h2>每小时访问量</h2><p class="note">域名请求数 · 最近 24 个完整小时 · 北京时间；缺失数据处折线断开，金色点为峰值小时。</p><div class="mini-row"><div class="mini"><div class="label">EdgeOne 响应流量</div><div class="num" id="traffic">—</div></div><div class="mini"><div class="label">/api 请求数</div><div class="num" id="api-requests">—</div></div><div class="mini"><div class="label">/api 请求占比</div><div class="num" id="api-share">—</div></div><div class="mini"><div class="label">小时均值</div><div class="num" id="hourly-avg">—</div></div></div><p id="hourly-status" class="note" role="status">正在加载每小时数据…</p><div class="hourly-container"><svg id="hourly-chart" class="hourly-svg" viewBox="0 0 680 220" role="img" aria-label="每小时域名请求数折线图，鼠标移动或触摸查看详情"></svg><div id="hourly-tooltip" class="hourly-tooltip" role="tooltip" hidden></div></div><p class="note" id="hourly-summary"></p><details><summary>查看每小时数据</summary><div id="hourly-list"></div></details></section><section class="card"><div class="label">自 2026-11-15 起累计请求数</div><div class="value loading" id="cumulative">—</div><p class="note" id="history-status" role="status">正在加载每日汇总…</p><h2>每日请求趋势</h2><p class="note">最近 30 个北京时间自然日，灰色表示尚未采集，不代表零；金色柱为最高单日，柱顶数字为当日请求数。</p><div class="mini-row"><div class="mini"><div class="label">近 7 日合计</div><div class="num" id="week-total">—</div></div><div class="mini"><div class="label">已采集日均</div><div class="num" id="day-average">—</div></div><div class="mini"><div class="label">最高单日</div><div class="num" id="best-day">—</div></div></div><div id="chart" class="chart" role="img" aria-label="每日请求数柱状图"></div><details><summary>查看每日数据</summary><div id="history-list"></div></details></section><p class="note">统计包含该域名的首页、静态资源和 API；错误率按 EdgeOne 5xx 响应数除以请求总数计算。默认不包含 Web 防护缓释的请求。数据约有 10 分钟延迟，实例缓存最多 10 分钟；数据不足或查询失败时不显示为零。</p><p class="note">数据来源：腾讯云 EdgeOne 流量分析；每日汇总是同源 /stats-daily 接口提供（KV 缓存），数据源为 GitHub stats-data 分支。运行状态数据（JSON）见<a href="/status">/status</a>，项目见 <a href="https://github.com/jiandan2020/hitokoto-edgeone" target="_blank" rel="noopener">GitHub 仓库</a>。</p></main><script>
const dateFormat = new Intl.DateTimeFormat('zh-CN', { timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false });
const CATEGORIES = [["a", "动画"], ["b", "漫画"], ["c", "游戏"], ["d", "文学"], ["e", "原创"], ["f", "网络"], ["g", "其他"], ["h", "影视"], ["i", "诗词"], ["j", "网易云"], ["k", "哲学"], ["l", "抖机灵"]];
let quoteCategory = '';
function setLoading(id, on) { const el = document.getElementById(id); if (el) el.classList.toggle('loading', on); }
function pill(ok, goodText, badText) { return ok ? '✓ ' + goodText : '✗ ' + badText; }
function loadStatus() {
  return fetch('/status?format=json&probe=read', {cache:'no-store'}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
    const kv = data.kv || {};
    const pillEl = document.getElementById('health-pill');
    pillEl.textContent = data.ok ? '● 运行正常' : '● 运行异常';
    pillEl.className = 'pill ' + (data.ok ? 'ok' : 'bad');
    document.getElementById('health-title').textContent = data.ok ? '一切正常，缓存已生效' : '有项目异常，请查看下方 KV 状态';
    document.getElementById('health-version').textContent = 'API v' + (data.version || '未知') + (data.sentenceVersion ? ' · 语料 ' + data.sentenceVersion.slice(0, 12) : '');
    document.getElementById('health-time').textContent = '检查于 ' + dateFormat.format(new Date(data.timestamp)) + '（北京时间）';
    const catOk = (kv.categoriesTotal || 0) > 0 && kv.categoriesCached === kv.categoriesTotal;
    const cards = [
      {label:'KV 绑定', state: kv.bound ? 'ok' : 'bad', value: kv.bound ? '已绑定' : '未绑定', sub: kv.bound ? '变量 hitokoto_kv' : '请在控制台绑定'},
      {label:'索引缓存', state: kv.indexCached ? 'ok' : 'bad', value: kv.indexCached ? '已缓存' : '未缓存', sub: data.sentenceVersion ? '语料 ' + data.sentenceVersion.slice(0, 12) : ''},
      {label:'分类缓存', state: catOk ? 'ok' : 'bad', value: (kv.categoriesCached || 0) + ' / ' + (kv.categoriesTotal || 0) + ' 类', sub: (kv.sentencesCached || 0).toLocaleString('zh-CN') + ' 条句子'},
      {label:'统计缓存', state: kv.statsCached ? 'ok' : 'idle', value: kv.statsCached ? '已缓存' : '无 / 已过期', sub:'10 分钟缓存'},
      {label:'每日汇总缓存', state: kv.dailyStatsCached ? 'ok' : 'idle', value: kv.dailyStatsCached ? '已缓存' : '无 / 已过期', sub:'1 小时缓存'},
      {label:'写入读取', state:'idle', value:'只读模式', sub:'完整检测见 /status JSON'},
    ];
    const grid = document.getElementById('kv-grid');
    grid.innerHTML = '';
    for (const c of cards) {
      const card = document.createElement('div'); card.className = 'kv-card';
      const head = document.createElement('div'); head.className = 'kv-head';
      const dot = document.createElement('span'); dot.className = 'kv-dot ' + c.state;
      const label = document.createElement('span'); label.className = 'kv-label'; label.textContent = c.label;
      head.append(dot, label);
      const value = document.createElement('div'); value.className = 'kv-value'; value.textContent = c.value;
      const sub = document.createElement('div'); sub.className = 'kv-sub'; sub.textContent = c.sub;
      card.append(head, value, sub); grid.append(card);
    }
    document.getElementById('kv-status').textContent = data.error ? '注意：' + data.error : 'KV 状态由运行状态探针提供。';
  }).catch(() => {
    const pillEl = document.getElementById('health-pill');
    pillEl.textContent = '● 状态暂不可用'; pillEl.className = 'pill idle';
    document.getElementById('health-title').textContent = '运行状态暂不可用，请稍后再试。';
    document.getElementById('health-version').textContent = '';
    document.getElementById('health-time').textContent = '';
    document.getElementById('kv-grid').innerHTML = '';
    document.getElementById('kv-status').textContent = '运行状态暂不可用，请稍后再试。';
  });
}
function renderChips() {
  const box = document.getElementById('quote-chips');
  box.innerHTML = '';
  const all = document.createElement('button');
  all.type = 'button'; all.className = 'chip' + (quoteCategory === '' ? ' active' : ''); all.textContent = '全部';
  all.addEventListener('click', () => { quoteCategory = ''; renderChips(); loadQuote(); });
  box.append(all);
  for (const [key, name] of CATEGORIES) {
    const chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'chip' + (quoteCategory === key ? ' active' : ''); chip.textContent = name;
    chip.addEventListener('click', () => { quoteCategory = key; renderChips(); loadQuote(); });
    box.append(chip);
  }
}
function loadQuote() {
  const text = document.getElementById('quote-text');
  text.textContent = '正在取一句…';
  document.getElementById('quote-source').textContent = '';
  document.getElementById('quote-meta').textContent = '';
  const start = performance.now();
  const url = quoteCategory ? '/api?c=' + quoteCategory : '/api';
  return fetch(url, {cache:'no-store'}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
    const ms = Math.round(performance.now() - start);
    text.textContent = data.hitokoto || '暂无句子';
    document.getElementById('quote-source').textContent = data.from ? '—— ' + data.from + (data.from_who ? ' · ' + data.from_who : '') : '';
    const cat = (CATEGORIES.find(([k]) => k === data.type) || [])[1] || data.type || '';
    document.getElementById('quote-meta').textContent = (cat ? '分类 ' + cat + ' · ' : '') + '编号 #' + data.id + ' · ' + data.length + ' 字 · 往返 ' + ms + ' ms';
    document.getElementById('latency').textContent = ms + ' ms';
  }).catch(() => {
    text.textContent = '一言暂不可用，请稍后再试。';
    document.getElementById('latency').textContent = '暂无数据';
  }).finally(() => { setLoading('latency', false); });
}
function renderHourly(hourly) {
  const status = document.getElementById('hourly-status');
  if (!Array.isArray(hourly) || hourly.length !== 24 || hourly.some(p => !p || !Number.isFinite(Date.parse(p.time)))) { status.textContent = '每小时数据暂不可用。'; document.getElementById('hourly-avg').textContent = '暂无数据'; return; }
  const svg = document.getElementById('hourly-chart'), list = document.getElementById('hourly-list');
  svg.innerHTML = ''; list.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  function shape(name, attrs, text) { const node = document.createElementNS(ns, name); for (const [k,v] of Object.entries(attrs)) node.setAttribute(k, v); if (text !== undefined) node.textContent = text; svg.append(node); return node; }
  const defs = document.createElementNS(ns, 'defs');
  const grad = document.createElementNS(ns, 'linearGradient');
  grad.setAttribute('id', 'hourly-gradient'); grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0'); grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
  const stop1 = document.createElementNS(ns, 'stop'); stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#a83d5c'); stop1.setAttribute('stop-opacity', '0.18');
  const stop2 = document.createElementNS(ns, 'stop'); stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#a83d5c'); stop2.setAttribute('stop-opacity', '0');
  grad.append(stop1, stop2); defs.append(grad); svg.append(defs);
  const values = hourly.map(p => Number.isSafeInteger(p.requests) && p.requests >= 0 ? p.requests : null);
  const max = Math.max(1, ...values.filter(v => v !== null));
  for (let i = 0; i <= 2; i++) { const y = 15 + i * 75; shape('line', {x1:50,y1:y,x2:655,y2:y,class:'hourly-grid'}); shape('text',{x:45,y:y+4,'text-anchor':'end',class:'axis-label'},Math.round(max * (2-i)/2).toLocaleString('zh-CN')); }
  let segment = [];
  function flush() {
    if (segment.length > 1) {
      const first = segment[0].split(','), last = segment[segment.length - 1].split(',');
      shape('path', {d:'M' + segment.join(' L') + ' L' + last[0] + ',165 L' + first[0] + ',165 Z', class:'hourly-area', fill:'url(#hourly-gradient)'});
      shape('polyline', {points:segment.join(' '),class:'hourly-line'});
    }
    segment = [];
  }
  const known = values.filter(v => v !== null);
  const peak = known.length ? Math.max(...known) : null;
  hourly.forEach((point, i) => {
    const value = values[i], time = new Date(point.time), x = 50 + i * 605 / 23, y = value === null ? null : 165 - value / max * 150;
    const row = document.createElement('div'); row.textContent = dateFormat.format(time) + ' 至 ' + dateFormat.format(new Date(time.getTime() + 3600000)) + '：' + (value === null ? '暂无数据' : value.toLocaleString('zh-CN') + ' 次'); list.append(row);
    if (value === null) { flush(); return; }
    segment.push(x + ',' + y); const isPeak = peak !== null && value === peak && peak > 0; const dot = shape('circle',{cx:x,cy:y,r:isPeak ? 5 : 3,class:isPeak ? 'hourly-peak' : 'hourly-dot'}); const title = document.createElementNS(ns,'title'); title.textContent = row.textContent + (isPeak ? '（峰值）' : ''); dot.append(title);
  });
  flush();
  const tooltip = document.getElementById('hourly-tooltip');
  const guide = shape('line', {x1:50,y1:15,x2:50,y2:165,class:'hourly-crosshair',visibility:'hidden'});
  const hit = shape('rect', {x:37,y:0,width:631,height:175,class:'hourly-hit'});
  function show(event) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const viewX = (event.clientX - rect.left) * 680 / rect.width;
    const index = Math.max(0, Math.min(23, Math.round((viewX - 50) * 23 / 605)));
    const point = hourly[index], value = values[index], time = new Date(point.time);
    tooltip.textContent = dateFormat.format(time) + ' 至 ' + dateFormat.format(new Date(time.getTime() + 3600000)) + '（北京时间）：' + (value === null ? '暂无数据' : value.toLocaleString('zh-CN') + ' 次');
    tooltip.hidden = false;
    const x = 50 + index * 605 / 23;
    guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('visibility', 'visible');
    const anchor = x / 680 * rect.width;
    tooltip.style.left = Math.max(0, Math.min(rect.width - tooltip.offsetWidth, anchor - tooltip.offsetWidth / 2)) + 'px';
  }
  function hide() { tooltip.hidden = true; guide.setAttribute('visibility', 'hidden'); }
  hit.addEventListener('pointermove', show);
  hit.addEventListener('pointerdown', show);
  hit.addEventListener('pointerleave', hide);
  hit.addEventListener('pointercancel', hide);
  for (const i of [0, 6, 12, 18, 23]) shape('text', {x:50+i*605/23,y:188,'text-anchor':i===0?'start':i===23?'end':'middle',class:'axis-label'}, dateFormat.format(new Date(hourly[i].time)).slice(-5));
  const missing = values.filter(v => v === null).length;
  status.textContent = missing === 24 ? '每小时数据暂不可用。' : missing ? '有 ' + missing + ' 个小时缺少数据，未按零计算。' : '每个点代表该小时内的域名请求数。';
  const summary = document.getElementById('hourly-summary');
  if (!known.length) { summary.textContent = ''; document.getElementById('hourly-avg').textContent = '暂无数据'; return; }
  const total = known.reduce((sum, v) => sum + v, 0);
  const peakIndex = values.indexOf(peak);
  document.getElementById('hourly-avg').textContent = Math.round(total / known.length).toLocaleString('zh-CN') + ' 次';
  summary.textContent = '平均每小时 ' + Math.round(total / known.length).toLocaleString('zh-CN') + ' 次 · 峰值 ' + dateFormat.format(new Date(hourly[peakIndex].time)) + '（北京时间）' + peak.toLocaleString('zh-CN') + ' 次。';
}
function loadLive() {
  ['requests','rate'].forEach(id => setLoading(id, true));
  return fetch('/stats-data', {cache:'no-store'}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
    document.getElementById('requests').textContent = data.requests.toLocaleString('zh-CN') + ' 次';
    document.getElementById('requests-sub').textContent = '最近 24 个完整小时';
    document.getElementById('api-requests').textContent = Number.isSafeInteger(data.apiRequests) && data.apiRequests >= 0 ? data.apiRequests.toLocaleString('zh-CN') + ' 次' : '暂无数据';
    document.getElementById('api-share').textContent = Number.isSafeInteger(data.apiRequests) && data.apiRequests >= 0 && data.requests > 0 ? (data.apiRequests / data.requests * 100).toFixed(1) + '%' : '暂无数据';
    document.getElementById('traffic').textContent = (data.bytes / 1048576).toFixed(2) + ' MiB';
    const errCount = data.errorRate === null ? null : Math.round(data.errorRate * data.requests);
    document.getElementById('rate').textContent = data.errorRate === null ? '暂无数据' : (data.errorRate * 100).toFixed(2) + '%';
    document.getElementById('rate-sub').textContent = errCount === null ? '' : '约 ' + errCount.toLocaleString('zh-CN') + ' 次 5xx';
    document.getElementById('status').textContent = '统计范围：' + dateFormat.format(new Date(data.start)) + ' 至 ' + dateFormat.format(new Date(data.end)) + '（北京时间） · 获取时间：' + dateFormat.format(new Date(data.fetchedAt)) + '（北京时间）';
    document.getElementById('status').className = '';
    renderHourly(data.hourly);
  }).catch(() => { document.getElementById('status').textContent = '统计数据暂不可用，请稍后再试。'; document.getElementById('status').className = 'error'; document.getElementById('api-requests').textContent = '暂不可用'; document.getElementById('api-share').textContent = '暂无数据'; document.getElementById('hourly-avg').textContent = '暂无数据'; document.getElementById('hourly-status').textContent = '每小时数据暂不可用。'; }).finally(() => { ['requests','rate'].forEach(id => setLoading(id, false)); });
}
function loadDaily() {
  setLoading('cumulative', true);
  setLoading('yesterday-requests', true);
  return fetch('/stats-daily', {cache:'no-store'}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
    const start = Date.parse(data.startDate + 'T00:00:00+08:00');
    const today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0,10);
    const end = Date.parse(today + 'T00:00:00+08:00');
    if (data.domain !== 'hitokoto.xzccs.top' || data.startDate !== '2026-11-15' || !Number.isFinite(start) || !data.days || typeof data.days !== 'object' || Array.isArray(data.days)) throw new Error('invalid');
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
    const collected = entries.filter(e => e.value !== null);
    const last = collected.length ? collected[collected.length - 1] : null;
    document.getElementById('yesterday-requests').textContent = last ? last.value.toLocaleString('zh-CN') + ' 次' : '暂无数据';
    document.getElementById('yesterday-date').textContent = last ? last.key.slice(5).replace('-', ' 月 ') + ' 日' : '';
    const week = collected.slice(-7);
    const weekTotal = week.reduce((sum, e) => sum + e.value, 0);
    const best = collected.reduce((a, b) => (!a || b.value > a.value) ? b : a, null);
    document.getElementById('week-total').textContent = week.length ? weekTotal.toLocaleString('zh-CN') + ' 次' : '暂无数据';
    document.getElementById('day-average').textContent = collected.length ? Math.round(total / collected.length).toLocaleString('zh-CN') + ' 次' : '暂无数据';
    document.getElementById('best-day').textContent = best ? best.key.slice(5) + ' · ' + best.value.toLocaleString('zh-CN') + ' 次' : '暂无数据';
    const recent = entries.slice(-30), max = Math.max(1, ...recent.map(e => e.value || 0));
    const chart = document.getElementById('chart'), list = document.getElementById('history-list');
    chart.innerHTML = ''; list.innerHTML = '';
    for (const e of recent) {
      const wrap = document.createElement('div'), bar = document.createElement('div'), label = document.createElement('span'), row = document.createElement('div');
      const isMax = e.value !== null && e.value === max && max > 0;
      wrap.className = 'bar-wrap'; bar.className = e.value === null ? 'bar missing' : isMax ? 'bar max' : 'bar'; bar.style.height = e.value === null ? '8px' : Math.max(2, e.value / max * 155) + 'px';
      wrap.title = e.key + '：' + (e.value === null ? '未采集' : e.value.toLocaleString('zh-CN') + ' 次' + (isMax ? '（最高）' : '')); label.className = 'chart-label'; label.textContent = e.key.slice(5);
      if (isMax) { const valueEl = document.createElement('span'); valueEl.className = 'bar-value'; valueEl.textContent = e.value.toLocaleString('zh-CN'); wrap.append(valueEl, bar, label); } else { wrap.append(bar, label); }
      chart.append(wrap); row.textContent = wrap.title; list.append(row);
    }
  }).catch(() => { document.getElementById('history-status').textContent = '每日汇总暂不可用，请稍后再试。'; document.getElementById('yesterday-requests').textContent = '暂无数据'; document.getElementById('yesterday-date').textContent = ''; }).finally(() => { setLoading('cumulative', false); setLoading('yesterday-requests', false); });
}
function loadAll() {
  document.getElementById('updated').textContent = '正在刷新…';
  return Promise.all([loadStatus(), loadLive(), loadDaily()]).then(() => {
    document.getElementById('updated').textContent = '更新于 ' + dateFormat.format(new Date()) + '（北京时间）· 统计每 10 分钟、运行状态每分钟自动刷新一次。';
  });
}
document.getElementById('refresh').addEventListener('click', loadAll);
document.getElementById('quote-next').addEventListener('click', loadQuote);
renderChips();
loadQuote();
loadAll();
setInterval(loadAll, 600000);
setInterval(loadStatus, 60000);
</script></body></html>`;
export default function onRequest() {
    return new Response(page, { headers: { "Content-Type": "text/html; charset=UTF-8", "X-Content-Type-Options": "nosniff" } });
}
