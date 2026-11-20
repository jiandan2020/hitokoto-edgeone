// 兼容入口（v5.1 过渡期）：API 源逻辑已拆到 api-core/，本文件仅转发。
// build.js 不再从本文件切片生成 edge-functions/api.js。
export { default as onRequest } from "../api-core/handler.js";
