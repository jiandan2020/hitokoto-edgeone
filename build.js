// 构建句子长度索引；句子正文由同一部署的静态数据提供。
// 生成产物：sentence-index.json 与 edge-functions/api.js（esbuild 打包 api-core/）。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { buildApiBundle } from "./scripts/build-api.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const index = {};
const hashes = {};
const hash = createHash("sha256");
for (const category of "abcdefghijkl") {
    const bytes = readFileSync(join(root, "sentences", `${category}.json`));
    hashes[category] = createHash("sha256").update(bytes).digest("hex");
    hash.update(category).update(bytes);
    const records = JSON.parse(bytes.toString("utf8"));
    index[category] = {};
    records.forEach((record, i) => {
        (index[category][record.length] ||= []).push(i);
    });
}
const version = hash.digest("hex");
const output = await buildApiBundle({ version, index, hashes });
mkdirSync(join(root, "edge-functions"), { recursive: true });
writeFileSync(join(root, "sentence-index.json"), JSON.stringify({ version, index, hashes }));
writeFileSync(join(root, "edge-functions", "api.js"), output);
console.log(`Generated sentence-index.json and edge-functions/api.js (${Buffer.byteLength(output)} bytes)`);
