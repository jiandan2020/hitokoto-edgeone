# 项目记忆

- 目标：将 `jiandan2020/hitokoto-edgeone` 部署到 EdgeOne Pages，只保留 `main` 分支。用户确认将现有 EdgeOne 内容合入 main、删除 edgeone-support 并重命名仓库。
- 用户没有 KV 权限；无需依赖 KV 或 Blob。语录数据保存在仓库 `sentences/`。
- EdgeOne Pages 使用默认导出处理函数，不支持 `addEventListener`。`edge-functions/index.js` 为 `/` 接口说明首页，`edge-functions/api.js` 为 `/api` 一言接口；根路径不再返回一言 JSON。
- `npm run build` 根据 `functions/index.js` 和语录生成 `edge-functions/api.js`；同时提交生成文件以支持构建前扫描。根目录历史版本及其指南并非当前入口。
- 2026-11-14：提交 b74d183 的预览中 OPTIONS、文本、JS 和 JSONP 返回 200，但 JSON 返回 545；改用 `new Response(JSON.stringify(...))` 后，用户确认可用，HTTP 域名根路径返回 JSON 200，非法参数返回 400。没有运行栈，无法确定 545 的底层原因。
- HTTPS 域名在本机 curl 证书验证失败（SEC_E_WRONG_PRINCIPAL）；绕过证书验证后返回 200。需在其他网络复核证书与域名绑定，不能将绕过验证视为 HTTPS 正常。
- 首页详列 `/api` 的六个查询参数、分类、响应字段和状态码；版本展示通过浏览器读取同源 `/version.json` 的 `bundle_version`，缺失或请求失败显示“暂不可用”，随句子库同步更新。浏览器禁用脚本时也显示占位。
- 自动同步上游 `hitokoto-osc/sentences-bundle` 的 `master`：默认分支 `main` 上的 GitHub Actions 每天 03:17 UTC 检出 `main` 与上游快照，运行 `sync-sentences.js` 校验、生成函数、有变化则推送 main。同步上游版本 1.0.1375，生成代码约 3.5 MB；自动提交是否触发 EdgeOne 部署需实际验证。Actions 写权限与 EdgeOne 自动部署为必要条件。
- EdgeOne 需核实部署分支改为 main，仓库重命名和删除旧分支可能影响现有 Git 集成。线上间歇 HTTP 545 尚无根因。
