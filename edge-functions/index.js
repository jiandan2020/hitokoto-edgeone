// 首页与 API 分开路由；使用当前域名的相对路径，预览和正式环境均可访问。
const page = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="一言 API 接口说明：随机获取一句话，支持分类和多种返回格式。">
  <title>小周的一言API</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
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
    }
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{margin:0;min-height:100vh;color:var(--md-on-surface);background:var(--md-surface);font-family:"Google Sans","Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;font-size:16px;line-height:1.5}
    a{color:var(--md-primary);text-decoration:none}
    a:hover{text-decoration:underline}
    a:focus-visible{outline:2px solid var(--md-primary);outline-offset:3px;border-radius:4px}
    header,main,footer{max-width:960px;margin:auto;padding-left:24px;padding-right:24px}
    header{padding-top:48px;padding-bottom:32px;text-align:center}
    .eyebrow{font-size:12px;font-weight:500;line-height:1.5;letter-spacing:.12em;text-transform:uppercase;color:var(--md-primary)}
    header .eyebrow{margin-bottom:20px}
    h1{font-size:clamp(40px,8vw,57px);font-weight:500;line-height:1.12;letter-spacing:-.01em;margin:16px 0 12px;color:var(--md-on-surface)}
    header p{color:var(--md-on-surface-variant);max-width:600px;margin:0 auto 24px}
    .button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;border:0;border-radius:999px;background:var(--md-primary);color:var(--md-on-primary);font-size:14px;font-weight:500;line-height:1.5;text-decoration:none;cursor:pointer;transition:box-shadow .2s var(--md-ease),background .2s var(--md-ease)}
    .button:hover{background:#8f2f00;box-shadow:var(--md-elev-1);text-decoration:none}
    .button:active{transform:scale(.98)}
    .button.ghost{background:transparent;color:var(--md-primary);border:1px solid var(--md-outline)}
    .button.ghost:hover{background:rgba(178,60,0,.08);box-shadow:none}
    header .button+.button{margin-left:12px}
    header .note{margin-top:20px;font-size:12px;color:var(--md-on-surface-variant)}
    section{background:var(--md-surface-container);border-radius:28px;padding:32px;margin-bottom:24px}
    h2{font-size:22px;font-weight:400;line-height:1.27;margin:0 0 16px;color:var(--md-on-surface)}
    h3{font-size:16px;font-weight:500;line-height:1.5;margin:20px 0 8px}
    p{margin:8px 0}
    code,pre{font-family:"Roboto Mono",ui-monospace,SFMono-Regular,Consolas,Menlo,monospace;font-size:.9em}
    code{background:var(--md-surface-container-high);color:var(--md-on-surface-variant);padding:2px 6px;border-radius:4px;overflow-wrap:anywhere}
    pre{background:var(--md-surface-container-high);padding:16px;border-radius:16px;overflow:auto;line-height:1.6;margin:12px 0}
    pre code{background:none;padding:0;overflow-wrap:normal}
    table{border-collapse:collapse;width:100%;font-size:14px;text-align:left}
    th,td{padding:12px 10px;border-bottom:1px solid var(--md-outline-variant);vertical-align:top}
    th{color:var(--md-on-surface-variant);font-weight:500}
    tr:last-child td{border-bottom:0}
    .table-wrap{overflow-x:auto}
    .note{color:var(--md-on-surface-variant);font-size:14px}
    .examples{display:grid;gap:8px}
    .examples a{overflow-wrap:anywhere}
    footer{text-align:center;font-size:13px;line-height:1.6;color:var(--md-on-surface-variant);padding-top:24px;padding-bottom:48px}
    .quote{font-size:clamp(24px,4vw,32px);font-weight:400;line-height:1.4;margin:8px 0;color:var(--md-on-surface)}
    .quote-source{text-align:right;color:var(--md-on-surface-variant);font-size:15px}
    .quote-meta{font-size:13px;color:var(--md-on-surface-variant);font-variant-numeric:tabular-nums}
    .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
    .chip{min-height:32px;padding:0 16px;border:1px solid var(--md-outline);border-radius:8px;background:transparent;color:var(--md-on-surface);font-size:14px;font-weight:500;line-height:1.5;font-family:inherit;cursor:pointer;transition:background .2s var(--md-ease)}
    .chip:hover{background:rgba(178,60,0,.08)}
    .chip.active{background:var(--md-secondary-container);border-color:transparent;color:var(--md-on-secondary-container)}
    .chip.active:before{content:'✓ ';font-weight:700}
    .btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;margin-top:8px;padding:0 24px;border:0;border-radius:999px;background:var(--md-primary);color:var(--md-on-primary);font-size:14px;font-weight:500;line-height:1.5;font-family:inherit;cursor:pointer;transition:box-shadow .2s var(--md-ease),background .2s var(--md-ease)}
    .btn:hover{background:#8f2f00;box-shadow:var(--md-elev-1)}
    .btn:active{transform:scale(.98)}
    .footer-sources{margin-bottom:16px}
    .footer-sources a{color:var(--md-on-surface-variant)}
    .footer-sources a:hover{color:var(--md-primary)}
    .icp-link,.edgeone-badge{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 16px;border-radius:999px;background:var(--md-surface-container-high);color:var(--md-on-surface-variant);text-decoration:none;transition:background .2s var(--md-ease),color .2s var(--md-ease)}
    .icp-link:hover,.edgeone-badge:hover{color:var(--md-primary);background:var(--md-surface-container-highest);text-decoration:none}
    .edgeone-badge{margin-top:12px}
    .edgeone-badge img{height:20px;width:auto;display:block}
    .icp-link img{width:16px;height:16px;object-fit:contain}
    .reveal{opacity:0;transform:translateY(16px);transition:opacity .5s var(--md-ease),transform .5s var(--md-ease)}
    .reveal.visible{opacity:1;transform:none}
    @media(max-width:600px){header{padding-top:48px;padding-bottom:32px}section{padding:24px 20px;border-radius:24px}th,td{min-width:110px}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button,.btn,.chip,.icp-link,.edgeone-badge{transition:none}.reveal{opacity:1;transform:none}}
  
    .app-bar{position:sticky;top:0;z-index:10;background:var(--md-surface-container-low);box-shadow:var(--md-elev-1)}
    .app-bar-inner{max-width:960px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;gap:24px}
    .app-logo{display:inline-flex;align-items:center;gap:10px;color:var(--md-on-surface);font-size:17px;font-weight:500;text-decoration:none}
    .app-logo:hover{text-decoration:none}
    .app-logo img{width:28px;height:28px;display:block}
    .app-nav-links{display:flex;align-items:center;gap:4px;margin-left:auto}
    .app-nav-links a{padding:8px 12px;border-radius:999px;color:var(--md-on-surface-variant);font-size:14px;font-weight:500;text-decoration:none}
    .app-nav-links a:hover{background:rgba(178,60,0,.08);color:var(--md-on-surface);text-decoration:none}
    @media(max-width:600px){.app-nav-links{display:none}.app-bar-inner{gap:12px}}
    .api-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:20px}
    .api-card{padding:20px 22px;border-radius:20px;background:var(--md-surface-container-low);box-shadow:var(--md-elev-1)}
    .api-card-header{display:flex;align-items:center;gap:12px}
    .api-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:var(--md-primary-container);color:var(--md-on-primary-container);font-size:18px;font-weight:500}
    .api-card h3{font-size:16px;font-weight:500;margin:0}
    .api-desc{font-size:14px;color:var(--md-on-surface-variant);margin:12px 0}
    .api-meta{display:flex;align-items:center;gap:8px}
    .api-method{padding:2px 8px;border-radius:6px;background:var(--md-primary);color:var(--md-on-primary);font-size:12px;font-weight:700}
    .api-meta code{background:none;padding:0;color:var(--md-on-surface-variant)}
  </style>
