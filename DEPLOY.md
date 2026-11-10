# 客户端上架部署清单 · QDU-Wiki

> 双端源码已就绪（`app-uniapp/` iOS、`mp-weixin/` 微信小程序）。数据拉 `site/search/search_index.json`。

## 一、微信小程序（约 15 分钟 + 1 处文件）

1. mp.weixin.qq.com 注册小程序 → 拿 **AppID** → AppID 已填 `wx313c28f3fdf79289` → 开发者工具直接导入。
2. **request 合法域名**：
   - `https://iceoftea.github.io`
   - `https://cdn.jsdelivr.net`
   - `https://raw.githubusercontent.com`
3. **业务域名**：~~需配 `iceoftea.github.io`~~ **已不需要**——详情页已改为本地渲染 `search_index.json` 正文（个人主体小程序后台本来就没有业务域名配置项，无需再找）。若日后用企业主体账号想开 web-view 原文，再配业务域名、校验文件放 `docs/`。
4. 上传 → 提审，类目建议「教育 > 教育信息服务」。

## 二、iOS App（uni-app）

同姊妹仓：H5+主屏幕零成本路线，或 Apple 开发者 $99/年走云打包 ipa（`manifest.json` 填 DCloud appid + 证书）。详情见 FJNU-Nav 仓 `DEPLOY.md`。

## 三、后端（可选，默认关闭）

`backend-options/`：02-cloudflare-kv 额外支持 `POST /contribute` 投稿收件箱（私有读、联系方式保护），启用照该 README 执行；Wiki 正文仍走 git 流程不变。

---
*客户端基建记录见 `prompt/AGENT-GUIDE.md` 日志 2026-11-09 条目。*
