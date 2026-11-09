# 方案 01：GitHub 仓内 JSON 文件

**价格**：完全免费。文档存 `data/dynamic/*.json`（注意：mkdocs 构建输出在 `site/`，
动态数据放源码侧 `data/`，读用 jsDelivr/raw 指 `main` 分支路径）。

## 启用

```js
import { configure, pull, push } from '../backend-options/shared/cloud-sync.js';
configure({ type: 'github', repo: 'IceofTea/QDU-Wiki', branch: 'main', dir: 'data/dynamic' });
const doc = await pull('announcements');
// 管理端写（PAT 只存本机）：
configure({ type:'github', repo:'IceofTea/QDU-Wiki', token: localStorage.wiki_gh_token });
await push('announcements', data);
```

兜底：`https://github.com/IceofTea/QDU-Wiki/edit/main/data/dynamic/announcements.json` 网页提交。

- ⚠️ `contributions` 不适合放公开仓（含投稿人联系方式）——用方案 02/03 存私有 KV/DB
- 小程序侧只读；request 域名加 `cdn.jsdelivr.net`
