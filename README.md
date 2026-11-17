# Hitokoto — EdgeOne Pages

一言 API。语录保存在仓库的 `sentences/`，边缘函数运行时读取同一部署的静态句子文件；可选的 EdgeOne KV 只做跨实例共享缓存，未绑定时退回静态文件，不需要 Blob 或 GitHub Raw 请求。KV 设置见 `docs/kv-setup.md`。

## 部署

在 EdgeOne Pages 从 GitHub 导入此仓库的 `main` 分支：

- 构建命令：`npm run build`（只校验仓库已有的部署文件，不生成索引）
- 首页：`edge-functions/index.js`，路由为 `/`；接口文档：`edge-functions/docs.js`，路由为 `/docs`；一言接口：`edge-functions/api.js`，路由为 `/api`（由 Pages 自动识别）
- 一言 API 不需要环境变量或存储服务；可选的站点统计页面需要单独配置环境变量，见下文。想用 KV 做跨实例共享缓存时，在控制台开通 KV、创建命名空间并绑定到项目，变量名必须为 `hitokoto_kv`，部署后跑 `node scripts/warm-kv.mjs` 预热；不绑定也能正常运行，见 `docs/kv-setup.md`。

`npm run generate` 在本地或 GitHub Actions 中从 `sentences/` 生成独立的 `sentence-index.json`，并根据 `functions/index.js` 生成 `edge-functions/api.js`。两者均保存在仓库；更改语录或原始函数后应在提交前运行 `npm run generate` 并提交生成文件。EdgeOne 的 `npm run build` 只校验已提交的索引、语料和函数是否一致，不生成文件；校验失败时部署会停止。运行时先读实例内缓存，再读 KV（若已绑定），最后读同一部署的静态文件并核对版本；索引和句子按语料版本分键写进 KV，缓存未命中时会转发预览凭据；缓存命中时不再检查静态资源授权，因此不要依赖静态资源授权限制 API 访问。函数需要能访问部署域名的静态资源；支持 `hitokoto.xzccs.top` 和 EdgeOne 的 `*.edgeone.cool` 域名。

如果项目此前在控制台手动设置了边缘函数或路由，请检查是否与本项目的 `/` 路由冲突，并确认部署的是最新提交。构建成功并不等同于运行验证成功。

## 使用

- `/`：首页（随机一言 + 入口）
- `/docs`：接口文档（请求参数、返回字段、状态码与示例）
- `/stats`：运行状况（健康横幅、KV 状态、24 小时与每日访问统计）
- `/status`：运行状态探针数据，只返回 JSON（绑定、写读、索引与分类缓存）；可视化的运行状况见 `/stats`
- `/stats-daily`：每日汇总数据（KV 缓存，供统计页使用）
- `/api`：随机一言，JSON 格式（原根路径接口已迁移）
- `/api?c=a`：按分类获取（a–l）
- `/api?mode=category`：先随机分类、再随机句子，小分类和大分类机会均等（默认 `mode=weighted` 为全库等概率）
- `/api?encode=text`：纯文本
- `/api?min_length=10&max_length=20`：筛选长度

`GET /api` 的全部查询参数：`c`（单个分类 a–l）、`mode`（weighted、category、balanced）、`encode`（json、text、js）、`min_length`、`max_length`、`select`（用于 js）、`callback`。完整参数、字段、状态码和示例见 `/docs` 接口文档。不传 `max_length` 时不限制最大长度，传入时包含边界；长度按数据的 `length` 字段筛选。`callback` 在 JSON 格式下接收的是字符串而非对象。实现沿用原项目行为。

## 优化记录（4.9.1）

- 全站样式改成 Material Design 3（Material 3 Expressive）：首页、接口文档、运行状况三页统一换成 Material 色板（玫瑰红主色）、Roboto Flex 字体、圆角卡片、填充/描边按钮与筛选芯片；去掉原来的宋体、暖底渐变、渐变标题、✦ 小标题与漂浮气泡；图表与峰值配色同步改成主色与琥珀色。接口与数据不变。

## 优化记录（4.9.0）

