#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""构建 Wiki 知识图谱数据（docs/assets/graph.json）。
节点 = mkdocs nav 正式收录的中文页面（与 build_kb.py 同口径）；
边 = 页面正文里的站内 Markdown 互链（去重、无向、只计双向可达页）。
运行：python scripts/build_graph.py（CI 在 kb 构建后顺带跑）
产物：docs/assets/graph.json（构建产物，gitignore，前端 graph.js 渲染）
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
OUT = DOCS / "assets" / "graph.json"

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

LINK_RE = re.compile(r"(?<!!)\[([^\]]+)\]\(([^)]+)\)")
FENCE_RE = re.compile(r"```.*?```", re.DOTALL)
SKIP_PREFIX = ("http://", "https://", "mailto:", "#", "data:")


def page_id(md: Path) -> str:
    """docs 相对路径去后缀作节点 id（如 new/preparation）。"""
    return md.relative_to(DOCS).with_suffix("").as_posix()


def resolve_link(src: Path, target: str) -> str | None:
    """相对链接解析为节点 id；外链/锚点/缺失返回 None。"""
    t = target.strip().split("#")[0].split("?")[0]
    if not t or t.startswith(SKIP_PREFIX):
        return None
    if t.startswith("/"):
        parts = t.strip("/").split("/")
        # /QDU-Wiki/xxx → docs/xxx
        rel = "/".join(parts[1:]) if len(parts) > 1 else ""
        if not rel:
            return None
        cand = DOCS / rel
    else:
        cand = (src.parent / t).resolve()
    if cand.is_dir():
        cand = cand / "index.md"
    if not cand.suffix and (cand.with_suffix(".md")).exists():
        cand = cand.with_suffix(".md")
    if not cand.is_file() or cand.suffix != ".md":
        return None
    try:
        return page_id(cand)
    except ValueError:
        return None


def main() -> int:
    # 与 kb  builds 同口径：只收中文正式页（排除 en/ 与 share 附件区）
    pages = sorted(
        p for p in DOCS.rglob("*.md")
        if "en" not in p.parts and "share" not in p.parts
    )
    ids = {page_id(p) for p in pages}
    # 分类取一级目录名（与 kb chunk.c 口径对齐：中文名映射）
    cat_of = {}
    for p in pages:
        rel = p.relative_to(DOCS)
        cat_of[page_id(p)] = rel.parts[0] if len(rel.parts) > 1 else "主页"
    edges: set[tuple[str, str]] = set()
    for p in pages:
        src = page_id(p)
        try:
            text = p.read_text(encoding="utf-8")
        except Exception:
            continue
        text = FENCE_RE.sub("", text)
        text = re.sub(r"`[^`\n]+`", "", text)
        for m in LINK_RE.finditer(text):
            dst = resolve_link(p, m.group(2))
            if dst and dst in ids and dst != src:
                edges.add(tuple(sorted((src, dst))))
    # kb chunk 数（节点大小权重，缺 kb 时回退 1）
    chunks: dict[str, int] = {}
    kb_file = DOCS / "assets" / "kb.json"
    if kb_file.exists():
        try:
            kb = json.loads(kb_file.read_text(encoding="utf-8"))
            for ch in kb.get("chunks", []):
                # u 是目录式 URL（organization/、live/map/、空=根），先去锚点再反解成 md 节点 id
                u = str(ch.get("u", "")).split("#", 1)[0].strip("/")
                if u == "":
                    key = "index"
                elif (DOCS / f"{u}/index.md").is_file():
                    key = f"{u}/index"
                else:
                    key = u  # 旧格式 organization/index 或 live/map
                chunks[key] = chunks.get(key, 0) + 1
        except Exception:
            pass
    nodes = [
        {"id": pid, "cat": cat_of[pid], "n": chunks.get(pid, 1)}
        for pid in sorted(ids)
    ]
    out = {"pages": len(nodes), "links": len(edges), "nodes": nodes,
           "edges": [[a, b] for a, b in sorted(edges)]}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"graph: {len(nodes)} 页 / {len(edges)} 条互链 -> assets/graph.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
