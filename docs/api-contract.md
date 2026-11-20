# API 契约（v5.0.4 冻结版）

本文档锁定 `/api` 的公开行为。任何改动都必须先更新本文档与
`test/api-contract.test.mjs`、`test/api.test.mjs`，再改代码。
契约只承诺行为，不承诺实现方式（缓存层、生成方式可变）。

- 冻结版本：API **5.0.4**（package.json `version`）
- 冻结日期：2026-11-20
- 语料：11,278 句，12 个分类，句子库版本 1.0.1383（以线上 `/status` 为准）
- 适用范围：`GET /api` 及其参数、响应、错误、响应头；不含 `/status`、
  `/stats-data`、`/stats-daily` 与前端页面（另见 README 与 `/docs`）。

## 1. 端点与方法

| 方法 | 路径 | 行为 |
| --- | --- | --- |
| `GET` | `/api` | 返回一条随机语录 |
| `OPTIONS` | `/api` | CORS 预检，200，空 body |
| 其他 | `/api` | **405**，错误体见第 5 节，响应带 `Allow: GET, OPTIONS` |

## 2. 请求参数

参数只取**首次出现**的值（重复参数以后出现的为准，取第一个）。
未传参数时按默认值处理；不传 `max_length` 表示不限制最大长度。

| 参数 | 取值 | 默认 | 非法时 |
| --- | --- | --- | --- |
| `c` | 单个分类，`a` 至 `l` | 不限分类 | 未知分类返回 **404**（不是 400） |
| `mode` | `weighted`、`category`、`balanced` | `weighted` | 其他值 **400** |
| `encode` | `json`、`text`、`js` | `json` | 其他值按默认 JSON 处理（不报错） |
| `min_length` | 严格正整数（纯数字字符串） | `0`（不限） | `12abc`、`0`、`1.5` 等 **400** |
| `max_length` | 严格正整数（纯数字字符串） | 不限 | 同上；小于 `min_length` 时 **400** |
| `select` | 简单选择器：`#id`、`.class` 或标签名，仅 `encode=js` 时校验 | `.hitokoto` | 非法选择器 **400** |
| `callback` | 合法 JS 标识符路径，如 `show`、`App.onHitokoto` | 无 | 非法 **400** |

分类代码 `a` 至 `l` 依次对应动画、漫画、游戏、文学、原创、网络、其他、
影视、诗词、网易云、哲学、抖机灵。

长度按语料记录的 `length` 字段筛选，上下限**均包含边界**。
`min_length` / `max_length` 是"严格正整数"：只接受纯数字字符串，
`12abc`、`0x10`、`1.5`、带空格的一律无效。

## 3. 抽取语义（不得以重构为名修改）

- `mode=weighted`（默认）：在**全部符合条件的句子中等概率**抽一条，
  大分类被抽中的概率按其句子数加权。
- `mode=category`（别名 `balanced`）：先在**符合条件的分类中等概率**
  抽一个分类，再在该分类内等概率抽一句；小分类与大分类机会均等。
  `balanced` 与 `category` 是同一行为，不是两种算法。
- 只指定一个分类时，两种模式结果相同。
- 长度筛选先按长度桶汇总候选，再抽取；没有符合条件的句子时返回 **404**。
- 选中后核对分类、索引长度与请求范围三者，任一不符视为数据错版，
  清掉实例缓存并返回 **500**，绝不返回错版句子。

## 4. 响应格式

### 4.1 JSON（默认，`encode=json` 或不传）

`Content-Type: application/json; charset=UTF-8`，HTTP 200，恰好 7 个字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 语录唯一标识（全局唯一） |
| `hitokoto` | string | 语录内容，非空 |
| `type` | string | 分类代码 `a`–`l` |
| `from` | string | 来源 |
| `from_who` | string \| null | 作者，可为 `null` |
| `length` | number | `hitokoto` 的字符数（与内容一致） |
| `timestamp` | number | 响应生成时的 Unix 毫秒时间戳 |

### 4.2 纯文本（`encode=text`）

`Content-Type: text/plain; charset=UTF-8`，body 就是语录正文。

### 4.3 JavaScript（`encode=js`）

`Content-Type: application/javascript; charset=UTF-8`，body 是立即执行的
脚本：把语录写入 `select` 指定的元素（默认 `.hitokoto`），元素不存在时
静默不写。句子与选择器均经 `JSON.stringify` 转义。

### 4.4 回调（`callback`，JSONP 兼容）

`callback` 指定的函数会被调用，**收到的是 JSON 字符串而非对象**，
调用方需用 `JSON.parse()` 解析。这是历史约定，不得悄悄改成传对象。

- JSON + callback：`;callback("<JSON 字符串>");`
- text + callback：`;callback("<语录正文>");`
- js + callback：`;callback("<JS 脚本字符串>");`

