# EdgeOne Blob 存储部署指南

由于只有 Blob 存储权限（没有 KV），使用 Blob 存储来托管 JSON 数据文件。

## 📋 部署步骤

### 1. 上传 JSON 文件到 Blob 存储

将 `sentences/` 目录下的所有 JSON 文件上传到 EdgeOne Blob 存储：

**需要上传的文件**:
```
sentences/a.json
sentences/b.json
sentences/c.json
sentences/d.json
sentences/e.json
sentences/f.json
sentences/g.json
sentences/h.json
sentences/i.json
sentences/j.json
sentences/k.json
sentences/l.json
```

**Blob 存储结构**:
```
your-blob-storage/
└── sentences/
    ├── a.json
    ├── b.json
    ├── c.json
    ├── d.json
    ├── e.json
    ├── f.json
    ├── g.json
    ├── h.json
    ├── i.json
    ├── j.json
    ├── k.json
    └── l.json
```

### 2. 获取 Blob 存储访问地址

上传完成后，记录 Blob 存储的访问域名，例如：
- `https://your-blob-domain.edgeone.app`
- `https://blob.yourdomain.com`

### 3. 部署边缘函数

1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone)
2. 进入「边缘函数」> 「新建函数」
3. 函数名称：`hitokoto-api`
4. 代码：复制 `edgeone/index-blob.js` 的内容
5. **配置环境变量**:
   - 变量名：`BLOB_URL`
   - 变量值：你的 Blob 存储域名（例如：`https://your-blob-domain.edgeone.app`）
6. 配置触发路由（例如：`/*` 或 `/api/hitokoto`）
7. 保存并发布

### 4. 测试访问

```bash
# 测试基础功能
curl https://your-domain.com/

# 测试指定分类
curl https://your-domain.com/?c=a

# 测试长度筛选
curl https://your-domain.com/?min_length=10&max_length=20
```

## 🔧 上传到 Blob 存储的方法

### 方法一：通过 EdgeOne 控制台

1. 进入 EdgeOne 控制台 > 「对象存储」或「Blob 存储」
2. 创建存储桶或选择现有存储桶
3. 创建 `sentences` 目录
4. 逐个上传 JSON 文件（a.json 到 l.json）

### 方法二：使用 EdgeOne CLI（如果支持）

```bash
# 批量上传
for file in sentences/*.json; do
  eo blob upload "$file" --path="sentences/$(basename $file)"
done
```

### 方法三：使用腾讯云 COS CLI（如果 Blob 基于 COS）

```bash
# 安装 COSCMD
pip install coscmd

# 配置
coscmd config -a <SecretId> -s <SecretKey> -b <BucketName> -r <Region>

# 批量上传
coscmd upload -r sentences/ sentences/
```

### 方法四：通过 API 上传

如果有 Blob 存储的 API 访问权限，可以编写脚本批量上传。

## ⚙️ 环境变量配置

在 EdgeOne 边缘函数中配置：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| BLOB_URL | Blob 存储访问域名 | `https://your-blob-domain.edgeone.app` |
| DEV_ENV | 开发环境（可选，显示详细错误） | `true` 或 `false` |

## 📊 性能说明

**优势**:
- ✅ 边缘函数代码小（约 6KB）
- ✅ 利用 CDN 缓存加速 JSON 文件访问
- ✅ 无 KV 限制
- ✅ 数据更新方便（直接替换 Blob 文件）

**缓存策略**:
- JSON 文件会缓存 1 小时（在代码中配置）
- 边缘节点首次访问后会缓存在本地
- 修改数据后需等待缓存过期或手动刷新

## 🔄 更新数据

要更新句子数据：
1. 修改本地 `sentences/*.json` 文件
2. 重新上传到 Blob 存储（覆盖原文件）
3. 等待缓存过期（1 小时）或在 EdgeOne 控制台刷新缓存

## 📁 项目文件

```
edgeone/
├── index-blob.js              # Blob 存储版本（使用此文件）✅
├── index-kv.js               # KV 存储版本（无权限，不可用）
├── BLOB-DEPLOYMENT-GUIDE.md  # 本文件
└── README.md                 # 完整说明
```

## ⚠️ 注意事项

1. **CORS 配置**: 确保 Blob 存储启用了 CORS，允许边缘函数访问
2. **访问权限**: Blob 文件需要设置为公开读取，或配置访问凭证
3. **缓存时间**: 可在代码中调整 `cacheTtl` 值（单位：秒）
4. **域名配置**: `BLOB_URL` 不要以 `/` 结尾
5. **文件路径**: 必须保持 `sentences/` 目录结构

## 🆚 与 KV 版本的对比

| 特性 | Blob 版本 | KV 版本 |
|------|-----------|---------|
| 权限要求 | Blob 存储 | KV 存储 |
| 部署复杂度 | 简单 | 中等 |
| 性能 | 良好（依赖 CDN 缓存） | 优秀（边缘缓存） |
| 数据更新 | 替换文件 | 更新 KV 键值 |
| 冷启动 | 需要 fetch JSON | 直接读取 |

## 🎯 快速检查清单

- [ ] 上传所有 12 个 JSON 文件到 Blob 存储
- [ ] 确认 Blob 存储目录结构为 `sentences/*.json`
- [ ] 获取 Blob 存储访问域名
- [ ] 在边缘函数中配置 `BLOB_URL` 环境变量
- [ ] 使用 `index-blob.js` 作为边缘函数代码
- [ ] 测试访问是否正常
- [ ] 验证 CORS 配置（如果跨域访问）

## 🚀 预期效果

部署成功后：
- 首次请求每个分类时会从 Blob 加载 JSON（约 100-300ms）
- 后续请求会使用缓存，响应时间 < 50ms
- 修改数据只需更新 Blob 文件，无需重新部署函数
