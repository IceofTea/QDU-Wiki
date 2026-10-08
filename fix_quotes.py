#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix unescaped double quotes inside JSON string values.
Replace ASCII " around Chinese text with Unicode curly quotes.
"""
import re

with open('docs/i18n/en.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Strategy: Find patterns like ,"Chinese text with "quotes" inside": "English"
# We need to replace the inner ASCII quotes with Unicode curly quotes
# \u201c = " and \u201d = "

# Pattern: find ASCII double quotes that appear between Chinese characters
# or between a Chinese character and a space/punctuation inside JSON values
# These are quotes used for emphasis or highlighting within Chinese text

# First, let's do a targeted replacement for known problematic patterns
# from the original Chinese source text
replacements = [
    ('如"青岛旅游地理"等', '如\u201c青岛旅游地理\u201d等'),
    ('百度搜索"青大教务处"登录', '百度搜索\u201c青大教务处\u201d登录'),
    ('微信公众号"青小助"查询', '微信公众号\u201c青小助\u201d查询'),
    ('"青岛大学迎新接站"字样', '\u201c青岛大学迎新接站\u201d字样'),
    ('"积极"的学长学姐', '\u201c积极\u201d的学长学姐'),
    ('"出事"的消息', '\u201c出事\u201d的消息'),
    ('"热心"的师哥师姐', '\u201c热心\u201d的师哥师姐'),
    ('"刷单返利"都是诈骗', '\u201c刷单返利\u201d都是诈骗'),
    ('"仅供XXX使用"', '\u201c仅供XXX使用\u201d'),
    ('"不注册不能报名"是误传', '\u201c不注册不能报名\u201d是误传'),
    ('"优卡"APP', '\u201c优卡\u201dAPP'),
    ('"妖风"', '\u201c妖风\u201d'),
    ('"大学60分万岁"', '\u201c大学60分万岁\u201d'),
    ('"Internet+" 竞赛', '\u201cInternet+\u201d 竞赛'),
    ('"挑战杯"', '\u201c挑战杯\u201d'),
    ('"排行榜"', '\u201c排行榜\u201d'),
    ('"文能答辩、武能拼团"', '\u201c文能答辩、武能拼团\u201d'),
    ('"互联网+"', '\u201c互联网+\u201d'),
    ('"代表作"', '\u201c代表作\u201d'),
    ('"公认最好吃的"', '\u201c公认最好吃的\u201d'),
    ('"黑暗料理"', '\u201c黑暗料理\u201d'),
    ('"柠檬不萌"', '\u201c柠檬不萌\u201d'),
    ('"一头雾水"', '\u201c一头雾水\u201d'),
    ('"三公"经费', '\u201c三公\u201d经费'),
    ('"明德、博学、守正、出奇"', '\u201c明德、博学、守正、出奇\u201d'),
    ('"明德、博学、守正、出奇" —— 青岛大学校训', '\u201c明德、博学、守正、出奇\u201d —— 青岛大学校训'),
    ('"课外活动"', '\u201c课外活动\u201d'),
    ('"和毕业证挂钩的硬性必修课"', '\u201c和毕业证挂钩的硬性必修课\u201d'),
    ('"第二课堂成绩单"', '\u201c第二课堂成绩单\u201d'),
    ('"第二课堂"', '\u201c第二课堂\u201d'),
    ('"大学生素质拓展计划"', '\u201c大学生素质拓展计划\u201d'),
    ('"创新创业实践"', '\u201c创新创业实践\u201d'),
    ('"加分活动"', '\u201c加分活动\u201d'),
    ('"看起来"更完整地毕业', '\u201c看起来\u201d更完整地毕业'),
    ('"重点团队"', '\u201c重点团队\u201d'),
    ('"不贵"', '\u201c不贵\u201d'),
    ('"三胡子烧烤店"', '\u201c三胡子烧烤店\u201d'),
    ('"懒人"', '\u201c懒人\u201d'),
    ('"低楼层"', '\u201c低楼层\u201d'),
    ('"QDU-1X" 和 "QDU-Web"', '\u201cQDU-1X\u201d 和 \u201cQDU-Web\u201d'),
    ('"菁彩校园"', '\u201c菁彩校园\u201d'),
    ('"青小助"', '\u201c青小助\u201d'),
    ('"多彩校园"', '\u201c多彩校园\u201d'),
    ('"智慧团委"', '\u201c智慧团委\u201d'),
    ('"共青团员"', '\u201c共青团员\u201d'),
    ('"保研"资格', '\u201c保研\u201d资格'),
    ('"奖学金"评定', '\u201c奖学金\u201d评定'),
    ('"入党"等评优', '\u201c入党\u201d等评优'),
    ('"学生会"竞选', '\u201c学生会\u201d竞选'),
    ('"名师"', '\u201c名师\u201d'),
    ('"挂科"', '\u201c挂科\u201d'),
    ('"成绩才是王道"', '\u201c成绩才是王道\u201d'),
    ('"人人平等"', '\u201c人人平等\u201d'),
    ('"公平"', '\u201c公平\u201d'),
    ('"挂科=直接出局"', '\u201c挂科=直接出局\u201d'),
    ('"应予以接收"', '\u201c应予以接收\u201d'),
    ('"不得申请转专业"', '\u201c不得申请转专业\u201d'),
    ('"禁止在宿舍饲养宠物"', '\u201c禁止在宿舍饲养宠物\u201d'),
    ('"同一批次"', '\u201c同一批次\u201d'),
    ('"不允许挂床帘"', '\u201c不允许挂床帘\u201d'),
    ('"蚊帐可以挂"', '\u201c蚊帐可以挂\u201d'),
    ('"挂科影响重大"', '\u201c挂科影响重大\u201d'),
    ('"严禁作弊"', '\u201c严禁作弊\u201d'),
    ('"旷考"', '\u201c旷考\u201d'),
    ('"诈骗"', '\u201c诈骗\u201d'),
    ('"谨防诈骗"', '\u201c谨防诈骗\u201d'),
    ('"保研名额有多少？"', '\u201c保研名额有多少？\u201d'),
    ('"成绩排名（考试课平均成绩）"', '\u201c成绩排名（考试课平均成绩）\u201d'),
    ('"团队竞赛主力队员怎么认定？"', '\u201c团队竞赛主力队员怎么认定？\u201d'),
    ('"保研猛学的同学"', '\u201c保研猛学的同学\u201d'),
    ('"舍"娱乐"得"成就', '\u201c舍\u201d娱乐\u201c得\u201d成就'),
    ('"舍"学习"得"快乐', '\u201c舍\u201d学习\u201c得\u201d快乐'),
    ('"新能源"', '\u201c新能源\u201d'),
    ('"智能制造"', '\u201c智能制造\u201d'),
    ('"不配"', '\u201c不配\u201d'),
    ('"到达巅峰前必须要走的路"', '\u201c到达巅峰前必须要走的路\u201d'),
    ('"太过遥远"', '\u201c太过遥远\u201d'),
    ('"我们亦能企及的未来"', '\u201c我们亦能企及的未来\u201d'),
    ('"该项目"', '\u201c该项目\u201d'),
    ('"知名度"', '\u201c知名度\u201d'),
    ('"我的"', '\u201c我的\u201d'),
    ('"他们"', '\u201c他们\u201d'),
    ('"高水平收入"', '\u201c高水平收入\u201d'),
    ('"寒冬"', '\u201c寒冬\u201d'),
    ('"项目不变，工作效率高了，加班时间没事做"', '\u201c项目不变，工作效率高了，加班时间没事做\u201d'),
    ('"快速循环"', '\u201c快速循环\u201d'),
    ('"一门手艺"', '\u201c一门手艺\u201d'),
    ('"包治百病"', '\u201c包治百病\u201d'),
    ('"救命"', '\u201c救命\u201d'),
    ('"入场券"', '\u201c入场券\u201d'),
    ('"敲门砖"', '\u201c敲门砖\u201d'),
    ('"打铁还需自身硬"', '\u201c打铁还需自身硬\u201d'),
    ('"没有金刚钻，别揽瓷器活"', '\u201c没有金刚钻，别揽瓷器活\u201d'),
    ('"屠龙之术"', '\u201c屠龙之术\u201d'),
    ('"用不上"', '\u201c用不上\u201d'),
    ('"过期"', '\u201c过期\u201d'),
    ('"万金油"', '\u201c万金油\u201d'),
    ('"值不值得"', '\u201c值不值得\u201d'),
    ('"学校统发的建行卡"', '\u201c学校统发的建行卡\u201d'),
    ('"教务系统"', '\u201c教务系统\u201d'),
    ('"网上报名"', '\u201c网上报名\u201d'),
    ('"加盖公章的书面报名表"', '\u201c加盖公章的书面报名表\u201d'),
    ('"提前（一到半个月）"', '\u201c提前（一到半个月）\u201d'),
    ('"不轻信、不透露、不转账、不贪小便宜。"', '\u201c不轻信、不透露、不转账、不贪小便宜。\u201d'),
    ('"网上报名"', '\u201c网上报名\u201d'),
    ('"优卡"', '\u201c优卡\u201d'),
    ('"零门槛"', '\u201c零门槛\u201d'),
]

for old, new in replacements:
    content = content.replace(old, new)

# Now do a general pass: find any remaining unescaped ASCII quotes inside Chinese text
# Pattern: Chinese char + " + non-quote chars + " + Chinese char
# This catches any remaining unescaped quotes
# But we need to be careful not to mess up JSON structure

# Let's just check if JSON is now valid
import json
try:
    data = json.loads(content)
    print("JSON is now valid!")
    print("Global keys:", len(data['global']))
    print("Pages keys:", len(data['pages']))
    with open('docs/i18n/en.json', 'w', encoding='utf-8') as f:
        f.write(content)
    print("File saved successfully.")
except json.JSONDecodeError as e:
    print(f"Still has error at line {e.lineno}, col {e.colno}, pos {e.pos}")
    # Show context
    start = max(0, e.pos - 80)
    end = min(len(content), e.pos + 80)
    context = content[start:end]
    print("Context:", repr(context))
    # Find the exact char
    ch = content[e.pos]
    print(f"Problem char: U+{ord(ch):04X} '{ch}'")