- 新增 `/docs` 接口文档页：内容以本项目 `/api` 的实际实现为准（请求地址、7 个参数、12 个分类、返回编码、7 个返回字段、状态码与错误、真实返回示例、注意事项）；首页不再写用法说明，只留随机一言区、试试接口与查看接口文档入口。

## 优化记录（4.8.0）

- 随机一言从 `/stats` 运行状况页移到首页：首页顶部新增随机一言区（12 个分类筛选、换一句、显示往返耗时），同源请求 /api；`/stats` 的“接口往返”卡改由运行状态探针的往返耗时提供。

## 优化记录（4.7.2）

- `/stats` 运行状况页去掉 KV 状态里的“写入读取”卡片（原来固定显示只读模式），现在只剩五张状态卡；页面的完整写读检测入口仍指向 `/status?probe=write`。

## 优化记录（4.7.1）

- `/status` 默认只读：不再每次打开都写一次 KV 探针键，任意访客、爬虫都不会再触发 KV 写入；完整写读探针改成加 `?probe=write` 才触发，`?probe=read` 与默认相同（只读），未知 `probe` 值也按只读处理。JSON 字段不变，只读时 `writeRead` 为 `skipped`；`/stats` 的只读探针与健康判定不受影响。

## 优化记录（4.7.0）

- `/stats` 运行状况页重新设计为一览式仪表盘：顶部状态总览卡（健康状态、版本、检查时间、刷新按钮与更新时间）；四张关键数字卡（昨日请求、24 小时请求、5xx 错误率及约多少次、接口往返）；KV 状态由表格改为六张状态卡（绑定、索引、分类、统计缓存、每日汇总缓存、写入读取只读模式）；每小时趋势折线下加渐变面积填充，流量与 /api 小计（流量、/api 请求数、占比、小时均值）收进趋势区小卡片，单独的 /api 表格并入其中；每日趋势最高单日的柱顶标出数值。数据与接口不变，仍是同源只读探针，不写 KV。

## 优化记录（4.6.0）

- `/stats` 改为运行状况页：标题与眉题改为运行状况，健康横幅、KV 清单、一言、24 小时与每日统计全部保留；首页页脚链接同步改名。
- `/status` 只返回 JSON 探针数据，不再渲染 HTML 页面；可视化的运行状况见 `/stats`。JSON 字段与探针行为不变，`?probe=read` 只读、`?format=json` 仍可加。

## 优化记录（4.5.1）

- /stats 样式与首页统一：暖底渐变、玫瑰红强调、渐变标题、✦ 小标题、半透明白卡片、漂浮气泡；布局和内容不变（健康横幅、KV 清单、一言、24 小时与每日统计）。
- /status 页最上方新增随机一言区：12 个分类筛选、换一句、显示往返耗时，同源请求 /api；KV 探针表移至其下方。

## 优化记录（4.5.0）

- 统计页改成监控面板：浅绿底、白卡片、翡翠绿强调、金色峰值；顶部健康横幅（运行状态、API 版本）与 KV 状态清单（绑定、索引、12 个分类、统计与每日汇总缓存），状态用只读探针每分钟刷新；新增随机一言区（12 个分类筛选、换一句、显示往返耗时）；每小时折线图峰值点标金色，每日柱状图最高单日标金色；保留每小时均值、近 7 日合计/日均、骨架屏与 10 分钟自动刷新。数据全部同源直取（/status、/stats-data、/stats-daily、/api），不再经过服务端中转。
- 安全取舍：面板的“检查记录”和“全面检查”没有搬过来——检查记录依赖空间的快照库，网站没有这套存储；全面检查会写 KV 探针键，放在公开页上等于让任意访客都能写 KV，所以公开页只读，完整写读检测请去 /status。

## 优化记录（4.4.0）

