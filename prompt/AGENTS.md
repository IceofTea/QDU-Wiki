# AGENTS.md — 本站维护须知（每次会话必读）

本仓库是**青岛大学 Wiki（QDU-Wiki）**，一个用 MkDocs + Material 构建的非官方校园指南站。

> ⚠️ **每次任何维护任务开始前，请先完整阅读 `prompt/` 目录下的 [`AGENT-GUIDE.md`](AGENT-GUIDE.md)**。
> 那是你的「入职培训」总纲，包含本站的目的、架构、逻辑、维护工作流与质量红线。

## 快速须知

1. **技术栈**：MkDocs + Material，内容全为 Markdown（`docs/` 下），导航定义在 `mkdocs.yml` 的 `nav:`。
2. **站点内容**：`docs/` 下按板块分目录（`new/` 新生手册、`live/` 生活指南、`study/` 学习学业、`college/` 学院详情等）。
3. **硬性红线**：
   - 每次修改后必须执行 `python -m mkdocs build --strict` 确认构建通过；
   - 改 `mkdocs.yml` 注意 YAML 缩进；新增页面要同步加进 nav；
   - 不要删除/重排已有导航项；
   - 不手动改 `site/`（构建产物）；
   - 相对路径链接必须正确；不引入新的外部依赖。
4. **输出语言**：始终使用中文回复与写作；页面内容遵循中文排版（中英文间加空格）。
5. **信息源处理**：图片用 OCR 提文字，长文档提炼成结构化 Markdown，并纳入对应板块。
6. **任务完成后**：如本次维护有实质改动，请在 [`AGENT-GUIDE.md`](AGENT-GUIDE.md) 的「历次维护记录」一节追加一条记录，方便后续 Agent 衔接。

> 更多细节（页面模板、提示框语法、工作流、红线清单）请阅读 [`AGENT-GUIDE.md`](AGENT-GUIDE.md)。
