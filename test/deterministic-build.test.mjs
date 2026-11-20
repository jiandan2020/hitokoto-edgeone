// 确定性构建接线测试（v5.1 第 2 期）：子进程跑
// scripts/check-deterministic-build.mjs，断言其在真实仓库上通过，
// 即连续两次 node build.js 生成的产物字节一致。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("check-deterministic-build.mjs 在真实仓库上通过", async () => {
    const { stdout } = await execFileAsync(
        process.execPath,
        ["scripts/check-deterministic-build.mjs"],
        { cwd: new URL("..", import.meta.url).pathname },
    );
    assert.match(stdout, /确定性构建校验通过/);
});