- 每日汇总进 KV：新增 `/stats-daily`，把 GitHub Actions 每天采集的 `daily-stats.json` 也放进 KV（键 `daily_stats_cache`，1 小时过期），三层缓存：实例内缓存 → KV → jsDelivr（`stats-data` 分支仍是数据源，采集流程不变）。统计页改为请求同源 `/stats-daily`，访客浏览器不再直接访问 jsDelivr；数据每天只更新一次，过期后重新拉取。`/status` 探针新增每日汇总缓存检查，预热脚本也多请求一次 `/stats-daily`。
- 统计页显示优化：样式与首页统一（渐变背景、衬线标题、圆角卡片）；新增 /api 请求占比卡片、每小时均值与峰值小时、近 7 日合计、已采集日均、最高单日；每日柱状图最高单日用金色标出；加载时数字位显示骨架动画；新增手动刷新按钮，每 10 分钟自动刷新并显示更新时间；刷新时图表会清空重绘，不再叠加。

## 优化记录（4.3.0）

- 运行状态探针：新增 `/status`，公开显示 KV 是否真正生效——是否绑定、写读是否通（往 KV 写一个很小的探针键 `status_probe` 再读回比对并计时）、索引和 12 个分类是否已在 KV 里、统计缓存是否在 KV 里。加 `?format=json` 返回 JSON，加 `?probe=read` 只读不写（适合监控定时拉取）。首页页脚加了运行状态链接。

## 优化记录（4.2.0）

- KV 缓存：索引和句子改为三层缓存——实例内 Map（L1）→ EdgeOne KV（L2，跨实例共享）→ 同源静态文件（L3，数据源）。KV 未绑定、读写失败时自动退回静态文件；索引和句子按语料版本分键（`sentence_index_<版本>`、`sentences_<分类>_<版本>`），不怕 KV 最长 60 秒的最终一致性读到旧数据；并发请求用单飞合并，避免冷启动重复取数。部署后跑 `node scripts/warm-kv.mjs` 预热，设置见 `docs/kv-setup.md`。
- 抽取模式：新增 `mode=category`（别名 `balanced`），先在符合条件的分类中等概率抽一个分类，再在分类内等概率抽一句；默认 `mode=weighted` 仍是全库等概率。非法 `mode` 返回 400；只指定一个分类时两种模式结果相同。
- 统计缓存：统计接口的 10 分钟缓存也放进 KV（键 `stats_data_cache`，值里带 `expires`），跨实例共享，腾讯云 API 调用不再随实例数放大；KV 未绑定时退回原有实例内缓存。

## 优化记录（4.1.0）

- 安全：`callback` 只接受合法 JS 函数名，`select` 只接受简单选择器，JS/JSONP 输出改用 `JSON.stringify` 转义，修复了此前可注入任意 JS 的问题。
- 参数：`min_length` / `max_length` 只接受纯正整数，`12abc` 等不再被截取解析，改为 400。
- 正确性：非 GET/OPTIONS 请求返回 405，不支持的域名返回 403（此前为 500）；删掉未使用的句子导入和 `sentencesMap`；索引缓存不再整表清空。
- 性能：`/api` 响应显式 `Cache-Control: no-store`，避免缓存随机结果；`_headers` 给 `sentences/*.json` 加 `immutable`、给 `sentence-index.json` 加 1 小时缓存；删除了实测无效的 `_redirects`（`/sentences/*.json` 本就直接返回 200）。
- 工程：新增 `npm run lint` 和 `npm test`，修复全部 ESLint 报错，新增 `test/api.test.mjs` 单元测试。

## 版本维护

首页 API 版本取自 `package.json` 的 `version`，表示本项目的版本，不是上游接口版本。发布包含 API 实现变更的版本时同步更新 `package.json` 和 `package-lock.json`：不兼容变更递增主版本，兼容的新功能递增次版本，兼容的修复或性能优化递增修订版本。仅更新句子数据、文档或首页样式不递增 API 版本；句子库有自己的版本号。发布 API 新版本时同时更新 `package.json` 的 `apiUpdatedAt`（带时区的发布时间）；首页句子库上游更新时间来自 `version.json` 的 `updated_at`，并非本项目的同步或部署时间。

## 运行状况

