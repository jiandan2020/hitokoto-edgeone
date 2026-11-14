# 项目记忆

- 目标：将 `jiandan2020/hitokoto-cloudflare` 部署到 EdgeOne Pages，使用 `edgeone-support` 分支从 GitHub 导入。
- 用户没有 KV 权限；无需依赖 KV 或 Blob。语录数据保存在仓库 `sentences/`。
- EdgeOne Pages 使用 `edge-functions/index.js` 对应 `/`，采用默认导出的 `onRequest(context)`，不能使用 `addEventListener`。此前根目录入口及 KV、Blob 指引未经验证，不应作为 Pages 部署依据。
- `npm run build` 根据 `functions/index.js` 和语录生成 `edge-functions/index.js`；同时提交生成文件以支持构建前扫描。根目录历史版本及其指南并非当前入口。
- 2026-11-14：提交 b74d183 的 EdgeOne 预览，OPTIONS、文本、JS 和 JSONP 返回 200；默认 JSON 和非法参数返回 545。共同差异指向 `Response.json()` 兼容性，但无运行栈，尚不能断定；改为 `new Response(JSON.stringify(...))`，待重新部署并线上验证。Node 环境禁用 `Response.json` 的本地测试通过。
- 已清理旧 KV、Blob、GitHub Raw 和旧根入口文件；保留构建、数据、许可证及原有数据清单。构建成功不等于运行成功。
