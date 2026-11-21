// EdgeOne KV：三层缓存，L1 实例内 Map → L2 KV（跨实例共享）→ L3 同源静态文件。
// KV 是可选的缓存层，不是主数据源：未绑定、读取失败或写入失败时一律退回
// 静态文件，接口照常工作。控制台需先开通 KV、创建命名空间，再绑定到项目，
// 绑定变量名必须为 hitokoto_kv。KV 键只允许字母、数字、下划线，所以用下划线
// 拼接；索引和句子按语料版本分键，版本更新即换键，旧键自然失效，不怕 KV
// 最长 60 秒的最终一致性读到旧数据。单值上限 25MB，最大分类文件约 366KB。
// 不同运行时的绑定注入位置不同：Pages/Makers 文档用全局变量，Cloudflare
// 风格用 env，所以按 globalThis → env 依次找。
//
// 本模块引用构建时注入的全局量 sentenceVersion 与 embeddedSentenceHashes
//（见 build.js 前缀的常量声明），运行时由打包产物提供。
import { log } from "./log.js";

export function resolveKv(env) {
    const fromGlobal = globalThis.hitokoto_kv;
    if (fromGlobal && typeof fromGlobal.get === "function") {return fromGlobal;}
    const fromEnv = env && env.hitokoto_kv;
    if (fromEnv && typeof fromEnv.get === "function") {return fromEnv;}
    return null;
}
export function indexKvKey() {
    return `sentence_index_${sentenceVersion}`;
}
// 每类语料的内容摘要（构建时生成，随 api.js 内联）；KV 键按摘要分键，
// 内容一变键就变，旧键自然失效，不怕 KV 的最终一致性读到旧数据。
export function expectedSentenceHash(category) {
    if (typeof embeddedSentenceHashes !== "undefined" && embeddedSentenceHashes && typeof embeddedSentenceHashes === "object") {
        const h = embeddedSentenceHashes[category];
        if (typeof h === "string" && h) {return h;}
    }
    return null;
}
export function sentencesKvKey(category) {
    const h = expectedSentenceHash(category);
    if (h) {return `sentences_${category}_${h}`;}
    return `sentences_${category}_${sentenceVersion}`;
}
// 对原始字节算 sha256，与构建时生成的摘要比对。运行时没有 Web Crypto
// 时返回 null，调用方退回结构校验，接口不因此中断。
export async function sha256Hex(data) {
    try {
        if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
            const digest = await crypto.subtle.digest("SHA-256", data);
            return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
        }
    } catch {
        // 摘要不可用时返回 null。
    }
    return null;
}
export async function kvGetJson(kv, key) {
    try {
        const raw = await kv.get(key);
        if (raw && typeof raw === "object") {return raw;}
        if (typeof raw !== "string" || !raw) {return null;}
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
export async function kvPutJson(kv, key, value) {
    try {
        await kv.put(key, JSON.stringify(value));
    } catch (error) {
        log("error", "kv_write_failed", { error });
    }
}
