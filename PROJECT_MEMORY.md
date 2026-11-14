# 项目记忆

- 目标：将 `jiandan2020/hitokoto-cloudflare` 部署到 EdgeOne Pages，使用 `edgeone-support` 分支从 GitHub 导入。
- 用户没有 KV 权限；无需依赖 KV 或 Blob。语录数据保存在仓库 `sentences/`。
- EdgeOne Pages 使用默认导出处理函数，不支持 `addEventListener`。`edge-functions/index.js` 为 `/` 接口说明首页，`edge-functions/api.js` 为 `/api` 一言接口；根路径不再返回一言 JSON。
- `npm run build` 根据 `functions/index.js` 和语录生成 `edge-functions/api.js`；同时提交生成文件以支持构建前扫描。根目录历史版本及其指南并非当前入口。
- 2026-11-14：提交 b74d183 的预览中 OPTIONS、文本、JS 和 JSONP 返回 200，但 JSON 返回 545；改用 `new Response(JSON.stringify(...))` 后，用户确认可用，HTTP 域名根路径返回 JSON 200，非法参数返回 400。没有运行栈，无法确定 545 的底层原因。
- HTTPS 域名在本机 curl 证书验证失败（SEC_E_WRONG_PRINCIPAL）；绕过证书验证后返回 200。需在其他网络复核证书与域名绑定，不能将绕过验证视为 HTTPS 正常。
- 已清理旧 KV、Blob、GitHub Raw 和旧根入口文件；保留构建、数据、许可证及原有数据清单。首页与 `/api` 迁移已做本地处理函数测试，线上需部署后验证。构建成功不等于运行成功。
