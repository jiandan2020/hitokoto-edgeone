<template>
    <div class="docs-view">
        <header class="docs-header">
            <div class="container">
                <p class="eyebrow">HITOKOTO · 接口文档</p>
                <h1>接口文档</h1>
                <p class="intro">一言指一句话，可以是动漫台词或网络小段子。本接口随机返回一句语录，支持按分类和长度筛选，以及 JSON、纯文本、JS 脚本三种返回格式。</p>
                <a class="btn btn-primary" href="/api" target="_blank" rel="noopener">试试接口 ↗</a>
            </div>
        </header>
        <div class="container docs-layout">
            <details class="toc" :open="tocOpen" @toggle="onTocToggle">
                <summary class="toc-title">目录</summary>
                <a
                    v-for="item in tocItems"
                    :key="item.id"
                    :href="`#${item.id}`"
                    :class="{ active: activeSection === item.id }"
                    @click="onTocClick"
                >
                    {{ item.label }}
                </a>
            </details>
            <div class="docs-body">
                <section id="sec-1">
                    <h2>1. 概述</h2>
                    <p>一言（Hitokoto）指一句语录，内容可为动漫台词、网络段子等。本接口用于随机返回一句语录，支持按分类和长度筛选，并提供 JSON、纯文本、JavaScript 脚本三种返回格式。</p>
                    <p>本服务提供单一随机语录接口。语录数据来自 <a href="https://github.com/hitokoto-osc/sentences-bundle" target="_blank" rel="noopener noreferrer"><code>sentences-bundle</code></a>，当前共收录 11,277 条，分为 12 个分类。接口部署于腾讯云 EdgeOne Pages，域名为 <code>hitokoto.xzccs.top</code>。</p>
                </section>
                <section id="sec-2">
                    <h2>2. 请求地址</h2>
                    <CodeExample code="GET https://hitokoto.xzccs.top/api" :show-copy="true" />
                    <p>接口仅接受 <code>GET</code> 与 <code>OPTIONS</code> 请求，其他请求方法返回 <code>405</code>。浏览器预检请求 <code>OPTIONS /api</code> 返回 <code>200</code>。</p>
                </section>
                <section id="sec-3">
                    <h2>3. 请求参数</h2>
                    <p>所有查询参数均为可选。参数需置于 URL 查询字符串中。</p>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>参数</th><th>说明</th><th>默认值</th><th>示例</th></tr></thead>
                            <tbody>
                                <tr v-for="row in paramRows" :key="row.name">
                                    <td><code>{{ row.name }}</code></td>
                                    <td v-html="row.description"></td>
                                    <td>{{ row.defaultValue }}</td>
                                    <td><code>{{ row.example }}</code></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <h3>3.1 参数补充规则</h3>
                    <ul>
                        <li>相同参数重复出现时，仅读取第一个值。</li>
                    </ul>
                </section>
                <section id="sec-4">
                    <h2>4. 句子分类</h2>
                    <p>通过 <code>c</code> 参数指定一个分类；不传 <code>c</code> 时从全部分类中筛选。</p>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>代码</th><th>分类</th><th>说明</th></tr></thead>
                            <tbody>
                                <tr v-for="cat in categoryRows" :key="cat.key">
                                    <td><a :href="`/api?c=${cat.key}`" target="_blank" rel="noopener"><code>{{ cat.key }}</code></a></td>
                                    <td>{{ cat.label }}</td>
                                    <td>{{ cat.description }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
                <section id="sec-5">
                    <h2>5. 返回编码</h2>
                    <h3>5.1 JSON（默认）</h3>
                    <p>成功时返回一个对象。字段值取决于语录数据，部分字段可能为 <code>null</code>。</p>
                    <p>响应头：</p>
                    <CodeExample code="Content-Type: application/json; charset=UTF-8" />
                    <h3>5.2 纯文本</h3>
                    <p>使用 <code>encode=text</code> 时，仅返回语录正文。</p>
                    <p>响应头：</p>
                    <CodeExample code="Content-Type: text/plain; charset=UTF-8" />
                    <h3>5.3 JavaScript</h3>
                    <p>使用 <code>encode=js</code> 时，返回一段脚本。脚本执行时将正文写入 <code>select</code> 指定元素的 <code>innerText</code>。</p>
                    <p>响应头：</p>
                    <CodeExample code="Content-Type: application/javascript; charset=UTF-8" />
                    <p>页面使用示例：</p>
                    <CodeExample code="<p id=&quot;hitokoto&quot;></p>&#10;<script src=&quot;https://hitokoto.xzccs.top/api?encode=js&amp;select=%23hitokoto&quot;></script>" />
                </section>
                <section id="sec-6">
                    <h2>6. 回调</h2>
                    <p>使用 <code>callback=show</code> 时，响应形如：</p>
                    <CodeExample code=";show(&quot;内容&quot;);" />
                </section>
                <section id="sec-7">
                    <h2>7. 返回字段</h2>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>字段</th><th>说明</th></tr></thead>
                            <tbody>
                                <tr v-for="row in fieldRows" :key="row.name">
                                    <td><code>{{ row.name }}</code></td>
                                    <td v-html="row.description"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
                <section id="sec-8">
                    <h2>8. 状态码与错误</h2>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>状态码</th><th>含义</th></tr></thead>
                            <tbody>
                                <tr v-for="row in statusRows" :key="row.code">
                                    <td><code>{{ row.code }}</code></td>
                                    <td v-html="row.description"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p>错误以 JSON 返回，包含 <code>code</code>、<code>message</code> 和毫秒级时间戳 <code>timestamp</code>。示例：</p>
                    <CodeExample code='{"code":400,"message":"min_length 必须是正整数","timestamp":1730000000000}' />
                </section>
                <section id="sec-9">
                    <h2>9. 示例</h2>
                    <h3>9.1 随机 JSON</h3>
                    <p>请求：</p>
                    <CodeExample code="GET /api" />
                    <p>响应：</p>
                    <CodeExample :code="exampleJson" />
                    <h3>9.2 动画分类</h3>
                    <p>请求：</p>
                    <CodeExample code="GET /api?c=a" />
                    <p>响应：</p>
                    <CodeExample :code="exampleAnime" />
                    <h3>9.3 纯文本</h3>
                    <p>请求：</p>
                    <CodeExample code="GET /api?encode=text" />
                    <p>响应：</p>
                    <CodeExample code="风有约，花不误，岁岁年年不相负。" />
                    <h3>9.4 更多示例</h3>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>功能</th><th>请求示例</th></tr></thead>
                            <tbody>
                                <tr v-for="row in moreExamples" :key="row.label">
                                    <td>{{ row.label }}</td>
                                    <td><a :href="row.path" target="_blank" rel="noopener"><code>{{ row.path }}</code></a></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
                <section id="sec-10">
                    <h2>10. 注意事项</h2>
                    <ol>
                        <li>站点流量较大时，建议在程序中使用缓存减轻请求压力，或自行部署接口（项目源码见 <a href="https://github.com/jiandan2020/hitokoto-edgeone" target="_blank" rel="noopener noreferrer">GitHub 仓库</a>）。</li>
                    </ol>
                </section>
                <section id="playground">
                    <ApiPlayground />
                </section>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import CodeExample from "../components/CodeExample.vue";
import ApiPlayground from "../components/ApiPlayground.vue";

const tocItems = [
    { id: "sec-1", label: "1. 概述" },
    { id: "sec-2", label: "2. 请求地址" },
    { id: "sec-3", label: "3. 请求参数" },
    { id: "sec-4", label: "4. 句子分类" },
    { id: "sec-5", label: "5. 返回编码" },
    { id: "sec-6", label: "6. 回调" },
    { id: "sec-7", label: "7. 返回字段" },
    { id: "sec-8", label: "8. 状态码与错误" },
    { id: "sec-9", label: "9. 示例" },
    { id: "sec-10", label: "10. 注意事项" },
    { id: "playground", label: "在线调试" },
];

const paramRows = [
    { name: "c", description: "分类代码，取值为 <code>a</code>–<code>l</code>。不传或为空时从所有分类中筛选；仅读取第一个 <code>c</code>，不支持多分类同时筛选。未知分类通常返回 <code>404</code>。", defaultValue: "—", example: "c=a" },
    { name: "mode", description: "抽取模式。<code>weighted</code>：默认模式，全库等概率抽取，大分类更容易被抽中；<code>category</code>（别名 <code>balanced</code>）：先在符合条件的分类中等概率抽取一个分类，再在该分类内等概率抽取一句，使小分类与大分类机会均等。仅指定一个分类时，两种模式结果相同。其他取值返回 <code>400</code>。", defaultValue: "weighted", example: "mode=category" },
    { name: "encode", description: "返回格式，支持 <code>json</code>（默认）、<code>text</code>、<code>js</code>。其他值按 JSON 返回，且不应用 <code>callback</code>。", defaultValue: "json", example: "encode=text" },
    { name: "min_length", description: "最小长度，包含边界。不传时不限制下限。只能使用正整数。", defaultValue: "—", example: "min_length=10" },
    { name: "max_length", description: "最大长度，包含边界。不传时不限制上限。只能使用正整数，且不能小于 <code>min_length</code>。", defaultValue: "—", example: "max_length=20" },
    { name: "select", description: "仅用于 <code>encode=js</code>，指定页面上的 CSS 选择器。默认值为 <code>.hitokoto</code>。目标元素必须存在。", defaultValue: ".hitokoto", example: "select=%23hitokoto" },
    { name: "callback", description: "非空时，将 <code>json</code>、<code>text</code> 或 <code>js</code> 结果包装为 JavaScript 函数调用。对于 JSON 格式，回调参数为 JSON 字符串，而非对象。仅接受合法函数名，如 <code>show</code>、<code>App.onHitokoto</code>；其他值返回 <code>400</code>。", defaultValue: "—", example: "callback=show" },
];

const categoryRows = [
    { key: "a", label: "动画", description: "动画类语录" },
    { key: "b", label: "漫画", description: "漫画类语录" },
    { key: "c", label: "游戏", description: "游戏类语录" },
    { key: "d", label: "文学", description: "主要收录现代文学，如小说、散文、戏剧" },
    { key: "e", label: "原创", description: "原创类语录" },
    { key: "f", label: "网络", description: "来自网络的语录" },
    { key: "g", label: "其他", description: "其他类语录" },
    { key: "h", label: "影视", description: "影视类语录" },
    { key: "i", label: "诗词", description: "主要收录中国古代文学，如诗、歌、词、赋、曲" },
    { key: "j", label: "网易云", description: "主要收录网易云音乐热评" },
    { key: "k", label: "哲学", description: "哲学类语录" },
    { key: "l", label: "抖机灵", description: "抖机灵类语录" },
];

const fieldRows = [
    { name: "id", description: "语录编号" },
    { name: "hitokoto", description: "语录正文" },
    { name: "type", description: "分类代码" },
    { name: "from", description: "出处" },
    { name: "from_who", description: "作者或来源人物，可能为 <code>null</code>" },
    { name: "length", description: "数据记录的语录长度" },
    { name: "timestamp", description: "响应生成时的 Unix 时间戳，单位毫秒" },
];

const statusRows = [
    { code: "200", description: "请求成功；<code>OPTIONS</code> 预检也返回 <code>200</code>。" },
    { code: "400", description: "长度参数解析后不是正整数，或最大长度小于最小长度，或 <code>mode</code> 不是 <code>weighted</code>、<code>category</code>、<code>balanced</code> 之一，或 <code>callback</code> 不是合法函数名，或 <code>select</code> 不是合法选择器。" },
    { code: "404", description: "没有符合筛选条件的语录。" },
    { code: "405", description: "仅支持 <code>GET</code> 与 <code>OPTIONS</code> 请求。" },
    { code: "500", description: "服务处理请求时发生异常。" },
];

const moreExamples = [
    { label: "长度筛选", path: "/api?min_length=10&max_length=20" },
    { label: "分类均衡抽取", path: "/api?mode=category" },
    { label: "生成页面脚本", path: "/api?encode=js&select=%23hitokoto" },
    { label: "文本回调", path: "/api?encode=text&callback=show" },
    { label: "JSON 回调", path: "/api?callback=show" },
];

const exampleJson = `{
  "id": 4529,
  "hitokoto": "如果争端能够避免，那我们应当沉默——如果战斗是必须的，那就战斗到最后！",
  "type": "c",
  "from": "明日方舟",
  "from_who": null,
  "length": 35,
  "timestamp": 1794876477309
}`;

const exampleAnime = `{
  "id": 13467,
  "hitokoto": "我们以后，也要一直在一起。",
  "type": "a",
  "from": "擅长捉弄的高木同学",
  "from_who": "山本崇一朗",
  "length": 13,
  "timestamp": 1794876482819
}`;

const activeSection = ref("");
const tocOpen = ref(true);
let observer = null;

function onTocToggle(event) {
    tocOpen.value = event.target.open;
}

function onTocClick() {
    if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) {
        tocOpen.value = false;
    }
}

