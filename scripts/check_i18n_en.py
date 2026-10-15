#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""中英对照体检：英文页覆盖率 + 英文页中文残留。

背景：2026-10-15 自检发现 `docs/en/**` 存在「机器翻译长尾漏译」——英文页里仍夹生中文
（该轮人工补了 10 处）。这类缺陷没有门禁扫描时只能靠肉眼，容易随新增页面反复回潮。
本脚本把「哪些中文页没有英文版」与「英文页里还剩多少中文」一次性摊开。

用法：
  python scripts/check_i18n_en.py            # 体检报告，始终退出码 0（不拦流程）
  python scripts/check_i18n_en.py --strict   # 有「缺英文页」或「白名单外的中文残留」时退出 1

判定口径：
  · 缺失英文页：中文页在 docs/en/ 下无同名文件（index.md 对 index.md）。
  · 中文残留：英文页正文出现 CJK 字符。以下为**合理保留**，不计入：
      1) 行尾中文注释行（<!-- ... -->）；
      2) 白名单文件（见 WHITELIST_FILES，整篇允许中文，如群名/组织名清单）；
      3) 行内白名单片段（见 WHITELIST_INLINE 正则，如「（群号 …）」「QQ 群」等专名）；
      4) 代码块 / 行内代码（```…``` 与 `…`）内的中文——通常是命令、路径或原始数据。
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
EN = DOCS / "en"

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

CJK = re.compile(r"[\u4e00-\u9fff]")
FENCE = re.compile(r"^\s*(```|~~~)")

# 整篇允许中文的英文页（专名/群名清单类，翻译反而失真）
WHITELIST_FILES: set[str] = {
    "en/words/index.md",        # 校园黑话词条名本身即专有名词（炎黄YH / 玉环YH …）
    "en/organization/index.md",  # QQ 群名按图原文保留（青大都市第21区大湖…）
}

# 行内允许保留的中文片段（先删掉再判断是否仍有中文）
WHITELIST_INLINE = [
    re.compile(r"`[^`]*`"),                          # 行内代码
    re.compile(r"\]\([^)]*\)"),                      # Markdown 链接 / 图片目标（真实文件名含中文）
    re.compile(r'(?:src|href)\s*=\s*"[^"]*"'),        # HTML 属性值（真实文件名含中文）
    re.compile(r"\*\*[\u4e00-\u9fff][^*]{0,20}\*\*"),  # 贡献者昵称等加粗专名（**鸢.**）
    re.compile(r"[\u4e00-\u9fff]+QQ[\u4e00-\u9fff]*群[\u4e00-\u9fff]*"),  # QQ 群名
    re.compile(r"(青大|青大都市|青岛大学)[\u4e00-\u9fff]*"),              # 学校/组织专名
]


def zh_pages() -> list[Path]:
    out = []
    for p in DOCS.rglob("*.md"):
        if EN in p.parents:
            continue
        out.append(p)
    return sorted(out)


def en_rel_of(zh: Path) -> Path:
    return EN / zh.relative_to(DOCS)


def strip_code(text: str) -> str:
    """删除围栏代码块与行内代码，避免命令/原始数据里的中文被误判。"""
    lines = []
    in_fence = False
    for line in text.splitlines():
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        lines.append("" if in_fence else line)
    body = "\n".join(lines)
    body = re.sub(r"`[^`]*`", "", body)
    body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
    return body


def stray_chinese(text: str) -> list[str]:
    hits = []
    for raw in strip_code(text).splitlines():
        line = raw
        for pat in WHITELIST_INLINE:
            line = pat.sub("", line)
        if CJK.search(line):
            hits.append(raw.strip())
    return hits


def main() -> int:
    strict = "--strict" in sys.argv
    zhs = zh_pages()
    missing = [z for z in zhs if not en_rel_of(z).exists()]

    print(f"did: 中文页 {len(zhs)} 篇；英文页缺 {len(missing)} 篇")
    for z in missing:
        print(f"  ✘ 缺英文版: {z.relative_to(DOCS).as_posix()} → 期望 {en_rel_of(z).relative_to(DOCS).as_posix()}")

    total_lines = 0
    dirty_files = 0
    for en in sorted(EN.rglob("*.md")):
        rel = en.relative_to(DOCS).as_posix()
        if rel in WHITELIST_FILES:
            continue
        hits = stray_chinese(en.read_text(encoding="utf-8", errors="replace"))
        if hits:
            dirty_files += 1
            total_lines += len(hits)
            print(f"  ⚠ 中文残留 {len(hits)} 行: {rel}")
            for h in hits[:5]:
                print(f"      {h[:110]}")
            if len(hits) > 5:
                print(f"      … 另有 {len(hits) - 5} 行")

    print(f"\n汇总：缺英文页 {len(missing)} 篇；含中文残留的英文页 {dirty_files} 篇 / 共 {total_lines} 行")
    if strict and (missing or total_lines):
        print("strict 模式：存在上述问题 → 退出码 1")
        return 1
    print("体检完成（默认不拦截；如已清零可把本脚本以 --strict 接进 CI）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
