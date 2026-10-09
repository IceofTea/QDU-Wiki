#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Wiki 死链审计：docs 内相对 Markdown 链接 + 图片是否存在。
命名 Giscus/Supabase 等外部事项无关，纯本机文件检查，CI 可跑。
用法：python scripts/check_links.py（退出码 0 = 无死链）
只查：[文](../x.md) 与 ![图](../y.png) 相对路径；http(s) 外链跳过；
锚点（#xxx）存在性不校验（Material 渲染锚点与源码标题不完全一致）。
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"

# Windows GBK 控制台打印生僻字必崩：stdout 切 utf-8/replace（交接文档编码坑）
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
SKIP_PREFIX = ("http://", "https://", "mailto:", "#", "data:")

errors: list[str] = []


def check_file(md: Path) -> None:
    text = md.read_text(encoding="utf-8")
    # 去掉围栏代码块（维护指南里的示例链接不是真链接）
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    # 去掉行内代码（`![示例](路径)` 同样只是写法示范）
    text = re.sub(r"`[^`\n]+`", "", text)
    for m in LINK_RE.finditer(text):
        target = m.group(1).strip().split("#")[0].split("?")[0]
        if not target or target.startswith(SKIP_PREFIX):
            continue
        # 站点内绝对路径（/QDU-Wiki/...）映射回 docs
        if target.startswith("/"):
            cand = DOCS / target.lstrip("/").split("/", 1)[-1]
            # 形如 /QDU-Wiki/xxx → docs/xxx；“/” 结尾视为目录索引
            if target.rstrip("/").count("/") <= 1:
                continue
        else:
            cand = (md.parent / target).resolve()
        if cand.is_dir():
            cand = cand / "index.md"
        # 无扩展名指向 Markdown（MkDocs use_directory_urls 风格）
        if not cand.suffix and (cand.with_suffix(".md")).exists():
            cand = cand.with_suffix(".md")
        if not cand.exists():
            errors.append(f"{md.relative_to(ROOT)} → {target}")


def main() -> int:
    mds = sorted(DOCS.rglob("*.md"))
    for md in mds:
        # share/files 下的附件说明不审计（大文件目录）
        if "share" in md.parts:
            continue
        check_file(md)
    print(f"check_links: {len(mds)} 页，死链 {len(errors)} 条")
    for e in errors[:30]:
        print("  DEAD  " + e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
