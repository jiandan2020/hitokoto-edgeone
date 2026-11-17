// 首页运行时回归测试：在 jsdom 里真实跑页面脚本，验证一言加载、
// 快捷分类、调试器 URL 预览与发送、主题切换、页脚版本信息。
// 运行：npm test
import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import handler from "../edge-functions/index.js";

async function renderDom() {
    const html = await (await handler()).text();
    const calls = [];
    const dom = new JSDOM(html, {
        url: "https://hitokoto.xzccs.top/",
        runScripts: "dangerously",
        pretendToBeVisual: true,
        beforeParse(window) {
            window.fetch = async (url) => {
                const u = String(url);
                calls.push(u);
                if (u.includes("/api")) {
                    const parsed = new URL(u, "https://hitokoto.xzccs.top");
                    const c = parsed.searchParams.get("c");
                    const body = { id: 1, hitokoto: "测试句子", type: c || "a", from: "测试出处", from_who: "测试作者", length: 4, timestamp: 1794876477309 };
                    return { ok: true, status: 200, headers: { get: () => "application/json; charset=UTF-8" }, json: async () => body, text: async () => JSON.stringify(body) };
                }
                if (u.includes("/package.json")) {
                    return { ok: true, status: 200, json: async () => ({ version: "4.9.11", apiUpdatedAt: "2026-11-18T00:09:03+08:00" }), text: async () => "{}" };
                }
                if (u.includes("/version.json")) {
                    return { ok: true, status: 200, json: async () => ({ bundle_version: "abc123", updated_at: "2026-11-17T00:00:00+08:00" }), text: async () => "{}" };
                }
                return { ok: false, status: 404, headers: { get: () => "" }, json: async () => ({}), text: async () => "" };
            };
        },
    });
    await new Promise((r) => setTimeout(r, 300));
    return { dom, calls };
}

test("quote loads, shows source and clears the skeleton", async () => {
    const { dom } = await renderDom();
    try {
        const doc = dom.window.document;
        assert.equal(doc.getElementById("quote-text").textContent, "测试句子");
        assert.ok(doc.getElementById("quote-source").textContent.includes("测试出处"), "source must show");
        assert.ok(doc.getElementById("quote-source").textContent.includes("测试作者"), "author must show");
        assert.equal(doc.getElementById("quote-body").classList.contains("skeleton"), false, "skeleton must clear after load");
        assert.equal(doc.getElementById("quote-error").hidden, true, "error must stay hidden on success");
    } finally {
        dom.window.close();
    }
});

test("quick category chip switches the category and reloads the quote", async () => {
    const { dom, calls } = await renderDom();
    try {
        const doc = dom.window.document;
        const chips = [...doc.querySelectorAll("#quote-chips .chip")];
        assert.deepEqual(chips.map(c => c.textContent), ["全部", "动画", "诗词", "哲学", "网易云"]);
        const before = calls.filter(u => u.includes("/api")).length;
        chips.find(c => c.textContent === "诗词").click();
        await new Promise((r) => setTimeout(r, 200));
        const after = calls.filter(u => u.includes("/api"));
        assert.ok(after.length > before, "switching category must fetch again");
        assert.ok(after[after.length - 1].includes("c=i"), "poetry category must request c=i");
        const freshChips = [...doc.querySelectorAll("#quote-chips .chip")];
        assert.ok(freshChips.find(c => c.textContent === "诗词").classList.contains("active"), "poetry chip must be active");
    } finally {
        dom.window.close();
    }
});

test("playground builds the URL from the selected feature and parameters", async () => {
    const { dom } = await renderDom();
    try {
        const doc = dom.window.document;
        const url = () => doc.getElementById("pg-url").textContent;
        assert.equal(url(), "https://hitokoto.xzccs.top/api");
        const featureChips = [...doc.querySelectorAll("#pg-features .chip")];
        featureChips.find(c => c.textContent === "分类筛选").click();
        assert.equal(url(), "https://hitokoto.xzccs.top/api?c=a");
        featureChips.find(c => c.textContent === "长度筛选").click();
        assert.ok(url().includes("min_length=10"), "length preset must set min_length");
        assert.ok(url().includes("max_length=20"), "length preset must set max_length");
        featureChips.find(c => c.textContent === "JSONP 回调").click();
        assert.ok(url().includes("callback=cb"), "jsonp preset must set callback");
        assert.equal(doc.getElementById("pg-field-callback").style.display, "", "callback field must show for the jsonp feature");
    } finally {
        dom.window.close();
    }
});

test("playground validates length and shows the error instead of a URL", async () => {
    const { dom } = await renderDom();
    try {
        const doc = dom.window.document;
        const min = doc.getElementById("pg-min");
        const max = doc.getElementById("pg-max");
        min.value = "20";
        max.value = "10";
        min.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        const err = doc.getElementById("pg-error");
        assert.equal(err.hidden, false, "max < min must show an error");
        assert.ok(err.textContent.includes("最大长度不能小于最小长度"), "error must explain max < min");
        assert.equal(doc.getElementById("pg-url").textContent, "参数有误，无法生成请求地址");
    } finally {
        dom.window.close();
    }
});

test("playground send shows the real status, timing and formatted response", async () => {
    const { dom } = await renderDom();
    try {
        const doc = dom.window.document;
        doc.getElementById("pg-send").click();
        await new Promise((r) => setTimeout(r, 200));
        assert.equal(doc.getElementById("pg-result").hidden, false, "result must show after send");
        assert.ok(doc.getElementById("pg-status").textContent.includes("HTTP 200"), "status must show the real HTTP code");
        assert.ok(doc.getElementById("pg-status").textContent.includes("ms"), "status must show the real timing");
        const resp = doc.getElementById("pg-response").textContent;
        assert.ok(resp.includes("测试句子"), "response must contain the real sentence");
        assert.ok(resp.includes("\n  \"hitokoto\""), "JSON response must be pretty-printed");
    } finally {
        dom.window.close();
    }
});

test("theme toggle switches data-theme and persists the choice", async () => {
    const { dom } = await renderDom();
    try {
        const doc = dom.window.document;
        const btn = doc.getElementById("theme-btn");
        assert.equal(doc.documentElement.getAttribute("data-theme"), null, "no theme set by default in jsdom");
        btn.click();
        assert.equal(doc.documentElement.getAttribute("data-theme"), "dark");
        assert.equal(btn.textContent, "☀️");
        assert.equal(dom.window.localStorage.getItem("hitokoto-theme"), "dark");
        btn.click();
        assert.equal(doc.documentElement.getAttribute("data-theme"), "light");
        assert.equal(btn.textContent, "🌙");
    } finally {
        dom.window.close();
    }
});

test("footer version info fills in and stays visible on success", async () => {
    const { dom } = await renderDom();
    try {
        const doc = dom.window.document;
        assert.equal(doc.getElementById("api-version").textContent, "4.9.11");
        assert.equal(doc.getElementById("bundle-version").textContent, "abc123");
        assert.equal(doc.getElementById("version-info").hidden, false, "version group must stay visible on success");
        assert.equal(doc.getElementById("version-info").getAttribute("aria-busy"), "false");
    } finally {
        dom.window.close();
    }
});
