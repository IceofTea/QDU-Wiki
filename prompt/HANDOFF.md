# HANDOFF · 三仓接力并入指南（QDU-Wiki / QDU-Nav / FJNU-Nav）

> 本文件与桌面《接力任务-QDU-Nav与Wiki-20261009.md》同步，供**任何一台接续设备** git pull 后直接读取。
> 更新：2026-10-10 第二棒完成回写（原 8 项任务闭环、三仓已推送）。
> **接续者先读 §0 并入流程**（防冲突防丢失），再看 §二 避免重复劳动、§三 开放项。
> 维护总纲见 [AGENT-GUIDE.md](AGENT-GUIDE.md) 的「历次维护记录 · 多设备并行维护接续须知」。

---

> **生成**：2026-10-09 晚 · 第一棒（会话中断收尾）
> **更新**：2026-10-10 11:40 · **第二棒完成回写**——原 8 项任务全部闭环，三仓已全部推送 GitHub 并部署。
> **更新**：2026-10-10 下午 · **第三棒前核查 + 推送实测完成**（VPN 连通后逐仓验证）：
> 内容无丢失；§0.1.1 三处风险已全部解决，三仓真实远端已确认（见 §0.1.1 尾部终态表）。
> **⚠️ 账户归属纠正**：FJNU-Nav 属于 **icyteacn** 账户（非 IceofTea）——推送/拉取一律用本地 `origin`，详见 §0.1.1 红线框。
> **更新**：2026-10-10 晚 · **第四棒完成回写**（工作机 `F:\000000\QSX20261480\disk\学习\wiki\*-agent` 三仓）：
> 按 §0 五步并入（本机三仓无本地独有提交、工作区干净 → 快进融合，全套验证全绿）；
> §三 四个开放项全部处置（见 §三 尾部处置结果表）；p0-p3 逐项核验实际早已闭环（线上 CI 均 success，仅 todo 状态未回写）。
> 三仓终态：QDU-Nav=**v1.6.12**、FJNU-Nav=**v1.5.12**（⚠️仍属 icyteacn，推送一律 `git push origin`）、QDU-Wiki=本 HANDOFF 所在提交（无版本号）。
> **本文档现服务第五棒**：接续者先 `git pull` 读本文件最新更新行，再按 §0 流程操作；§0 仍是必读核心。
> 仓库根：`E:\A老分盘\默认数据D\2025海之子计算机复试电子资料\福star\学习\wiki\{QDU-Nav, FJNU-Nav, QDU-Wiki}`
> 仓库内同源副本：本文件（与桌面《接力任务-QDU-Nav与Wiki-20261009.md》同步维护，新设备 git pull 即可读取）

---

## 〇、你的半成品如何并入（防冲突防丢失，必读）★

### 0.1 三仓当前基线（第二棒推送后，你的改动可能基于旧基线）

| 仓库 | 本机 main HEAD（=第二棒声明的远端位置） | 关键内容 | 本机工作区 |
| --- | --- | --- | --- |
| QDU-Wiki | **`4e47725`** | 直达 404 根治 / 手机端适配 / 群卡片（仅学生组织页保留）/ PR#4、#6 合并 / kb no-cache / `prompt/HANDOFF.md` 接力指南入库 | 干净 |
| QDU-Nav | **`f057f54`** | v1.6.11 busuanzi 三指标共享模块 + 35 应用老前新后 + rebrand 375 修复 + ensureHost 修复 | 干净 |
| FJNU-Nav（⚠️ **icyteacn 账户**） | **`a035081`** | v1.5.11 busuanzi 三指标（**基线已从 1.2.22 跃升至 v1.5.10 后重新移植**） | 干净 |

⚠️ 比 10-09 晚的老基线新很多：FJNU 远端曾领先 92 个提交、QDU-Nav 有 snapshot.yml 每 6h 自动提交。
**你若在老基线上改的，务必完整走完下面五步，不要直接 push。**

