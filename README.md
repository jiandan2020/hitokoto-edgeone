# Hitokoto — EdgeOne Pages

一言 API。语录保存在仓库的 `sentences/`，边缘函数运行时读取同一部署的静态句子文件，不需要 KV、Blob 或 GitHub Raw 请求。

## 部署

在 EdgeOne Pages 从 GitHub 导入此仓库的 `main` 分支：

- 构建命令：`npm run build`（只校验仓库已有的部署文件，不生成索引）
- 首页说明：`edge-functions/index.js`，路由为 `/`；一言接口：`edge-functions/api.js`，路由为 `/api`（由 Pages 自动识别）
- 一言 API 不需要环境变量或存储服务；可选的站点统计页面需要单独配置环境变量，见下文。

`npm run generate` 在本地或 GitHub Actions 中从 `sentences/` 生成独立的 `sentence-index.json`，并根据 `functions/index.js` 生成 `edge-functions/api.js`。两者均保存在仓库；更改语录或原始函数后应在提交前运行 `npm run generate` 并提交生成文件。EdgeOne 的 `npm run build` 只校验已提交的索引、语料和函数是否一致，不生成文件；校验失败时部署会停止。运行时读取同一部署的索引并核对版本，再按选中的分类读取静态句子文件；索引缓存 1 小时，句子实例内按需缓存最多 12 个分类、保留 1 小时，预览授权请求也使用实例共享缓存，缓存未命中时会转发预览凭据；缓存命中时不再检查静态资源授权，因此不要依赖静态资源授权限制 API 访问。函数需要能访问部署域名的静态资源；支持 `hitokoto.xzccs.top` 和 EdgeOne 的 `*.edgeone.cool` 域名。

如果项目此前在控制台手动设置了边缘函数或路由，请检查是否与本项目的 `/` 路由冲突，并确认部署的是最新提交。构建成功并不等同于运行验证成功。

## 使用

- `/`：接口说明首页
- `/api`：随机一言，JSON 格式（原根路径接口已迁移）
- `/api?c=a`：按分类获取（a–l）
- `/api?encode=text`：纯文本
- `/api?min_length=10&max_length=20`：筛选长度

`GET /api` 的全部查询参数：`c`（单个分类 a–l）、`encode`（json、text、js）、`min_length`、`max_length`、`select`（用于 js）、`callback`。完整参数、字段、状态码和示例见部署后的首页。默认 `max_length=30`；长度按数据的 `length` 字段筛选。`callback` 在 JSON 格式下接收的是字符串而非对象。实现沿用原项目行为，不保证与 [一言开发者中心](https://developer.hitokoto.cn/sentence/) 的全部功能一致。

## 版本维护

首页 API 版本取自 `package.json` 的 `version`，表示本项目的版本，不是上游接口版本。发布包含 API 实现变更的版本时同步更新 `package.json` 和 `package-lock.json`：不兼容变更递增主版本，兼容的新功能递增次版本，兼容的修复或性能优化递增修订版本。仅更新句子数据、文档或首页样式不递增 API 版本；句子库有自己的版本号。发布 API 新版本时同时更新 `package.json` 的 `apiUpdatedAt`（带时区的发布时间）；首页句子库上游更新时间来自 `version.json` 的 `updated_at`，并非本项目的同步或部署时间。

## 站点统计

`/stats` 展示固定域名 `hitokoto.xzccs.top` 最近 24 个完整小时的请求数、EdgeOne 响应流量和 5xx 错误率，并单独展示路径精确等于 `/api` 的请求数（不包含查询参数）；数据包含首页和静态资源，默认不包含 Web 防护缓释请求。时间窗口结束于至少 10 分钟以前，统计接口的数据也可能延迟。统计接口公开，无身份验证；所有访问者可查看汇总数据。实例内缓存 10 分钟并合并并发请求，不是全局限流，不同实例的冷启动仍会调用腾讯云 API。

在 EdgeOne Pages 项目的 Project Settings → Environment Management 中为对应环境设置 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY`，然后重新部署；变更只作用于新部署。使用具备站点 `zone-3ry57u0agvak` 的 `teo:DescribeTimingL7AnalysisData` 必要权限的子用户，避免管理员密钥；具体资源级授权能力以腾讯云 CAM 实际支持为准。不要将真实密钥提交仓库、写入客户端或日志，保护项目管理权限与旧部署。未配置、鉴权失败或查询失败时显示暂不可用；5xx 查询无记录时显示暂无数据，不直接假定为零。官方配置参考：https://pages.edgeone.ai/document/build-guide

### 每日累计和趋势

GitHub Actions 每天北京时间 02:17 采集前一天完整的 24 个小时，保存到公开仓库 `stats-data` 分支的 `daily-stats.json`；统计页通过 jsDelivr CDN 读取该分支的文件，展示自 **2026-11-15** 起的已采集累计值及最近 30 天柱状图，更新不依赖 EdgeOne 重新部署。缺失天数明确标注，不当成零，也不含当天。此时间不是网站成立时间，不能称为历史总量。该文件及其 Git 历史公开，默认口径是 EdgeOne 防护后的整个域名请求。访客浏览器必须能访问 jsDelivr。采集工作流每次运行后请求刷新 CDN 缓存，刷新可能失败或有传播延迟；失败时查看 Actions 日志并重新运行。网络不可用时页面显示暂不可用，不回退到旧部署数据。

在 GitHub 仓库 **Settings → Secrets and variables → Actions → Repository secrets** 单独添加 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY`（Pages 的环境变量不会同步到 GitHub），并确保工作流有 `contents: write` 权限；可在 Actions →「采集域名每日请求数」手动运行。任务按日期幂等保存，失败后再次运行会补采仍处于保守 29 天范围内的缺失日期；API 实际数据保留时长未确认，超期或无数据不会视为零，需检查 Actions 日志。采集成功后只推送 `stats-data` 分支，不推送 `main`；确保 EdgeOne 生产部署跟踪 `main`，并检查其他分支的预览部署设置，否则统计分支推送仍可能触发预览构建。首次使用须先部署读取 `stats-data` 分支的页面。

## 句子库手动同步

在 GitHub Actions 的“同步一言句子库”中手动运行，从 [sentences-bundle](https://github.com/hitokoto-osc/sentences-bundle) 的 `master` 检查最新语料；不再定时执行。工作流从同一上游提交读取语录及清单，验证分类和基本字段后重新生成索引与 API，并与语料一起提交；仅在文件变化时提交到 `main`。分类变化或验证失败时停止，不会提交不完整数据。

工作流定义位于仓库默认分支 `main`，需要允许 Actions 对该分支写入；手动同步有变化时推送 `main`，EdgeOne 是否自动上线取决于部署集成，需查看部署记录验证。统计采集是独立的定时任务，GitHub 定时任务可能延迟，仓库长期不活跃时也可能暂停。

## 数据与许可

语录数据基于 [hitokoto-osc/sentences-bundle](https://github.com/hitokoto-osc/sentences-bundle)，详见该项目的著作权声明。程序遵循 [AGPL-3.0](LICENSE)；修改后对外提供服务时，请遵守相应的源码提供义务。
