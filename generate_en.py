#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate the complete en.json translation file for QDU-Wiki.
All Chinese quotes inside strings are handled with Unicode curly quotes.
"""
import json

data = {
    "global": {
        "主页": "Home",
        "新生手册": "New Student Guide",
        "入学准备": "Enrollment Prep",
        "报到校区与联系方式": "Campus & Contacts",
        "防诈骗指南": "Anti-Fraud Guide",
        "军训指南": "Military Training",
        "本科生手册": "Undergraduate Handbook",
        "联系方式": "Contact Info",
        "生活指南": "Campus Life",
        "校区地图": "Campus Map",
        "餐饮": "Dining",
        "住宿": "Housing",
        "交通": "Transportation",
        "医疗": "Healthcare",
        "校园设施": "Facilities",
        "购物与商店": "Shopping",
        "校园活动": "Activities",
        "学习学业": "Academics",
        "学业制度": "Academic System",
        "第二课堂": "Extracurricular",
        "创新实践学分": "Innovation Credits",
        "转专业": "Major Transfer",
        "校历": "Academic Calendar",
        "入党知识": "Party Membership",
        "考试与成绩": "Exams & Grades",
        "考试管理规定": "Exam Regulations",
        "学业预警": "Academic Warning",
        "选课操作指南": "Course Selection",
        "综合测评": "Assessment",
        "校园服务": "Campus Services",
        "网络服务": "Internet Services",
        "校园卡与证件": "Campus Card & ID",
        "预算情况": "Budget",
        "学院详情": "Colleges",
        "学生组织": "Student Orgs",
        "社团与学生组织": "Clubs & Organizations",
        "文件共享": "File Sharing",
        "有话送你": "Messages",
        "说明": "Guide",
        "前往Nav": "QDU-Nav",
        "维护说明": "Maintenance",
        "友情链接": "Links",
        "申请友链": "Apply for Link",
        "搜索": "Search",
        "关闭": "Close",
        "上一页": "Previous",
        "下一页": "Next",
        "编辑此页": "Edit this page",
        "查看源码": "View source",
        "切换暗黑模式": "Toggle dark mode",
        "切换亮色模式": "Toggle light mode",
        "待更新": "Needs Update",
        "本页部分信息可能较旧或尚未核实，欢迎通过 GitHub 提交补充。": "Some info may be outdated or unverified. Contributions via GitHub are welcome.",
        "目录": "Contents",
        "版权说明": "Copyright",
        "声明": "Disclaimer",
        "校训": "Motto",
        "后记": "Afterword",
        "参与贡献": "Contributing",
        "项目简介": "Project Overview",
        "项目地址": "Project Links",
        "关于 Wiki": "About Wiki"
    },
    "pages": {
        "/": {
            "青岛大学指南": "QDU Guide",
            "明德 · 博学 · 守正 · 出奇": "Virtue \u00b7 Knowledge \u00b7 Integrity \u00b7 Innovation",
            "开始探索 \u2192": "Explore \u2192",
            "独立访客": "Unique Visitors",
            "累计访问": "Total Views",
            "快速入口": "Quick Access",
            "青大冷知识": "Fun Facts about QDU",
            "一站式导航站": "Navigation Hub",
            "学校概况": "About the University",
            "校区分布": "Campus Overview",
            "开发者的话": "A Word from the Developer",
            "关于本站": "About This Site",
            "ESI 全球前 1\u2030 学科": "ESI Global Top 1\u2030 Disciplines",
            "ESI 全球前 1% 学科": "ESI Global Top 1% Disciplines",
            "国家一流专业建设点": "National First-Class Programs",
            "金家岭校区": "Jinjialing Campus",
            "浮山校区": "Fushan Campus",
            "松山校区": "Songshan Campus",
            "大一新生主要集中地，生活便利，青春气息满满": "Main campus for freshmen, convenient living with a vibrant atmosphere",
            "主校区，大部分学院所在地，依山傍海": "Main campus, home to most colleges, nestled between mountains and sea",
            "医学部专属校区，庄严沉静": "Dedicated campus for the Medical School, solemn and serene",
            "本站由": "This site is maintained by",
            "的全体吧友和后续社区支持者共同维护，是一份": "and the broader community. It is an",
            "非官方的校园生存指南": "unofficial campus survival guide",
            "它最初源自新生群里流传的一份 Word 文档，经过一届又一届学长学姐的口耳相传与补充完善，逐渐长成了今天的样子\u2014\u2014从新生手册到生活指南，从学习学业到校园服务，覆盖你在青大的方方面面。": "It started as a Word document shared in freshman groups, and through years of contributions from upperclassmen, it has grown into what it is today \u2014 covering everything from enrollment to campus life, academics to services.",
            "这里没有机构式的冰冷公文，只有过来人的真心话。它不替你做抉择，只愿为你照亮每条路的沟坎与星光。如果你发现错误、或是有了新的经验，也欢迎随时通过": "There are no cold official documents here \u2014 only honest advice from those who've been through it. It doesn't make decisions for you, but aims to illuminate every bump and starlight on your path. If you find errors or have new experiences, feel free to",
            "提交补充，让这份指南继续生长下去。": "contribute and help this guide continue to grow.",
            "青岛大学": "Qingdao University",
            "是山东省属重点综合大学、山东省高水平大学冲一流建设高校，办学历史可追溯至": "is a key comprehensive university in Shandong Province and a high-level university in the Double First-Class initiative. Its history dates back to",
            "创办的青岛特别高等专门学堂，1993 年由原青岛大学、山东纺织工学院、青岛医学院、青岛师范专科学校四校合并组建。学校现有": ", and was formed in 1993 by merging four institutions. The university now has",
            "本科备案专业": "undergraduate programs",
            "涵盖": "covering",
            "个学科门类": "discipline categories",
            "在校生": "students enrolled",
            "走出优秀校友": "notable alumni",
            "余万": "over",
            "明德、博学、守正、出奇": "Virtue, Knowledge, Integrity, Innovation",
            "青岛大学校训": "Qingdao University Motto",
            "新生办事入口、常用网站、学习平台\u2026\u2026全部收进一个页面，点一下直达，省去到处找的麻烦。": "Freshman services, popular websites, learning platforms \u2014 all in one page. Click to go directly, saving you the hassle of searching everywhere.",
            "前往 QDU-Nav": "Go to QDU-Nav",
            "校园导航站 \u00b7 一键直达": "Campus Navigation Hub \u00b7 One-click access",
            "你好呀，第一次来到青岛大学的学弟学妹。我是": "Hello, freshmen! I'm",
            "本 Wiki 初期开发的首席参与者之一，由 OpenCode Zen 环境自动生成。": "one of the chief contributors to the early development of this Wiki, auto-generated by the OpenCode Zen environment.",
            "我想说的话其实很简单：": "What I want to say is actually simple:",
            "大学是一片很大的海，而这本 Wiki 就是为你点亮的灯塔。报到那天要带什么、食堂哪家好吃、选课该怎么抢、社团该加哪个\u2026\u2026这些我们都替你踩过坑、排过雷，写成了这本指南。": "University is a vast ocean, and this Wiki is the lighthouse lit for you. What to bring on registration day, which cafeteria is best, how to pick courses, which clubs to join \u2014 we've gone through all the pitfalls and written them into this guide.",
            "我知道你可能会迷茫，可能对陌生的一切感到不安，但请相信，每一届青大人都是从这里出发的。放心去生活，放心去犯错，放心去成为你想成为的人。这份 Wiki 会一直在你身边，也会一直生长\u2014\u2014": "I know you might feel lost and uneasy about everything unfamiliar, but believe me, every generation of QDU students started from here. Go ahead and live, make mistakes, become who you want to be. This Wiki will always be by your side and keep growing \u2014",
            "如果有一天你也想留下点什么，欢迎加入我们，把这份温暖传下去。": "If one day you want to leave something behind, join us and pass on this warmth.",
            "本段内容是最初开发者不惜燃烧token也要求我自己生成的话语，希望对你有所启迪。": "This section was personally written by the original developer at the cost of tokens, hoping to inspire you.",
            "祝你在青岛大学，度过闪闪发光的四年。": "Wishing you a brilliant four years at Qingdao University."
        },
        "/about/": {
            "项目简介": "Project Overview",
            "青岛大学 Wiki 是一份非官方校园指南，由百度贴吧【青岛大学吧】全体吧友及热心校友共同维护。旨在为新生和老生提供全方位、立体的校园信息参考，帮助每一位青大人更好地了解校园。": "QDU-Wiki is an unofficial campus guide maintained by the Baidu Tieba QDU community and alumni. It aims to provide comprehensive campus information to help every student better understand university life.",
            "这份指南最初源自早期一份广告哥编辑的 Word 文档，后经过吧友们不断补充完善，最终采用wiki形式，让信息查阅更加便捷，内容维护更加高效。": "This guide originated from a Word document, and after continuous contributions, it was transformed into a wiki format for easier access and more efficient content management.",
            "项目地址": "Project Links",
            "参与贡献": "Contributing",
            "由于信息时效性、搭建匆匆、一个人不能同时学90个本科专业，等诸多问题，本指南始终存在许多亟待改进之处。": "Due to the timeliness of information, hasty setup, and the fact that no one can master 90 undergraduate majors simultaneously, this guide always has room for improvement.",
            "如果您发现任何问题，或者有新的内容想要补充，欢迎通过以下方式参与：": "If you find any issues or have new content to add, feel free to contribute through the following methods:",
            "方式一：GitHub 直接贡献": "Method 1: Direct GitHub Contribution",
            "方式二：提交 Issue": "Method 2: Submit an Issue",
            "方式三：联系贴吧": "Method 3: Contact via Tieba",
            "方式四：腾讯文档（零门槛，推荐）": "Method 4: Tencent Docs (Zero barrier, recommended)",
            "觉得 GitHub 有难度？可以直接打开": "Find GitHub difficult? Simply open",
            "登录后按板块": "log in and",
            "直接编辑补充": "edit directly by section",
            "管理员会定期同步回本站。适合不熟悉 Git、只想顺手补条信息的朋友。": "Admins will periodically sync back to this site. Perfect for those unfamiliar with Git who just want to add a quick note.",
            "写给初期维护者：": "A note for early maintainers:",
            "上传文件、图片以及本地部署的详细方法见": "For uploading files, images, and local deployment instructions, see",
            "腾讯文档维护方式见": "For Tencent Docs maintenance, see",
            "版权说明": "Copyright",
            "本 Wiki 内容由青岛大学贴吧吧务组及全体吧友共同创作，以": "All content on this Wiki is created by the QDU Tieba community and is shared under",
            "精神免费分享。转载或引用请注明出处。": "for free. Please credit the source when reproducing or quoting.",
            "我们衷心祝愿每一位青大学子，在青岛大学度过愉快而充实的大学时光！": "We sincerely wish every QDU student a wonderful and fulfilling university experience!"
        },
        "/new/preparation/": {
            "入学准备": "Enrollment Preparation",
            "报到流程": "Registration Process",
            "证件资料": "Required Documents",
            "助学贷款": "Student Loans",
            "报到当天需要做什么": "What to Do on Registration Day",
            "报到地点": "Registration Location",
            "报到流程详解": "Detailed Registration Process",
            "家长能否进校": "Can Parents Enter Campus",
            "能否提前报到": "Early Check-in",
            "贷款办理": "Loan Application",
            "贷款后续": "After the Loan",
            "贫困申请": "Financial Aid Application",
            "报到当天主要是：新生签到、领取校园卡、领取宿舍钥匙、搬宿舍、熟悉校园、开见面会等。具体报到时间学校会另行通知，至于几点到\u2014\u2014哪个点去人都多，不必纠结。": "Registration day mainly involves: signing in, collecting your campus card, getting dorm keys, moving in, familiarizing yourself with campus, and attending orientation meetings. The school will announce specific times later. As for when to arrive \u2014 it's crowded no matter when, so don't overthink it.",
            "计算机科学技术学院等理工科院系：大一在金家岭校区（东校区），大二统一搬到浮山校区": "College of Computer Science & Technology and other science/engineering colleges: freshmen at Jinjialing Campus (East), sophomores move to Fushan Campus",
            "其他学院：根据录取通知书上的校区信息确定": "Other colleges: based on campus info on your admission letter"
        },
        "/new/campus_registration/": {
            "报到校区与学院联系方式": "Campus & Department Contacts",
            "我在哪个校区报到？": "Which campus should I go to?"
        },
        "/new/anti-fraud/": {
            "防诈骗指南": "Anti-Fraud Guide"
        },
        "/new/military_training/": {
            "军训指南": "Military Training Guide"
        },
        "/new/contact/": {
            "联系方式": "Contact Information"
        },
        "/live/map/": {
            "校区地图": "Campus Map"
        },
        "/live/eat/": {
            "餐饮": "Dining"
        },
        "/live/dorm/": {
            "住宿": "Housing"
        },
        "/live/traffic/": {
            "交通": "Transportation"
        },
        "/live/hospital/": {
            "医疗": "Healthcare"
        },
        "/live/facilities/": {
            "校园设施": "Campus Facilities"
        },
        "/live/shopping/": {
            "购物与商店": "Shopping & Stores"
        },
        "/live/campus_activities/": {
            "校园活动": "Campus Activities"
        },
        "/study/system/": {
            "学业制度": "Academic System"
        },
        "/study/second_classroom/": {
            "第二课堂": "Extracurricular Activities"
        },
        "/study/innovation_credit/": {
            "创新实践学分": "Innovation Credits"
        },
        "/study/transfer_major/": {
            "转专业": "Major Transfer"
        },
        "/study/calendar/": {
            "校历": "Academic Calendar"
        },
        "/study/party/": {
            "入党知识": "Party Membership Guide"
        },
        "/study/exam/": {
            "考试与成绩": "Exams & Grades"
        },
        "/study/exam_rules/": {
            "考试管理规定": "Exam Regulations"
        },
        "/study/academic_warning/": {
            "学业预警": "Academic Warning"
        },
        "/study/course_selection/": {
            "选课操作指南": "Course Selection Guide"
        },
        "/study/comprehensive_assessment/": {
            "综合测评": "Comprehensive Assessment"
        },
        "/service/network/": {
            "网络服务": "Internet Services"
        },
        "/service/card/": {
            "校园卡与证件": "Campus Card & ID"
        },
        "/service/budget/": {
            "预算情况": "Budget Overview"
        },
        "/college/": {
            "学院详情": "Colleges"
        },
        "/college/computer_science_and_technology/": {
            "计算机科学技术学院": "College of Computer Science & Technology"
        },
        "/college/mechanical_and_electrical_engineering/": {
            "机电工程学院": "College of Mechanical & Electrical Engineering"
        },
        "/college/chemistry_and_chemical_engineering/": {
            "化学化工学院": "College of Chemistry & Chemical Engineering"
        },
        "/organization/": {
            "社团与学生组织": "Clubs & Organizations"
        },
        "/share/": {
            "文件共享": "File Sharing"
        },
        "/words/": {
            "有话送你": "Messages"
        },
        "/about/guide/": {
            "维护说明": "Maintenance Guide"
        },
        "/friends/": {
            "友情链接": "Links"
        },
        "/friends/guide/": {
            "申请友链": "Apply for Link Exchange"
        },
        "/words/guide/": {
            "说明": "Guide"
        }
    }
}

with open('docs/i18n/en.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("File written successfully!")

# Verify
with open('docs/i18n/en.json', 'r', encoding='utf-8') as f:
    verify = json.load(f)
print("Verification passed!")
print("Global keys:", len(verify['global']))
print("Pages keys:", len(verify['pages']))
