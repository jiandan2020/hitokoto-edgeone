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
  <script>(function(){try{var t=localStorage.getItem('hitokoto-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();</script>
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
      --md-hover:var(--md-hover);--md-primary-hover:#8f2f00;
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
    .button:hover{background:var(--md-primary-hover);box-shadow:var(--md-elev-1);text-decoration:none}
    .button:active{transform:scale(.98)}
    .button.ghost{background:transparent;color:var(--md-primary);border:1px solid var(--md-outline)}
    .button.ghost:hover{background:var(--md-hover);box-shadow:none}
    header .button+.button{margin-left:12px}
    header .note{margin-top:20px;font-size:12px;color:var(--md-on-surface-variant)}
    section{background:var(--md-surface-container);border-radius:28px;padding:32px;margin-bottom:24px;scroll-margin-top:80px}
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
    .quote-card{position:relative}
    .quote-mark{position:absolute;top:4px;left:16px;font-size:80px;line-height:1;color:var(--md-primary);opacity:.12;pointer-events:none;user-select:none}
    .quote-body{min-height:132px;transition:opacity .25s var(--md-ease)}
    .quote-body.skeleton .quote{color:transparent;background:var(--md-surface-container-high);border-radius:8px;min-height:44px;animation:skeleton-pulse 1.2s ease-in-out infinite}
    .quote-body.skeleton .quote-source,.quote-body.skeleton .quote-meta{visibility:hidden}
    @keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.45}}
    .quote-quick{margin:20px 0 8px}
    .quote-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px}
    .quote-actions .btn{margin-top:0}
    .btn.ghost-btn{background:transparent;color:var(--md-primary);border:1px solid var(--md-outline)}
    .btn.ghost-btn:hover{background:var(--md-hover);box-shadow:none}
    .btn:disabled{opacity:.55;cursor:default}
    .quote-error{color:var(--md-error);font-size:14px;margin:12px 0 0}
    .link-btn{border:0;background:none;padding:0;color:var(--md-primary);font-size:14px;font-weight:500;font-family:inherit;cursor:pointer;text-decoration:underline}
    .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
    .chip{min-height:32px;padding:0 16px;border:1px solid var(--md-outline);border-radius:8px;background:transparent;color:var(--md-on-surface);font-size:14px;font-weight:500;line-height:1.5;font-family:inherit;cursor:pointer;transition:background .2s var(--md-ease)}
    .chip:hover{background:var(--md-hover)}
    .chip.active{background:var(--md-secondary-container);border-color:transparent;color:var(--md-on-secondary-container)}
    .chip.active:before{content:'✓ ';font-weight:700}
    .btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;margin-top:8px;padding:0 24px;border:0;border-radius:999px;background:var(--md-primary);color:var(--md-on-primary);font-size:14px;font-weight:500;line-height:1.5;font-family:inherit;cursor:pointer;transition:box-shadow .2s var(--md-ease),background .2s var(--md-ease)}
    .btn:hover{background:var(--md-primary-hover);box-shadow:var(--md-elev-1)}
    .btn:active{transform:scale(.98)}
    .footer-sources{margin-bottom:16px}
    .footer-sources a{color:var(--md-on-surface-variant)}
    .footer-sources a:hover{color:var(--md-primary)}
    .icp-link{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 16px;border-radius:999px;background:var(--md-surface-container-high);color:var(--md-on-surface-variant);text-decoration:none;transition:background .2s var(--md-ease),color .2s var(--md-ease)}
    .icp-link:hover{color:var(--md-primary);background:var(--md-surface-container-highest);text-decoration:none}
    .edgeone-badge{display:inline-flex;align-items:center;gap:8px;margin-bottom:12px;color:var(--md-on-surface-variant);text-decoration:none;transition:color .2s var(--md-ease)}
    .edgeone-badge:hover{color:var(--md-primary);text-decoration:none}
    .edgeone-badge img{height:20px;width:auto;display:block}
    .icp-link img{width:16px;height:16px;object-fit:contain}
    .reveal{opacity:0;transform:translateY(16px);transition:opacity .5s var(--md-ease),transform .5s var(--md-ease)}
    .reveal.visible{opacity:1;transform:none}
    @media(max-width:600px){header{padding-top:48px;padding-bottom:32px}section{padding:24px 20px;border-radius:24px}th,td{min-width:110px}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button,.btn,.chip,.icp-link,.edgeone-badge,.quote-body{transition:none}.reveal{opacity:1;transform:none}.quote-body.skeleton .quote{animation:none}}
  
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
    @media(max-width:600px){.app-nav-links{display:none}.app-menu{display:block}.app-bar-inner{gap:12px}.theme-btn{display:none}}
    .api-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:20px}
    .api-card{padding:20px 22px;border-radius:20px;background:var(--md-surface-container-low);box-shadow:var(--md-elev-1);border:1px solid transparent;cursor:pointer;transition:box-shadow .2s var(--md-ease),border-color .2s var(--md-ease)}
    .api-card:hover,.api-card:focus-visible{box-shadow:var(--md-elev-2);border-color:var(--md-outline)}
    .api-card:focus-visible{outline:2px solid var(--md-primary);outline-offset:2px}
    .api-card-header{display:flex;align-items:center;gap:12px}
    .api-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:var(--md-primary-container);color:var(--md-on-primary-container);font-size:18px;font-weight:500}
    .api-icon svg{width:24px;height:24px;display:block}
    .card-copy{display:inline-flex;align-items:center;min-height:32px;margin-top:12px;padding:0 14px;border:1px solid var(--md-outline);border-radius:999px;background:transparent;color:var(--md-primary);font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;transition:background .2s var(--md-ease)}
    .card-copy:hover{background:var(--md-hover)}
    .pg-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin:16px 0}
    .pg-field{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:500;color:var(--md-on-surface)}
    .pg-field select,.pg-field input{min-height:40px;padding:0 12px;border:1px solid var(--md-outline);border-radius:10px;background:var(--md-surface-container-lowest);color:var(--md-on-surface);font-size:14px;font-family:inherit}
    .pg-field select:focus,.pg-field input:focus{outline:2px solid var(--md-primary);outline-offset:1px}
    .pg-error{color:var(--md-error);font-size:14px;margin:8px 0}
    .pg-url-row{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:12px 0}
    .pg-url{flex:1;min-width:200px;background:var(--md-surface-container-high);padding:10px 12px;border-radius:10px;overflow-wrap:anywhere}
    .pg-url-row .btn{margin-top:0}
    .pg-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px;font-size:13px;color:var(--md-on-surface-variant);font-variant-numeric:tabular-nums;margin:16px 0 8px}
    .pg-meta .btn{margin-top:0}
    .pg-response{background:var(--md-surface-container-high);padding:16px;border-radius:16px;overflow:auto;line-height:1.6;margin:8px 0;white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px}
    .pg-copy-resp{min-height:32px;padding:0 14px;font-size:13px}
    .api-card h3{font-size:16px;font-weight:500;margin:0}
    .api-desc{font-size:14px;color:var(--md-on-surface-variant);margin:12px 0}
    .api-meta{display:flex;align-items:center;gap:8px}
    .api-method{padding:2px 8px;border-radius:6px;background:var(--md-primary);color:var(--md-on-primary);font-size:12px;font-weight:700}
    .api-meta code{background:none;padding:0;color:var(--md-on-surface-variant)}
  </style>
