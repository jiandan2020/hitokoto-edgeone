// KV 里的句子必须结构完整才可用：数组非空，每个元素是对象且
// id/hitokoto/type/from/from_who/length 字段齐全、类型正确、
// type 与分类一致。验不过就当 KV 未命中，回退到静态文件，
// 读到正确数据后会顺手写回 KV 修好它。
export function isValidSentenceRecords(records, category) {
    if (!Array.isArray(records) || records.length === 0) {return false;}
    for (const record of records) {
        if (!record || typeof record !== "object") {return false;}
        if (!Number.isSafeInteger(record.id)) {return false;}
        if (typeof record.hitokoto !== "string" || !record.hitokoto) {return false;}
        if (record.type !== category) {return false;}
        if (typeof record.from !== "string") {return false;}
        if (record.from_who !== null && typeof record.from_who !== "string") {return false;}
        if (!Number.isSafeInteger(record.length) || record.length < 0) {return false;}
    }
    return true;
}
