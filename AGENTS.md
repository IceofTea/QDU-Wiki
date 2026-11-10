# AGENTS.md — 本站维护须知（每次会话必读）

> ⚠️ **每次任何维护任务开始前，请先完整阅读 [`prompt/AGENT-GUIDE.md`](prompt/AGENT-GUIDE.md)**。
> 那是你的「入职培训」总纲，包含本站的目的、架构、逻辑、维护工作流与质量红线。

本入口文件与完整维护文档、社区提示词模板统一收纳在 **`prompt/`** 目录下：

| 文件 | 说明 |
| --- | --- |
| [`prompt/AGENTS.md`](prompt/AGENTS.md) | 本站维护须知（速览版，本入口内容与其一致） |
| [`prompt/AGENT-GUIDE.md`](prompt/AGENT-GUIDE.md) | Agent 规则总纲（必读） |
| [`prompt/prompt.md`](prompt/prompt.md) | 社区「提示词工程」提交模板 |

更多细节请阅读 [`prompt/AGENT-GUIDE.md`](prompt/AGENT-GUIDE.md)。

## CI 红线（2026-11 踩坑补记）

- CI 跑 `mkdocs build --strict`：`docs/**/*.md` 内**禁止指向非文档路径的相对链接**（如 `app/`、本地资源目录）——`validation.links.not_found: warn` 会被 --strict 放大为 fatal，deploy 直接挂。指向站内非文档资源一律写完整 URL（`https://iceoftea.github.io/QDU-Wiki/app/`）。
- 改动 md 后本地可跑 `py -3.13 -m mkdocs build --strict` 预检（本机已装 mkdocs 1.6.1）；Material 团队的版本横幅警告不影响结果。
