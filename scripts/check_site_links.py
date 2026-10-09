#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""全站构建产物链接审计：扫 site/**/*.html 里的 href/src，验证目标是否真实存在。

比 scripts/check_links.py（只查 md 相对链接）更全面，能抓到：
  - md_in_html / 绝对路径 / 带锚点链接
  - index.md 类目录式 URL 是否真有对应产物
  - 指向静态资源（图片/PDF）的引用
  - 跨页锚点是否存在

用法：python scripts/check_site_links.py   （退出码 0 = 无死链）
不校验：http(s) 外链、mailto、data:、纯 # 页内锚点（页内锚点单独统计）
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ATTR_RE = re.compile(r'(?:href|src)\s*=\s*"([^"]+)"', re.I)
ID_RE = re.compile(r'id="([^"]+)"')
SKIP_SCHEME = ("http://", "https://", "mailto:", "data:", "javascript:", "tel:", "//")

# 页内锚点缓存
_id_cache: dict[Path, set[str]] = {}


def ids_of(f: Path) -> set[str]:
    if f not in _id_cache:
        _id_cache[f] = set(ID_RE.findall(f.read_text(encoding="utf-8", errors="replace")))
    return _id_cache[f]


def resolve(base_html: Path, target: str) -> tuple[Path | None, str]:
    """返回 (目标文件, 锚点)。文件不存在 → (None, 锚点)。"""
    parts = urlsplit(target)
    path = unquote(parts.path)
    anchor = parts.fragment
    if not path:
        return base_html, anchor  # 纯锚点
    if path.startswith("/"):
        # 站内绝对路径：取去掉站点首段后的相对部分
        segs = [s for s in path.split("/") if s]
        if not segs:
            return SITE / "index.html", anchor
        # GitHub Pages 子路径（/QDU-Wiki/xxx）：首段是站点名，不一定是 docs 根
        cand = SITE.joinpath(*segs)
        if cand.exists():
            return cand, anchor
        # 去掉首段重试（/QDU-Wiki/live/x → site/live/x）
        cand2 = SITE.joinpath(*segs[1:]) if len(segs) > 1 else None
        if cand2 and cand2.exists():
            return cand2, anchor
        return None, anchor

    cand = (base_html.parent / path).resolve()
    if cand.is_dir():
        idx = cand / "index.html"
        return (idx if idx.exists() else None), anchor
    if cand.exists():
        return cand, anchor
    # 目录式 URL 无尾斜杠：live/map → live/map/index.html
    if cand.suffix == "":
        as_dir = cand / "index.html"
        if as_dir.exists():
            return as_dir, anchor
        as_html = cand.with_suffix(".html")
        if as_html.exists():
            return as_html, anchor
    # /index 形式：xxx/index → xxx/index.html（MkDocs 会生成）
    if cand.name == "index" or path.rstrip("/").endswith("/index"):
        alt = SITE / path.lstrip("/") if path.startswith("/") else cand
        if alt.suffix == "" and (alt.with_suffix(".html")).exists():
            return alt.with_suffix(".html"), anchor
    return None, anchor


def main() -> int:
    if not SITE.exists():
        print("check_site_links: 未找到 site/，请先 python -m mkdocs build")
        return 1

    dead: list[str] = []
    dead_anchor: list[str] = []
    pages = sorted(SITE.rglob("*.html"))
    n_refs = 0
    for html in pages:
        text = html.read_text(encoding="utf-8", errors="replace")
        rel_page = html.relative_to(SITE)
        for m in ATTR_RE.finditer(text):
            t = m.group(1).strip()
            if not t or t.lower().startswith(SKIP_SCHEME) or t.startswith("#"):
                continue
            # 页内锚点 + 其它页链接统一处理
            n_refs += 1
            f, anchor = resolve(html, t)
            if f is None:
                dead.append(f"{rel_page} → {t}")
                continue
            if anchor and f.suffix == ".html" and anchor not in ids_of(f):
                dead_anchor.append(f"{rel_page} → {t}")

    print(f"check_site_links: {len(pages)} 页，{n_refs} 个引用，死链 {len(dead)}，锚点失效 {len(dead_anchor)}")
    for d in dead[:40]:
        print("  DEAD   " + d)
    for d in dead_anchor[:40]:
        print("  ANCHOR " + d)
    return 1 if (dead or dead_anchor) else 0


if __name__ == "__main__":
    sys.exit(main())
