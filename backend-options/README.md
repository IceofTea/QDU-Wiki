# QDU-Wiki 后端备选方案（预置 · 未启用）

> 本站当前是 MkDocs 静态站 + GitHub Pages，**保持现状即可**。
> 本目录为「将来需要动态后端时直接取用」的备选方案，**全部默认关闭**。

## 统一抽象

动态数据抽象为一组 JSON 文档：`announcements`（公告条）、`featured`（首页推荐）、
`contributions`（词条投稿收件箱）、`stats`（运营计数快照）。

```js
pull(key)          // → { data, rev } | null
push(key, data)    // → boolean（仅运营者持写凭据）
```

- `shared/cloud-sync.js` —— Web / uni-app 通用（ESM，fetch）
- `shared/cloud-sync.mp.js` —— 微信小程序专用（CJS，wx.request）

## 方案矩阵

| # | 方案 | 免费额度 | 国内可达 | 适用 |
| --- | --- | --- | --- | --- |
| 01 | GitHub 仓内 JSON 文件 | 完全免费 | ⚠️ 写需代理，jsDelivr 读 | 公告/推荐位低频更新 |
| 02 | Cloudflare Workers + KV | 10万请求/日 | ✅ 多数可通 | 投稿收件箱等实时读写 |
| 03 | LeanCloud | 开发版免费 | ✅ 直达 | 控制台 + 国内稳定 |
| 04 | PocketBase + Oracle VPS | 永久免费 ARM | ✅ 自建 | 投稿审核流/账号体系 |

## 投稿收件箱（contributions）建议流程

读者提交词条草稿 → `push('contributions', ...)` 追加 → 运营者在控制台/管理页审稿 →
采纳后由人把内容写进 MkDocs 源并发布。**Wiki 正文永远走 git 流程**，后端只做「收件箱」。

## 权限模型

- 读公开；写按方案收紧（token/ACL）
- 贡献内容可能含联系方式——`contributions` 文档**设为私有读**（仅管理端拉取），不公开
- token 不进代码、不进小程序包
