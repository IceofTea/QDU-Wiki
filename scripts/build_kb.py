#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
构建 QDU-Wiki 站内检索知识库（docs/assets/kb.json）

职责：
  1. 从 mkdocs.yml 的 nav 收集正式展示的页面（排除 words/share/about 等非问答板块）
  2. 按 H2/H3 标题将每个页面切成信息块，并用与 MkDocs 一致的 toc 算法生成标题锚点
  3. jieba 精确分词 + 去停用词，构建 BM25 倒排索引（标题词加权）
  4. 输出紧凑 JSON，供前端 chat-widget.js 在浏览器内完成本地检索

运行：python scripts/build_kb.py
产物：docs/assets/kb.json（构建产物，已被 .gitignore 忽略，由 CI 自动生成）
"""
from __future__ import annotations

import html as html_mod
import json
import re
import sys
from pathlib import Path

import jieba
import markdown
import yaml

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
OUT = DOCS / "assets" / "kb.json"
MKDOCS_YML = ROOT / "mkdocs.yml"

# 与 mkdocs.yml 保持一致的扩展（保证标题锚点 id 与站点渲染结果一致）
MD_EXTENSIONS = [
    "toc",
    "md_in_html",
    "admonition",
    "pymdownx.superfences",
    "pymdownx.details",
    "pymdownx.tabbed",
    "attr_list",
    "pymdownx.tilde",
]

# 无问答价值的板块前缀，不进入知识库
EXCLUDE_PREFIXES = ("words/", "share/", "about/")

# 中文停用词（虚词 / 高频无区分度词）
STOPWORDS = set(
    """
    的 了 和 与 及 或 在 是 有 也 都 而 但 并 又 很 更 最 么 吗 呢 吧 啊 呀 哦 嘛 哈
    一个 一种 一些 我们 你们 他们 咱们 大家 自己 这个 那个 这些 那些 什么 怎么 怎样 如何
    可以 可能 需要 应该 必须 要 会 能 能够 没有 还有 还是 就是 但是 而且 然后 如果 因为 所以
    比如 例如 此外 另外 其中 以及 一下 一般 通常 大概 是否 不是 非常 等等 本身 关于
    从 到 于 对 把 被 让 给 向 往 按 根据 按照 通过 利用 使用 进行 认为 觉得 请 请问
    年 月 日 时 分 秒 今天 明天 昨天 今年 去年 每年 现在 时候
    """.split()
)

jieba.setLogLevel(60)

HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*#*\s*$")


def log(msg: str) -> None:
    print(f"[build_kb] {msg}")


class NavLoader(yaml.SafeLoader):
    """安全降级：把 !!python/object/apply 等 python 标签当普通值处理，不执行任何代码"""


def _noop_py_tag(loader: NavLoader, tag_suffix: str, node) -> object:
    if isinstance(node, yaml.ScalarNode):
        return loader.construct_scalar(node)
    if isinstance(node, yaml.SequenceNode):
        return loader.construct_sequence(node)
    if isinstance(node, yaml.MappingNode):
        return loader.construct_mapping(node, deep=True)
    return None


NavLoader.add_multi_constructor("tag:yaml.org,2002:python/", _noop_py_tag)
NavLoader.add_constructor(
    "!ENV",
    lambda loader, node: loader.construct_sequence(node) if isinstance(node, yaml.SequenceNode) else loader.construct_scalar(node),
)


def collect_nav_pages() -> dict[str, list[str]]:
    """解析 mkdocs.yml 的 nav，返回 {md相对路径: [面包屑分类...]}"""
    cfg = yaml.load(MKDOCS_YML.read_text(encoding="utf-8"), Loader=NavLoader)
    pages: dict[str, list[str]] = {}

    def walk(items: list, crumbs: list[str]) -> None:
        for item in items:
            if isinstance(item, str):
                if item.endswith(".md"):
                    pages[item] = list(crumbs)
                continue
            if not isinstance(item, dict):
                continue
            for key, value in item.items():
                if isinstance(value, str) and value.endswith(".md"):
                    pages[value] = list(crumbs)
                elif isinstance(value, list):
                    walk(value, crumbs + [key])

    walk(cfg.get("nav", []), [])
    return pages


def render_heads(md_text: str) -> list[tuple[str, str]]:
    """渲染整页，返回标题序列 [(id, 标题文本), ...]（与站点锚点一致）"""
    html = markdown.markdown(md_text, extensions=MD_EXTENSIONS)
    heads = []
    for m in re.finditer(r"<h([1-6])[^>]*?id=\"([^\"]+)\"[^>]*>(.*?)</h\1>", html, re.S):
        title = re.sub(r"<[^>]+>", "", m.group(3))
        heads.append((m.group(2), html_mod.unescape(title).strip()))
    return heads


def split_blocks(lines: list[str]) -> list[tuple[int, str, list[str]]]:
    """按标题行切块，返回 [(层级, 标题, 行列表)]；页首（H1 之后、首个 H2 之前）为层级 0 空标题块"""
    blocks: list[tuple[int, str, list[str]]] = []
    pending: list[str] = []
    cur: tuple[int, str, list[str]] | None = None
    in_fence = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            (cur[2] if cur else pending).append(line)
            continue
        if not in_fence:
            m = HEADING_RE.match(line)
            if m and len(m.group(1)) >= 2:
                if cur is not None and cur[2]:
                    blocks.append(cur)
                elif pending:
                    blocks.append((0, "", pending))
                    pending = []
                cur = (len(m.group(1)), m.group(2).strip(), [])
                continue
        (cur[2] if cur else pending).append(line)
    if pending:
        blocks.append((0, "", pending))
    elif cur is not None and cur[2]:
        blocks.append(cur)
    return blocks


def block_to_text(md_lines: list[str]) -> str:
    """把一块 markdown 渲染后去标签，得到纯文本"""
    text = " ".join(md_lines)
    html = markdown.markdown(text, extensions=MD_EXTENSIONS)
    text = re.sub(r"<[^>]+>", "", html)
    text = html_mod.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> list[str]:
    out = []
    for w in jieba.lcut(text):
        w = w.strip()
        if not w or w in STOPWORDS:
            continue
        if not re.search(r"[\u4e00-\u9fff0-9A-Za-z]", w):
            continue
        out.append(w)
    return out


def main() -> int:
    pages = collect_nav_pages()
    selected = [
        (rel, crumbs)
        for rel, crumbs in pages.items()
        if not rel.startswith(EXCLUDE_PREFIXES)
    ]
    log(f"nav 共 {len(pages)} 页，纳入知识库 {len(selected)} 页")

    chunks: list[dict] = []
    vocab: set[str] = set()
    df: dict[str, set[int]] = {}
    postings: dict[str, dict[int, int]] = {}
    skipped: list[str] = []

    for rel, crumbs in sorted(selected):
        src = DOCS / rel
        if not src.exists():
            log(f"  缺失文件，跳过: {rel}")
            continue
        md_text = src.read_text(encoding="utf-8")
        lines = md_text.splitlines()
        page_title = "主页" if rel == "index.md" else rel
        first = lines[0].strip() if lines else ""
        m = HEADING_RE.match(first)
        if m and m.group(1).strip() == "#":
            page_title = m.group(2).strip()
            lines = lines[1:]  # 去掉 H1 标题行

        html_heads = render_heads(md_text)
        blocks = split_blocks(lines)
        if not blocks:
            skipped.append(rel)
            continue

        base_url = Path(rel).with_suffix("").as_posix()  # 如 live/dorm
        crumb_text = " › ".join(crumbs) if crumbs else "主页"

        # 标题块与渲染标题按顺序配对取锚点
        anchor_iter = iter(html_heads)
        for level, title, blines in blocks:
            if not title:
                # 页首块：无锚点
                text = block_to_text(blines)
                if not text:
                    continue
                chunk_id = len(chunks)
                tokens = tokenize(text)
                if not tokens:
                    continue
                snippet = text[:120]
                chunks.append({
                    "id": chunk_id,
                    "t": title or page_title,
                    "c": crumb_text,
                    "p": page_title,
                    "u": base_url,
                    "s": snippet,
                    "len": len(tokens),
                })
                post_chunk(chunk_id, tokens, [], df, postings, vocab)
                continue

            # 找到匹配锚点
            anchor = None
            for h_id, h_title in anchor_iter:
                if h_title == title or not h_title:
                    anchor = h_id
                    break
            text = block_to_text(blines)
            if not text:
                continue
            tokens = tokenize(text)
            title_tokens = tokenize(title)
            if not tokens and not title_tokens:
                continue
            chunk_id = len(chunks)
            snippet = text[:120]
            url = f"{base_url}/#{anchor}" if anchor else base_url
            chunks.append({
                "id": chunk_id,
                "t": title,
                "c": crumb_text,
                "p": page_title,
                "u": url,
                "s": snippet,
                "len": len(tokens),
            })
            post_chunk(chunk_id, tokens, title_tokens, df, postings, vocab)

    log(f"生成 {len(chunks)} 个信息块，{len(vocab)} 个词条")

    vocab_list = sorted(vocab)
    df_arr = [len(df[w]) for w in vocab_list]
    post_arr = [
        sorted((cid, tf) for cid, tf in postings[w].items())
        for w in vocab_list
    ]
    total_len = sum(c["len"] for c in chunks)
    avgdl = round(total_len / len(chunks), 2) if chunks else 0.0
    max_word_len = max((len(w) for w in vocab_list), default=1)

    data = {
        "meta": {
            "k1": 1.5,
            "b": 0.75,
            "n": len(chunks),
            "avgdl": avgdl,
            "maxlen": max_word_len,
        },
        "chunks": chunks,
        "vocab": vocab_list,
        "df": df_arr,
        "postings": post_arr,
        "stopwords": sorted(STOPWORDS),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    log(f"已输出 {OUT.name}: {OUT.stat().st_size / 1024:.0f} KB")
    return 0


def post_chunk(
    chunk_id: int,
    body_tokens: list[str],
    title_tokens: list[str],
    df: dict[str, set[int]],
    postings: dict[str, dict[int, int]],
    vocab: set[str],
) -> None:
    tf: dict[str, int] = {}
    for w in body_tokens:
        tf[w] = tf.get(w, 0) + 1
    for w in title_tokens:
        tf[w] = tf.get(w, 0) + 2  # 标题词加权
    for w, c in tf.items():
        vocab.add(w)
        df.setdefault(w, set()).add(chunk_id)
        postings.setdefault(w, {})[chunk_id] = c


if __name__ == "__main__":
    sys.exit(main())