onMounted(() => {
    if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) {
        tocOpen.value = false;
    }
    if (!("IntersectionObserver" in window)) {
        return;
    }
    observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                activeSection.value = entry.target.id;
            }
        });
    }, { rootMargin: "-80px 0px -70% 0px" });
    document.querySelectorAll(".docs-body section[id]").forEach((section) => {
        observer.observe(section);
    });
});

onUnmounted(() => {
    if (observer) {
        observer.disconnect();
    }
});
</script>

<style scoped>
.docs-view {
    padding-bottom: 64px;
}

.docs-header {
    padding: 56px 0 32px;
}

.eyebrow {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--color-primary);
}

.docs-header h1 {
    margin: 0 0 12px;
    font-size: clamp(30px, 5vw, 42px);
}

.intro {
    margin: 0 0 20px;
    max-width: 720px;
    font-size: 16px;
    color: var(--color-text-secondary);
    line-height: 1.7;
}

.btn {
    display: inline-block;
    padding: 11px 24px;
    border-radius: var(--radius-full);
    font-size: 15px;
    font-weight: 600;
    border: 1px solid transparent;
    transition: all var(--transition-fast);
}

.btn-primary {
    background: var(--color-primary);
    color: #fff;
}

.btn-primary:hover {
    background: var(--color-primary-hover);
    text-decoration: none;
}

