# 方案 03：LeanCloud（国内直达）

**价格**：开发版免费。**国内**：✅ 免梯子。

1. leancloud.cn 建应用 → 记 AppID/AppKey/REST 域名
2. Class `DynDoc`：`key`/`data`——公告/推荐位
3. Class `Contribution`：`title`/`contact`/`body`/`status`——投稿收件箱，
   **读权限收紧为仅管理员**（含联系方式），写可开放
4. 接入：`configure({ type:'leancloud', base:'…', appId:'…', appKey:'…' })`

⚠️ AppKey 前端可见——靠 Class ACL 做真正权限分离。
