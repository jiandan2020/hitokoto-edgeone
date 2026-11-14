# Hitokoto — EdgeOne Pages

一言 API。语录保存在仓库的 `sentences/`，边缘函数运行时读取同一部署的静态句子文件，不需要 KV、Blob 或 GitHub Raw 请求。

## 部署

在 EdgeOne Pages 从 GitHub 导入此仓库的 `main` 分支：

- 构建命令：`npm run build`（只校验仓库已有的部署文件，不生成索引）
- 首页说明：`edge-functions/index.js`，路由为 `/`；一言接口：`edge-functions/api.js`，路由为 `/api`（由 Pages 自动识别）
- 不需要环境变量和存储服务。

`npm run generate` 在本地或 GitHub Actions 中从 `sentences/` 生成独立的 `sentence-index.json`，并根据 `functions/index.js` 生成 `edge-functions/api.js`。两者均保存在仓库；更改语录或原始函数后应在提交前运行 `npm run generate` 并提交生成文件。EdgeOne 的 `npm run build` 只校验已提交的索引、语料和函数是否一致，不生成文件；校验失败时部署会停止。运行时读取同一部署的索引并核对版本，再按选中的分类读取静态句子文件；索引缓存 1 小时，句子实例内按需缓存最多 12 个分类、保留 1 小时，预览授权请求不使用共享缓存。函数需要能访问部署域名的静态资源；支持 `hitokoto.xzccs.top` 和 EdgeOne 的 `*.edgeone.cool` 域名。

如果项目此前在控制台手动设置了边缘函数或路由，请检查是否与本项目的 `/` 路由冲突，并确认部署的是最新提交。构建成功并不等同于运行验证成功。

## 使用

- `/`：接口说明首页
- `/api`：随机一言，JSON 格式（原根路径接口已迁移）
- `/api?c=a`：按分类获取（a–l）
- `/api?encode=text`：纯文本
- `/api?min_length=10&max_length=20`：筛选长度

`GET /api` 的全部查询参数：`c`（单个分类 a–l）、`encode`（json、text、js）、`min_length`、`max_length`、`select`（用于 js）、`callback`。完整参数、字段、状态码和示例见部署后的首页。默认 `max_length=30`；长度按数据的 `length` 字段筛选。`callback` 在 JSON 格式下接收的是字符串而非对象。实现沿用原项目行为，不保证与 [一言开发者中心](https://developer.hitokoto.cn/sentence/) 的全部功能一致。

## 版本维护

首页 API 版本取自 `package.json` 的 `version`，表示本项目的版本，不是上游接口版本。发布包含 API 实现变更的版本时同步更新 `package.json` 和 `package-lock.json`：不兼容变更递增主版本，兼容的新功能递增次版本，兼容的修复或性能优化递增修订版本。仅更新句子数据、文档或首页样式不递增 API 版本；句子库有自己的版本号。

## 句子库自动同步

GitHub Actions 每天 03:17 UTC（北京时间 11:17）检查 [sentences-bundle](https://github.com/hitokoto-osc/sentences-bundle) 的 `master`；也可在 Actions 的“同步一言句子库”中手动运行。工作流从同一上游提交读取语录及清单，验证分类和基本字段后重新生成索引与 API，并与语料一起提交；仅在文件变化时提交到 `main`。分类变化或验证失败时停止，不会提交不完整数据。

定时工作流运行于仓库默认分支 `main`。需要允许 Actions 对该分支写入，并在 EdgeOne 配置跟踪 `main` 的 Git 推送自动部署。自动提交能否触发该集成需以实际运行验证；构建、同步和部署结果分别查看 GitHub Actions 与 EdgeOne 部署记录。GitHub 定时任务可能延迟，仓库长期不活跃时也可能暂停。

## 数据与许可

语录数据基于 [hitokoto-osc/sentences-bundle](https://github.com/hitokoto-osc/sentences-bundle)，详见该项目的著作权声明。程序遵循 [AGPL-3.0](LICENSE)；修改后对外提供服务时，请遵守相应的源码提供义务。
