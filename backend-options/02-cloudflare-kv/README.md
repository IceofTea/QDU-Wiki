# 方案 02：Cloudflare Workers + KV（含投稿收件箱）

**价格**：免费档 10 万请求/天。**国内**：多数可通。

```bash
cd backend-options/02-cloudflare-kv
npx wrangler login && npx wrangler kv namespace create WIKI_DOCS
npx wrangler secret put WRITE_TOKEN
npx wrangler secret put READ_TOKEN      # 读 contributions 用
npx wrangler deploy
```

三端点：
- `GET /doc/:key` 读（`contributions` 需 `X-Read-Token`——投稿含联系方式，私有读）
- `PUT /doc/:key` 写（`X-Write-Token`）
- `POST /contribute` 公开投稿追加（≤8KB、滚动保留 500 条）——Wiki 正文仍走 git，这里只是收件箱

```js
configure({ type:'cfkv', base:'https://qdu-wiki-docs.<sub>.workers.dev' });
await pull('announcements');
// 投稿：POST /contribute { title, contact, body }
```
