// 把边缘函数运行时需要的同源静态文件复制进 dist/。
// EdgeOne Makers 以 dist/ 为静态根目录；/sentence-index.json、/sentences/*.json、
// /package.json（/status 取用）与 favicon 等站点文件必须在 dist/ 内才会被 served。
// 只复制，不生成；源文件仍在仓库根目录，check-deployment.js 校验的也是根目录版本。
import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";

const dist = new URL("../dist/", import.meta.url);

function copyFile(name) {
    const src = new URL(`../${name}`, import.meta.url);
    if (!existsSync(src)) {
        throw new Error(`缺少静态文件: ${name}`);
    }
    copyFileSync(src, new URL(name, dist));
}

mkdirSync(new URL("sentences", dist), { recursive: true });
copyFile("sentence-index.json");
cpSync(new URL("../sentences/", import.meta.url), new URL("sentences", dist), { recursive: true });
copyFile("package.json");
copyFile("version.json");
copyFile("LICENSE");
for (const name of ["favicon.svg", "robots.txt", "edgeone-logo.png", "icp-beian.png", "_headers"]) {
    copyFile(name);
}
console.log("静态文件已复制进 dist/。");
