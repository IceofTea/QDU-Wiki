import os, json, re

base = r'D:\2025海之子计算机复试电子资料\福star\学习\wiki\QDU-Wiki\docs'
pages_map = {
    '/': 'index.md',
    '/about/': 'about/index.md',
    '/new/preparation/': 'new/preparation.md',
    '/new/anti-fraud/': 'new/anti-fraud.md',
    '/new/military_training/': 'new/military_training.md',
    '/new/undergraduate_handbook/': 'new/undergraduate_handbook.md',
    '/new/contact/': 'new/contact.md',
    '/live/dorm/': 'live/dorm.md',
    '/live/traffic/': 'live/traffic.md',
    '/live/eat/': 'live/eat.md',
    '/live/hospital/': 'live/hospital.md',
    '/live/facilities/': 'live/facilities.md',
    '/live/shopping/': 'live/shopping.md',
    '/study/system/': 'study/system.md',
    '/study/second_classroom/': 'study/second_classroom.md',
    '/study/exam/': 'study/exam.md',
    '/service/network/': 'service/network.md',
    '/service/card/': 'service/card.md',
    '/service/budget/': 'service/budget.md',
    '/college/': 'college/index.md',
}

# 常见段落翻译词典
translations = {
    "青岛大学": "Qingdao University",
    "占地2496亩": "covers 2,496 mu",
    "全日制在校生41000余人": "with over 41,000 full-time students",
    "28个学院": "28 colleges",
    "90个本科专业": "90 undergraduate programs",
    "11个学科门类": "11 discipline categories",
    "在校生41000余人": "with over 41,000 students",
    "1909年": "1909",
    "1993年": "1993",
    "1909 年": "1909",
    "1993 年": "1993",
    "24小时不停电": "24/7 power supply",
    "24h不停电": "24/7 power supply",
    "严禁使用大功率电器": "High-power appliances are strictly prohibited",
    "2025年起": "Since 2025",
    "所有宿舍均已安装空调": "all dormitories have air conditioning installed",
    "空调全覆盖": "full air conditioning coverage",
    "均配有暖气": "all equipped with heating",
    "电压220V": "220V voltage",
    "第一个月免费": "First month free",
    "刷校园卡": "Swipe campus card",
    "支付宝": "Alipay",
    "微信支付": "WeChat Pay",
    "不能微信支付": "WeChat Pay not accepted",
    "门禁": "Access control",
    "晚上11:30前必须回宿舍": "Must return to dorm by 11:30 PM",
    "严禁使用大功率电器（吹风机、卷发棒、电热锅等发热用品）": "High-power appliances (hair dryers, curling irons, electric pots, etc.) are strictly prohibited",
    "待更新": "Needs Update",
    "本页部分信息可能较旧或尚未核实，欢迎通过 GitHub 提交补充。": "Some info may be outdated. Contributions via GitHub are welcome.",
    "床位分配": "Bed assignment",
    "查寝": "Room inspection",
    "宿舍检查": "Room inspection",
    "床上用品": "Bedding",
    "金家岭校区分为西院和东院": "Jinjialing Campus is divided into West and East sections",
    "移动网速快但不稳定，联通稳定但网速一般": "China Mobile is fast but unstable; China Unicom is stable but slower",
    "浮山校区分为东院、西院、北院": "Fushan Campus is divided into East, West, and North sections",
    "六人间": "6-person room",
    "八人间": "8-person room",
    "有阳台": "balcony",
    "无阳台": "no balcony",
    "有独卫": "private bathroom",
    "无独卫": "shared bathroom",
    "洗衣机在一楼": "washing machines on 1st floor",
    "有饮水机": "water dispenser available",
    "无饮水机": "no water dispenser",
    "有自习室": "study room available",
    "无自习室": "no study room",
    "楼号": "Building",
    "类型": "Type",
    "阳台": "Balcony",
    "独卫": "Bathroom",
    "备注": "Notes",
    "共五层": "5 floors total",
    "共六层": "6 floors total",
    "共八层": "8 floors total",
    "自习室在": "study room on",
    "门口有超市": "supermarket at entrance",
    "有公共阳台": "shared balcony",
    "西院": "West Campus",
    "东院": "East Campus",
    "北院": "North Campus",
    "西面女生宿舍": "female dorms on west side",
    "东面男生宿舍": "male dorms on east side",
    "一人一个小柜子": "personal locker for each student",
    "宿舍有门禁": "dorm has curfew",
    "宿舍不熄灯": "dorms have no lights-out",
    "可以养宠物吗": "Can I keep pets?",
    "不可以": "No",
    "学校禁止在宿舍饲养宠物": "Pets are prohibited in dormitories",
    "床的尺寸是多少": "What are the bed dimensions?",
    "标准尺寸为90cm × 190cm": "Standard size is 90cm × 190cm",
    "学校被褥怎么样": "How is the school bedding?",
    "推荐用学校的吗": "Is it recommended to use the school's?",
    "需要带暖水瓶吗": "Do I need to bring a thermos?",
    "可以铺地垫吗": "Can I use a floor mat?",
    "能拉网线吗": "Can I connect a network cable?",
    "可以安装床上书桌吗": "Can I install a bed desk?",
    "可以提前到校住宿舍吗": "Can I move in early?",
    "宿舍柜子多大": "How big are the dorm cabinets?",
    "每个床铺旁都有插座吗": "Are there outlets by each bed?",
    "宿舍墙上可以贴东西吗": "Can I put things on the wall?",
    "宿舍有WiFi吗": "Does the dorm have WiFi?",
    "怎么办理校园网": "How to set up campus network?",
    "宿舍有洗衣机吗": "Are there washing machines?",
    "宿舍配备插排吗": "Are there power strips?",
    "宿舍有垃圾桶": "Are there trash cans?",
    "宿舍里可以吃饭吗": "Can I eat in the dorm?",
    "晒被子的地方在哪里": "Where can I dry my quilt?",
    "需要带台灯吗": "Do I need a desk lamp?",
}