### 0.1.1 第三棒前核查发现（2026-10-10 下午 · 必读）★

**内容面：无丢失。** 第一棒全部工作完整并入第二棒提交（QDU-Nav `f480cf3` 13 文件 +244 行、
FJNU `a035081` 8 文件 +198 行，含 AGENTS/CHANGELOG/i18n/版本号/Contributors 全套）。

**交接面：3 处风险，处理如下——**

1. **「三仓已推送」在本机无法实时验证**（写此段时代理 `127.0.0.1:1080` 不通，fetch 失败）。
   本机 `git status -sb` 显示 `ahead QDU-Nav 3 / QDU-Wiki 9 / FJNU 93`——第二棒用
   `git push https://…` URL 直推**不更新本地 origin/main 跟踪引用**，ahead 通常是假象；
   但也可能是真实推送失败。**第三棒第一步必须实测**：
   ```powershell
   git fetch <仓库URL> main
   git log --oneline HEAD..FETCH_HEAD     # 空 = 远端已包含你本地全部提交（推送成功）
   # 若非空：说明远端缺提交 → 本地提交仍完好，push 补推即可（见 0.7）
   ```
   新设备直接 `git clone` 的话天然以远端真实状态为准，不受此干扰。
2. **FJNU `backup-v1223-busuanzi` 分支仅存在于第二棒那台本机**（未推送，无远端跟踪）。
   换设备即丢失——它只是 v1.2.23 旧实现的留档参考（价值低），丢了可弃；
   若第二棒设备还在且想保留：开网后 `git push <FJNU URL> backup-v1223-busuanzi`。
3. **网络实测**：`~/.ssh/config` 的 ssh.github.com 重写常 DNS 不通；HTTPS 走代理时
   先确认代理真的在监听（本机 1080 当时实测不通），再执行 0.3 的 fetch。
   **经验补充（10-10 下午实测）**：VPN 全局/TUN 模式下**直连 github 即可**，走 1080 代理
   反而 git push 大包会超时——优先清空代理环境变量直推。

**✅ 三处风险处置结果（2026-10-10 下午已全部解决，第三棒可无视）：**

| 风险 | 处置 |
| --- | --- |
| 推送未实测 | 已逐仓实测：QDU-Nav `f057f54` 早已在远端（up-to-date）；QDU-Wiki 推上 `8a793d0`；**FJNU-Nav 在正确远端 icyteacn 上早已是 `a035081`（第二棒推送成功，无需任何 merge）**——曾误 fetch/push IceofTea 名下同名旧副本一次，本地已 `reset --hard a035081` 回正 |
| backup 分支未推 | 已推到正确账户：icyteacn 的 `backup-v1223-busuanzi` = `ad54398` |
| 代理不通 | VPN 全局模式下直连（清空代理环境变量）完成推送；走 1080 代理 git push 大包会超时 |

**三仓终态（第三棒以此为准）：**
`QDU-Wiki main = 8a793d0`（IceofTea 账户）· `QDU-Nav main = f057f54`（IceofTea 账户）·
**`FJNU-Nav main = a035081`（⚠️ icyteacn 账户，不是 IceofTea！）**

> ⚠️ **账户归属红线**：FJNU-Nav 属于 **icyteacn**（本地 `origin` = `git@github.com:icyteacn/FJNU-Nav.git`，
> SSH 直连可用）。IceofTea 名下存在一个同名 `IceofTea/FJNU-Nav` **旧副本仓库**——手写 URL 推送极易推错它。
> **推送/拉取 FJNU 一律用 `git push origin` / `git fetch origin`（本地已配好），严禁手写 IceofTea URL。**
> 误推事故已闭环（2026-10-10）：误推到 IceofTea/FJNU-Nav 的 `7b8f130` 已 force-push 回退到 `b2a992f`、
> 误推的 `backup-v1223-busuanzi` 分支已删除，该旧副本已还原；icyteacn 主仓库全程未受影响（现为 `a035081`）。

