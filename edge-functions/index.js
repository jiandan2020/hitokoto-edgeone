// 首页与 API 分开路由；使用当前域名的相对路径，预览和正式环境均可访问。
const page = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="一言 API 接口说明：随机获取一句话，支持分类和多种返回格式。">
  <title>一言 API · 接口说明</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    :root{color-scheme:light;--ink:#30283f;--muted:#6d6279;--line:#ebdfe5;--accent:#a83d5c;--card:rgba(255,255,255,.76)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-height:100vh;color:var(--ink);background:radial-gradient(ellipse at 10% 0%,#ffe6ed 0,transparent 42%),radial-gradient(ellipse at 90% 20%,#e3f3ff 0,transparent 42%),linear-gradient(155deg,#fff7e8,#fffdf9 55%,#fff0f5);font-family:"Songti SC","Noto Serif SC",Georgia,serif;line-height:1.85}a{color:var(--accent);text-underline-offset:4px}a:focus-visible{outline:3px solid #b74469;outline-offset:4px}header,main,footer{max-width:960px;margin:auto;padding-left:24px;padding-right:24px}header{text-align:center;padding-top:86px;padding-bottom:48px}.eyebrow{font:700 12px/1.5 system-ui,sans-serif;letter-spacing:.32em;color:#806b7d}h1{font-size:clamp(39px,8vw,76px);line-height:1.18;letter-spacing:-.035em;margin:22px 0;background:linear-gradient(100deg,#b97622,#c64e55 40%,#b83f80 70%,#367db3);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#a83d5c}header p{color:var(--muted);max-width:600px;margin:0 auto 25px}.button{display:inline-block;background:linear-gradient(110deg,#cc5a48,#c44d7c);color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font:650 15px/1.5 system-ui,sans-serif;box-shadow:0 12px 24px -12px #d16b82;transition:transform .2s,box-shadow .2s}.button:hover{transform:translateY(-2px);box-shadow:0 16px 28px -12px #d16b82}.button.ghost{background:rgba(255,255,255,.8);color:var(--accent);border:1px solid rgba(255,255,255,.9);box-shadow:none}header .note{margin-top:24px;font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.03em}section{background:var(--card);border:1px solid rgba(255,255,255,.95);border-radius:22px;padding:30px 34px;margin-bottom:22px;box-shadow:0 16px 45px -30px rgba(90,55,80,.3)}h2{font-size:23px;margin:0 0 14px}h2:before{content:'✦';font-size:13px;color:#d25a7e;margin-right:12px}h3{font-size:16px;margin:20px 0 6px}p{margin:8px 0}code,pre{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.9em}code{background:#f8edf0;padding:2px 5px;border-radius:5px;overflow-wrap:anywhere}pre{background:#fbf2f4;padding:16px;border-radius:12px;overflow:auto;line-height:1.65;margin:10px 0}pre code{background:none;padding:0;overflow-wrap:normal}table{border-collapse:collapse;width:100%;font-size:14px;text-align:left}th,td{padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--muted);font-weight:600}tr:last-child td{border-bottom:0}.table-wrap{overflow-x:auto}.note{color:var(--muted);font-size:14px}.examples{display:grid;gap:9px}.examples a{overflow-wrap:anywhere}footer{text-align:center;font:13px/1.8 system-ui,sans-serif;color:var(--muted);padding-top:24px;padding-bottom:64px}.quote{font-size:clamp(24px,4vw,32px);line-height:1.6;margin:8px 0;color:var(--ink)}.quote-source{text-align:right;color:var(--muted);font-size:15px}.quote-meta{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}.chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.chip{padding:6px 14px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.8);color:var(--ink);font:600 13px/1.6 system-ui,sans-serif;cursor:pointer}.chip:hover{border-color:var(--accent)}.chip.active{background:var(--accent);border-color:var(--accent);color:#fff}.btn{display:inline-block;margin-top:8px;padding:9px 22px;border:0;border-radius:999px;background:linear-gradient(110deg,#cc5a48,#c44d7c);color:#fff;font:600 14px/1.5 system-ui,sans-serif;cursor:pointer;box-shadow:0 12px 24px -12px #d16b82}.btn:hover{filter:brightness(1.08)}@media(max-width:600px){header{padding-top:60px;padding-bottom:34px}section{padding:22px 20px;border-radius:18px}th,td{min-width:110px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button{transition:none}}
    .footer-sources{margin-bottom:18px}.footer-sources a{color:var(--muted)}.footer-sources a:hover{color:var(--accent)}.icp-link{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.9);color:var(--muted);text-decoration:none;transition:color .25s,transform .25s,box-shadow .25s}.edgeone-badge{display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.9);color:var(--muted);text-decoration:none;transition:color .25s,transform .25s,box-shadow .25s}.edgeone-badge:hover{color:var(--accent);transform:translateY(-2px);box-shadow:0 10px 22px -14px rgba(70,50,90,.5)}.edgeone-badge img{height:20px;width:auto;display:block}.icp-link:hover{color:var(--accent);transform:translateY(-2px);box-shadow:0 10px 22px -14px rgba(70,50,90,.5)}.icp-link img{width:16px;height:16px;object-fit:contain}
    .bubbles{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}.bubble{position:absolute;bottom:-70px;border-radius:50%;opacity:0;animation:rise var(--duration) linear var(--delay) infinite;background:var(--color);width:var(--size);height:var(--size);left:var(--left)}@keyframes rise{0%{transform:translateY(0) scale(.8);opacity:0}10%{opacity:.35}100%{transform:translateY(-115vh) scale(1.15);opacity:0}}header,main,footer{position:relative;z-index:1}h1{background-size:200% 100%;animation:shimmer 8s ease-in-out infinite alternate}@keyframes shimmer{to{background-position:100% 50%}}.reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}.reveal.visible{opacity:1;transform:none}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.icp-link,.reveal{transition:none}.reveal{opacity:1;transform:none}.bubble,h1{animation:none}.bubble{display:none}}
  </style>
