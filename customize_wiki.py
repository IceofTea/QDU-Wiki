#!/usr/bin/env python3
"""
QDU-Wiki 一键换校脚本（MkDocs 版）
==================================
与 Nav 站 customize.py 同款交互，落点适配静态百科站：
  1. mkdocs.yml   —— site_name / site_url / repo_url / copyright / 贴吧社交链接
  2. docs/javascripts/chat-widget.js —— 智能体名称、欢迎语、跨站联动 NAV_URL
换校后百科与导航站的智能体保持同名同校、互相直达（换校不换大脑）。

用法：
  python customize_wiki.py                     # 交互式输入
  python customize_wiki.py --config cfg.json   # 从配置文件导入
"""
import sys
import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent
MKDOCS = BASE_DIR / 'mkdocs.yml'
WIDGET = BASE_DIR / 'docs' / 'javascripts' / 'chat-widget.js'


def input_with_default(prompt, default=''):
    val = input(f'{prompt} [{default}]: ').strip()
    return val if val else default


def gather_info():
    print('=' * 60)
    print('  QDU-Wiki 一键换校脚本（MkDocs 百科版）')
    print('=' * 60)
    info = {}
    print('\n📝 基本信息：')
    info['university'] = input_with_default('学校全称', '青岛大学')
    info['shortName'] = input_with_default('学校简称', '青大')
    info['siteName'] = input_with_default('百科站名', info['university'] + ' Wiki')
    info['agentName'] = input_with_default('智能体名称', info['shortName'] + '智答')
    print('\n🌐 网络信息：')
    info['siteUrl'] = input_with_default('百科 Pages 地址', 'https://iceoftea.github.io/QDU-Wiki/')
    info['repoUrl'] = input_with_default('GitHub 仓库', 'https://github.com/IceofTea/QDU-Wiki')
    info['navUrl'] = input_with_default('导航站地址（智能体跨站直达）', 'https://iceoftea.github.io/QDU-Nav/')
    info['tiebaUrl'] = input_with_default('贴吧 URL', 'https://tieba.baidu.com/f?kw=%E9%9D%92%E5%B2%9B%E5%A4%A7%E5%AD%A6')
    return info


def apply_config(config_path):
    # utf-8-sig 兼容带 BOM 的配置（如 Windows 记事本另存的 JSON）
    with open(config_path, 'r', encoding='utf-8-sig') as f:
        return json.load(f)


def update_mkdocs(info):
    if not MKDOCS.exists():
        print('⚠️ mkdocs.yml 不存在，跳过')
        return
    content = MKDOCS.read_text(encoding='utf-8')
    content = re.sub(r"site_name:\s*.*", f"site_name: {info['siteName']}", content, count=1)
    content = re.sub(r"site_url:\s*.*", f"site_url: {info['siteUrl']}", content, count=1)
    content = re.sub(r"repo_url:\s*.*", f"repo_url: {info['repoUrl']}", content, count=1)
    content = re.sub(r"copyright:\s*'[^']*'",
                     f"copyright: 'Copyright &copy; 2026 {info['shortName']} Wiki.'", content, count=1)
    # 贴吧社交链接（extra.social 中 fontawesome/solid/comments 条目）
    content = re.sub(r"(fontawesome/solid/comments\s*\n\s*link:\s*)\S+",
                     r"\g<1>" + info['tiebaUrl'], content, count=1)
    content = re.sub(r"(name:\s*)[^\n]*青岛大学吧",
                     r"\g<1>" + info['shortName'] + '吧', content, count=1)
    MKDOCS.write_text(content, encoding='utf-8')
    print('✅ mkdocs.yml 站点配置已更新')


def update_chat_widget(info):
    if not WIDGET.exists():
        print('⚠️ chat-widget.js 不存在，跳过')
        return
    content = WIDGET.read_text(encoding='utf-8')
    # 跨站联动地址（导航站 + 智能体直达）
    content = re.sub(r"var NAV_URL = '[^']*';",
                     f"var NAV_URL = '{info['navUrl']}';", content, count=1)
    # 智能体名称与欢迎语（换校同名）
    content = content.replace('青大智答', info['agentName'])
    # 站内条数提示语中的校名（若有）
    content = re.sub(r"基于 80 篇 Wiki 条目",
                     f"基于 {info['shortName']} Wiki 条目", content, count=1)
    WIDGET.write_text(content, encoding='utf-8')
    print(f"✅ chat-widget.js 智能体「{info['agentName']}」与跨站直达已更新")


def main():
    if len(sys.argv) > 2 and sys.argv[1] == '--config':
        info = apply_config(sys.argv[2])
    else:
        info = gather_info()
    print('\n🔧 开始适配...')
    update_mkdocs(info)
    update_chat_widget(info)
    print('\n' + '=' * 60)
    print('  ✅ 适配完成！')
    print(f"  学校：{info['university']}")
    print(f"  百科：{info['siteName']}")
    print(f"  智能体：{info['agentName']}")
    print('=' * 60)
    print('\n下一步：')
    print('  1. pip install mkdocs-material jieba')
    print('  2. python scripts/build_kb.py   # 重建知识库（可选）')
    print('  3. mkdocs serve')
    print('  4. 按需更新 docs/ 下的校本内容与 docs/assets/logo')


if __name__ == '__main__':
    main()
