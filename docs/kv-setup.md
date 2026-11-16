# EdgeOne KV 设置

`/api` 和统计接口用 KV 做跨实例共享缓存。KV 是可选的缓存层，不是主数据源：
没开通、没绑定、读写失败时，接口退回实例内缓存 + 同源静态文件，照常工作。

## 开通和绑定

1. EdgeOne 控制台 → Pages → KV 存储 → 申请开通（免费额度 1GB，单个账号最多 10 个命名空间）。
2. 创建一个命名空间，例如 `hitokoto_kv`。
3. 进入项目 → KV 存储 → 绑定命名空间，变量名必须填 **`hitokoto_kv`**（代码里
   按 `globalThis.hitokoto_kv`、再按 `env.hitokoto_kv` 的顺序找这个绑定）。
4. 重新部署。

注意：KV 目前只支持在边缘函数内使用；最终一致性最长约 60 秒，见下文。

## 存了什么

| KV 键 | 内容 | 大小 |
| --- | --- | --- |
| `sentence_index_<语料版本 SHA-256>` | `sentence-index.json` 的全部内容 | 约 53KB |
| `sentences_<分类 a–l>_<语料版本 SHA-256>` | 该分类的句子数组 | 每个 14–366KB，共约 1.8MB |
| `stats_data_cache` | 统计接口最近 24 小时汇总 + `expires` | 很小 |

键只用字母、数字和下划线，符合 KV 的键规则。索引和句子按语料版本分键：
新版本部署后读新键，旧键自然失效，不会因为 KV 最长 60 秒的一致性窗口
读到旧版本数据。统计缓存值里自带 `expires`（10 分钟），过期即重新查询
腾讯云 API；不同节点最多 60 秒内看到旧值，可以接受。

## 写入方式：懒写入

没有从外部直接往 KV 写数据的步骤。第一次请求某个分类时，边缘函数：

1. 先读实例内缓存（L1）；
2. 再读 KV（L2），命中直接用；
3. 否则读同源静态文件（L3），读到后顺手写回 KV。

所以部署后跑一次预热即可让全部键落进 KV：

```bash
node scripts/warm-kv.mjs https://hitokoto.xzccs.top
```

预热会逐分类请求 `/api?c=a` … `/api?c=l`，再请求 `/api?mode=category` 和
`/stats-data`。不传地址时默认 `https://hitokoto.xzccs.top`。

## 排查

- 打开 `/status` 看运行状态：会直接显示 KV 是否绑定、写读是否通、索引和 12 个分类是否已在 KV 里，不用猜。
- KV 没绑定：接口正常，但每次冷启动仍要读静态文件；检查绑定变量名是否
  为 `hitokoto_kv`，以及是否重新部署。
- 语料更新后：`npm run generate` 会生成新版本，函数自动读新键；旧键可
  在控制台手动删除，不删也不影响。
- 统计一直 503：不是 KV 的问题，先检查 `TENCENT_SECRET_ID` /
  `TENCENT_SECRET_KEY` 是否配置。
