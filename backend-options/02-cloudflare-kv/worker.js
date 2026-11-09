// 文件路径: /qdu-wiki/backend-options/02-cloudflare-kv/worker.js
// GET /doc/:key 读（contributions 需 X-Read-Token）；PUT /doc/:key 写（X-Write-Token）。
// POST /contribute 追加投稿（公开写但仅限该键，且有长度/频率约束）。KV binding = WIKI_DOCS。

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Write-Token,X-Read-Token',
};
const PRIVATE_KEYS = new Set(['contributions']);

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/contribute') {
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
      const s = JSON.stringify(body);
      if (s.length > 8000) return json({ error: 'too large' }, 413);
      const list = (await env.WIKI_DOCS.get('contributions', 'json')) || [];
      list.push({ at: Date.now(), ...body });
      await env.WIKI_DOCS.put('contributions', JSON.stringify(list.slice(-500)));
      return json({ ok: true });
    }

    const m = url.pathname.match(/^\/doc\/([\w-]+)$/);
    if (!m) return json({ error: 'not found' }, 404);
    const key = m[1];

    if (request.method === 'GET') {
      if (PRIVATE_KEYS.has(key) && request.headers.get('X-Read-Token') !== env.READ_TOKEN)
        return json({ error: 'forbidden' }, 403);
      const v = await env.WIKI_DOCS.get(key, 'json');
      return v === null ? json({ error: 'empty' }, 404) : json(v);
    }
    if (request.method === 'PUT') {
      if (!env.WRITE_TOKEN || request.headers.get('X-Write-Token') !== env.WRITE_TOKEN)
        return json({ error: 'forbidden' }, 403);
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
      if (body === null || typeof body !== 'object' || Array.isArray(body))
        return json({ error: 'body must be JSON object' }, 400);
      await env.WIKI_DOCS.put(key, JSON.stringify(body));
      return json({ ok: true });
    }
    return json({ error: 'method not allowed' }, 405);
  },
};

function json(v, status = 200) {
  return new Response(JSON.stringify(v), {
    status, headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