d = {
    "global": {
        "主页": "Home", "新生手册": "New Student Guide", "生活指南": "Campus Life",
        "学习学业": "Academics", "校园服务": "Campus Services", "学院详情": "Colleges",
        "学生组织": "Student Orgs", "文件共享": "File Sharing", "有话送你": "Messages",
        "关于 Wiki": "About Wiki", "友情链接": "Links", "搜索": "Search",
        "待更新": "Needs Update",
        "本页部分信息可能较旧或尚未核实，欢迎通过 GitHub 提交补充。": "Some info may be outdated. Contributions via GitHub are welcome.",
        "目录": "Contents", "查看源码": "View source",
        "编辑此页": "Edit this page", "上一页": "Previous", "下一页": "Next",
    },
    "pages": {}
}

for page_path, md_file in pages_map.items():
    filepath = os.path.join(base, md_file)
    if not os.path.exists(filepath):
        continue
    with open(filepath, encoding='utf-8') as f:
        content = f.read()
    
    page_trans = {}
    
    # Extract H1
    h1_match = re.search(r'^# (.+)$', content, re.MULTILINE)
    if h1_match:
        h1 = h1_match.group(1).strip()
        if h1 in translations:
            page_trans[h1] = translations[h1]
    
    # Extract H2, H3
    for m in re.finditer(r'^#{2,3} (.+)$', content, re.MULTILINE):
        title = m.group(1).strip()
        if title in translations:
            page_trans[title] = translations[title]
    
    # Extract admonition titles
    for m in re.finditer(r'!!! \w+ "(.+?)"', content):
        t = m.group(1)
        if t in translations:
            page_trans[t] = translations[t]
    
    # Extract paragraphs (first 200 chars)
    for m in re.finditer(r'^([^#\|!\n].{10,200})$', content, re.MULTILINE):
        text = m.group(1).strip()
        if text in translations:
            page_trans[text] = translations[text]
    
    # Extract list items
    for m in re.finditer(r'^- \*\*(.+?)\*\*[：:](.+)$', content, re.MULTILINE):
        key = m.group(1) + '：' + m.group(2).strip()
        if key in translations:
            page_trans[key] = translations[key]
    
    if page_trans:
        d["pages"][page_path] = page_trans

out_path = os.path.join(base, 'i18n', 'en.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

# Verify
with open(out_path, encoding='utf-8') as f:
    d2 = json.load(f)
total = len(d2.get('global', {}))
for pk, pv in d2.get('pages', {}).items():
    total += len(pv)
print(f'Written {len(d2["pages"])} pages, {total} total translations')
