#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""来源标注体检（**只出报告，默认不改内容、不进 CI 硬门禁**）。

背景：本站有大量来自文件的「硬数字」——奖学金金额、学费、电话、比例、床位、预算额……
红线是「不编造数据」，因此这类数字必须能让读者一眼看出**出处或口径**（例如「以学校现行
有效文件为准」「数据来源：《2026 年青岛大学单位预算》」）。

2026-10-15 的盘点发现：真正带来源/口径标注的只有 ~9 处，首页统计、电话表、学院页电话等
大量数字没有标注。本脚本把「哪些数字缺标注」一次性摊开，便于维护者逐条决定补来源、
加免责语或删数字——**它不做任何自动修改**，也不会让 CI 失败（保持现状不引入新风险）。

用法：
  python scripts/check_source_tags.py              # 体检报告，始终退出码 0
  python scripts/check_source_tags.py --strict     # 仅有发现时退出 1（供人工巡检用，勿接 CI）
  python scripts/check_source_tags.py --zh-only    # 只看中文页

判定口径（宁可少报，不制造噪声）：
  · 只扫「表格行」与「含数字的正文行」；
  · 命中「数字」判定：金额（含 ¥/元/万/亿）、电话（0xxx-xxxxxxx / 11 位手机号）、
    百分比、比例、以及 ≥3 位的纯整数（如床位数、门类数）；
  · 该行（或上方 3 行内）出现以下「出处/口径」标记即视为**已标注**：
    来源 / 数据来源 / 出自 / 以官方为准 / 以当年为准 / 以现行文件为准 / 以学校…为准 /
    文号样式（〔20xx〕）/ 参考 / 依据 / 仅供参考；
  · 跳过：代码块、行内代码、链接目标、autolink、以及「示例/占位」文本。
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# 「有数字」的判定（收紧版：只报真正高风险的类别，避免噪声）
MONEY = re.compile(r"[¥￥]\s?\d|\d+(?:\.\d+)?\s?(?:元|万元|万|亿元|亿)(?![\d.])")
PHONE = re.compile(r"\b(?:0\d{2,3}-\d{6,8}|\d{3,4}-\d{7,8}|1[3-9]\d{9})\b")
# 政策参数类比例：必须与「资格线/比例/标准/要求/覆盖率」等政策词同现
POLICY = re.compile(r"(?:资格线|比例|标准|要求|覆盖率|分数线|门槛|档|名额|学费|住宿费|奖学金)")
PERCENT = re.compile(r"\d+(?:\.\d+)?\s?%")
RATIO = re.compile(r"前\s?\d+(?:\.\d+)?\s?[%‰]|\d+\s?:\s?\d+")
# 规模类整数：必须带量词提示，且排除年份/端口/版本
BIGNUM = re.compile(r"(?:共|约|达|近|超过|超过|在校|现有|设有|拥有)\s?\**\d{3,}(?![\d.%])|\d{3,}\s?(?:余人|人|台|个|间|门|亿|万|㎡|平方米)")
YEAR = re.compile(r"(?:19|20)\d{2}")

# 「已标注出处/口径」的标记
SOURCE_MARK = re.compile(
    r"来源|数据来源|出自|出处|以官方为准|以当年为准|以现行|以学校|以.{0,6}为准|"
    r"〔\s*20\d{2}\s*〕|仅供参考|参考|依据|见.{0,8}(?:文件|通知|公告|附件)|"
    r"subject to|the official .{0,20}prevails|verify on the official|official website|"
    r"compiled from public"
)
# 跳过：示例/占位/引用块/贡献者署名/格式行
SKIP_LINE = re.compile(r"(?i)```|<!--|!\s?\[|^\s*\|?\s*:?-{3,}|\bTODO\b|示例|举例|占位|XXXX|待补充|贡献|编辑于|更新于|^\s*>")
FENCE = re.compile(r"^\s*(```|~~~)")
# 页面级免责：正文开头（前 20 行）出现出处/口径标记，则认为该页整体已交代清楚
PAGE_COVERED_LINES = 20


def strip_masks(line: str) -> str:
    """去掉行内代码与链接目标，避免把代码/URL 里的数字当成正文数字。"""
    line = re.sub(r"`[^`]*`", "", line)
    line = re.sub(r"\]\([^)]*\)", "]", line)
    line = re.sub(r"<[^>]+>", "", line)
    return line


def has_number(line: str) -> str | None:
    """返回命中类别；年份/端口/版本号不算（避免把 2026 年、8000 端口当成硬数字）。"""
    has_year = bool(YEAR.search(line))
    for name, pat in (("金额", MONEY), ("电话", PHONE)):
        if pat.search(line):
            return name
    # 政策参数：比例/百分比必须与政策词同现
    if POLICY.search(line) and (PERCENT.search(line) or RATIO.search(line)):
        return "政策参数"
    if BIGNUM.search(line) and not (has_year and not re.search(r"(?:余人|人|台|个|间|门|亿|万|㎡|平方米)", line)):
        return "规模数字"
    return None


def scan_file(path: Path) -> list[tuple[int, str, str]]:
    out = []
    in_fence = False
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    # 页面级免责：开头若干行已交代出处/口径 → 整页视为已标注
    head = "\n".join(strip_masks(x) for x in lines[:PAGE_COVERED_LINES])
    if SOURCE_MARK.search(head):
        return out
    for i, raw in enumerate(lines):
        if FENCE.match(raw):
            in_fence = not in_fence
            continue
        if in_fence or SKIP_LINE.search(raw):
            continue
        body = strip_masks(raw)
        kind = has_number(body)
        if not kind:
            continue
        # 本行或上方 3 行内有出处标记 → 视为已标注
        window = "\n".join(strip_masks(x) for x in lines[max(0, i - 3):i + 1])
        if SOURCE_MARK.search(window):
            continue
        out.append((i + 1, kind, body.strip()))
    return out


def main() -> int:
    strict = "--strict" in sys.argv
    zh_only = "--zh-only" in sys.argv
    files = sorted(p for p in DOCS.rglob("*.md") if not (zh_only and "en" in p.parts and DOCS / "en" in p.parents))
    total = 0
    by_kind: dict[str, int] = {}
    per_file: list[tuple[str, list]] = []
    for f in files:
        hits = scan_file(f)
        if hits:
            per_file.append((f.relative_to(DOCS).as_posix(), hits))
            total += len(hits)
            for _, kind, _ in hits:
                by_kind[kind] = by_kind.get(kind, 0) + 1

    print(f"扫描 {len(files)} 篇；**未标注出处的数字行 {total} 行**（分类："
          + "、".join(f"{k} {v}" for k, v in sorted(by_kind.items(), key=lambda x: -x[1])) + "）\n")
    for rel, hits in per_file:
        print(f"— {rel}  ({len(hits)} 行)")
        for ln, kind, text in hits[:6]:
            print(f"    L{ln:<4} [{kind}] {text[:100]}")
        if len(hits) > 6:
            print(f"    … 另有 {len(hits) - 6} 行")
    print("\n说明：本脚本不修改任何文件、默认退出码 0（**不要接进 CI 硬门禁**）。")
    print("维护策略（维护者定夺）：① 能查到文件的补「数据来源：…」；② 查不到的加「以当年通知为准」；")
    print("③ 明显易过期的（电话/价格）考虑直接删除或改为引导到官方页面——宁缺勿造。")
    if strict and total:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