### 0.2 第 1 步 · 无条件保存你的未提交改动（三个仓库各做一次）

```powershell
# 方案 A（推荐，可回滚、可追溯）
git add -A
git commit -m "wip(device-B): 未完成优化暂存（稍后 rebase 到最新）"

# 方案 B
git stash push -u -m "device-B wip"
```

❌ **严禁** `git checkout .` / `git reset --hard` / `git restore .`——会**直接丢弃**你的半成品。

### 0.3 第 2 步 · 同步远端（网络注意）

```powershell
# 网络：~/.ssh/config 把 github.com 重写到 ssh.github.com:443，该域名常 DNS 不通；
# VPN 全局/TUN 模式下直连即可（清空代理环境变量）；走 127.0.0.1:1080 代理时 git push 大包易超时。
# FJNU-Nav 的 origin（SSH git@github.com:icyteacn/FJNU-Nav.git）实测直连可用。
git fetch https://github.com/IceofTea/QDU-Wiki.git main     # QDU-Nav 同账户换名
git fetch origin                                            # FJNU-Nav 专用（icyteacn，勿手写 URL）
git log --oneline HEAD..FETCH_HEAD      # 远端新增了什么
git diff --stat HEAD FETCH_HEAD         # 哪些文件被动过（评估你的改动撞不撞）
```

### 0.4 第 3 步 · 把你的 wip 叠到最新远端之上

```powershell
git rebase FETCH_HEAD          # 你已 commit（方案A）
# 或 git stash pop             # 你用了 stash（方案B），冲突同样逐文件解

# 有冲突 → git status 列出冲突文件
#        → 手工合并（原则见 0.5）→ git add <file> → git rebase --continue
# 想反悔 → git rebase --abort   （你的提交/改动仍在，绝不丢）
```

**QDU-Nav 特例**：push 被拒（`fetch first`）是 snapshot.yml 自动提交，先 `pull --rebase` 再推。

### 0.5 冲突高危文件清单（第二棒改过；你的改动若涉及，逐行对比取舍）

**QDU-Wiki**
| 文件 | 第二棒做了什么 |
| --- | --- |
| `scripts/build_kb.py` | **大改**：directory_urls 路径规则 + 锚点改从 `site/` 产物提取 + 有界文本对齐 |
| `scripts/build_graph.py` | kb 的 u 反解先去锚点 |
| `docs/javascripts/graph.js` | 新增 `pageUrl()` 修图谱节点 `/index/` 404 |
| `docs/javascripts/fix-board.js` | 新增 `fixHref()` 修纠错记录双 `/QDU-Wiki/` 前缀 404 |
| `docs/javascripts/comments.js` | 主页 hero 内 h1 不挂 💬 徽标（文章页保留） |
| `docs/javascripts/chat-widget.js` | `loadKb` 加 `cache:'no-cache'`（防旧 kb 缓存直达 404，**勿改回**） |
| `docs/stylesheets/extra.css` | hero 防裁（eyebrow 单行/h1 底距高特异性/82vh）、`.qq-*` 群卡片样式、≤600px 隐藏季节按钮 |
| `mkdocs.yml` | nav 新页面一律后置（维护者约定）+ `validation` 固化 |
| `.github/workflows/ci.yml` | 构建顺序 `build --strict → build_kb → 校验链`，strict 步骤注入 `GITHUB_TOKEN` |
| `docs/share/index.md`、`docs/en/share/index.md` | 死链修复 + 群卡片区块后又按维护者要求**删除**（表格末尾新增 logo 两行来自 PR#4） |
| `docs/organization/index.md`、`docs/en/organization/index.md` | 新增「兴趣交流群」2 张群卡片（**保留**） |
| `docs/en/friends/index.md` | 整篇重写（路径 `../../../`→`../../` + mojibake 修复） |
| `prompt/AGENT-GUIDE.md` | 追加 2026-10-10 维护记录（含多设备接续须知） |
| 新增 | `scripts/check_kb_links.py`、`scripts/check_site_links.py`、`docs/pics/share/share-图{1,2}-*.jpg` |
| 删除 | `docs/javascripts/ai-badge.js`（AI 共建应维护者要求删净） |

