// 语料校验（v5.1 第 1 期）：ID 全局唯一、hitokoto 非空、length 与内容长度一致。
// 供 sync-sentences.js（上游入库）与 check-deployment.js（构建校验）共用。
// 长度用 JS 字符串 .length（UTF-16 码元数），与运行时核对逻辑一致。
// 校验失败抛错并点名分类与 id；通过返回本分类的句子数。
export function validateCategoryRecords(category, records, seenIds) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error(`分类 ${category} 数据为空或格式错误`);
    }
    for (const record of records) {
        if (!record || typeof record !== "object") {
            throw new Error(`分类 ${category} 存在非对象记录`);
        }
        if (!Number.isSafeInteger(record.id)) {
            throw new Error(`分类 ${category} 存在非法 id：${JSON.stringify(record.id)}`);
        }
        if (seenIds.has(record.id)) {
            throw new Error(`id ${record.id} 重复（分类 ${category}）`);
        }
        seenIds.add(record.id);
        if (typeof record.hitokoto !== "string" || record.hitokoto.length === 0) {
            throw new Error(`分类 ${category} id ${record.id} 的 hitokoto 为空或非字符串`);
        }
        if (record.length !== record.hitokoto.length) {
            throw new Error(`分类 ${category} id ${record.id} 的 length 字段（${record.length}）与内容长度（${record.hitokoto.length}）不一致`);
        }
    }
    return records.length;
}
