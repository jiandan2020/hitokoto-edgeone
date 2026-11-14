# 项目记忆

- 用户保留 EdgeOne 自动部署，句子库同步工作流改为仅手动运行；统计采集每天从 main 获取脚本、将 `daily-stats.json` 提交至独立 `stats-data` 分支，浏览器从该分支 GitHub Raw 读取。生产部署需只跟踪 main，其他分支预览触发需在控制台确认；此变更本身需先部署。统计分支与 GitHub Actions 线上运行待验证，GitHub Raw 可用性及缓存影响访问。

- `/stats` 最近 24 个完整小时的域名请求量折线图复用 EdgeOne 请求数小时明细；北京时间，缺失小时显示断点，不记为零；增加图表悬浮及触屏详情提示，已进行模拟事件测试，线上交互与部署待验证。

- `/stats` 请求数详细数据另显示最近 24 个完整小时内路径精确等于 `/api` 的域名请求数；EdgeOne `url` 筛选不含查询参数。子查询失败或数据缺失时显示暂无数据，不影响其他指标；本地真实查询成功，线上待验证。

- GitHub Actions 按北京时间自然日采集域名请求数到公开 `stats-data/daily-stats.json`，从 2026-11-15 起累计，页面显示缺失天数和最近 30 日趋势；不含当天、不将缺失视为零。需要 GitHub Actions secrets `TENCENT_SECRET_ID`、`TENCENT_SECRET_KEY`（与 Pages 环境变量独立）和仓库写权限；定时任务仍需线上确认。采集最近 29 天内缺失日，超过范围不自动恢复，API 保留期未确认。

- 2026-11-14：新增公开 `/stats` 和 `/stats-data`，展示固定域名 `hitokoto.xzccs.top` 最近 24 个完整小时的域名级请求数、响应流量、5xx 错误率；调用腾讯云 EdgeOne DescribeTimingL7AnalysisData，站点 ID `zone-3ry57u0agvak`，数据约延迟 10 分钟，函数实例缓存 10 分钟且非全局限流。5xx 无记录为未知，不当作零。`TENCENT_SECRET_ID`、`TENCENT_SECRET_KEY` 由 Pages 项目运行时环境变量提供，不入仓库，修改后需新部署。本机使用用户 CSV 中的子用户凭证进行本地真实调用成功，线上运行时与环境变量尚未验证。

- 首页页脚显示 API 版本及其更新时间（`package.json` 的 `apiUpdatedAt`，发布新 API 版本时维护）、句子库版本及上游更新时间（`version.json` 的 `updated_at`），统一按北京时间显示；上游更新时间不等于本项目同步或部署时间。

- 2026-11-14：语料与同步脚本只保留 `id`、`hitokoto`、`type`、`from`、`from_who`、`length`，保持顺序；成功 JSON 增加响应时生成的 Unix 毫秒 `timestamp`，文本和脚本格式不变。按用户要求移除 `uuid` 属于不兼容变更，API 版本升至 3.0.0；部署及自动同步仍需线上确认。下方旧版本描述为历史记录。

- 目标：将 `jiandan2020/hitokoto-edgeone` 部署到 EdgeOne Pages；`main` 为生产部署分支，`stats-data` 为统计数据分支。旧 `edgeone-support` 已合入并删除。
- 用户没有 KV 权限；无需依赖 KV 或 Blob。语录数据保存在仓库 `sentences/`。
- EdgeOne Pages 使用默认导出处理函数，不支持 `addEventListener`。`edge-functions/index.js` 为 `/` 接口说明首页，`edge-functions/api.js` 为 `/api` 一言接口；根路径不再返回一言 JSON。
- 2026-11-14 用户要求索引独立：`npm run generate` 在 GitHub Actions 或本地生成仓库根目录 `sentence-index.json` 和 `edge-functions/api.js`，EdgeOne 的 `npm run build` 仅读取并校验仓库已有产物，不生成文件；运行时按部署域名读取索引并校验内嵌版本，再读取句子。索引缓存 1 小时，句子实例内按需缓存最多 12 个分类、1 小时，按用户要求带预览凭据的请求也使用实例共享缓存，缓存未命中时转发凭据；命中时不再检查静态资源授权，入口授权是否充分尚未核实；自动同步同时提交索引与语料。新增一次冷加载请求，线上部署与性能尚未验证，索引版本校验不保证句子资源字节一致。
- 2026-11-14：提交 b74d183 的预览中 OPTIONS、文本、JS 和 JSONP 返回 200，但 JSON 返回 545；改用 `new Response(JSON.stringify(...))` 后，用户确认可用，HTTP 域名根路径返回 JSON 200，非法参数返回 400。没有运行栈，无法确定 545 的底层原因。
- HTTPS 域名在本机 curl 证书验证失败（SEC_E_WRONG_PRINCIPAL）；绕过证书验证后返回 200。需在其他网络复核证书与域名绑定，不能将绕过验证视为 HTTPS 正常。
- 首页详列 `/api` 的六个查询参数、分类、响应字段和状态码；浏览器标签图标为根目录 `favicon.svg`。API 版本读取同源 `/package.json` 的 `version`；用户要求 API 代码变更时维护版本：兼容新功能升次版本，兼容修复和性能优化升修订号，不兼容变更升主版本，仅语录或页面文档更新不升 API 版本；同步维护 `package-lock.json`。预览请求使用共享缓存后 API 版本为 1.1.3；线上内存占用及稳定性尚未验证。句子库版本来自 `/version.json` 的 `bundle_version`，互相独立。
- 自动同步上游 `hitokoto-osc/sentences-bundle` 的 `master`：默认分支 `main` 上的 GitHub Actions 每天 03:17 UTC 检出 `main` 与上游快照，运行 `sync-sentences.js` 校验、生成函数、有变化则推送 main。同步上游版本 1.0.1375；自动提交是否触发 EdgeOne 部署需实际验证。Actions 写权限与 EdgeOne 自动部署为必要条件。
- EdgeOne 需核实部署分支改为 main，仓库重命名和删除旧分支可能影响现有 Git 集成。线上间歇 HTTP 545 尚无根因：轻量首页 10/10 成功，API 的 OPTIONS（无需筛选）10 次中 1 次 545，分类请求 10 次中 2 次 545；间隔 5 秒的请求也出现 545。用户观察首次访问更易失败，冷启动/资源限制只是待验证假设。新增轻量 `/health` 探针提交 3e62824：预览顺序测试轻量探针 20/20 成功，API OPTIONS 19/20 成功（1 次 545，X-NWS-LOG-UUID 3482145947686225559）。提交 c231703 的同一预览交错测试 `/health` 30/30、小数据 `/diagnostic-small` OPTIONS 30/30、`/api` OPTIONS 29/30（失败标识 7880605446472194772）。提交 9265dff 增加完整数据不筛选的 `/diagnostic-full` 后，EdgeOne 显示生产部署成功且有该路由，但部署地址的所有函数均返回 404、静态 version.json 正常。提交 2298559 移除该大探针后，预览中首页、health、api、version 均恢复 200，提示额外大函数与发布失败有关但未证实平台根因；后续 20 次交错对照 health 20/20、small 20/20、api OPTIONS 19/20，原 545 仍存在。此前用户反馈没有运行日志；尚未证明冷启动或大数据是根因。提交 c3271d3 改为长度索引加按需读取同部署静态数据，函数约 62 KB；预览交错测试 health、API OPTIONS、API GET 各 30 次均 200，全部 12 类及其他响应模式抽测通过，但不足以证明 545 已彻底解决。临时诊断接口已移除。