</head>
<body>
<nav class="app-bar"><div class="app-bar-inner"><a class="app-logo" href="/"><img src="/favicon.svg" alt="" width="28" height="28"><span>小周的一言API</span></a><div class="app-nav-links"><a href="/">首页</a><a href="/docs">接口文档</a><a href="/stats">运行状况</a></div><button class="theme-btn" id="theme-btn" type="button" aria-label="切换深色模式">🌙</button><div class="app-menu"><button class="app-menu-btn" id="menu-btn" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="menu-dropdown">☰</button><div class="app-menu-dropdown" id="menu-dropdown" hidden><a href="/" class="active">首页</a><a href="/docs">接口文档</a><a href="/stats">运行状况</a><button class="app-menu-theme" id="theme-btn-menu" type="button">🌙 切换深色模式</button></div></div></div></nav>
<header>
  <div class="eyebrow">HITOKOTO · API</div>
  <h1>让每一次请求，都遇见一句好话</h1>
  <p>稳定、轻量的中文语录开放接口，支持多维度筛选与多种返回格式。</p>
  <a class="button" href="#api-grid">快速接入</a>
  <a class="button ghost" href="/docs">接口文档</a>
</header>
<main>
  <section class="quote-card">
    <h2>随机一言</h2>
    <div class="quote-mark" aria-hidden="true">❝</div>
    <div class="quote-body" id="quote-body">
      <p class="quote" id="quote-text">正在取一句…</p>
      <p class="quote-source" id="quote-source"></p>
      <p class="quote-meta" id="quote-meta"></p>
    </div>
    <div class="chips quote-quick" id="quote-chips"></div>
    <div class="quote-actions">
      <button class="btn" id="quote-next" type="button">换一句</button>
      <button class="btn ghost-btn" id="quote-copy" type="button">复制</button>
      <button class="btn ghost-btn" id="quote-share" type="button">分享</button>
    </div>
    <p class="quote-error" id="quote-error" hidden>暂时无法获取一言。<button class="link-btn" id="quote-retry" type="button">重新获取</button></p>
  </section>
  <section id="api-grid-section">
    <h2>接口一览</h2>
    <p class="note">一个接口，六种用法。全部只支持 GET 请求，返回 JSON、纯文本或 JS 脚本。</p>
    <div class="api-grid" id="api-grid">
      <article class="api-card" data-feature="random" tabindex="0">
        <div class="api-card-header"><span class="api-icon"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.5 4v2c0 1 0 1 1 1z"/></svg></span><h3>随机一言</h3></div>
        <p class="api-desc">随机返回一句语录，全库等概率。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api</code></div>
        <button class="card-copy" type="button" data-url="/api">复制 URL</button>
      </article>
      <article class="api-card" data-feature="category" tabindex="0">
        <div class="api-card-header"><span class="api-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></span><h3>分类筛选</h3></div>
        <p class="api-desc">按 12 个分类取句：动画、漫画、游戏、文学、原创、网络、其他、影视、诗词、网易云、哲学、抖机灵。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api?c=a</code></div>
        <button class="card-copy" type="button" data-url="/api?c=a">复制 URL</button>
      </article>
      <article class="api-card" data-feature="length" tabindex="0">
        <div class="api-card-header"><span class="api-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg></span><h3>长度筛选</h3></div>
        <p class="api-desc">按字数范围筛选句子，只返回符合长度的语录。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api?min_length=10&amp;max_length=20</code></div>
        <button class="card-copy" type="button" data-url="/api?min_length=10&amp;max_length=20">复制 URL</button>
      </article>
      <article class="api-card" data-feature="format" tabindex="0">
        <div class="api-card-header"><span class="api-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></span><h3>多种返回格式</h3></div>
        <p class="api-desc">JSON、纯文本、JS 脚本三种返回编码，按需选择。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api?encode=text</code></div>
        <button class="card-copy" type="button" data-url="/api?encode=text">复制 URL</button>
      </article>
      <article class="api-card" data-feature="jsonp" tabindex="0">
        <div class="api-card-header"><span class="api-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-4a2 2 0 0 1 2-2 2 2 0 0 1-2-2V7a2 2 0 0 0-2-2h-1"/></svg></span><h3>JSONP 回调</h3></div>
        <p class="api-desc">跨域调用时用回调函数接收结果，JSON 格式下回调收到的是字符串。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api?callback=cb</code></div>
        <button class="card-copy" type="button" data-url="/api?callback=cb">复制 URL</button>
      </article>
      <article class="api-card" data-feature="balanced" tabindex="0">
        <div class="api-card-header"><span class="api-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg></span><h3>均衡抽取</h3></div>
        <p class="api-desc">先随机分类、再随机句子，小分类和大分类机会均等。</p>
        <div class="api-meta"><span class="api-method">GET</span><code>/api?mode=category</code></div>
        <button class="card-copy" type="button" data-url="/api?mode=category">复制 URL</button>
      </article>
    </div>
  </section>
  <section id="playground">
    <h2>API 在线调试</h2>
    <p class="note">选一个功能，调好参数，实时预览请求地址，点发送请求就能看到真实返回。</p>
    <div class="chips" id="pg-features"></div>
    <div class="pg-form">
      <label class="pg-field">分类
        <select id="pg-c"></select>
      </label>
      <label class="pg-field">最小长度
        <input id="pg-min" type="number" min="1" max="10000" inputmode="numeric" placeholder="不限制">
      </label>
      <label class="pg-field">最大长度
        <input id="pg-max" type="number" min="1" max="10000" inputmode="numeric" placeholder="不限制">
      </label>
      <label class="pg-field">返回格式
        <select id="pg-encode"><option value="json">json</option><option value="text">text</option><option value="js">js</option></select>
      </label>
      <label class="pg-field" id="pg-field-callback">回调
        <input id="pg-callback" type="text" placeholder="如 show" autocomplete="off">
      </label>
      <label class="pg-field">抽取模式
        <select id="pg-mode"><option value="">默认（全库等概率）</option><option value="category">均衡抽取（mode=category）</option></select>
      </label>
    </div>
    <p class="pg-error" id="pg-error" hidden></p>
    <div class="pg-url-row">
      <code class="pg-url" id="pg-url"></code>
      <button class="btn ghost-btn" id="pg-copy-url" type="button">复制 URL</button>
    </div>
    <div class="quote-actions">
      <button class="btn" id="pg-send" type="button">发送请求</button>
      <button class="btn ghost-btn" id="pg-copy-curl" type="button">复制 curl</button>
    </div>
    <div id="pg-result" hidden>
      <p class="pg-meta"><span id="pg-status"></span><button class="btn ghost-btn pg-copy-resp" id="pg-copy-resp" type="button">复制响应</button></p>
      <pre class="pg-response" id="pg-response"></pre>
    </div>
    <p class="note">调试器只请求本站 /api，不请求任何外部地址。</p>
  </section>
