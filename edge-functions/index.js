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
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-height:100vh;color:var(--ink);background:radial-gradient(ellipse at 10% 0%,#ffe6ed 0,transparent 42%),radial-gradient(ellipse at 90% 20%,#e3f3ff 0,transparent 42%),linear-gradient(155deg,#fff7e8,#fffdf9 55%,#fff0f5);font-family:"Songti SC","Noto Serif SC",Georgia,serif;line-height:1.85}a{color:var(--accent);text-underline-offset:4px}a:focus-visible{outline:3px solid #b74469;outline-offset:4px}header,main,footer{max-width:960px;margin:auto;padding-left:24px;padding-right:24px}header{text-align:center;padding-top:86px;padding-bottom:48px}.eyebrow{font:700 12px/1.5 system-ui,sans-serif;letter-spacing:.32em;color:#806b7d}h1{font-size:clamp(39px,8vw,76px);line-height:1.18;letter-spacing:-.035em;margin:22px 0;background:linear-gradient(100deg,#b97622,#c64e55 40%,#b83f80 70%,#367db3);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#a83d5c}header p{color:var(--muted);max-width:600px;margin:0 auto 25px}.button{display:inline-block;background:linear-gradient(110deg,#cc5a48,#c44d7c);color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font:650 15px/1.5 system-ui,sans-serif;box-shadow:0 12px 24px -12px #d16b82;transition:transform .2s,box-shadow .2s}.button:hover{transform:translateY(-2px);box-shadow:0 16px 28px -12px #d16b82}header .note{margin-top:24px;font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.03em}section{background:var(--card);border:1px solid rgba(255,255,255,.95);border-radius:22px;padding:30px 34px;margin-bottom:22px;box-shadow:0 16px 45px -30px rgba(90,55,80,.3)}h2{font-size:23px;margin:0 0 14px}h2:before{content:'✦';font-size:13px;color:#d25a7e;margin-right:12px}h3{font-size:16px;margin:20px 0 6px}p{margin:8px 0}code,pre{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.9em}code{background:#f8edf0;padding:2px 5px;border-radius:5px;overflow-wrap:anywhere}pre{background:#fbf2f4;padding:16px;border-radius:12px;overflow:auto;line-height:1.65;margin:10px 0}pre code{background:none;padding:0;overflow-wrap:normal}table{border-collapse:collapse;width:100%;font-size:14px;text-align:left}th,td{padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--muted);font-weight:600}tr:last-child td{border-bottom:0}.table-wrap{overflow-x:auto}.note{color:var(--muted);font-size:14px}.examples{display:grid;gap:9px}.examples a{overflow-wrap:anywhere}footer{text-align:center;font:13px/1.8 system-ui,sans-serif;color:var(--muted);padding-top:24px;padding-bottom:64px}@media(max-width:600px){header{padding-top:60px;padding-bottom:34px}section{padding:22px 20px;border-radius:18px}th,td{min-width:110px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button{transition:none}}
    .footer-sources{margin-bottom:18px}.footer-sources a{color:var(--muted)}.footer-sources a:hover{color:var(--accent)}.icp-link{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.9);color:var(--muted);text-decoration:none;transition:color .25s,transform .25s,box-shadow .25s}.icp-link:hover{color:var(--accent);transform:translateY(-2px);box-shadow:0 10px 22px -14px rgba(70,50,90,.5)}.icp-link img{width:16px;height:16px;object-fit:contain}
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
</header>
<main>
  <section>
    <h2>快速开始</h2>
    <p>发送 GET 请求即可获取一条随机一言。默认返回 JSON，默认最大长度为 30。</p>
    <pre><code>GET /api</code></pre>
    <p>所有查询参数均为可选。接口支持跨域请求；浏览器预检 <code>OPTIONS /api</code> 返回允许的跨域方法和请求头。</p>
    <p class="note">本服务只有一个一言接口，以下参数均用于 <code>/api</code>，不是分别独立的接口。</p>
  </section>
  <section>
    <h2>请求参数</h2>
    <div class="table-wrap"><table>
      <thead><tr><th>参数</th><th>说明</th><th>示例</th></tr></thead>
      <tbody>
        <tr><td><code>c</code></td><td>分类代码，取值 a–l。不传或为空时从所有分类中筛选；只读取第一个 <code>c</code>，不支持多分类同时筛选。未知分类通常返回 404。</td><td><code>c=a</code></td></tr>
        <tr><td><code>encode</code></td><td>返回格式：<code>json</code>（默认）、<code>text</code> 或 <code>js</code>。其他值按 JSON 返回，不应用 callback。</td><td><code>encode=text</code></td></tr>
        <tr><td><code>min_length</code></td><td>最小长度，包含边界；不传时不限制下限。建议使用正整数。</td><td><code>min_length=10</code></td></tr>
        <tr><td><code>max_length</code></td><td>最大长度，包含边界；默认 30。建议使用正整数，且不能小于最小长度。</td><td><code>max_length=20</code></td></tr>
        <tr><td><code>select</code></td><td>仅用于 <code>encode=js</code>，指定页面上的 CSS 选择器；默认 <code>.hitokoto</code>。目标元素必须存在。</td><td><code>select=%23hitokoto</code></td></tr>
        <tr><td><code>callback</code></td><td>非空时将 json、text 或 js 结果包装为 JavaScript 函数调用；json 的参数是 JSON 字符串，而非对象。</td><td><code>callback=show</code></td></tr>
      </tbody>
    </table></div>
    <p class="note">长度依据数据中的 <code>length</code> 字段。当前实现使用整数解析，可能截取数值前缀（例如 <code>12abc</code> 被解析为 12）；请始终传入纯正整数。相同参数重复出现时只读取第一个值。</p>
  </section>
  <section>
    <h2>分类</h2>
    <p>通过 <code>c</code> 参数指定一个分类；点击分类代码可直接试用。不传 <code>c</code> 时从全部分类中筛选。</p>
    <div class="table-wrap"><table>
      <thead><tr><th>代码</th><th>分类</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td><a href="/api?c=a" target="_blank" rel="noopener"><code>a</code></a></td><td>动画</td><td>动画类语录</td></tr>
        <tr><td><a href="/api?c=b" target="_blank" rel="noopener"><code>b</code></a></td><td>漫画</td><td>漫画类语录</td></tr>
        <tr><td><a href="/api?c=c" target="_blank" rel="noopener"><code>c</code></a></td><td>游戏</td><td>游戏类语录</td></tr>
        <tr><td><a href="/api?c=d" target="_blank" rel="noopener"><code>d</code></a></td><td>文学</td><td>主要收录现代文学，如小说、散文、戏剧</td></tr>
        <tr><td><a href="/api?c=e" target="_blank" rel="noopener"><code>e</code></a></td><td>原创</td><td>原创类语录</td></tr>
        <tr><td><a href="/api?c=f" target="_blank" rel="noopener"><code>f</code></a></td><td>网络</td><td>来自网络的语录</td></tr>
        <tr><td><a href="/api?c=g" target="_blank" rel="noopener"><code>g</code></a></td><td>其他</td><td>其他类语录</td></tr>
        <tr><td><a href="/api?c=h" target="_blank" rel="noopener"><code>h</code></a></td><td>影视</td><td>影视类语录</td></tr>
        <tr><td><a href="/api?c=i" target="_blank" rel="noopener"><code>i</code></a></td><td>诗词</td><td>主要收录中国古代文学，如诗、歌、词、赋、曲</td></tr>
        <tr><td><a href="/api?c=j" target="_blank" rel="noopener"><code>j</code></a></td><td>网易云</td><td>主要收录网易云音乐热评</td></tr>
        <tr><td><a href="/api?c=k" target="_blank" rel="noopener"><code>k</code></a></td><td>哲学</td><td>哲学类语录</td></tr>
        <tr><td><a href="/api?c=l" target="_blank" rel="noopener"><code>l</code></a></td><td>抖机灵</td><td>抖机灵类语录</td></tr>
      </tbody>
    </table></div>
    <p class="note">分类名称和范围参考句子库的 <code>categories.json</code>。</p>
  </section>
  <section>
    <h2>返回格式与字段</h2>
    <h3>JSON（默认）</h3>
    <p>成功时返回一个对象（字段值取决于语录数据，部分字段可能为 <code>null</code>）：</p>
    <div class="table-wrap"><table>
      <thead><tr><th>字段</th><th>说明</th></tr></thead><tbody>
        <tr><td><code>id</code></td><td>语录编号</td></tr>
        <tr><td><code>hitokoto</code></td><td>语录正文</td></tr>
        <tr><td><code>type</code></td><td>分类代码</td></tr>
        <tr><td><code>from</code></td><td>出处</td></tr>
        <tr><td><code>from_who</code></td><td>作者或来源人物，可能为 null</td></tr>
        <tr><td><code>length</code></td><td>数据记录的语录长度</td></tr>
        <tr><td><code>timestamp</code></td><td>响应生成时的 Unix 时间戳，单位毫秒</td></tr>
      </tbody></table></div>
    <h3>纯文本与 JavaScript</h3>
    <p><code>encode=text</code> 只返回语录正文。<code>encode=js</code> 返回一段脚本，执行时将正文写入 <code>select</code> 指定元素的 <code>innerText</code>。</p>
    <p>使用 <code>callback=show</code> 时，响应形如 <code>;show("内容");</code>；默认 JSON 格式传给回调的是序列化后的 JSON 字符串，需要自行解析。返回 JavaScript 的参数只应使用可信内容，不要拼入未经信任的输入。</p>
  </section>
  <section>
    <h2>状态码与错误</h2>
    <div class="table-wrap"><table><thead><tr><th>状态码</th><th>含义</th></tr></thead><tbody>
      <tr><td><code>200</code></td><td>请求成功；OPTIONS 预检也返回 200。</td></tr>
      <tr><td><code>400</code></td><td>长度参数解析后不是正整数，或最大长度小于最小长度。</td></tr>
      <tr><td><code>404</code></td><td>没有符合筛选条件的语录。</td></tr>
      <tr><td><code>500</code></td><td>服务处理请求时发生异常。</td></tr>
    </tbody></table></div>
    <p>错误以 JSON 返回，包含 <code>code</code>、<code>message</code> 和毫秒时间戳 <code>timestamp</code>，例如：</p>
    <pre><code>{"code":400,"message":"min_length 必须是正整数","timestamp":1730000000000}</code></pre>
  </section>
  <section>
    <h2>请求示例</h2>
    <div class="examples">
      <div>随机 JSON：<a href="/api" target="_blank" rel="noopener">/api</a></div>
      <div>动画分类：<a href="/api?c=a" target="_blank" rel="noopener">/api?c=a</a></div>
      <div>纯文本：<a href="/api?encode=text" target="_blank" rel="noopener">/api?encode=text</a></div>
      <div>长度筛选：<a href="/api?min_length=10&amp;max_length=20" target="_blank" rel="noopener">/api?min_length=10&amp;max_length=20</a></div>
      <div>生成页面脚本：<a href="/api?encode=js&amp;select=%23hitokoto" target="_blank" rel="noopener">/api?encode=js&amp;select=%23hitokoto</a></div>
      <div>文本回调：<a href="/api?encode=text&amp;callback=show" target="_blank" rel="noopener">/api?encode=text&amp;callback=show</a></div>
      <div>JSON 回调：<a href="/api?callback=show" target="_blank" rel="noopener">/api?callback=show</a></div>
    </div>
  </section>
</main>
<footer>
  <p class="note" style="overflow-wrap:anywhere">当前 API 版本：<span id="api-version">暂不可用</span> · 更新时间：<span id="api-updated">暂不可用</span><br>当前句子库版本：<span id="bundle-version">暂不可用</span> · 上游更新时间：<span id="bundle-updated">暂不可用</span></p>
  <p><a href="/stats">站点访问统计</a></p>
  <div class="footer-sources"><a href="https://github.com/hitokoto-osc/sentences-bundle" target="_blank" rel="noopener noreferrer">语录数据来自 sentences-bundle</a> · <a href="https://github.com/jiandan2020/hitokoto-edgeone" target="_blank" rel="noopener noreferrer">项目源码</a></div>
  <a class="icp-link" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"><img src="/icp-beian.png" alt="" width="16" height="16">赣ICP备2025074916号-1</a>
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
</script>
</body>
</html>`;

export default function onRequest() {
    return new Response(page, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
}
