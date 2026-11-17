// 统一复制工具：优先用 Clipboard API，失败时回退到 textarea + execCommand，
// 并如实返回是否复制成功，调用方只有拿到 true 才显示“已复制”。
export async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        try {
            textarea.select();
            return document.execCommand("copy");
        } finally {
            textarea.remove();
        }
    }
}
