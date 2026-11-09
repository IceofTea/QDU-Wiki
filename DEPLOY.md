# 客户端上架部署清单 · QDU-Wiki

> 双端源码已就绪（`app-uniapp/` iOS、`mp-weixin/` 微信小程序）。数据拉 `site/search/search_index.json`。

## 一、微信小程序（约 15 分钟 + 1 处文件）

1. mp.weixin.qq.com 注册小程序 → 拿 **AppID** → AppID 已填 `wx313c28f3fdf79289` → 开发者工具直接导入。
2. **request 合法域名**：
   - `https://iceoftea.github.io`
   - `https://cdn.jsdelivr.net`
   - `https://raw.githubusercontent.com`
3. **业务域名**（词条详情页 web-view 用，否则自动降级为「复制链接」提示，不影响其他功能）：
   - mp 后台 → 开发设置 → 业务域名 → 添加 `https://iceoftea.github.io`
   - 下载其提供的**校验文件**（形如 `MP_verify_xxxx.txt`），放入本仓 **`docs/` 目录**（mkdocs 会原样发布到站点根）→ push 部署 → 回后台点「保存并验证」。
4. 上传 → 提审，类目建议「教育 > 教育信息服务」。

## 二、iOS App（uni-app）

同姊妹仓：H5+主屏幕零成本路线，或 Apple 开发者 $99/年走云打包 ipa（`manifest.json` 填 DCloud appid + 证书）。详情见 FJNU-Nav 仓 `DEPLOY.md`。

## 三、后端（可选，默认关闭）

`backend-options/`：02-cloudflare-kv 额外支持 `POST /contribute` 投稿收件箱（私有读、联系方式保护），启用照该 README 执行；Wiki 正文仍走 git 流程不变。

---
*客户端基建记录见 `prompt/AGENT-GUIDE.md` 日志 2026-11-09 条目。*
