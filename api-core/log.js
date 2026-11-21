// 结构化日志：每条日志一行 JSON（时间、级别、事件、上下文），便于在
// Makers 控制台按字段检索。Error 对象单独序列化（直接 stringify 会丢
// message 与 stack）。日志只记录运行状况，不影响接口行为。
function serializeError(error) {
    if (error instanceof Error) {
        return { name: error.name, message: error.message, stack: error.stack };
    }
    return String(error);
}

export function log(level, event, details = {}) {
    const record = { ts: new Date().toISOString(), level, event };
    for (const [key, value] of Object.entries(details)) {
        record[key] = value instanceof Error ? serializeError(value) : value;
    }
    const text = JSON.stringify(record);
    if (level === "error") {
        console.error(text);
    } else if (level === "warn") {
        console.warn(text);
    } else {
        console.log(text);
    }
}
