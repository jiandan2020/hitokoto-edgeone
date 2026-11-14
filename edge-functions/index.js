// 首页与 API 分开路由；使用当前域名的相对路径，预览和正式环境均可访问。
const page = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="一言 API 接口说明：随机获取一句话，支持分类和多种返回格式。">
  <title>一言 API · 接口说明</title>
  <style>
    :root{color-scheme:light;--ink:#172c2a;--muted:#5d706b;--line:#dce7e1;--green:#21624d;--paper:#f5f8f5}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.75}a{color:var(--green);text-underline-offset:3px}header,main,footer{max-width:960px;margin:auto;padding-left:24px;padding-right:24px}header{padding-top:64px;padding-bottom:38px}.eyebrow{font-size:13px;letter-spacing:.14em;font-weight:700;color:var(--green)}h1{font-size:clamp(36px,7vw,62px);line-height:1.15;letter-spacing:-.04em;margin:14px 0}header p{color:var(--muted);max-width:600px;margin:0 0 24px}.button{display:inline-block;background:var(--green);color:white;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:650}section{background:#fff;border:1px solid var(--line);border-radius:14px;padding:24px 28px;margin-bottom:18px}h2{font-size:20px;margin:0 0 14px}h3{font-size:15px;margin:20px 0 6px}p{margin:8px 0}code,pre{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.9em}code{background:#eef5ef;padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}pre{background:#f3f7f4;padding:16px;border-radius:8px;overflow:auto;line-height:1.65;margin:10px 0}pre code{background:none;padding:0;overflow-wrap:normal}table{border-collapse:collapse;width:100%;font-size:14px;text-align:left}th,td{padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--muted);font-weight:600}tr:last-child td{border-bottom:0}.table-wrap{overflow-x:auto}.note{color:var(--muted);font-size:14px}.examples{display:grid;gap:9px}.examples a{overflow-wrap:anywhere}footer{font-size:13px;color:var(--muted);padding-top:12px;padding-bottom:48px}@media(max-width:600px){header{padding-top:42px}section{padding:20px}th,td{min-width:110px}}
  </style>
</head>
<body>
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
    <p>a 动画 · b 漫画 · c 游戏 · d 文学 · e 原创 · f 来自网络 · g 其他 · h 影视 · i 诗词 · j 网易云 · k 哲学 · l 抖机灵</p>
  </section>
  <section>
    <h2>返回格式与字段</h2>
    <h3>JSON（默认）</h3>
    <p>成功时返回一个对象（字段值取决于语录数据，部分字段可能为 <code>null</code>）：</p>
    <div class="table-wrap"><table>
      <thead><tr><th>字段</th><th>说明</th></tr></thead><tbody>
        <tr><td><code>id</code></td><td>语录编号</td></tr>
        <tr><td><code>uuid</code></td><td>语录的 UUID</td></tr>
        <tr><td><code>hitokoto</code></td><td>语录正文</td></tr>
        <tr><td><code>type</code></td><td>分类代码</td></tr>
        <tr><td><code>from</code></td><td>出处</td></tr>
        <tr><td><code>from_who</code></td><td>作者或来源人物，可能为 null</td></tr>
        <tr><td><code>creator</code></td><td>提交者名称</td></tr>
        <tr><td><code>creator_uid</code></td><td>提交者用户编号</td></tr>
        <tr><td><code>reviewer</code></td><td>审核者编号</td></tr>
        <tr><td><code>commit_from</code></td><td>提交来源</td></tr>
        <tr><td><code>created_at</code></td><td>数据记录的创建时间</td></tr>
        <tr><td><code>length</code></td><td>数据记录的语录长度</td></tr>
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
<footer>语录数据来自 <a href="https://github.com/hitokoto-osc/sentences-bundle">sentences-bundle</a> · <a href="https://github.com/jiandan2020/hitokoto-cloudflare">项目源码</a></footer>
</body>
</html>`;

export default function onRequest() {
    return new Response(page, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
}