**QDU-Nav**：`src/utils/busuanzi.js`(新)、`src/router.js`(parseHash 注入)、`src/components/VisitStats.vue`(消 UU+只读共享态)、`src/data/apps.js`(35 应用组内老前新后，`appGroups` 组序未动)、`src/views/RebrandPreview.vue`(375 修复)、`AGENTS.md`/`CHANGELOG.md`/`README.md`/`package.json`/`src/config/site.js`(v1.6.11)、`src/i18n/{zh,en}.js`(bsz* 键)

**FJNU-Nav**：`src/utils/busuanzi.js`(新)、`src/router.js`、`src/components/VisitStats.vue`、`site.js`/`package.json`(1.5.11)、`README.md`/`CHANGELOG.md`/`AGENTS.md`

**冲突解决三原则**
1. **版本号一律以远端为准**（案例：FJNU 本地 1.2.23 vs 远端 1.5.10 → 放弃本地版本提交、按远端序列 bump 1.5.11；旧提交留档分支 `backup-v1223-busuanzi`，可 `git show` 参考但勿直接 merge）
2. **功能代码保留双方**：重复实现取更完善的一版（`git diff` 两边比对）；busuanzi 若你也有实现，以远端 `utils/busuanzi.js` 为准（含 ensureHost 逐个补齐等实测坑修复）
3. **文档日志（AGENTS/CHANGELOG/README）是追加式**：冲突时两段都保留，不要二删一

### 0.6 第 4 步 · 验证（全绿才能推）

```powershell
# QDU-Wiki
python -m mkdocs build --strict
python scripts/build_kb.py          # 必须在 build 之后（锚点取自 site/）
python scripts/test_kb.py           # 3 PASS
python scripts/check_kb_links.py    # 期望「可达 N，路径失效 0，锚点失效 0，标题错位 0」
python scripts/check_links.py       # 0 死链
python scripts/check_site_links.py  # 0 死链 0 锚点失效
# 注意 kb.json 随内容变化条数会变，看「失效 0」而非绝对值

# QDU-Nav
npm run build
python -m unittest discover -s tests        # 18/18
node scripts/unit-grow.mjs                  # 另有 unit-agent/unit-wall/unit-im，全 PASS
node scripts/audit-refs.mjs                 # 0/0

# FJNU-Nav
npm run build
```

### 0.7 第 5 步 · 推送

```powershell
# QDU-Wiki / QDU-Nav（IceofTea 账户）
git push https://github.com/IceofTea/QDU-Wiki.git main
git push https://github.com/IceofTea/QDU-Nav.git main
# FJNU-Nav（⚠️ icyteacn 账户！）——用本地 origin，勿手写 URL
git push origin main
# 推前看一眼有没有别人的新提交：git fetch <对应远端> main && git log --oneline HEAD..FETCH_HEAD
# 推完看 CI：git fetch <url> gh-pages && git log FETCH_HEAD -1
#   出现 "Deployed <你的sha>" = 部署成功；远端 main 前进 = 有人抢推，回 0.4 再 rebase
```

---

## 二、原任务清单状态（第二棒已全部闭环，勿重复劳动）