`Content-Type` 为 `application/javascript; charset=UTF-8`。

## 5. 错误响应

错误体一律为 JSON：`{code, message, timestamp}`，其中 `code` 等于 HTTP
状态码，`timestamp` 为 Unix 毫秒时间戳。正式环境不输出堆栈与内部细节
（`DEV_ENV=true` 时 `message` 为原始错误信息，仅用于调试）。

| 状态码 | 含义 |
| --- | --- |
| 400 | 参数非法：`mode`、`min_length`、`max_length`、`callback`、`select` 校验失败 |
| 403 | 不支持的部署域名（见第 7 节） |
| 404 | 未知分类，或没有符合长度条件的句子 |
| 405 | 非 GET / OPTIONS 方法，响应带 `Allow: GET, OPTIONS` |
| 500 | 服务器内部错误或数据错版（选中核对失败、静态语料校验失败等） |

## 6. 响应头

所有动态响应（正常、错误、JSONP、纯文本）都带：

- `Access-Control-Allow-Origin: *`（公开只读接口，不带凭据 Cookie 的 CORS 授权）
- `Cache-Control: no-store`（随机接口，不得缓存某一条结果）
- `X-Content-Type-Options: nosniff`
- `X-Source-Code: https://github.com/jiandan2020/hitokoto-edgeone`

`OPTIONS` 预检额外带 `Access-Control-Allow-Methods: GET, OPTIONS` 与
`Access-Control-Max-Age: 86400`。

## 7. 部署域名检查

请求协议须为 `http:` 或 `https:`，且主机名须为 `hitokoto.xzccs.top`
或 `*.edgeone.cool`，否则 **403**。检查发生在读取语料之前。
预览部署域名是否命中白名单，见第 9 节待确认项。

## 8. 缓存与数据完整性（实现可变，行为不变）

- 语料唯一真源是仓库 `sentences/`；运行时不远程拉 GitHub Raw。
- 三层读取：实例内缓存（L1，1 小时 TTL，最多 12 个分类，单飞合并）→
  可选 KV（L2，跨实例共享）→ 同部署静态文件（L3，数据源）。
  KV 未绑定、读写失败时一律退回静态文件，接口照常工作。
- 句子索引在构建时内联进生成的边缘函数，冷启动不另取索引文件。
- KV 键按内容摘要分键（`sentences_<分类>_<sha256>`）；内容一变键就变，
  旧键自然失效。KV 数据须结构完整才可用，损坏时回退静态文件并修好 KV。
- 静态文件按原始字节核验 sha256 摘要，不符不解析、不缓存、不回填，
  直接 500。索引与语料版本不一致时构建失败，不输出随机错句。
- `context.waitUntil` 可用时 KV 回填放后台跑，响应不等它；没有时同步写。

## 9. 延迟基线（2026-11-20 记录）

基线只用于判断"有没有明显退化"，不承诺绝对数值。

| 测量方 | 时间 | 方法 | /api 结果 |
| --- | --- | --- | --- |
| 用户笔记本 | 2026-11-17 | 10 次 curl，中位 | **152 ms** |
| 用户手机 | 2026-11-17 | 浏览器请求 | **约 104 ms** |
| 本助手 VM | 2026-11-20 | 10 次 curl | 中位 3437 ms，最小 2563 ms，p90 5870 ms，最大 18805 ms |

**本助手 VM 的数字不代表接口速度**：VM 走海外出口链路，2–3 秒是出口
瓶颈；判断接口快慢以用户自己跑出来的数字为准。后续回归以"用户侧
中位不出现无解释的大幅退化"为标准，不以 VM 数字为准。

## 10. 契约测试映射

| 契约点 | 测试文件 |
| --- | --- |
| 7 个字段与类型 | `test/api-contract.test.mjs` |
| 分类、长度、模式行为 | `test/api-contract.test.mjs`、`test/api.test.mjs` |
| 三种返回格式与 Content-Type | `test/api-contract.test.mjs` |
| 错误体结构、405 / 403 / 404 | `test/api-contract.test.mjs` |
| 参数严格校验、边界、回调注入防护 | `test/api.test.mjs` |
| KV 损坏回退、摘要校验、选中核对 | `test/api.test.mjs` |
| 长度索引与生成产物一致性 | `npm run build` 中的 `check-deployment.js` |

## 11. 待确认（v5.1 第 4 期处理，不阻塞第 0–1 期）

- 预览部署域名是否命中 `*.edgeone.cool` 白名单：需在 Makers 控制台
  点一次预览链接，访问其 `/api` 看 200 还是 403，再决定白名单是否调整。
- 延迟 p50 / p95 的持续观测方式：腾讯统计只给次数不给延迟，
  平台指标是否可用、是否采样，待定。
