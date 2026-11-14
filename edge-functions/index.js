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
    <p>响应包含 <code>hitokoto</code>（内容）、<code>type</code>（分类）、<code>from</code>（出处）、<code>from_who</code>（作者）等字段。</p>
  </section>
  <section>
    <h2>请求参数</h2>
    <div class="table-wrap"><table>
      <thead><tr><th>参数</th><th>说明</th><th>示例</th></tr></thead>
      <tbody>
        <tr><td><code>c</code></td><td>选择一个分类，取值为 a–l；不传则从全部分类筛选。</td><td><code>c=a</code></td></tr>
        <tr><td><code>encode</code></td><td>返回格式：<code>json</code>（默认）、<code>text</code> 或 <code>js</code>。</td><td><code>encode=text</code></td></tr>
        <tr><td><code>min_length</code></td><td>最小长度，包含边界；传入时须为正整数。</td><td><code>min_length=10</code></td></tr>
        <tr><td><code>max_length</code></td><td>最大长度，包含边界；默认为 30，传入时须为正整数。</td><td><code>max_length=20</code></td></tr>
        <tr><td><code>select</code></td><td>配合 <code>encode=js</code> 使用的 CSS 选择器；默认为 <code>.hitokoto</code>。</td><td><code>select=%23hitokoto</code></td></tr>
        <tr><td><code>callback</code></td><td>将结果包装为 JavaScript 回调；JSON 结果作为字符串传入。</td><td><code>callback=show</code></td></tr>
      </tbody>
    </table></div>
    <p class="note">长度以语录数据中的 length 字段为准。参数无效返回 400；没有符合条件的语录返回 404。</p>
  </section>
  <section>
    <h2>分类</h2>
    <p>a 动画 · b 漫画 · c 游戏 · d 文学 · e 原创 · f 来自网络 · g 其他 · h 影视 · i 诗词 · j 网易云 · k 哲学 · l 抖机灵</p>
  </section>
  <section>
    <h2>请求示例</h2>
    <div class="examples">
      <div>随机 JSON：<a href="/api" target="_blank" rel="noopener">/api</a></div>
      <div>动画分类：<a href="/api?c=a" target="_blank" rel="noopener">/api?c=a</a></div>
      <div>纯文本：<a href="/api?encode=text" target="_blank" rel="noopener">/api?encode=text</a></div>
      <div>长度筛选：<a href="/api?min_length=10&amp;max_length=20" target="_blank" rel="noopener">/api?min_length=10&amp;max_length=20</a></div>
    </div>
  </section>
</main>
<footer>语录数据来自 <a href="https://github.com/hitokoto-osc/sentences-bundle">sentences-bundle</a> · <a href="https://github.com/jiandan2020/hitokoto-cloudflare">项目源码</a></footer>
</body>
</html>`;

export default function onRequest() {
    return new Response(page, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
}
