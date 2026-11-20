// 确定性构建检查（v5.1 第 2 期）：连续两次运行 node build.js，
// sentence-index.json 与 edge-functions/api.js 的字节必须完全一致。
// 输入不变时输出不变；一旦引入时间、随机数、无序遍历等非确定因素，
// 这里立刻失败，阻止发布。只比较两次生成结果，不改动输入文件。
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outputs = ["sentence-index.json", join("edge-functions", "api.js")];

function digestAll() {
    return outputs.map(path => createHash("sha256").update(readFileSync(join(root, path))).digest("hex"));
}

function generate() {
    execFileSync(process.execPath, ["build.js"], { cwd: root, stdio: "pipe" });
}

generate();
const first = digestAll();
generate();
const second = digestAll();
for (let i = 0; i < outputs.length; i++) {
    if (first[i] !== second[i]) {
        throw new Error(`非确定性构建：${outputs[i]} 两次生成结果不一致`);
    }
}
console.log("确定性构建校验通过：两次生成字节一致。");
