# 项目记忆

- 目标：将 `jiandan2020/hitokoto-edgeone` 部署到 EdgeOne Pages，只保留 `main` 分支。用户确认将现有 EdgeOne 内容合入 main、删除 edgeone-support 并重命名仓库。
- 用户没有 KV 权限；无需依赖 KV 或 Blob。语录数据保存在仓库 `sentences/`。
- EdgeOne Pages 使用默认导出处理函数，不支持 `addEventListener`。`edge-functions/index.js` 为 `/` 接口说明首页，`edge-functions/api.js` 为 `/api` 一言接口；根路径不再返回一言 JSON。
- `npm run build` 根据 `functions/index.js` 和语录生成长度索引及 `edge-functions/api.js`；函数按需读取本部署静态句子文件，支持 hitokoto.xzccs.top 和 *.edgeone.cool。自动同步时同时提交索引与句子数据。提交 ac791fe 增加实例内最多 3 个分类、5 分钟缓存，带预览凭据的请求不缓存；本地测试通过，线上当前部署提交未确认，速度收益及稳定性尚未证实。
- 2026-11-14：提交 b74d183 的预览中 OPTIONS、文本、JS 和 JSONP 返回 200，但 JSON 返回 545；改用 `new Response(JSON.stringify(...))` 后，用户确认可用，HTTP 域名根路径返回 JSON 200，非法参数返回 400。没有运行栈，无法确定 545 的底层原因。
- HTTPS 域名在本机 curl 证书验证失败（SEC_E_WRONG_PRINCIPAL）；绕过证书验证后返回 200。需在其他网络复核证书与域名绑定，不能将绕过验证视为 HTTPS 正常。
- 首页详列 `/api` 的六个查询参数、分类、响应字段和状态码；浏览器标签图标为根目录 `favicon.svg`。API 版本读取同源 `/package.json` 的 `version`；用户要求 API 代码变更时维护版本：兼容新功能升次版本，兼容修复和性能优化升修订号，不兼容变更升主版本，仅语录或页面文档更新不升 API 版本；同步维护 `package-lock.json`。本次将过去遗漏的 API 变更补记为 1.1.0。句子库版本来自 `/version.json` 的 `bundle_version`，互相独立。
- 自动同步上游 `hitokoto-osc/sentences-bundle` 的 `master`：默认分支 `main` 上的 GitHub Actions 每天 03:17 UTC 检出 `main` 与上游快照，运行 `sync-sentences.js` 校验、生成函数、有变化则推送 main。同步上游版本 1.0.1375，生成代码约 62 KB；自动提交是否触发 EdgeOne 部署需实际验证。Actions 写权限与 EdgeOne 自动部署为必要条件。
- EdgeOne 需核实部署分支改为 main，仓库重命名和删除旧分支可能影响现有 Git 集成。线上间歇 HTTP 545 尚无根因：轻量首页 10/10 成功，API 的 OPTIONS（无需筛选）10 次中 1 次 545，分类请求 10 次中 2 次 545；间隔 5 秒的请求也出现 545。用户观察首次访问更易失败，冷启动/资源限制只是待验证假设。新增轻量 `/health` 探针提交 3e62824：预览顺序测试轻量探针 20/20 成功，API OPTIONS 19/20 成功（1 次 545，X-NWS-LOG-UUID 3482145947686225559）。提交 c231703 的同一预览交错测试 `/health` 30/30、小数据 `/diagnostic-small` OPTIONS 30/30、`/api` OPTIONS 29/30（失败标识 7880605446472194772）。提交 9265dff 增加完整数据不筛选的 `/diagnostic-full` 后，EdgeOne 显示生产部署成功且有该路由，但部署地址的所有函数均返回 404、静态 version.json 正常。提交 2298559 移除该大探针后，预览中首页、health、api、version 均恢复 200，提示额外大函数与发布失败有关但未证实平台根因；后续 20 次交错对照 health 20/20、small 20/20、api OPTIONS 19/20，原 545 仍存在。此前用户反馈没有运行日志；尚未证明冷启动或大数据是根因。提交 c3271d3 改为长度索引加按需读取同部署静态数据，函数约 62 KB；预览交错测试 health、API OPTIONS、API GET 各 30 次均 200，全部 12 类及其他响应模式抽测通过，但不足以证明 545 已彻底解决。临时诊断接口已移除。
