// 抽取逻辑单元测试：selectSentence 是纯函数，直接测 api-core/select.js，
// 覆盖无候选、单分类、边界长度、未知分类、balanced 模式。
// 抽取用 Math.random，断言只做不变量（结果在候选内、长度在范围内、
// 索引有效），不做精确的分布断言。
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { selectSentence } from "../api-core/select.js";

const index = {
    a: { 5: [0, 1], 10: [2] },
    b: { 3: [0], 8: [1, 2, 3] },
};

describe("selectSentence", () => {
    it("无符合条件的句子时返回 null", () => {
        assert.equal(selectSentence(index, { categoryKey: null, balancedMode: false, minLength: 100, maxLength: 200 }), null);
    });
    it("未知分类返回 null", () => {
        assert.equal(selectSentence(index, { categoryKey: "z", balancedMode: false, minLength: 0, maxLength: Infinity }), null);
    });
    it("空索引返回 null", () => {
        assert.equal(selectSentence({}, { categoryKey: null, balancedMode: false, minLength: 0, maxLength: Infinity }), null);
    });
    it("单分类：结果在候选内且索引有效", () => {
        for (let i = 0; i < 50; i++) {
            const picked = selectSentence(index, { categoryKey: "a", balancedMode: false, minLength: 0, maxLength: Infinity });
            assert.ok(picked);
            assert.equal(picked.key, "a");
            assert.ok([5, 10].includes(picked.length));
            assert.ok(picked.selected >= 0 && picked.selected < picked.indexes.length);
        }
    });
    it("长度边界：只取长度在 [min, max] 内的桶", () => {
        for (let i = 0; i < 50; i++) {
            const picked = selectSentence(index, { categoryKey: null, balancedMode: false, minLength: 8, maxLength: 10 });
            assert.ok(picked);
            assert.ok(picked.length >= 8 && picked.length <= 10);
        }
    });
    it("balanced 模式：结果仍在候选内", () => {
        for (let i = 0; i < 50; i++) {
            const picked = selectSentence(index, { categoryKey: null, balancedMode: true, minLength: 0, maxLength: Infinity });
            assert.ok(picked);
            assert.ok(["a", "b"].includes(picked.key));
            assert.ok(picked.selected >= 0 && picked.selected < picked.indexes.length);
        }
    });
    it("单分类时 balanced 与 weighted 结果形态相同", () => {
        for (let i = 0; i < 20; i++) {
            const picked = selectSentence(index, { categoryKey: "b", balancedMode: true, minLength: 0, maxLength: Infinity });
            assert.ok(picked);
            assert.equal(picked.key, "b");
        }
    });
});
