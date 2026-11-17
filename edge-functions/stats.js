// 运行状况页：重新设计的一览式仪表盘（4.7.0）。
// 顶部是运行状态总览（健康状态、版本、刷新），接着是四张关键数字卡
// （昨日请求、24 小时请求、5xx 错误率、接口往返），然后是 KV 状态卡片、
// 随机一言、每小时趋势（含流量与 /api 小计）与每日趋势。
// 样式与首页统一（暖底、玫瑰红强调、金色峰值、漂浮气泡）。
// 数据全部由同源服务端接口提供：运行状态走 /status（只读探针，不写 KV），
// 每日汇总走 /stats-daily（KV 缓存），一言走 /api；访客浏览器不直接访问第三方。
// 公开页上没有写 KV 的按钮，完整写读探针请去 /status?probe=write（JSON）。
const page = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>运行状况 · 小周的一言API</title><link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet"><script>(function(){try{var t=localStorage.getItem('hitokoto-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();</script><style>
:root{
  color-scheme:light;
  --md-primary:#b23c00;--md-on-primary:#fff;--md-primary-container:#ffdcc3;--md-on-primary-container:#3a1400;
  --md-secondary:#775a44;--md-on-secondary:#fff;--md-secondary-container:#ffdcc3;--md-on-secondary-container:#2d1707;
  --md-tertiary:#8a6100;--md-on-tertiary:#fff;--md-tertiary-container:#ffdea6;--md-on-tertiary-container:#2a1a00;
  --md-error:#b3261e;--md-on-error:#fff;--md-error-container:#f9dedc;--md-on-error-container:#410e0b;
  --md-surface:#fff8f2;--md-surface-dim:#e9d8cb;
  --md-surface-container-lowest:#fff;--md-surface-container-low:#fff3ea;--md-surface-container:#fbe9dc;
  --md-surface-container-high:#f5dcd0;--md-surface-container-highest:#efd0c0;
  --md-on-surface:#221a14;--md-on-surface-variant:#53443a;
  --md-outline:#857265;--md-outline-variant:#dcc7b8;
  --md-inverse-surface:#372e27;--md-inverse-on-surface:#ffede2;
  --md-success-container:#dce9dc;--md-on-success-container:#1b4d1f;
  --md-elev-1:0 1px 2px rgba(0,0,0,.3),0 1px 3px 1px rgba(0,0,0,.15);
  --md-elev-2:0 1px 2px rgba(0,0,0,.3),0 2px 6px 2px rgba(0,0,0,.15);
  --md-elev-3:0 1px 3px rgba(0,0,0,.3),0 4px 8px 3px rgba(0,0,0,.15);
  --md-ease:cubic-bezier(.2,0,0,1);
  --md-hover:rgba(178,60,0,.08);--md-primary-hover:#8f2f00;
}
[data-theme="dark"]{
  color-scheme:dark;
  --md-primary:#ffb08a;--md-on-primary:#3a1400;--md-primary-container:#5f2a10;--md-on-primary-container:#ffdcc3;
  --md-secondary:#d8bfa8;--md-on-secondary:#2d1707;--md-secondary-container:#4a3527;--md-on-secondary-container:#ffdcc3;
  --md-tertiary:#f0c06a;--md-on-tertiary:#2a1a00;--md-tertiary-container:#4d3a00;--md-on-tertiary-container:#ffdea6;
  --md-error:#ffb4ab;--md-on-error:#410e0b;--md-error-container:#5c1a15;--md-on-error-container:#f9dedc;
  --md-surface:#1a1512;--md-surface-dim:#120e0b;
  --md-surface-container-lowest:#120e0b;--md-surface-container-low:#211a15;--md-surface-container:#2a211b;
  --md-surface-container-high:#352a22;--md-surface-container-highest:#403329;
  --md-on-surface:#f5e8dd;--md-on-surface-variant:#cbb9a9;
  --md-outline:#978578;--md-outline-variant:#4a3f36;
  --md-inverse-surface:#f5e8dd;--md-inverse-on-surface:#221a14;
  --md-success-container:#1e3a24;--md-on-success-container:#bfe6c4;
  --md-hover:rgba(255,176,138,.12);--md-primary-hover:#ffc9a8;
  --md-elev-1:0 1px 2px rgba(0,0,0,.5),0 1px 3px 1px rgba(0,0,0,.35);
  --md-elev-2:0 1px 2px rgba(0,0,0,.5),0 2px 6px 2px rgba(0,0,0,.35);
  --md-elev-3:0 1px 3px rgba(0,0,0,.5),0 4px 8px 3px rgba(0,0,0,.35);
}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;color:var(--md-on-surface);background:var(--md-surface);font-family:"Google Sans","Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;font-size:16px;line-height:1.5}
main{max-width:960px;margin:auto;padding:56px 24px;position:relative;z-index:1}
a{color:var(--md-primary);text-decoration:none}
a:hover{text-decoration:underline}
a:focus-visible{outline:2px solid var(--md-primary);outline-offset:3px;border-radius:4px}
main>a:first-child{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;margin-bottom:8px;border-radius:999px;color:var(--md-primary);font-size:14px;font-weight:500}
main>a:first-child:hover{background:var(--md-hover);text-decoration:none}
.eyebrow{font-size:12px;font-weight:500;line-height:1.5;letter-spacing:.12em;text-transform:uppercase;color:var(--md-primary)}
h1{font-size:clamp(32px,6vw,45px);font-weight:500;line-height:1.2;margin:16px 0 8px;color:var(--md-on-surface)}
h2{font-size:22px;font-weight:400;line-height:1.27;margin:0 0 8px;color:var(--md-on-surface)}
p{line-height:1.5;color:var(--md-on-surface-variant)}
p.note{font-size:14px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;margin:28px 0}
.card{padding:24px 28px;border-radius:28px;background:var(--md-surface-container);margin-bottom:24px}
.cards .card{margin-bottom:0;background:var(--md-surface-container-low);box-shadow:var(--md-elev-1);border-radius:24px}
.label{font-size:14px;color:var(--md-on-surface-variant)}
.value{font-size:36px;font-weight:500;line-height:1.2;margin:12px 0 0;overflow-wrap:anywhere;color:var(--md-primary);font-variant-numeric:tabular-nums}
.value.loading{color:transparent;background:linear-gradient(90deg,var(--md-surface-container-high),var(--md-surface-container-highest),var(--md-surface-container-high));background-size:200% 100%;animation:shimmer 1.4s linear infinite;border-radius:8px;min-height:44px}
@keyframes shimmer{to{background-position:-200% 0}}
.sub{font-size:13px;color:var(--md-on-surface-variant);margin-top:6px;min-height:20px}
.note{font-size:13px}
.error{color:var(--md-error)}
.pill{display:inline-flex;align-items:center;min-height:32px;padding:0 16px;border-radius:999px;font-size:14px;font-weight:500;line-height:1.5}
.pill.ok{background:var(--md-success-container);color:var(--md-on-success-container)}
.pill.bad{background:var(--md-error-container);color:var(--md-on-error-container)}
.pill.idle{background:var(--md-surface-container-high);color:var(--md-on-surface-variant)}
.hero{display:flex;flex-wrap:wrap;gap:16px 24px;align-items:center;justify-content:space-between;background:var(--md-surface-container-low);box-shadow:var(--md-elev-2)}
.hero-main{display:flex;flex-direction:column;gap:6px}
.hero-title{font-size:22px;font-weight:500;line-height:1.3;color:var(--md-on-surface)}
.hero-side{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.hero-side .meta{font-size:13px;color:var(--md-on-surface-variant);text-align:right}
.kv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:16px}
.kv-card{padding:16px 18px;border-radius:16px;background:var(--md-surface-container-highest)}
.kv-head{display:flex;align-items:center;gap:8px}
.kv-dot{flex:none;width:10px;height:10px;border-radius:50%}
.kv-dot.ok{background:#2e7d32}
.kv-dot.bad{background:#c62828}
.kv-dot.idle{background:#9c8a8f}
.kv-label{font-size:13px;color:var(--md-on-surface-variant)}
.kv-value{font-size:20px;font-weight:500;line-height:1.4;margin-top:8px;font-variant-numeric:tabular-nums;color:var(--md-on-surface)}
.kv-sub{font-size:12px;color:var(--md-on-surface-variant);margin-top:2px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;margin-top:8px;padding:0 24px;border:0;border-radius:999px;background:var(--md-primary);color:var(--md-on-primary);font-size:14px;font-weight:500;line-height:1.5;font-family:inherit;cursor:pointer;transition:box-shadow .2s var(--md-ease),background .2s var(--md-ease)}
.btn:hover{background:var(--md-primary-hover);box-shadow:var(--md-elev-1)}
.btn:active{transform:scale(.98)}
.btn.ghost{background:transparent;color:var(--md-primary);border:1px solid var(--md-outline)}
.btn.ghost:hover{background:var(--md-hover);box-shadow:none}
.mini-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:16px 0 4px}
.mini{padding:16px;border-radius:16px;background:var(--md-surface-container-highest)}
.mini .label{font-size:13px}
.mini .num{font-size:20px;font-weight:500;line-height:1.5;color:var(--md-on-surface);margin-top:4px;font-variant-numeric:tabular-nums}
.hourly-container{position:relative}
.hourly-svg{width:100%;height:auto;display:block;overflow:visible;touch-action:pan-y}
.hourly-tooltip{position:absolute;top:0;left:0;z-index:2;max-width:85%;padding:8px 12px;border-radius:8px;background:var(--md-inverse-surface);color:var(--md-inverse-on-surface);font-size:13px;line-height:1.5;pointer-events:none;box-shadow:var(--md-elev-2)}
.hourly-crosshair{stroke:var(--md-primary);stroke-width:1;stroke-dasharray:4 4;pointer-events:none}
.hourly-hit{fill:transparent;pointer-events:all;cursor:crosshair}
.hourly-grid{stroke:var(--md-outline-variant);stroke-width:1}
.hourly-area{stroke:none}
.hourly-line{fill:none;stroke:var(--md-primary);stroke-width:3;stroke-linejoin:round;stroke-linecap:round}
.hourly-dot{fill:var(--md-primary)}
.hourly-peak{fill:var(--md-tertiary);stroke:#fff;stroke-width:1.5}
.axis-label{font-size:11px;fill:var(--md-on-surface-variant)}
details summary{cursor:pointer;color:var(--md-primary);font-size:14px;font-weight:500}
details{margin-top:16px}
.data-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px;margin-top:14px}
.data-item{padding:12px;border-radius:16px;background:var(--md-surface-container-highest)}
.data-item .data-time{font-size:12px;color:var(--md-on-surface-variant)}
.data-item .data-value{font-size:16px;font-weight:500;line-height:1.5;font-variant-numeric:tabular-nums;color:var(--md-on-surface)}
.data-item.peak{background:var(--md-tertiary-container)}
.data-item.peak .data-value{color:var(--md-on-tertiary-container)}
.data-item.empty .data-value{color:var(--md-on-surface-variant);font-weight:400}
footer{max-width:960px;margin:auto;padding:24px 24px 64px;text-align:center;font-size:13px;line-height:1.6;color:var(--md-on-surface-variant);position:relative;z-index:1}
.footer-sources{margin-bottom:16px}
.footer-sources a{color:var(--md-on-surface-variant)}
.footer-sources a:hover{color:var(--md-primary)}
.icp-link{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 16px;border-radius:999px;background:var(--md-surface-container-high);color:var(--md-on-surface-variant);text-decoration:none;transition:background .2s var(--md-ease),color .2s var(--md-ease)}
.icp-link:hover{color:var(--md-primary);background:var(--md-surface-container-highest);text-decoration:none}
.icp-link img{width:16px;height:16px;object-fit:contain}
.edgeone-badge{display:inline-flex;align-items:center;gap:8px;margin-bottom:12px;color:var(--md-on-surface-variant);text-decoration:none;transition:color .2s var(--md-ease)}
.edgeone-badge:hover{color:var(--md-primary);text-decoration:none}
.edgeone-badge img{height:20px;width:auto;display:block}
@media(max-width:600px){main{padding:40px 18px}.card{padding:20px}.hero-side{align-items:flex-start}.hero-side .meta{text-align:left}.kv-grid{grid-template-columns:repeat(2,1fr)}.theme-btn{display:none}}
@media(prefers-reduced-motion:reduce){.value.loading{animation:none}.btn,.edgeone-badge{transition:none}}

.app-bar{position:sticky;top:0;z-index:10;background:var(--md-surface-container-low);box-shadow:var(--md-elev-1)}
.app-bar-inner{max-width:960px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;gap:24px}
.app-logo{display:inline-flex;align-items:center;gap:10px;color:var(--md-on-surface);font-size:17px;font-weight:500;text-decoration:none}
.app-logo:hover{text-decoration:none}
.app-logo img{width:28px;height:28px;display:block}
.app-nav-links{display:flex;align-items:center;gap:4px;margin-left:auto}
.app-nav-links a{padding:8px 12px;border-radius:999px;color:var(--md-on-surface-variant);font-size:14px;font-weight:500;text-decoration:none}
.app-nav-links a:hover{background:var(--md-hover);color:var(--md-on-surface);text-decoration:none}
.app-menu{position:relative;display:none;margin-left:auto}
.app-menu-btn{width:40px;height:40px;border:0;border-radius:999px;background:transparent;color:var(--md-on-surface);font-size:20px;line-height:1;cursor:pointer}
.app-menu-btn:hover{background:var(--md-hover)}
.app-menu-dropdown{position:absolute;top:calc(100% + 8px);right:0;min-width:160px;padding:8px;border-radius:16px;background:var(--md-surface-container-high);box-shadow:var(--md-elev-2)}
.app-menu-dropdown a{display:block;padding:10px 14px;border-radius:12px;color:var(--md-on-surface);font-size:14px;font-weight:500;text-decoration:none}
.app-menu-dropdown a:hover{background:var(--md-hover);text-decoration:none}
.app-menu-dropdown a.active{background:var(--md-primary-container);color:var(--md-on-primary-container)}
.theme-btn{flex:none;width:40px;height:40px;border:0;border-radius:999px;background:transparent;color:var(--md-on-surface);font-size:18px;line-height:1;cursor:pointer}
.theme-btn:hover{background:var(--md-hover)}
.app-menu-theme{display:block;width:100%;text-align:left;padding:10px 14px;border:0;border-radius:12px;background:transparent;color:var(--md-on-surface);font-size:14px;font-weight:500;font-family:inherit;cursor:pointer}
.app-menu-theme:hover{background:var(--md-hover)}
@media(max-width:600px){.app-nav-links{display:none}.app-menu{display:block}.app-bar-inner{gap:12px}}
</style></head><body><nav class="app-bar"><div class="app-bar-inner"><a class="app-logo" href="/"><img src="/favicon.svg" alt="" width="28" height="28"><span>小周的一言API</span></a><div class="app-nav-links"><a href="/">首页</a><a href="/docs">接口文档</a><a href="/stats">运行状况</a></div><button class="theme-btn" id="theme-btn" type="button" aria-label="切换深色模式">🌙</button><div class="app-menu"><button class="app-menu-btn" id="menu-btn" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="menu-dropdown">☰</button><div class="app-menu-dropdown" id="menu-dropdown" hidden><a href="/">首页</a><a href="/docs">接口文档</a><a href="/stats" class="active">运行状况</a><button class="app-menu-theme" id="theme-btn-menu" type="button">🌙 切换深色模式</button></div></div></div></nav><main><div class="eyebrow">HITOKOTO · STATUS</div><h1>运行状况</h1><p>hitokoto.xzccs.top · 运行状态、一言与访问统计</p><section class="card hero" id="health-banner"><div class="hero-main"><span class="pill idle" id="health-pill">检查中…</span><div class="hero-title" id="health-title">正在检查运行状态…</div><div class="meta" id="health-version" style="font-size:14px;color:var(--muted)"></div><div class="meta" id="health-time" style="font-size:14px;color:var(--muted)"></div></div><div class="hero-side"><button class="btn ghost" id="refresh" type="button">刷新数据</button><div class="meta" id="updated">统计每 10 分钟自动刷新一次，运行状态每分钟刷新一次。</div></div></section><div class="cards"><div class="card"><div class="label">昨日请求</div><div class="value loading" id="yesterday-requests">—</div><div class="sub" id="yesterday-date"></div></div><div class="card"><div class="label">24 小时请求</div><div class="value loading" id="requests">—</div><div class="sub" id="requests-sub"></div></div><div class="card"><div class="label">5xx 错误率</div><div class="value loading" id="rate">—</div><div class="sub" id="rate-sub"></div></div><div class="card"><div class="label">接口往返</div><div class="value loading" id="latency">—</div><div class="sub">最近一次状态探针的往返耗时</div></div></div><p id="status" role="status">正在加载统计数据…</p><section class="card"><h2>KV 缓存状态</h2><p class="note">KV 状态由运行状态探针提供。</p><p id="kv-status" class="note" role="status">正在加载 KV 状态…</p><div class="kv-grid" id="kv-grid"></div></section><section class="card"><h2>每小时访问量</h2><p class="note">域名请求数 · 最近 24 个完整小时 · 北京时间；缺失数据处折线断开，金色点为峰值小时。</p><div class="mini-row"><div class="mini"><div class="label">EdgeOne 响应流量</div><div class="num" id="traffic">—</div></div><div class="mini"><div class="label">/api 请求数</div><div class="num" id="api-requests">—</div></div><div class="mini"><div class="label">/api 请求占比</div><div class="num" id="api-share">—</div></div><div class="mini"><div class="label">小时均值</div><div class="num" id="hourly-avg">—</div></div></div><p id="hourly-status" class="note" role="status">正在加载每小时数据…</p><div class="hourly-container"><svg id="hourly-chart" class="hourly-svg" viewBox="0 0 680 220" role="img" aria-label="每小时域名请求数折线图，鼠标移动或触摸查看详情"></svg><div id="hourly-tooltip" class="hourly-tooltip" role="tooltip" hidden></div></div><p class="note" id="hourly-summary"></p><details><summary>查看每小时数据</summary><div id="hourly-list" class="data-grid"></div></details></section><section class="card"><div class="label">自 2026-11-15 起累计请求数</div><div class="value loading" id="cumulative">—</div><p class="note" id="history-status" role="status">正在加载每日汇总…</p><h2>每日请求趋势</h2><p class="note">最近 30 个北京时间自然日；缺失数据处折线断开，不代表零，金色点为最高单日。</p><div class="mini-row"><div class="mini"><div class="label">近 7 日合计</div><div class="num" id="week-total">—</div></div><div class="mini"><div class="label">已采集日均</div><div class="num" id="day-average">—</div></div><div class="mini"><div class="label">最高单日</div><div class="num" id="best-day">—</div></div></div><div class="hourly-container"><svg id="daily-chart" class="hourly-svg" viewBox="0 0 680 220" role="img" aria-label="每日请求数折线图，鼠标移动或触摸查看详情"></svg><div id="daily-tooltip" class="hourly-tooltip" role="tooltip" hidden></div></div><details><summary>查看每日数据</summary><div id="history-list" class="data-grid"></div></details></section></main><footer><p class="footer-sources"><a href="/">返回首页</a> · <a href="/docs">接口文档</a> · <a href="https://github.com/hitokoto-osc/sentences-bundle" target="_blank" rel="noopener noreferrer">语句数据</a> · <a href="https://github.com/jiandan2020/hitokoto-edgeone" target="_blank" rel="noopener noreferrer">项目源码</a></p><div><a class="edgeone-badge" href="https://edgeone.ai/" target="_blank" rel="noopener noreferrer">本站由 <img src="/edgeone-logo.png" alt="Tencent EdgeOne" width="140" height="20"> 提供加速服务</a></div><a class="icp-link" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"><img src="/icp-beian.png" alt="" width="16" height="16">赣ICP备2025074916号-1</a></footer><script>
(function(){var btn=document.getElementById('menu-btn');var menu=document.getElementById('menu-dropdown');if(!btn||!menu)return;btn.addEventListener('click',function(e){e.stopPropagation();var open=menu.hidden;menu.hidden=!open;btn.setAttribute('aria-expanded',String(open));});document.addEventListener('click',function(e){if(!menu.hidden&&!menu.contains(e.target)){menu.hidden=true;btn.setAttribute('aria-expanded','false');}});})();
(function(){var b=document.getElementById('theme-btn');var m=document.getElementById('theme-btn-menu');function cur(){return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';}function sync(){var t=cur();var i=t==='dark'?'☀️':'🌙';var l=t==='dark'?'切换浅色模式':'切换深色模式';if(b){b.textContent=i;b.setAttribute('aria-label',l);}if(m){m.textContent=i+' '+l;}}function apply(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('hitokoto-theme',t);}catch(e){}sync();}function tog(){apply(cur()==='dark'?'light':'dark');}if(b){b.addEventListener('click',tog);}if(m){m.addEventListener('click',tog);}sync();try{if(!localStorage.getItem('hitokoto-theme')&&window.matchMedia){window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){document.documentElement.setAttribute('data-theme',e.matches?'dark':'light');sync();});}}catch(e){}})();
const dateFormat = new Intl.DateTimeFormat('zh-CN', { timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false });
function setLoading(id, on) { const el = document.getElementById(id); if (el) el.classList.toggle('loading', on); }
function pill(ok, goodText, badText) { return ok ? '✓ ' + goodText : '✗ ' + badText; }
function loadStatus() {
  const start = performance.now();
  return fetch('/status?format=json&probe=read', {cache:'no-store', signal: AbortSignal.timeout(10000)}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
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
    const kvStatus = document.getElementById('kv-status');
    if (data.error) {
      kvStatus.textContent = '注意：' + data.error;
      kvStatus.hidden = false;
    } else {
      kvStatus.hidden = true;
    }
    const ms = Math.round(performance.now() - start);
    document.getElementById('latency').textContent = ms + ' ms';
    setLoading('latency', false);
  }).catch(() => {
    const pillEl = document.getElementById('health-pill');
    pillEl.textContent = '● 状态暂不可用'; pillEl.className = 'pill idle';
    document.getElementById('health-title').textContent = '运行状态暂不可用，请稍后再试。';
    document.getElementById('health-version').textContent = '';
    document.getElementById('health-time').textContent = '';
    document.getElementById('kv-grid').innerHTML = '';
    document.getElementById('kv-status').textContent = '运行状态暂不可用，请稍后再试。';
    document.getElementById('kv-status').hidden = false;
    document.getElementById('latency').textContent = '暂无数据';
    setLoading('latency', false);
  });
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
  const stop1 = document.createElementNS(ns, 'stop'); stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#b23c00'); stop1.setAttribute('stop-opacity', '0.18');
  const stop2 = document.createElementNS(ns, 'stop'); stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#b23c00'); stop2.setAttribute('stop-opacity', '0');
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
    const label = dateFormat.format(time) + ' 至 ' + dateFormat.format(new Date(time.getTime() + 3600000)) + '：' + (value === null ? '暂无数据' : value.toLocaleString('zh-CN') + ' 次');
    const isPeak = peak !== null && value === peak && peak > 0;
    const item = document.createElement('div');
    item.className = 'data-item' + (isPeak ? ' peak' : '') + (value === null ? ' empty' : '');
    const timeEl = document.createElement('div'); timeEl.className = 'data-time'; timeEl.textContent = dateFormat.format(time).slice(5);
    const valueEl = document.createElement('div'); valueEl.className = 'data-value'; valueEl.textContent = value === null ? '暂无数据' : value.toLocaleString('zh-CN') + ' 次';
    item.append(timeEl, valueEl); list.append(item);
    if (value === null) { flush(); return; }
    segment.push(x + ',' + y); const dot = shape('circle',{cx:x,cy:y,r:isPeak ? 5 : 3,class:isPeak ? 'hourly-peak' : 'hourly-dot'}); const title = document.createElementNS(ns,'title'); title.textContent = label + (isPeak ? '（峰值）' : ''); dot.append(title);
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
  return fetch('/stats-data', {cache:'no-store', signal: AbortSignal.timeout(10000)}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
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
  return fetch('/stats-daily', {cache:'no-store', signal: AbortSignal.timeout(10000)}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
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
    const svg = document.getElementById('daily-chart'), list = document.getElementById('history-list');
    svg.innerHTML = ''; list.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    function shape(name, attrs, text) { const node = document.createElementNS(ns, name); for (const [k,v] of Object.entries(attrs)) node.setAttribute(k, v); if (text !== undefined) node.textContent = text; svg.append(node); return node; }
    const defs = document.createElementNS(ns, 'defs');
    const grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', 'daily-gradient'); grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0'); grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    const stop1 = document.createElementNS(ns, 'stop'); stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#b23c00'); stop1.setAttribute('stop-opacity', '0.18');
    const stop2 = document.createElementNS(ns, 'stop'); stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#b23c00'); stop2.setAttribute('stop-opacity', '0');
    grad.append(stop1, stop2); defs.append(grad); svg.append(defs);
    const values = recent.map(e => e.value);
    for (let i = 0; i <= 2; i++) { const y = 15 + i * 75; shape('line', {x1:50,y1:y,x2:655,y2:y,class:'hourly-grid'}); shape('text',{x:45,y:y+4,'text-anchor':'end',class:'axis-label'},Math.round(max * (2-i)/2).toLocaleString('zh-CN')); }
    let segment = [];
    function flush() {
      if (segment.length > 1) {
        const first = segment[0].split(','), last = segment[segment.length - 1].split(',');
        shape('path', {d:'M' + segment.join(' L') + ' L' + last[0] + ',165 L' + first[0] + ',165 Z', class:'hourly-area', fill:'url(#daily-gradient)'});
        shape('polyline', {points:segment.join(' '),class:'hourly-line'});
      }
      segment = [];
    }
    const knownValues = values.filter(v => v !== null);
    const peak = knownValues.length ? Math.max(...knownValues) : null;
    recent.forEach((e, i) => {
      const value = values[i], x = 50 + i * 605 / 29, y = value === null ? null : 165 - value / max * 150;
      const label = e.key + '：' + (value === null ? '未采集' : value.toLocaleString('zh-CN') + ' 次');
      const isPeak = peak !== null && value === peak && peak > 0;
      const item = document.createElement('div');
      item.className = 'data-item' + (isPeak ? ' peak' : '') + (value === null ? ' empty' : '');
      const timeEl = document.createElement('div'); timeEl.className = 'data-time'; timeEl.textContent = e.key.slice(5);
      const valueEl = document.createElement('div'); valueEl.className = 'data-value'; valueEl.textContent = value === null ? '未采集' : value.toLocaleString('zh-CN') + ' 次';
      item.append(timeEl, valueEl); list.append(item);
      if (value === null) { flush(); return; }
      segment.push(x + ',' + y); const dot = shape('circle',{cx:x,cy:y,r:isPeak ? 5 : 3,class:isPeak ? 'hourly-peak' : 'hourly-dot'}); const title = document.createElementNS(ns,'title'); title.textContent = label + (isPeak ? '（最高单日）' : ''); dot.append(title);
    });
    flush();
    const tooltip = document.getElementById('daily-tooltip');
    const guide = shape('line', {x1:50,y1:15,x2:50,y2:165,class:'hourly-crosshair',visibility:'hidden'});
    const hit = shape('rect', {x:37,y:0,width:631,height:175,class:'hourly-hit'});
    function show(event) {
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      const viewX = (event.clientX - rect.left) * 680 / rect.width;
      const index = Math.max(0, Math.min(29, Math.round((viewX - 50) * 29 / 605)));
      const e = recent[index], value = values[index];
      if (!e) return;
      tooltip.textContent = e.key + '（北京时间）：' + (value === null ? '未采集' : value.toLocaleString('zh-CN') + ' 次');
      tooltip.hidden = false;
      const x = 50 + index * 605 / 29;
      guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('visibility', 'visible');
      const anchor = x / 680 * rect.width;
      tooltip.style.left = Math.max(0, Math.min(rect.width - tooltip.offsetWidth, anchor - tooltip.offsetWidth / 2)) + 'px';
    }
    function hide() { tooltip.hidden = true; guide.setAttribute('visibility', 'hidden'); }
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', hide);
    hit.addEventListener('pointercancel', hide);
    for (const i of [0, 6, 12, 18, 24, 29]) { if (!recent[i]) continue; shape('text', {x:50+i*605/29,y:188,'text-anchor':i===0?'start':i===29?'end':'middle',class:'axis-label'}, recent[i].key.slice(5)); }
  }).catch(() => { document.getElementById('history-status').textContent = '每日汇总暂不可用，请稍后再试。'; document.getElementById('yesterday-requests').textContent = '暂无数据'; document.getElementById('yesterday-date').textContent = ''; }).finally(() => { setLoading('cumulative', false); setLoading('yesterday-requests', false); });
}
function loadAll() {
  document.getElementById('updated').textContent = '正在刷新…';
  return Promise.all([loadStatus(), loadLive(), loadDaily()]).then(() => {
    document.getElementById('updated').textContent = '更新于 ' + dateFormat.format(new Date()) + '（北京时间）· 统计每 10 分钟、运行状态每分钟自动刷新一次。';
  });
}
document.getElementById('refresh').addEventListener('click', loadAll);
loadAll();
setInterval(loadAll, 600000);
setInterval(loadStatus, 60000);
</script></body></html>`;
export default function onRequest() {
    return new Response(page, { headers: { "Content-Type": "text/html; charset=UTF-8", "X-Content-Type-Options": "nosniff" } });
}
