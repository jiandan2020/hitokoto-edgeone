# 项目记忆

- 2026-11-14：语料与同步脚本只保留 `id`、`hitokoto`、`type`、`from`、`from_who`、`length`，保持顺序；成功 JSON 增加响应时生成的 Unix 毫秒 `timestamp`，文本和脚本格式不变。按用户要求移除 `uuid` 属于不兼容变更，API 版本升至 3.0.0；部署及自动同步仍需线上确认。下方旧版本描述为历史记录。

- 目标：将 `jiandan2020/hitokoto-edgeone` 部署到 EdgeOne Pages，只保留 `main` 分支。用户确认将现有 EdgeOne 内容合入 main、删除 edgeone-support 并重命名仓库。
- 用户没有 KV 权限；无需依赖 KV 或 Blob。语录数据保存在仓库 `sentences/`。
- EdgeOne Pages 使用默认导出处理函数，不支持 `addEventListener`。`edge-functions/index.js` 为 `/` 接口说明首页，`edge-functions/api.js` 为 `/api` 一言接口；根路径不再返回一言 JSON。
- 2026-11-14 用户要求索引独立：`npm run generate` 在 GitHub Actions 或本地生成仓库根目录 `sentence-index.json` 和 `edge-functions/api.js`，EdgeOne 的 `npm run build` 仅读取并校验仓库已有产物，不生成文件；运行时按部署域名读取索引并校验内嵌版本，再读取句子。索引缓存 1 小时，句子实例内按需缓存最多 12 个分类、1 小时，按用户要求带预览凭据的请求也使用实例共享缓存，缓存未命中时转发凭据；命中时不再检查静态资源授权，入口授权是否充分尚未核实；自动同步同时提交索引与语料。新增一次冷加载请求，线上部署与性能尚未验证，索引版本校验不保证句子资源字节一致。
- 2026-11-14：提交 b74d183 的预览中 OPTIONS、文本、JS 和 JSONP 返回 200，但 JSON 返回 545；改用 `new Response(JSON.stringify(...))` 后，用户确认可用，HTTP 域名根路径返回 JSON 200，非法参数返回 400。没有运行栈，无法确定 545 的底层原因。
- HTTPS 域名在本机 curl 证书验证失败（SEC_E_WRONG_PRINCIPAL）；绕过证书验证后返回 200。需在其他网络复核证书与域名绑定，不能将绕过验证视为 HTTPS 正常。
- 首页详列 `/api` 的六个查询参数、分类、响应字段和状态码；浏览器标签图标为根目录 `favicon.svg`。API 版本读取同源 `/package.json` 的 `version`；用户要求 API 代码变更时维护版本：兼容新功能升次版本，兼容修复和性能优化升修订号，不兼容变更升主版本，仅语录或页面文档更新不升 API 版本；同步维护 `package-lock.json`。预览请求使用共享缓存后 API 版本为 1.1.3；线上内存占用及稳定性尚未验证。句子库版本来自 `/version.json` 的 `bundle_version`，互相独立。
- 自动同步上游 `hitokoto-osc/sentences-bundle` 的 `master`：默认分支 `main` 上的 GitHub Actions 每天 03:17 UTC 检出 `main` 与上游快照，运行 `sync-sentences.js` 校验、生成函数、有变化则推送 main。同步上游版本 1.0.1375；自动提交是否触发 EdgeOne 部署需实际验证。Actions 写权限与 EdgeOne 自动部署为必要条件。
- EdgeOne 需核实部署分支改为 main，仓库重命名和删除旧分支可能影响现有 Git 集成。线上间歇 HTTP 545 尚无根因：轻量首页 10/10 成功，API 的 OPTIONS（无需筛选）10 次中 1 次 545，分类请求 10 次中 2 次 545；间隔 5 秒的请求也出现 545。用户观察首次访问更易失败，冷启动/资源限制只是待验证假设。新增轻量 `/health` 探针提交 3e62824：预览顺序测试轻量探针 20/20 成功，API OPTIONS 19/20 成功（1 次 545，X-NWS-LOG-UUID 3482145947686225559）。提交 c231703 的同一预览交错测试 `/health` 30/30、小数据 `/diagnostic-small` OPTIONS 30/30、`/api` OPTIONS 29/30（失败标识 7880605446472194772）。提交 9265dff 增加完整数据不筛选的 `/diagnostic-full` 后，EdgeOne 显示生产部署成功且有该路由，但部署地址的所有函数均返回 404、静态 version.json 正常。提交 2298559 移除该大探针后，预览中首页、health、api、version 均恢复 200，提示额外大函数与发布失败有关但未证实平台根因；后续 20 次交错对照 health 20/20、small 20/20、api OPTIONS 19/20，原 545 仍存在。此前用户反馈没有运行日志；尚未证明冷启动或大数据是根因。提交 c3271d3 改为长度索引加按需读取同部署静态数据，函数约 62 KB；预览交错测试 health、API OPTIONS、API GET 各 30 次均 200，全部 12 类及其他响应模式抽测通过，但不足以证明 545 已彻底解决。临时诊断接口已移除。