| # | 任务 | 状态 | 结果与提交 |
| --- | --- | --- | --- |
| 1 | QDU-Nav busuanzi 物尽其用 | ✅ | `f057f54` 共享模块 `utils/busuanzi.js`（串行队列+常驻 span+清空防旧值），CDP 冒烟 ALL PASS |
| 2 | FJNU-Nav 同款接入 | ✅ | `a035081` v1.5.11 三指标与 Vercount 并存；**基于 v1.5.10 重基线移植** |
| 3 | QDU-Wiki 404 全面排查 | ✅ | `bfd128d` build_kb 根治（路径+锚点双因）+ `check_kb_links`/`check_site_links` 双审计 + graph/fix-board 同类修复 + en 死链清零；线上 kb 943 条 0 legacy |
| 4 | Wiki 手机适配 + AI 共建清理 | ✅ | hero 375 溢出 42→0、AI 共建删净（`ai-badge.js` 已删）、主页 h1 不挂徽标、顶栏隐藏季节按钮 |
| 5 | QDU-Nav 375 逐页扫描 | ✅ | 35 应用页 0 溢出（修 rebrand `sp-row3` 撑破 grid） |
| 6 | QDU-Nav 应用排序 | ✅ | 35 应用**组内**老前新后，`appGroups` 组序不动，冲奖六件套后置；谜底：「评委演示」= v1.6.0 冲奖六件套（jobs/compare/flywheel/transplant/profile+buildingGallery） |
| 7 | 群二维码上架 | ✅ | 图入 `docs/pics/share/share-图{1,2}-*.jpg`；**仅学生组织页保留** 2 张兴趣群卡片（share 中英页区块已按维护者要求删除）；群号 837794374 / 1087984049 |
| 8 | 版本与文档 | ✅ | QDU-Nav v1.6.11、FJNU v1.5.11、Wiki 无版本号；三仓日志同步并推送 |

**第二棒额外完成**：CI run failed 修复（strict 步骤缺 `GITHUB_TOKEN` 被 git-committers WARNING 打死，`d218b91`）、PR#6 马院页合并（`cf9f23e`）、kb 请求 `no-cache` 防缓存回潮（`af24fa2`）。

---

## 三、剩余可做（第三棒开放项，与你的半成品一并考虑）

