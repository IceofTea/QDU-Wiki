# 青大百科 · iOS App（uni-app）

> uni-app 源码，HBuilderX 云打包 iOS。与 `mp-weixin/` 完全独立。

## 功能

- 词条索引：复用官网 `search/search_index.json`（三源容错+本地缓存）
- 分栏浏览（新生/学习/生活/学院/服务/社团/词典…）+ 全文搜索
- 词条正文：web-view 直开官网页面，失败可复制链接

## iOS 打包

1. HBuilderX 打开本目录 → `manifest.json` 填 DCloud appid + iOS 证书
2. 发行 → 原生App-云打包 → iOS(ipa)；需 `static/icon.png`（1024²）