</head>
<body>
<nav class="app-bar"><div class="app-bar-inner"><a class="app-logo" href="/"><img src="/favicon.svg" alt="" width="28" height="28"><span>小周的一言API</span></a><div class="app-nav-links"><a href="/">首页</a><a href="/docs">接口文档</a><a href="/stats">运行状况</a></div></div></nav>
<header>
  <div class="eyebrow">HITOKOTO · API</div>
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
  <section>
    <h2>接口一览</h2>
    <p class="note">一个接口，六种用法。全部只支持 GET 请求，返回 JSON、纯文本或 JS 脚本。</p>
    <div class="api-grid">
      <article class="api-card">
        <div class="api-card-header"><span class="api-icon">❝</span><h3>随机一言</h3></div>
        <p class="api-desc">随机返回一句语录，全库等概率。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api</code></div>
      </article>
      <article class="api-card">
        <div class="api-card-header"><span class="api-icon">类</span><h3>分类筛选</h3></div>
        <p class="api-desc">按 12 个分类取句：动画、漫画、游戏、文学、原创、网络、其他、影视、诗词、网易云、哲学、抖机灵。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api?c=a</code></div>
      </article>
      <article class="api-card">
        <div class="api-card-header"><span class="api-icon">长</span><h3>长度筛选</h3></div>
        <p class="api-desc">按字数范围筛选句子，只返回符合长度的语录。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api?min_length=10&amp;max_length=20</code></div>
      </article>
      <article class="api-card">
        <div class="api-card-header"><span class="api-icon">码</span><h3>多种返回格式</h3></div>
        <p class="api-desc">JSON、纯文本、JS 脚本三种返回编码，按需选择。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api?encode=text</code></div>
      </article>
      <article class="api-card">
        <div class="api-card-header"><span class="api-icon">调</span><h3>JSONP 回调</h3></div>
        <p class="api-desc">跨域调用时用回调函数接收结果，JSON 格式下回调收到的是字符串。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api?callback=cb</code></div>
      </article>
      <article class="api-card">
        <div class="api-card-header"><span class="api-icon">均</span><h3>均衡抽取</h3></div>
        <p class="api-desc">先随机分类、再随机句子，小分类和大分类机会均等。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api?mode=category</code></div>
      </article>
    </div>
  </section>
</main>
<footer>
  <p class="note" style="overflow-wrap:anywhere">当前 API 版本：<span id="api-version">暂不可用</span> · 更新时间：<span id="api-updated">暂不可用</span><br>当前句子库版本：<span id="bundle-version">暂不可用</span> · 上游更新时间：<span id="bundle-updated">暂不可用</span></p>
  <p class="footer-sources"><a href="/docs">接口文档</a> · <a href="/stats">运行状况</a> · <a href="https://github.com/hitokoto-osc/sentences-bundle" target="_blank" rel="noopener noreferrer">语句数据</a> · <a href="https://github.com/jiandan2020/hitokoto-edgeone" target="_blank" rel="noopener noreferrer">项目源码</a></p>
  <a class="icp-link" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"><img src="/icp-beian.png" alt="" width="16" height="16">赣ICP备2025074916号-1</a>
  <div><a class="edgeone-badge" href="https://edgeone.ai/" target="_blank" rel="noopener noreferrer">本站由 <img src="/edgeone-logo.png" alt="Tencent EdgeOne" width="140" height="20"> 提供加速服务</a></div>
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
