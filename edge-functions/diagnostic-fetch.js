// 临时探针：测试边缘函数能否读取同一部署的静态数据。
export default async function onRequest({ request }) {
    try {
        const url = new URL('/sentences/b.json', request.url);
        const headers = {};
        const cookie = request.headers.get('cookie');
        if (cookie) headers.cookie = cookie;
        const response = await fetch(url.toString(), { headers, redirect: 'manual' });
        if (!response.ok) return new Response(`static fetch status: ${response.status}`, { status: 502 });
        const data = await response.json();
        return new Response(`static fetch ok: ${Array.isArray(data) ? data.length : 'not-array'}`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        return new Response(`static fetch failed: ${String(error)}`, { status: 502 });
    }
}