.docs-layout {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 32px;
    align-items: start;
}

.docs-layout > * {
    min-width: 0;
}

.toc {
    position: sticky;
    top: calc(var(--header-height) + 16px);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    padding: 12px;
}

.toc-title {
    padding: 6px 10px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
}

.toc a {
    display: block;
    padding: 7px 10px;
    border-radius: var(--radius-md);
    font-size: 14px;
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);
}

.toc a:hover {
    color: var(--color-text);
    background: var(--color-surface-variant);
    text-decoration: none;
}

.toc a.active {
    color: var(--color-primary-text);
    background: var(--color-primary-container);
    font-weight: 600;
}

.docs-body section {
    scroll-margin-top: calc(var(--header-height) + 16px);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 28px 30px;
    margin-bottom: 20px;
    box-shadow: var(--shadow-sm);
}

.docs-body section h2 {
    margin: 0 0 14px;
    font-size: 22px;
}

.docs-body section h3 {
    margin: 22px 0 10px;
    font-size: 17px;
}

.docs-body section p {
    margin: 0 0 12px;
    line-height: 1.75;
    color: var(--color-text-secondary);
}

.docs-body section p:last-child {
    margin-bottom: 0;
}

.docs-body section code {
    padding: 2px 6px;
    background: var(--color-surface-variant);
    border-radius: 6px;
    font-size: 0.92em;
}