`/stats` 是运行状况页，展示固定域名 `hitokoto.xzccs.top` 最近 24 个完整小时的请求数、EdgeOne 响应流量和 5xx 错误率，并单独展示路径精确等于 `/api` 的请求数（不包含查询参数）；数据包含首页和静态资源，默认不包含 Web 防护缓释请求。时间窗口结束于至少 10 分钟以前，统计接口的数据也可能延迟。统计接口公开，无身份验证；所有访问者可查看汇总数据。缓存 10 分钟并合并并发请求：先读实例内缓存，再读 KV（键 `stats_data_cache`，跨实例共享），未命中才调用腾讯云 API；KV 未绑定时退回实例内缓存。页面顶部是状态总览卡与四张关键数字卡（昨日请求、24 小时请求、5xx 错误率、接口往返），再是 KV 状态卡片、每小时趋势与每日统计；公开页上没有写 KV 的按钮，完整写读检测见 `/status?probe=write`（只返回 JSON）。

在 EdgeOne Pages 项目的 Project Settings → Environment Management 中为对应环境设置 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY`，然后重新部署；变更只作用于新部署。使用具备站点 `zone-3ry57u0agvak` 的 `teo:DescribeTimingL7AnalysisData` 必要权限的子用户，避免管理员密钥；具体资源级授权能力以腾讯云 CAM 实际支持为准。不要将真实密钥提交仓库、写入客户端或日志，保护项目管理权限与旧部署。未配置、鉴权失败或查询失败时显示暂不可用；5xx 查询无记录时显示暂无数据，不直接假定为零。官方配置参考：https://pages.edgeone.ai/document/build-guide

### 每日累计和趋势

GitHub Actions 每天北京时间 02:17 采集前一天完整的 24 个小时，保存到公开仓库 `stats-data` 分支的 `daily-stats.json`；统计页通过同源 `/stats-daily` 接口读取该文件，展示自 **2026-11-15** 起的已采集累计值及最近 30 天柱状图，更新不依赖 EdgeOne 重新部署。`/stats-daily` 先读实例内缓存，再读 KV（键 `daily_stats_cache`，1 小时），未命中才请求 jsDelivr 并在校验通过后写回 KV，访客浏览器不再直接访问 jsDelivr。缺失天数明确标注，不当成零，也不含当天。此时间不是网站成立时间，不能称为历史总量。该文件及其 Git 历史公开，默认口径是 EdgeOne 防护后的整个域名请求。采集工作流每次运行后请求刷新 CDN 缓存，刷新可能失败或有传播延迟；失败时查看 Actions 日志并重新运行。网络不可用时页面显示暂不可用，不回退到旧部署数据。

在 GitHub 仓库 **Settings → Secrets and variables → Actions → Repository secrets** 单独添加 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY`（Pages 的环境变量不会同步到 GitHub），并确保工作流有 `contents: write` 权限；可在 Actions →「采集域名每日请求数」手动运行。任务按日期幂等保存，失败后再次运行会补采仍处于保守 29 天范围内的缺失日期；API 实际数据保留时长未确认，超期或无数据不会视为零，需检查 Actions 日志。采集成功后只推送 `stats-data` 分支，不推送 `main`；确保 EdgeOne 生产部署跟踪 `main`，并检查其他分支的预览部署设置，否则统计分支推送仍可能触发预览构建。首次使用须先部署读取 `stats-data` 分支的页面。

## 句子库手动同步

在 GitHub Actions 的“同步一言句子库”中手动运行，从 [sentences-bundle](https://github.com/hitokoto-osc/sentences-bundle) 的 `master` 检查最新语料；不再定时执行。工作流从同一上游提交读取语录及清单，验证分类和基本字段后重新生成索引与 API，并与语料一起提交；仅在文件变化时提交到 `main`。分类变化或验证失败时停止，不会提交不完整数据。

工作流定义位于仓库默认分支 `main`，需要允许 Actions 对该分支写入；手动同步有变化时推送 `main`，EdgeOne 是否自动上线取决于部署集成，需查看部署记录验证。统计采集是独立的定时任务，GitHub 定时任务可能延迟，仓库长期不活跃时也可能暂停。

## 数据与许可

语录数据基于 [hitokoto-osc/sentences-bundle](https://github.com/hitokoto-osc/sentences-bundle)，详见该项目的著作权声明。程序遵循 [AGPL-3.0](LICENSE)；修改后对外提供服务时，请遵守相应的源码提供义务。
