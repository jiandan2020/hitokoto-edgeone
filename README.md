# Hitokoto — EdgeOne Pages

一言 API。语录保存在仓库的 `sentences/`，运行时不需要 KV、Blob 或 GitHub Raw 请求。

## 部署

在 EdgeOne Pages 从 GitHub 导入此仓库的 `edgeone-support` 分支：

- 构建命令：`npm run build`
- 首页说明：`edge-functions/index.js`，路由为 `/`；一言接口：`edge-functions/api.js`，路由为 `/api`（由 Pages 自动识别）
- 不需要环境变量和存储服务。

`npm run build` 从 `sentences/` 和原始 Cloudflare 函数 `functions/index.js` 生成 `edge-functions/api.js`。仓库中保留生成文件，确保平台在构建前扫描函数时也能发现路由；更改语录或原始函数后应重新运行构建并提交生成文件。生成的函数约 2.2 MB，实际部署仍需受当前套餐和平台限制约束。

如果项目此前在控制台手动设置了边缘函数或路由，请检查是否与本项目的 `/` 路由冲突，并确认部署的是最新提交。构建成功并不等同于运行验证成功。

## 使用

- `/`：接口说明首页
- `/api`：随机一言，JSON 格式（原根路径接口已迁移）
- `/api?c=a`：按分类获取（a–l）
- `/api?encode=text`：纯文本
- `/api?min_length=10&max_length=20`：筛选长度

`GET /api` 的全部查询参数：`c`（单个分类 a–l）、`encode`（json、text、js）、`min_length`、`max_length`、`select`（用于 js）、`callback`。完整参数、字段、状态码和示例见部署后的首页。默认 `max_length=30`；长度按数据的 `length` 字段筛选。`callback` 在 JSON 格式下接收的是字符串而非对象。实现沿用原项目行为，不保证与 [一言开发者中心](https://developer.hitokoto.cn/sentence/) 的全部功能一致。

## 数据与许可

语录数据基于 [hitokoto-osc/sentences-bundle](https://github.com/hitokoto-osc/sentences-bundle)，详见该项目的著作权声明。程序遵循 [AGPL-3.0](LICENSE)；修改后对外提供服务时，请遵守相应的源码提供义务。
