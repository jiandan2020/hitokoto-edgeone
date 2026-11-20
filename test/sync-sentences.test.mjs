// 同步脚本接线测试（v5.1 第 1 期）：用临时上游快照目录跑
// sync-sentences.js，验证三项加固校验（ID 唯一、hitokoto 非空、
// length 一致）确实在入库时拦截脏数据，合法数据正常写入。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const KEYS = [..."abcdefghijkl"];
const SCRIPT = new URL("../sync-sentences.js", import.meta.url).pathname;

function fixtureRecord(key, id, hitokoto = "测试句子", length = 4) {
    return { id, hitokoto, type: key, from: "测试", from_who: null, length };
}

async function makeUpstream(mutate = () => {}) {
    const base = await mkdtemp(join(tmpdir(), "sync-sentences-"));
    const upstream = join(base, "upstream");
    const work = join(base, "work");
    await mkdir(join(upstream, "sentences"), { recursive: true });
    await mkdir(work, { recursive: true });
    // 同步脚本直接写相对路径 sentences/<分类>.json，不建目录；
    // 工作目录须预先存在 sentences/，与仓库根目录一致。
    await mkdir(join(work, "sentences"), { recursive: true });
    await writeFile(join(upstream, "version.json"), JSON.stringify({
        protocol_version: "1.0.0",
        bundle_version: "test-1",
        sentences: KEYS.map(key => ({ key, path: `./sentences/${key}.json` })),
    }));
    await writeFile(join(upstream, "categories.json"), JSON.stringify(KEYS.map(key => ({ key }))));
    const records = {};
    KEYS.forEach((key, i) => {
        records[key] = [fixtureRecord(key, i + 1)];
    });
    mutate(records);
    for (const key of KEYS) {
        await writeFile(join(upstream, "sentences", `${key}.json`), JSON.stringify(records[key], null, 2));
    }
    return { base, upstream, work };
}

async function runSync(upstream, work) {
    return execFileAsync(process.execPath, [SCRIPT, upstream], { cwd: work });
}

test("sync-sentences：合法快照同步成功并写入文件", async () => {
    const { base, upstream, work } = await makeUpstream();
    try {
        await runSync(upstream, work);
        const written = JSON.parse(await readFile(join(work, "sentences", "a.json"), "utf8"));
        assert.equal(written.length, 1);
        assert.equal(written[0].hitokoto, "测试句子");
        assert.equal(written[0].length, 4);
        const manifest = JSON.parse(await readFile(join(work, "version.json"), "utf8"));
        assert.equal(manifest.bundle_version, "test-1");
    } finally {
        await rm(base, { recursive: true, force: true });
    }
});

test("sync-sentences：跨分类 id 重复时拒绝同步", async () => {
    const { base, upstream, work } = await makeUpstream(records => {
        records.b[0].id = records.a[0].id;
    });
    try {
        await assert.rejects(() => runSync(upstream, work), /id 1 重复/);
    } finally {
        await rm(base, { recursive: true, force: true });
    }
});

test("sync-sentences：hitokoto 为空时拒绝同步", async () => {
    const { base, upstream, work } = await makeUpstream(records => {
        records.c[0].hitokoto = "";
    });
    try {
        await assert.rejects(() => runSync(upstream, work), /hitokoto 为空/);
    } finally {
        await rm(base, { recursive: true, force: true });
    }
});

test("sync-sentences：length 与内容不一致时拒绝同步", async () => {
    const { base, upstream, work } = await makeUpstream(records => {
        records.d[0].length = 99;
    });
    try {
        await assert.rejects(() => runSync(upstream, work), /length 字段（99）与内容长度（4）不一致/);
    } finally {
        await rm(base, { recursive: true, force: true });
    }
});