</head>
<body>
<div class="bubbles" aria-hidden="true">
  <span class="bubble" style="--left:8%;--size:28px;--duration:16s;--delay:-3s;--color:#ffb2c8"></span>
  <span class="bubble" style="--left:23%;--size:18px;--duration:19s;--delay:-11s;--color:#facf80"></span>
  <span class="bubble" style="--left:39%;--size:36px;--duration:22s;--delay:-7s;--color:#b8dfff"></span>
  <span class="bubble" style="--left:58%;--size:22px;--duration:18s;--delay:-14s;--color:#ffb2c8"></span>
  <span class="bubble" style="--left:77%;--size:30px;--duration:21s;--delay:-5s;--color:#facf80"></span>
  <span class="bubble" style="--left:93%;--size:19px;--duration:17s;--delay:-12s;--color:#b8dfff"></span>
</div>
<header>
  <div class="eyebrow">HITOKOTO · API</div>
  <h1>每一次请求，<br>遇见一句话。</h1>
  <p>一个简单的一言接口。获取随机语录，按类别和长度筛选，或选择适合你的返回格式。</p>
  <a class="button" href="/api" target="_blank" rel="noopener">试试接口 ↗</a>
  <a class="button ghost" href="/docs">查看接口文档 ↗</a>
</header>
<main>
  <section>
    <h2>随机一言</h2>
    <div class="chips" id="quote-chips"></div>
    <p class="quote" id="quote-text">正在取一句…</p>
    <p class="quote-source" id="quote-source"></p>
    <p class="quote-meta" id="quote-meta"></p>
    <button class="btn" id="quote-next" type="button">换一句</button>
  </section>
</main>
<footer>
  <p class="note" style="overflow-wrap:anywhere">当前 API 版本：<span id="api-version">暂不可用</span> · 更新时间：<span id="api-updated">暂不可用</span><br>当前句子库版本：<span id="bundle-version">暂不可用</span> · 上游更新时间：<span id="bundle-updated">暂不可用</span></p>
  <p><a href="/docs">接口文档</a> · <a href="/stats">运行状况</a></p>
  <div class="footer-sources"><a href="https://github.com/hitokoto-osc/sentences-bundle" target="_blank" rel="noopener noreferrer">语录数据来自 sentences-bundle</a> · <a href="https://github.com/jiandan2020/hitokoto-edgeone" target="_blank" rel="noopener noreferrer">项目源码</a></div>
  <a class="icp-link" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"><img src="/icp-beian.png" alt="" width="16" height="16">赣ICP备2025074916号-1</a>
  <div><a class="edgeone-badge" href="https://edgeone.ai/" target="_blank" rel="noopener noreferrer"><img src="/edgeone-logo.png" alt="Tencent EdgeOne" width="138" height="20">本站由 EdgeOne 提供加速服务</a></div>
</footer>
<script>
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('main section').forEach(section => {
      section.classList.add('reveal');
      observer.observe(section);
    });
  }
  function displayTime(value, id) {
    if ((typeof value !== 'number' && typeof value !== 'string') || value === '') return;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return;
    document.getElementById(id).textContent = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(date) + '（北京时间）';
  }
  fetch('/package.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('API 版本信息不可用');
      return response.json();
    })
    .then(data => {
      if (data && typeof data.version === 'string' && data.version.trim()) {
        document.getElementById('api-version').textContent = data.version.trim();
      }
      if (data) displayTime(data.apiUpdatedAt, 'api-updated');
    })
    .catch(() => {});
  fetch('/version.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('版本信息不可用');
      return response.json();
    })
    .then(data => {
      if (data && typeof data.bundle_version === 'string' && data.bundle_version.trim()) {
        document.getElementById('bundle-version').textContent = data.bundle_version.trim();
      }
      if (data) displayTime(data.updated_at, 'bundle-updated');
    })
    .catch(() => {});
  const CATEGORIES = [["a", "动画"], ["b", "漫画"], ["c", "游戏"], ["d", "文学"], ["e", "原创"], ["f", "网络"], ["g", "其他"], ["h", "影视"], ["i", "诗词"], ["j", "网易云"], ["k", "哲学"], ["l", "抖机灵"]];
  let quoteCategory = '';
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
    }).catch(() => {
      text.textContent = '一言暂不可用，请稍后再试。';
    });
  }
  document.getElementById('quote-next').addEventListener('click', loadQuote);
  renderChips();
  loadQuote();
</script>
</body>
</html>`;

export default function onRequest() {
    return new Response(page, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
}
