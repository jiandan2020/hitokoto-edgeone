// 语料校验单元测试（v5.1 第 1 期）：ID 全局唯一、hitokoto 非空、
// length 与内容长度一致。另以真实语料库做回归，并验证构建校验脚本
//（check-deployment.js）确实跑过这三项检查。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import { validateCategoryRecords } from "../scripts/validate-corpus.mjs";

const execFileAsync = promisify(execFile);

function record(id, hitokoto, category = "a") {
    return { id, hitokoto, type: category, from: "测试", from_who: null, length: hitokoto.length };
}

test("validateCategoryRecords：合法记录通过并返回条数", () => {
    const seen = new Set();
    const count = validateCategoryRecords("a", [record(1, "测试句子"), record(2, "另一句")], seen);
    assert.equal(count, 2);
    assert.deepEqual([...seen], [1, 2]);
});

test("validateCategoryRecords：同一分类内 id 重复抛错", () => {
    const seen = new Set();
    assert.throws(
        () => validateCategoryRecords("a", [record(1, "第一句"), record(1, "第二句")], seen),
        /id 1 重复/,
    );
});

test("validateCategoryRecords：跨分类 id 重复抛错", () => {
    const seen = new Set();
    validateCategoryRecords("a", [record(1, "第一句")], seen);
    assert.throws(
        () => validateCategoryRecords("b", [record(1, "别类句子", "b")], seen),
        /id 1 重复/,
    );
});

test("validateCategoryRecords：hitokoto 为空字符串抛错", () => {
    assert.throws(
        () => validateCategoryRecords("a", [record(1, "")], new Set()),
        /hitokoto 为空/,
    );
});

test("validateCategoryRecords：hitokoto 非字符串抛错", () => {
    assert.throws(
        () => validateCategoryRecords("a", [{ id: 1, hitokoto: 123, type: "a", from: "测试", from_who: null, length: 3 }], new Set()),
        /hitokoto 为空或非字符串/,
    );
});

test("validateCategoryRecords：length 与内容长度不一致抛错", () => {
    const bad = record(1, "测试句子");
    bad.length = 99;
    assert.throws(
        () => validateCategoryRecords("a", [bad], new Set()),
        /length 字段（99）与内容长度（4）不一致/,
    );
});

test("validateCategoryRecords：非法 id 抛错", () => {
    assert.throws(
        () => validateCategoryRecords("a", [{ id: 1.5, hitokoto: "测试", type: "a", from: "测试", from_who: null, length: 2 }], new Set()),
        /非法 id/,
    );
});

test("validateCategoryRecords：空数组抛错", () => {
    assert.throws(
        () => validateCategoryRecords("a", [], new Set()),
        /数据为空/,
    );
});

test("validateCategoryRecords：真实语料库 12 分类全部通过", () => {
    const seen = new Set();
    let total = 0;
    for (const key of "abcdefghijkl") {
        const records = JSON.parse(readFileSync(new URL(`../sentences/${key}.json`, import.meta.url), "utf8"));
        total += validateCategoryRecords(key, records, seen);
    }
    // 总数不写死：上游一加句子总数就变，写死会让同步工作流在有新句子时必失败。
    // 只断言两点：确实是完整语料库（过万句），且 ID 全局唯一。
    assert.ok(total > 10000, `真实语料库应超过 10000 句，实际 ${total} 句`);
    assert.equal(seen.size, total);
});

test("check-deployment.js 在真实仓库上通过（含三项校验）", async () => {
    await execFileAsync(process.execPath, ["check-deployment.js"], { cwd: new URL("..", import.meta.url).pathname });
});