1. **QDU-Wiki**：`check_site_links.py` 尚未入 CI（可加）；`docs/en/graph.md` 不存在而 i18n 会把中文页链接强转 `/en/...`（需 `i18n.js` 的 `toEnHref` 白名单跳过 graph，或补英文版）
2. **QDU-Nav**：CDP 冒烟/扫描脚本在 `C:\Users\13111\AppData\Local\Temp\opencode\`（系统清理即丢），可固化到 `scripts/`；`kb-nav.json` 与 QDU-Wiki kb 的交叉审计未做
3. **FJNU-Nav**：`VisitStats.vue` 尚未接 i18n（该组件现为硬编码中文；若做，参照 QDU 的 `visitStats.bsz*` 键模式）
4. **三仓通用**：你手上那半份「进行了一半的优化」按 §0 并入；若涉及 i18n 线文件（`generate_en.py`、`scripts/update_i18n.py`、`docs/i18n/*`），远端 10-09 已有该线内容，先 `git log` 看它改到哪再叠

### §三 处置结果（2026-10-10 晚 · 第四棒，四项全部闭环）★

| # | 开放项 | 处置 |
| --- | --- | --- |
| 1 | Wiki `check_site_links` 未入 CI / EN 模式 graph 404 | ✅ `ci.yml` 在 `check_links` 后、`gh-deploy` 前插入 `python scripts/check_site_links.py`（死链拦部署）；`docs/i18n/i18n.js` 新增 `ZH_ONLY` 白名单（`graph` / `college/marxism` / `about/agent-features` 三个无英文版页）：`toEnHref` 不改写指向它们的链接 + EN 模式落在白名单页不再被弹回 `/en/` + `SIDEBAR_MAP`/`TAB_MAP` 补 Knowledge Graph / School of Marxism 英译（点击进中文页，与 EN 索引「To be added」口径一致） |
| 2 | QDU CDP 固化 / kb-nav 交叉审计 | ⚠️ CDP 原件在第二棒设备 `C:\Users\13111\...\Temp` 不可恢复——已由入库的 `scripts/e2e-browser.mjs` + `.github/workflows/e2e.yml`（每 push 自动跑，QDU/FJNU 均 success）承接，视为闭环；✅ kb-nav 交叉审计完成：`kb-nav.json` 自 v1.4.0 后首次重生成 **80→104 条（旧 80 条零删减）**，35 应用出处 ⊆ apps.js/router、39 工作流出处 ⊆ workflows.js、4 条 QDU-Wiki 百科出处对 kb 943 chunk 全命中（faq.js 出处俗称→正式页名：生活指南/宿舍→住宿、医院→医疗），**QDU v1.6.12** |
| 3 | FJNU `VisitStats.vue` 未接 i18n | ✅ 硬编码中文全部 t() 化 + zh/en 词包同构新增 `visitStats` 9 键（参照 QDU `visitStats.bsz*` 模式），**FJNU v1.5.12**；顺手回补 Contributors 版本历史 v1.5.11 缺行（第二棒漏挂） |
| 4 | 半成品并入 | ✅ 本机三仓工作区干净且无未推送提交 → 快进融合（无冲突、无遗漏、无删减）；昨日 p0-p3 逐项核验**实际早已全部闭环**（QDU/FJNU deploy+e2e-browser、Wiki pages CI 线上均 success），仅 todo 状态未回写 |

**第四棒验证口径备忘**：本机默认 `python` 是 3.6.8（跑不动 crawler 测试/mkdocs）→ 一律用 **`py -3.13`**（自带 mkdocs 1.6.1）；QDU 单测 18/18 即用 `py -3.13 -m unittest discover -s tests`。

**四棒补记（同日深夜 · 二期「全部优化改进」10 项落地）**：
- §三-1 收口：`graph`/`college/marxism`/`about/agent-features` **三页英文版已补齐**（en nav 后置两入口；agent-features 维持不挂 nav），`ZH_ONLY` 白名单清空（机制保留备用）；sw.js **v2**（kb/graph.json 改网络优先，CORE 只留壳）
- Nav 两仓同批硬化（QDU **v1.6.13** / FJNU **v1.5.14**）：integrity 新增 kb-nav 新鲜度 + i18n 键对等两道硬门禁（FJNU 门禁立即抓到 kb-nav 陈旧 59→83 零删减）；`COMMUNITY_DATA` 测试数据隔离；snapshot 4 次/天→1 次/天；`crosscheck-kbnav.mjs`/`sync-diff.mjs` 入库；e2e-browser 增「375 全应用无横向溢出」
- 三仓终态：QDU-Nav=`1.6.13` 本次提交 · FJNU-Nav=`1.5.14` 本次提交 · QDU-Wiki=本补记所在提交

---

## 四、坑与约定（沿用第一棒 + 第二棒新增）

**继承**
- CJK 文件禁用 PowerShell `Get-Content/Set-Content` 读写（BOM/乱码）→ 用编辑器工具或 Python `encoding='utf-8'`
- PowerShell 内联 `python -e` / `node -e` 转义必炸 → **写临时脚本文件再跑**

**新增**
- ⚠️ **FJNU-Nav 归属 icyteacn 账户**（`git@github.com:icyteacn/FJNU-Nav.git`，本地 origin 已配好）；
  IceofTea 名下有同名旧副本 `IceofTea/FJNU-Nav`——手写 URL 推错会污染它，FJNU 一律 `git push origin` / `git fetch origin`
- git 走 **https URL + VPN/代理**（`~/.ssh/config` 的 ssh.github.com 重写常 DNS 不通）；VPN 全局/TUN 直连即可，1080 代理 push 大包易超时
- `docs/assets/kb.json` 是构建产物（gitignore）但被 chat-widget fetch → chat-widget 已配 `cache:'no-cache'`，**勿改回**
- `build_kb.py` 依赖 `site/` → 本地与 CI 必须 `mkdocs build` 在前（`ci.yml` 已固化顺序，改 CI 时保持）
- nav 新增页面一律放尾部（维护者明确要求，见 AGENT-GUIDE 2026-10-10 记录；与「不要重排导航」红线不冲突）
- 判断 CI 成败看 `gh-pages`：`git fetch <url> gh-pages && git log FETCH_HEAD -1` 出现 `Deployed <sha>` 即成功
- 微信/QQ 群卡片组件类名 `.qq-*` 定义在 `extra.css`，organization 页与 share 页共用（share 已撤、样式保留）

---

## 五、第一棒任务明细存档（全部完成，背景结论仍有效）

### 任务 1 · QDU-Nav busuanzi 三指标（✅ 已完成，实现见 `src/utils/busuanzi.js`）
| 指标 | 语义 | 实现 |
| --- | --- | --- |
| `site_pv` | 全站点击总次数 | 每次导航注入一次 JSONP → +1 |
| `site_uv` | 全站独立访客 | busuanzi 按域名去重 |
| `page_pv` | 单页阅读量 | 按 Referer 计数；**hash 路由下各页共享站点根计数**，前端按 path 缓存展示 |

- 脚本 `https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js`（官方 8.3.2 路径 404）
- 降级：onerror / 10s 超时 → `fail` 文案，不影响其他统计
- 本机 localhost 桶数字巨大属全网共享桶，非 bug；测试污染线上计数 ≈ +10 次属已知

### 任务 3 · 404 根因结论（✅ 已根治，勿重查）
- 双因叠加：`index.md` 拼成 `organization/index/`（带尾斜杠找 `index/index.html` → 404）+ 中文标题默认 slugify 空串 `_N` 编号与站点渲染错位
- 用户报的 `#_4404` 属旧构建产物中间态，现行数据 0 命中
- 修法：路径按 `use_directory_urls`、锚点从 `site/` HTML 提取、双审计脚本守门、chat-widget `no-cache`

### 任务 7 · 群图信息（✅ 已落位，仅学生组织页展示）
- `1.jpg` = 战争雷霆·青大战雷… 群号 **837794374**；`2.jpg` = 准时还QQ贷款分24… 群号 **1087984049**（群名按图原文展示勿补全）
- 规范命名 `docs/pics/share/share-图N-描述.jpg`；卡片组件 `.qq-*`（徽章+等宽群号+响应式二维码+点击看原图）

### 常用验证与工具备忘
```powershell
# CDP 手法（本机 Chrome 仓库禁止 playwright install）
C:\Users\13111\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe `
  --headless=new --remote-debugging-port=9222 --user-data-dir=<临时目录> [--proxy-server=http://127.0.0.1:1080]
# 连 ws：fetch http://127.0.0.1:9222/json/new?<url> (PUT) 取 webSocketDebuggerUrl
# 欢迎屏 sessionStorage key：QDU=qdu_welcome_seen、FJNU=fjnu_welcome_seen（新 tab 必显示，先置 1 再 reload）
# 静态预览：python -m http.server 8789 --directory <repo>\dist （或 mkdocs 的 site/）

# QDU-Wiki 快速体检
python -m mkdocs build --strict; python scripts/build_kb.py; python scripts/test_kb.py
python scripts/check_kb_links.py; python scripts/check_links.py; python scripts/check_site_links.py
```

### 第一棒记录的其他结论
- Wiki 页眉/页脚、导航、平台信息源等细节以 `prompt/AGENT-GUIDE.md` 为准（每次维护后追加记录）
- QDU-Nav `apps.js` 的分组顺序由 `appGroups` 数组显式定义（**不是**数组出现顺序），组内顺序 = 数组顺序
- FJNU 的 Vercount 会自建 `busuanzi_value_site_pv/site_uv` 两个 span → `ensureHost` 必须逐个补齐（否则漏 `page_pv` 卡 loading）
