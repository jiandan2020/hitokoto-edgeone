# 项目记忆

- 目标：将 `jiandan2020/hitokoto-cloudflare` 部署到 EdgeOne Pages，使用 `edgeone-support` 分支从 GitHub 导入。
- 用户没有 KV 权限；无需依赖 KV 或 Blob。语录数据保存在仓库 `sentences/`。
- EdgeOne Pages 使用 `edge-functions/index.js` 对应 `/`，采用默认导出的 `onRequest(context)`，不能使用 `addEventListener`。此前根目录入口及 KV、Blob 指引未经验证，不应作为 Pages 部署依据。
- `npm run build` 根据 `functions/index.js` 和语录生成 `edge-functions/index.js`；同时提交生成文件以支持构建前扫描。根目录历史版本及其指南并非当前入口。
- 本地已测试 JSON、分类、纯文本、长度筛选及非法参数；真实线上部署及平台运行尚待验证。构建成功不等于运行成功。
