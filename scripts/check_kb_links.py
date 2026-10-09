#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""知识库直达链接审计：校验 docs/assets/kb.json 每个 chunk 的 u 在线上是否真实可达。

背景（线上 404 教训）：
  青大智答「直达」按钮的链接由 build_kb.py 生成，曾出现三类坏链：
    1) 路径错：index.md 被拼成 `organization/index`，再加 `#锚点` 变成
       `/organization/index/#x`，GitHub Pages 按目录找 index/index.html → 404
    2) 锚点不存在：中文标题经默认 slugify 变空 → toc 编号 `_N`，
       若与站点真实渲染编号错位，锚点指向不存在的位置
    3) 锚点错位：锚点存在但指向另一个标题（标题顺序对齐失败）

前置：需先 `python -m mkdocs build` 生成 site/，再 `python scripts/build_kb.py`。
用法：python scripts/check_kb_links.py   （退出码 0 = 全部可达且标题对齐）
"""
from __future__ import annotations

import html as html_mod
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
KB = ROOT / "docs" / "assets" / "kb.json"

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

HEAD_RE = re.compile(r'<h([1-6])[^>]*?\bid="([^"]+)"[^>]*>(.*?)</h\1>', re.S)
# path → {id: 标题纯文本}
_page_cache: dict[str, dict[str, str] | None] = {}


def norm(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"[`*_~\[\]()#>|]", "", s)
    s = re.sub(r"\s+", "", s)
    return s.strip("。．.、，,：:；;！!？?“”\"'")


def _locate(raw_path: str) -> Path | None:
    """按真实 URL 语义定位构建产物。

    尾斜杠（目录式 URL）→ <path>/index.html；
    无尾斜杠 → 先 <path>.html（GitHub Pages extensionless fallback），再 <path>/index.html。
    注意：不做 `/index` 宽容归一化——`organization/index/#x` 的真实路径带尾斜杠，
    线上确实 404，必须被本脚本捕获。
    """
    p = raw_path.strip("/")
    if not p:
        return SITE / "index.html"
    if raw_path.endswith("/"):
        return SITE / p / "index.html"
    for c in (SITE / f"{p}.html", SITE / p / "index.html"):
        if c.exists():
            return c
    return SITE / f"{p}.html"


def page_headings(raw_path: str) -> dict[str, str] | None:
    if raw_path in _page_cache:
        return _page_cache[raw_path]
    f = _locate(raw_path)
    heads: dict[str, str] | None = None
    if f and f.exists():
        html = f.read_text(encoding="utf-8", errors="replace")
        heads = {
            m.group(2): html_mod.unescape(re.sub(r"<[^>]+>", "", m.group(3))).strip()
            for m in HEAD_RE.finditer(html)
        }
    _page_cache[raw_path] = heads
    return heads


def main() -> int:
    if not KB.exists():
        print("check_kb_links: 未找到 docs/assets/kb.json，请先运行 python scripts/build_kb.py")
        return 1
    if not SITE.exists():
        print("check_kb_links: 未找到 site/，请先运行 python -m mkdocs build")
        return 1

    data = json.loads(KB.read_text(encoding="utf-8"))
    chunks = data["chunks"]
    bad_path: list[str] = []
    bad_anchor: list[tuple[str, str]] = []
    bad_mismatch: list[tuple[str, str, str]] = []
    noncanon: list[str] = []
    ok = 0

    for c in chunks:
        u = c["u"]
        raw_path, _, anchor = u.partition("#")
        if raw_path and not raw_path.endswith("/"):
            noncanon.append(u)
        heads = page_headings(raw_path)
        if heads is None:
            bad_path.append(u)
            continue
        if anchor:
            if anchor not in heads:
                bad_anchor.append((u, c.get("t", "")))
                continue
            if norm(heads[anchor]) != norm(c.get("t", "")):
                bad_mismatch.append((u, c.get("t", ""), heads[anchor]))
                continue
        ok += 1

    total = len(chunks)
    print(
        f"check_kb_links: {total} 条直达链接 → 可达 {ok}，"
        f"路径失效 {len(bad_path)}，锚点失效 {len(bad_anchor)}，标题错位 {len(bad_mismatch)}，"
        f"非规范URL {len(noncanon)}"
    )
    for u in bad_path[:20]:
        print("  DEAD-PATH    " + u)
    for u, t in bad_anchor[:20]:
        print(f"  DEAD-ANCHOR  {u}  ← {t}")
    for u, t, real in bad_mismatch[:20]:
        print(f"  MISMATCH     {u}  kb「{t}」 vs 站点「{real}」")
    for u in noncanon[:10]:
        print("  NON-CANON    " + u)
    return 1 if (bad_path or bad_anchor or bad_mismatch) else 0


if __name__ == "__main__":
    sys.exit(main())
