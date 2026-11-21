# Hitokoto EdgeOne

基于腾讯云 EdgeOne Makers 的中文随机语录 API，支持分类与长度筛选、多种响应格式，提供配套的在线演示、接口文档和运行状况页面。

前端使用 Vue 3 与 Vite，接口由 EdgeOne 边缘函数提供。语料随项目部署，支持可选的 KV 共享缓存。

[在线体验](https://hitokoto.xzccs.top/) · [接口文档](https://hitokoto.xzccs.top/docs) · [运行状况](https://hitokoto.xzccs.top/stats) · [更新日志](CHANGELOG.md)

## 功能

- 支持 12 个语录分类和包含边界的长度筛选。
- 提供全库等概率与分类均衡两种抽取模式。
- 支持 JSON、纯文本、JavaScript 脚本及回调输出。
- 支持跨域调用，随机语录响应使用 `Cache-Control: no-store`。
- 提供在线调试、语录复制与分享、深浅色主题和移动端布局。
- 提供 API 可用性、KV 缓存状态与可选的访问统计展示。

## 快速调用

```bash
curl "https://hitokoto.xzccs.top/api"
```

在网页中获取并显示一条语录。

```html
<p id="quote">正在获取语录…</p>
<script>
  const element = document.getElementById("quote");

  fetch("https://hitokoto.xzccs.top/api")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      element.textContent = data.hitokoto;
    })
    .catch(() => {
      element.textContent = "语录暂不可用，请稍后重试。";
    });
</script>
```

### 常用参数

接口路径为 `/api`，支持 `GET` 与 `OPTIONS`。

| 参数 | 用途 | 示例 |
| --- | --- | --- |
| `c` | 指定一个分类，取值为 `a` 至 `l` | `c=a` |
| `mode` | `weighted` 为默认的全库等概率抽取，`category` 为分类均衡抽取，`balanced` 为其别名 | `mode=category` |
| `encode` | 返回格式，支持 `json`、`text`、`js`，默认为 JSON | `encode=text` |
| `min_length` | 最小长度，正整数，包含边界 | `min_length=10` |
| `max_length` | 最大长度，正整数，包含边界 | `max_length=20` |
| `select` | JavaScript 输出的目标元素，仅用于 `encode=js`，支持简单的 ID、类名或标签选择器 | `select=%23quote` |
| `callback` | 将结果包装为指定函数调用，支持合法的函数名或属性路径 | `callback=show` |

长度按语料记录的 `length` 字段筛选。省略长度参数时，对应方向不限长度。分类代码 `a` 至 `l` 依次对应动画、漫画、游戏、文学、原创、网络、其他、影视、诗词、网易云、哲学和抖机灵。

JSON 响应包含 `id`、`hitokoto`、`type`、`from`、`from_who`、`length` 和 `timestamp`。`from_who` 可为 `null`，`timestamp` 的单位为毫秒。JSON 回调接收 JSON 字符串，调用方可使用 `JSON.parse()` 解析。`encode=js` 返回向目标元素写入语录的脚本。

```bash
# 获取诗词分类
curl "https://hitokoto.xzccs.top/api?c=i"

# 获取长度为 10 至 20 的语录
curl "https://hitokoto.xzccs.top/api?min_length=10&max_length=20"

# 获取纯文本
curl "https://hitokoto.xzccs.top/api?encode=text"
```

完整参数规则、响应示例与错误说明见[接口文档](https://hitokoto.xzccs.top/docs)。

## 部署到 EdgeOne Makers

将仓库导入 EdgeOne Makers，使用以下构建设置。建议使用 Node.js 22，与仓库 CI 环境保持一致。

| 配置 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 项目根目录 | 仓库根目录 |
| 安装命令 | `npm ci` |
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |

构建会生成前端页面、复制语料和静态文件，并校验索引、分类摘要与生成的边缘函数是否一致。`dist/` 由构建生成，已加入 Git 忽略列表。`edge-functions/` 位于仓库根目录，由 Makers 识别并提供对应接口。

### 自定义域名

当前 API 的域名校验允许 `hitokoto.xzccs.top` 和 `*.edgeone.cool`。使用其他自定义域名时，修改 `api-core/handler.js` 中的域名校验，再运行 `npm run generate`，提交源文件和生成产物。

边缘函数需要访问同一部署中的静态语料。部署后检查首页、`/docs`、`/stats` 和 `/api`，确认页面深链接与边缘函数路由均可访问。

### 可选的 KV 缓存

在项目中绑定变量名为 `hitokoto_kv` 的 KV 命名空间，可启用跨实例共享缓存。未绑定时，语录接口使用实例内缓存和同源静态语料。

分类数据按需加载，当前索引内嵌在生成的边缘函数中。详细配置见 [KV 设置](docs/kv-setup.md)。

## 页面与接口

| 路径 | 功能 |
| --- | --- |
| `/` | 随机语录演示 |
| `/docs` | 接口文档与在线调试 |
| `/stats` | API 可用性、缓存状态与访问统计 |
| `/api` | 随机语录接口 |
| `/status` | 只读 JSON 状态探针 |
| `/stats-data` | 最近 24 个完整小时的访问统计 |
| `/stats-daily` | 每日请求汇总 |
| `/LICENSE` | 项目许可证正文 |

前端使用 SPA 路由。未知页面路径由前端显示“页面不存在”，静态回退响应的 HTTP 状态为 200。

## 配置访问统计

访问统计使用腾讯云 API 凭证。基础语录接口可以独立运行，统计功能按需配置。

| 配置位置 | 变量 | 用途 |
| --- | --- | --- |
| EdgeOne Makers 环境变量 | `TENCENT_SECRET_ID`、`TENCENT_SECRET_KEY` | 查询最近 24 个完整小时的统计 |
| GitHub Actions Repository secrets | `TENCENT_SECRET_ID`、`TENCENT_SECRET_KEY` | 采集每日请求数 |

两处凭证分别配置。Makers 环境变量变更后重新部署。凭证需具备目标站点的 `teo:DescribeTimingL7AnalysisData` 查询权限。

**自行部署统计功能时，需要同步调整项目内的站点配置。** 当前统计目标为 `hitokoto.xzccs.top`，采集起始日期为 `2026-11-15`。请统一以下位置的站点、域名、数据仓库地址和日期。

| 位置 | 需要核对的配置 |
| --- | --- |
| `edge-functions/stats-data.js` | 站点 ID、域名 |
| `collect-stats.js` | 站点 ID、域名、采集起始日期 |
| `edge-functions/stats-daily.js` | 数据地址、域名与日期校验 |
| `src/composables/useStats.js`、`src/views/StatsView.vue` | 域名、起始日期与展示文字 |
| `edge-functions/status.js` | 每日统计缓存的域名校验 |
| `daily-stats.json`、`stats-data` 分支、相关工作流 | 数据清单、分支和仓库地址 |

每日采集工作流在北京时间 02:17 执行，也支持手动运行。首次启用前，创建 `stats-data` 分支并放入与配置一致的 `daily-stats.json`，允许工作流写入该分支。采集结果经 jsDelivr 提供给 `/stats-daily`，可能存在缓存与传播延迟。

统计按北京时间展示。每日累计从配置的起始日计算，缺失日期单独标记。实时统计覆盖整个目标域名，并单独展示 `/api` 请求数。统计接口公开提供汇总数据。

## 本地开发与维护

```bash
git clone https://github.com/jiandan2020/hitokoto-edgeone.git
cd hitokoto-edgeone
npm ci
npm run dev
```

`npm run dev` 启动 Vite 前端开发服务。仓库未配置本地边缘函数模拟或 API 代理，页面中的同源接口请求需要配合模拟数据、代理或 EdgeOne 预览部署调试。

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动前端开发服务 |
| `npm run generate` | 从语料与 API 源文件生成索引、摘要清单和边缘入口 |
| `npm run lint` | 检查 JavaScript 与 Vue 源码 |
| `npm test` | 运行后端测试 |
| `npm run test:web` | 运行前端测试 |
| `npm run build` | 构建页面、复制静态文件并校验部署产物 |

修改 `api-core/` 或 `sentences/` 后，运行 `npm run generate`，并提交对应的 `sentence-index.json` 与 `edge-functions/api.js`。随后执行 lint、两套测试与构建。CI 在推送到 `main` 或向 `main` 提交拉取请求时运行检查。

### 同步上游语料

“同步一言句子库”工作流每天北京时间 03:17 检查上游，也可在 Actions 中手动运行。工作流从同一上游快照读取语料和清单，验证并生成部署文件后，仅在内容变化时提交到 `main`。自动上线取决于 EdgeOne 的仓库集成设置。

### 目录说明

| 位置 | 内容 |
| --- | --- |
| `src/` | Vue 页面、组件、样式与前端测试 |
| `api-core/` | 语录 API 源逻辑（参数、抽取、缓存、响应等模块） |
| `functions/index.js` | 兼容入口，过渡期转发到 `api-core/handler.js` |
| `edge-functions/` | EdgeOne 边缘函数入口 |
| `sentences/` | 分类语料 |
| `sentence-index.json` | 语料索引、版本与分类摘要 |
| `scripts/` | 静态文件复制与预热脚本 |
| `test/` | 后端测试 |
| `.github/workflows/` | CI、语料同步与统计采集 |

## 版本与更新记录

项目版本由 `package.json` 管理，语料版本由 `version.json` 管理。发布 API 实现变更时，同步更新包版本、锁文件与 `apiUpdatedAt`。详细历史见 [CHANGELOG.md](CHANGELOG.md)。

## 数据来源与许可证

语料来自 [hitokoto-osc/sentences-bundle](https://github.com/hitokoto-osc/sentences-bundle)，使用语料时请查阅上游的著作权声明。

项目代码采用 [AGPL-3.0 许可证](LICENSE)。使用、修改与分发时请遵循许可证条款。
