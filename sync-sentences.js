// 从同一上游 Git 快照验证并同步语录和清单。
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const upstream = process.argv[2];
if (!upstream) throw new Error("用法：node sync-sentences.js <上游仓库目录>");
const keys = [..."abcdefghijkl"];
const files = ["version.json", "categories.json", ...keys.map(key => `sentences/${key}.json`)];
const contents = new Map(files.map(file => [file, readFileSync(join(upstream, file))]));
const parse = file => JSON.parse(contents.get(file).toString("utf8"));
const manifest = parse("version.json");
const categories = parse("categories.json");
const manifestKeys = manifest.sentences?.map(item => item.key).sort();
const categoryKeys = Array.isArray(categories) && categories.map(item => item.key).sort();
if (JSON.stringify(manifestKeys) !== JSON.stringify(keys) || JSON.stringify(categoryKeys) !== JSON.stringify(keys)) {
    throw new Error("上游分类与当前支持的 a–l 不一致，停止同步以供检查");
}
for (const key of keys) {
    const records = parse(`sentences/${key}.json`);
    if (!Array.isArray(records) || records.length === 0 || records.some(item =>
        !item || typeof item.hitokoto !== "string" || typeof item.length !== "number" ||
        !Number.isFinite(item.length) || item.type !== key || item.id == null
    )) throw new Error(`上游分类 ${key} 数据不完整或格式不兼容`);
    const reduced = records.map(({ id, hitokoto, type, from, from_who, length }) => ({
        id, hitokoto, type, from: from ?? null, from_who: from_who ?? null, length,
    }));
    contents.set(`sentences/${key}.json`, Buffer.from(`[\n${reduced.map(item => `  ${JSON.stringify(item)}`).join(",\n")}\n]\n`));
    console.log(`${key}: ${records.length} 条`);
}
for (const [file, data] of contents) writeFileSync(file, data);
console.log(`已同步句子库版本 ${manifest.bundle_version ?? "未知"}`);