.docs-body section ul,
.docs-body section ol {
    margin: 0 0 12px;
    padding-left: 22px;
    line-height: 1.75;
    color: var(--color-text-secondary);
}

.table-wrap {
    overflow-x: auto;
    margin: 0 0 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.table-wrap table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.table-wrap th,
.table-wrap td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
    line-height: 1.6;
}

.table-wrap tr:last-child th,
.table-wrap tr:last-child td {
    border-bottom: 0;
}

.table-wrap th {
    background: var(--color-surface-variant);
    font-weight: 700;
    white-space: nowrap;
}

.table-wrap td code {
    white-space: nowrap;
}

.docs-body section .code-example {
    margin: 0 0 12px;
}

@media (max-width: 900px) {
    .docs-layout {
        grid-template-columns: 1fr;
    }

    .toc {
        position: static;
    }

    .docs-body section {
        padding: 22px 20px;
    }
}

@media (max-width: 600px) {
    .docs-header {
        padding: 36px 0 24px;
    }

    .docs-body section {
        padding: 20px 16px;
    }

    .docs-body section h2 {
        font-size: 20px;
    }

    .table-wrap table {
        font-size: 13px;
    }

    .table-wrap th,
    .table-wrap td {
        padding: 8px 10px;
    }

    .table-wrap td code {
        white-space: normal;
        word-break: break-all;
    }
}
</style>
