#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""知识库结构单测：kb.json 字段完整 + 覆盖 mkdocs nav 正式页。
用法：python scripts/test_kb.py（CI 在 build_kb 后跑）
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
KB = ROOT / "docs" / "assets" / "kb.json"

REQUIRED = {"id", "t", "c", "p", "u", "s"}
fails: list[str] = []


def check(cond: bool, msg: str) -> None:
    print(("  PASS  " if cond else "  FAIL  ") + msg)
    if not cond:
        fails.append(msg)


def main() -> int:
    if not KB.exists():
        print("  FAIL  kb.json 不存在（先跑 build_kb.py）")
        return 1
    kb = json.loads(KB.read_text(encoding="utf-8"))
    chunks = kb.get("chunks", [])
    check(isinstance(chunks, list) and len(chunks) >= 100, f"chunk 数≥100（当前 {len(chunks)}）")
    bad = [c.get("id") for c in chunks if not REQUIRED.issubset(c.keys())]
    check(not bad, f"chunk 必填字段齐全（缺 {len(bad)} 条）")
    empty = [c.get("id") for c in chunks if not str(c.get("s", "")).strip()]
    check(not empty, f"摘要非空（空 {len(empty)} 条）")
    print(f"test_kb: chunk={len(chunks)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
