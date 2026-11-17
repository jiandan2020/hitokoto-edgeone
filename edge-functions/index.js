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
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,400..700&display=swap" rel="stylesheet">
  <style>
    :root{
      color-scheme:light;
      --md-primary:#c2185b;--md-on-primary:#fff;--md-primary-container:#ffd9e3;--md-on-primary-container:#3f0016;
      --md-secondary:#7a4a55;--md-on-secondary:#fff;--md-secondary-container:#ffd9e3;--md-on-secondary-container:#2e1218;
      --md-tertiary:#8a5a00;--md-on-tertiary:#fff;--md-tertiary-container:#ffe1a8;--md-on-tertiary-container:#2a1a00;
      --md-error:#b3261e;--md-on-error:#fff;--md-error-container:#f9dedc;--md-on-error-container:#410e0b;
      --md-surface:#fff0f2;--md-surface-dim:#e7d6d8;
      --md-surface-container-lowest:#fff;--md-surface-container-low:#ffeef1;--md-surface-container:#fbe3e8;
      --md-surface-container-high:#f5d6dd;--md-surface-container-highest:#efc9d2;
      --md-on-surface:#221a1d;--md-on-surface-variant:#544247;
      --md-outline:#8a767b;--md-outline-variant:#dcc2c8;
      --md-inverse-surface:#372e31;--md-inverse-on-surface:#ffeded;
      --md-success-container:#dce9dc;--md-on-success-container:#1b4d1f;
      --md-elev-1:0 1px 2px rgba(0,0,0,.3),0 1px 3px 1px rgba(0,0,0,.15);
      --md-elev-2:0 1px 2px rgba(0,0,0,.3),0 2px 6px 2px rgba(0,0,0,.15);
      --md-elev-3:0 1px 3px rgba(0,0,0,.3),0 4px 8px 3px rgba(0,0,0,.15);
      --md-ease:cubic-bezier(.2,0,0,1);
    }
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{margin:0;min-height:100vh;color:var(--md-on-surface);background:var(--md-surface);font-family:"Roboto Flex","Roboto","Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;font-size:16px;line-height:1.5}
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
    .button:hover{background:#a31545;box-shadow:var(--md-elev-1);text-decoration:none}
    .button:active{transform:scale(.98)}
    .button.ghost{background:transparent;color:var(--md-primary);border:1px solid var(--md-outline)}
    .button.ghost:hover{background:rgba(194,24,91,.08);box-shadow:none}
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
    .chip:hover{background:rgba(194,24,91,.08)}
    .chip.active{background:var(--md-secondary-container);border-color:transparent;color:var(--md-on-secondary-container)}
    .chip.active:before{content:'✓ ';font-weight:700}
    .btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;margin-top:8px;padding:0 24px;border:0;border-radius:999px;background:var(--md-primary);color:var(--md-on-primary);font-size:14px;font-weight:500;line-height:1.5;font-family:inherit;cursor:pointer;transition:box-shadow .2s var(--md-ease),background .2s var(--md-ease)}
    .btn:hover{background:#a31545;box-shadow:var(--md-elev-1)}
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
  </style>
</head>
<body>
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
