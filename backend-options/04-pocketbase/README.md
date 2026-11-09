# 方案 04：PocketBase + 免费 VPS

**价格**：Oracle Always Free ARM（0 元/月）。投稿审核流选它最顺。

Collections：
- `dyn_docs`：`key`(unique)/`data`——公告/推荐位，读公开写管理员
- `contributions`：`title`/`contact`/`body`/`status`——投稿，
  规则：create=`""`（任何人可投），list/view/update=`@request.auth.id != ""`（仅管理员看）

```js
configure({ type:'pocketbase', base:'https://pb.example.com' });
await pull('announcements');
// 投稿：POST /api/collections/contributions/records { title, contact, body }
```

admin UI `/_/` 直接当审稿台用，零额外开发。