</main>
<footer>
  <p class="note" id="version-info" style="overflow-wrap:anywhere" aria-busy="true">当前 API 版本：<span id="api-version">加载中…</span> · 更新时间：<span id="api-updated">加载中…</span><br>当前句子库版本：<span id="bundle-version">加载中…</span> · 上游更新时间：<span id="bundle-updated">加载中…</span></p>
  <p class="footer-sources"><a href="/docs">接口文档</a> · <a href="/stats">运行状况</a> · <a href="https://github.com/hitokoto-osc/sentences-bundle" target="_blank" rel="noopener noreferrer">语句数据</a> · <a href="https://github.com/jiandan2020/hitokoto-edgeone" target="_blank" rel="noopener noreferrer">项目源码</a></p>
  <div><a class="edgeone-badge" href="https://edgeone.ai/" target="_blank" rel="noopener noreferrer">本站由 <img src="/edgeone-logo.png" alt="Tencent EdgeOne" width="140" height="20"> 提供加速服务</a></div>
  <a class="icp-link" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"><img src="/icp-beian.png" alt="" width="16" height="16">赣ICP备2025074916号-1</a>
</footer>
<script>
  (function(){var btn=document.getElementById('menu-btn');var menu=document.getElementById('menu-dropdown');if(!btn||!menu)return;btn.addEventListener('click',function(e){e.stopPropagation();var open=menu.hidden;menu.hidden=!open;btn.setAttribute('aria-expanded',String(open));});document.addEventListener('click',function(e){if(!menu.hidden&&!menu.contains(e.target)){menu.hidden=true;btn.setAttribute('aria-expanded','false');}});})();
  (function(){var b=document.getElementById('theme-btn');var m=document.getElementById('theme-btn-menu');function cur(){return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';}function sync(){var t=cur();var i=t==='dark'?'☀️':'🌙';var l=t==='dark'?'切换浅色模式':'切换深色模式';if(b){b.textContent=i;b.setAttribute('aria-label',l);}if(m){m.textContent=i+' '+l;}}function apply(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('hitokoto-theme',t);}catch(e){}sync();}function tog(){apply(cur()==='dark'?'light':'dark');}if(b){b.addEventListener('click',tog);}if(m){m.addEventListener('click',tog);}sync();try{if(!localStorage.getItem('hitokoto-theme')&&window.matchMedia){window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){document.documentElement.setAttribute('data-theme',e.matches?'dark':'light');sync();});}}catch(e){}})();
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
  const versionInfo = document.getElementById('version-info');
  let versionOkCount = 0;
  function onVersionPart(ok) {
    if (!ok) { versionInfo.hidden = true; return; }
    versionOkCount += 1;
    if (versionOkCount === 2) versionInfo.setAttribute('aria-busy', 'false');
  }
  fetch('/package.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    .then(response => {
      if (!response.ok) throw new Error('API 版本信息不可用');
      return response.json();
    })
    .then(data => {
      if (!data || typeof data.version !== 'string' || !data.version.trim()) throw new Error('版本缺失');
      document.getElementById('api-version').textContent = data.version.trim();
      displayTime(data.apiUpdatedAt, 'api-updated');
      onVersionPart(true);
    })
    .catch(() => onVersionPart(false));
  fetch('/version.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    .then(response => {
      if (!response.ok) throw new Error('版本信息不可用');
      return response.json();
    })
    .then(data => {
      if (!data || typeof data.bundle_version !== 'string' || !data.bundle_version.trim()) throw new Error('版本缺失');
      document.getElementById('bundle-version').textContent = data.bundle_version.trim();
      displayTime(data.updated_at, 'bundle-updated');
      onVersionPart(true);
    })
    .catch(() => onVersionPart(false));
  const CATEGORIES = [["a", "动画"], ["b", "漫画"], ["c", "游戏"], ["d", "文学"], ["e", "原创"], ["f", "网络"], ["g", "其他"], ["h", "影视"], ["i", "诗词"], ["j", "网易云"], ["k", "哲学"], ["l", "抖机灵"]];
  const QUICK_CATEGORIES = [["", "全部"], ["a", "动画"], ["i", "诗词"], ["k", "哲学"], ["j", "网易云"]];
  let quoteCategory = '';
  let quoteLoading = false;
  let lastQuote = null;
  function renderChips() {
    const box = document.getElementById('quote-chips');
    box.innerHTML = '';
    for (const [key, name] of QUICK_CATEGORIES) {
      const chip = document.createElement('button');
      chip.type = 'button'; chip.className = 'chip' + (quoteCategory === key ? ' active' : ''); chip.textContent = name;
      chip.addEventListener('click', () => { quoteCategory = key; renderChips(); loadQuote(); });
      box.append(chip);
    }
  }
  function fallbackCopy(value, done, fail) {
    try {
      const ta = document.createElement('textarea');
      ta.value = value; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) { done(); } else { fail(); }
    } catch (e) { fail(); }
  }
  function copyText(value, btn, doneLabel) {
    const done = () => { if (btn) { const old = btn.textContent; btn.textContent = doneLabel || '已复制'; setTimeout(() => { btn.textContent = old; }, 1500); } };
    const fail = () => { if (btn) { const old = btn.textContent; btn.textContent = '复制失败'; setTimeout(() => { btn.textContent = old; }, 1500); } };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value).then(done, () => fallbackCopy(value, done, fail));
    }
    return fallbackCopy(value, done, fail);
  }
  function loadQuote() {
    if (quoteLoading) return Promise.resolve();
    quoteLoading = true;
    const nextBtn = document.getElementById('quote-next');
    const body = document.getElementById('quote-body');
    const text = document.getElementById('quote-text');
    nextBtn.disabled = true;
    document.getElementById('quote-error').hidden = true;
    body.classList.add('skeleton');
    text.textContent = '正在取一句…';
    document.getElementById('quote-source').textContent = '';
    document.getElementById('quote-meta').textContent = '';
    const start = performance.now();
    const url = quoteCategory ? '/api?c=' + quoteCategory : '/api';
    return fetch(url, {cache:'no-store', signal: AbortSignal.timeout(10000)}).then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(data => {
      const ms = Math.round(performance.now() - start);
      if (!data || typeof data.hitokoto !== 'string' || !data.hitokoto) throw new Error('empty');
      lastQuote = data;
      body.classList.remove('skeleton');
      body.style.opacity = '0';
      text.textContent = data.hitokoto;
      document.getElementById('quote-source').textContent = data.from ? '—— ' + data.from + (data.from_who ? ' · ' + data.from_who : '') : '';
      const cat = (CATEGORIES.find(([k]) => k === data.type) || [])[1] || data.type || '';
      document.getElementById('quote-meta').textContent = (cat ? '分类 ' + cat + ' · ' : '') + '编号 #' + data.id + ' · ' + data.length + ' 字 · 往返 ' + ms + ' ms';
      requestAnimationFrame(() => { body.style.opacity = '1'; });
    }).catch(() => {
      body.classList.remove('skeleton');
      lastQuote = null;
      text.textContent = '暂时无法获取一言';
      document.getElementById('quote-error').hidden = false;
    }).finally(() => {
      quoteLoading = false;
      nextBtn.disabled = false;
    });
  }
  document.getElementById('quote-next').addEventListener('click', loadQuote);
  document.getElementById('quote-retry').addEventListener('click', loadQuote);
  document.getElementById('quote-copy').addEventListener('click', function() {
    if (!lastQuote) return;
    copyText(lastQuote.hitokoto, this);
  });
  document.getElementById('quote-share').addEventListener('click', function() {
    if (!lastQuote) return;
    const shareText = lastQuote.hitokoto + (lastQuote.from ? ' —— ' + lastQuote.from + (lastQuote.from_who ? ' · ' + lastQuote.from_who : '') : '');
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      copyText(shareText, this, '已复制分享文本');
    }
  });
  renderChips();
  loadQuote();
  const PG_FEATURES = [
    { key: 'random', name: '随机一言', params: {} },
    { key: 'category', name: '分类筛选', params: { c: 'a' } },
    { key: 'length', name: '长度筛选', params: { min_length: '10', max_length: '20' } },
    { key: 'format', name: '返回格式', params: { encode: 'text' } },
    { key: 'jsonp', name: 'JSONP 回调', params: { callback: 'cb' } },
    { key: 'balanced', name: '均衡抽取', params: { mode: 'category' } },
  ];
  let pgFeature = 'random';
  let pgSending = false;
  let pgLastResponse = '';
  const pgEls = {
    features: document.getElementById('pg-features'),
    c: document.getElementById('pg-c'),
    min: document.getElementById('pg-min'),
    max: document.getElementById('pg-max'),
    encode: document.getElementById('pg-encode'),
    callback: document.getElementById('pg-callback'),
    callbackField: document.getElementById('pg-field-callback'),
    mode: document.getElementById('pg-mode'),
    error: document.getElementById('pg-error'),
    url: document.getElementById('pg-url'),
    send: document.getElementById('pg-send'),
    result: document.getElementById('pg-result'),
    status: document.getElementById('pg-status'),
    response: document.getElementById('pg-response'),
  };
  (function initPgCategory() {
    const all = document.createElement('option');
    all.value = ''; all.textContent = '全部';
    pgEls.c.append(all);
    for (const [key, name] of CATEGORIES) {
      const opt = document.createElement('option');
      opt.value = key; opt.textContent = name + '（' + key + '）';
      pgEls.c.append(opt);
    }
  })();
  function renderPgFeatures() {
    pgEls.features.innerHTML = '';
    for (const f of PG_FEATURES) {
      const chip = document.createElement('button');
      chip.type = 'button'; chip.className = 'chip' + (pgFeature === f.key ? ' active' : ''); chip.textContent = f.name;
      chip.addEventListener('click', () => selectFeature(f.key));
      pgEls.features.append(chip);
    }
  }
  function selectFeature(key) {
    const f = PG_FEATURES.find(x => x.key === key) || PG_FEATURES[0];
    pgFeature = f.key;
    pgEls.c.value = f.params.c || '';
    pgEls.min.value = f.params.min_length || '';
    pgEls.max.value = f.params.max_length || '';
    pgEls.encode.value = f.params.encode || 'json';
    pgEls.callback.value = f.params.callback || '';
    pgEls.mode.value = f.params.mode || '';
    renderPgFeatures();
    updatePgUrl();
  }
  function pgPositiveInt(value) {
    if (value === '') return null;
    if (!/^\\d+$/.test(value)) return 'invalid';
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n < 1 || n > 10000) return 'invalid';
    return n;
  }
  function updatePgUrl() {
    const err = pgEls.error;
    err.hidden = true; err.textContent = '';
    const min = pgPositiveInt(pgEls.min.value.trim());
    const max = pgPositiveInt(pgEls.max.value.trim());
    if (min === 'invalid' || max === 'invalid') {
      err.textContent = '长度必须是 1–10000 的正整数。';
      err.hidden = false;
      pgEls.url.textContent = '参数有误，无法生成请求地址';
      return null;
    }
    if (min !== null && max !== null && max < min) {
      err.textContent = '最大长度不能小于最小长度。';
      err.hidden = false;
      pgEls.url.textContent = '参数有误，无法生成请求地址';
      return null;
    }
    const callback = pgEls.callback.value.trim();
    const showCallback = pgFeature === 'jsonp' || pgEls.encode.value === 'js';
    pgEls.callbackField.style.display = showCallback ? '' : 'none';
    if (callback !== '' && !/^[A-Za-z_$][A-Za-z0-9_$]*(\\.[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(callback)) {
      err.textContent = '回调必须是合法的 JS 函数名，如 show 或 App.onHitokoto。';
      err.hidden = false;
      pgEls.url.textContent = '参数有误，无法生成请求地址';
      return null;
    }
    const params = new URLSearchParams();
    if (pgEls.c.value) params.set('c', pgEls.c.value);
    if (pgEls.mode.value) params.set('mode', pgEls.mode.value);
    if (min !== null) params.set('min_length', String(min));
    if (max !== null) params.set('max_length', String(max));
    if (pgEls.encode.value !== 'json') params.set('encode', pgEls.encode.value);
    if (callback !== '') params.set('callback', callback);
    const query = params.toString();
    const url = location.origin + '/api' + (query ? '?' + query : '');
    pgEls.url.textContent = url;
    return url;
  }
  ['pg-c', 'pg-min', 'pg-max', 'pg-encode', 'pg-callback', 'pg-mode'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePgUrl);
    document.getElementById(id).addEventListener('change', updatePgUrl);
  });
  document.getElementById('pg-copy-url').addEventListener('click', function() {
    const url = updatePgUrl();
    if (url) copyText(url, this);
  });
  document.getElementById('pg-copy-curl').addEventListener('click', function() {
    const url = updatePgUrl();
    if (url) copyText('curl "' + url + '"', this, '已复制 curl');
  });
  document.getElementById('pg-copy-resp').addEventListener('click', function() {
    if (pgLastResponse) copyText(pgLastResponse, this, '已复制响应');
  });
  pgEls.send.addEventListener('click', () => {
    const url = updatePgUrl();
    if (!url || pgSending) return;
    pgSending = true;
    pgEls.send.disabled = true;
    pgEls.result.hidden = true;
    const start = performance.now();
    fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) }).then(async r => {
      const ms = Math.round(performance.now() - start);
      const text = await r.text();
      pgLastResponse = text;
      let shown = text;
      const isJson = (r.headers.get('content-type') || '').includes('application/json');
      if (isJson) {
        try { shown = JSON.stringify(JSON.parse(text), null, 2); } catch (e) { shown = text; }
      }
      pgEls.status.textContent = 'HTTP ' + r.status + ' · ' + ms + ' ms';
      pgEls.response.textContent = shown;
      pgEls.result.hidden = false;
    }).catch(e => {
      const ms = Math.round(performance.now() - start);
      pgLastResponse = '';
      pgEls.status.textContent = '请求失败 · ' + ms + ' ms';
      pgEls.response.textContent = '请求失败：' + (e && e.message ? e.message : '未知错误');
      pgEls.result.hidden = false;
    }).finally(() => {
      pgSending = false;
      pgEls.send.disabled = false;
    });
  });
  document.querySelectorAll('.api-card').forEach(card => {
    const open = () => { selectFeature(card.getAttribute('data-feature')); document.getElementById('playground').scrollIntoView({ behavior: 'smooth' }); };
    card.addEventListener('click', e => { if (e.target.closest('.card-copy')) return; open(); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  document.querySelectorAll('.card-copy').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      copyText(location.origin + btn.getAttribute('data-url'), btn);
    });
  });
  renderPgFeatures();
  updatePgUrl();
</script>
</body>
</html>`;

export default function onRequest() {
    return new Response(page, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
}
