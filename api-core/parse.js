// 参数解析：回调名、选择器、严格正整数。
// 回调名只允许合法的 JS 标识符路径，如 show / App.onHitokoto；其余一律拒绝，
// 防止 callback 被拼成任意 JS 代码执行。
const CALLBACK_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/;
// select 只允许简单的 #id / .class / 标签名，encode=js 时才校验。
const SELECTOR_PATTERN = /^(?:[#.][A-Za-z0-9_-]+|[A-Za-z][A-Za-z0-9_-]*)$/;
// 严格正整数：只接受纯数字字符串，12abc / 0x10 / 1.5 / 空格等一律无效。
export function parsePositiveInt(value) {
    if (!/^\d+$/.test(value)) {
        return Number.NaN;
    }
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : Number.NaN;
}

export { CALLBACK_PATTERN, SELECTOR_PATTERN };
