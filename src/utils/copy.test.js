import { describe, it, expect, vi, afterEach } from "vitest";
import { copyText } from "./copy.js";

describe("copyText", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("Clipboard API 成功时返回 true", async () => {
        Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
        expect(await copyText("hello")).toBe(true);
    });

    it("Clipboard API 被拒时回退 execCommand，成功返回 true", async () => {
        Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
        document.execCommand = vi.fn().mockReturnValue(true);
        expect(await copyText("hello")).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith("copy");
    });

    it("回退 execCommand 返回 false 时返回 false", async () => {
        Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
        document.execCommand = vi.fn().mockReturnValue(false);
        expect(await copyText("hello")).toBe(false);
    });
});
