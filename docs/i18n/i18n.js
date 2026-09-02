/* QDU-Wiki i18n Engine v19.0 — 用CSS控制侧边栏，不碰MkDocs内部逻辑 */
(function () {
  'use strict';
  var SK = 'qdu_lang';
  var cur = localStorage.getItem(SK) || 'zh';
  var isEN = location.pathname.indexOf('/en/') !== -1;

  var TAB_MAP = {
    '主页': 'Home', '新生手册': 'New Student Guide', '生活指南': 'Campus Life',
    '学习学业': 'Academics', '校园服务': 'Campus Services', '学院详情': 'Colleges',
    '学生组织': 'Student Orgs', '文件共享': 'File Sharing', '有话送你': 'Messages',
    '前往Nav': 'QDU-Nav', '关于Wiki': 'About Wiki', '友情链接': 'Links',
    '青岛大学 Wiki': 'Qingdao University', '青岛大学': 'Qingdao University'
  };

  var SIDEBAR_MAP = {
    '主页': 'Home', '新生手册': 'New Student Guide', '生活指南': 'Campus Life',
    '学习学业': 'Academics', '校园服务': 'Campus Services', '学院详情': 'Colleges',
    '学生组织': 'Student Orgs', '文件共享': 'File Sharing', '有话送你': 'Messages',
    '关于Wiki': 'About Wiki', '友情链接': 'Links',
    '入学准备': 'Enrollment Prep', '报到校区与联系方式': 'Campus & Contacts',
    '防诈骗指南': 'Anti-Fraud Guide', '军训指南': 'Military Training',
    '本科生手册': 'Undergraduate Handbook', '联系方式': 'Contact Info',
    '校区地图': 'Campus Map', '餐饮': 'Dining', '住宿': 'Housing',
    '交通': 'Transportation', '医疗': 'Healthcare', '校园设施': 'Facilities',
    '购物与商店': 'Shopping', '校园活动': 'Activities',
    '学业制度': 'Academic System', '第二课堂': 'Extracurricular',
    '创新实践学分': 'Innovation Credits', '转专业': 'Major Transfer',
    '校历': 'Academic Calendar', '入党知识': 'Party Membership',
    '考试与成绩': 'Exams & Grades', '考试管理规定': 'Exam Regulations',
    '学业预警': 'Academic Warning', '选课操作指南': 'Course Selection',
    '综合测评': 'Assessment',
    '网络服务': 'Internet Services', '校园卡与证件': 'Campus Card & ID',
    '预算情况': 'Budget',
    '计算机科学技术学院': 'Computer Science', '机电工程学院': 'Mechanical & Electrical',
    '化学化工学院': 'Chemistry',
    '社团与学生组织': 'Clubs & Organizations',
    '维护说明': 'Maintenance', '申请友链': 'Apply for Link', '说明': 'Guide',
    '学校概况': 'About the University',
    '开发者的话': 'A Word from the Developer', '关于本站': 'About This Site',
    '校区分布': 'Campus Distribution'
  };

  if (isEN && cur !== 'en') { cur = 'en'; localStorage.setItem(SK, 'en'); }

  if (cur === 'en' && !isEN) {
    var ep = location.pathname.replace('/QDU-Wiki/', '/QDU-Wiki/en/');
    if (ep === location.pathname) ep = '/QDU-Wiki/en/';
    location.replace(ep);
    return;
  }

  function toEnHref(href) {
    if (!href || href.charAt(0) === '#' || href.indexOf('http') === 0 || href.indexOf('javascript') === 0 || href.indexOf('mailto') === 0) return null;
    var resolved;
    try { resolved = new URL(href, location.href).pathname; } catch(e) { return null; }
    if (resolved.indexOf('/QDU-Wiki/en/') !== -1) return null;
    if (resolved.indexOf('/QDU-Wiki/') === 0) {
      var enAbs = resolved.replace('/QDU-Wiki/', '/QDU-Wiki/en/');
      return absToRelative(location.pathname, enAbs);
    }
    return null;
  }

  function absToRelative(from, to) {
    var fp = from.split('/').filter(Boolean);
    var tp = to.split('/').filter(Boolean);
    var i = 0;
    while (i < fp.length && i < tp.length && fp[i] === tp[i]) i++;
    var parts = [];
    for (var j = 0; j < fp.length - i; j++) parts.push('..');
    for (var j = i; j < tp.length; j++) parts.push(tp[j]);
    return parts.join('/') || '.';
  }

  function tr(el, map) {
    if (el.getAttribute('data-i18n-done')) return;
    var span = el.querySelector('.md-ellipsis') || el;
    var txt = span.textContent.replace(/[\s\u00a0]+/g, ' ').trim();
    if (map[txt]) {
      span.textContent = map[txt];
      el.setAttribute('data-i18n-done', '1');
    }
  }

  // 强制隐藏非当前分类的侧边栏子列表
  function forceSidebarHide() {
    if (!isEN) return;
    var path = location.pathname;
    var cats = ['new', 'live', 'study', 'service', 'college', 'organization', 'share', 'words', 'friends', 'about'];
    var found = '';
    for (var i = 0; i < cats.length; i++) {
      if (path.indexOf('/en/' + cats[i] + '/') !== -1) { found = cats[i]; break; }
    }
    if (!found) return; // 首页不隐藏

    // 遍历侧边栏所有分类项
    var items = document.querySelectorAll('.md-nav--primary .md-nav__item--nested');
    items.forEach(function (item) {
      // 获取这个分类的链接文本
      var label = item.querySelector(':scope > label .md-ellipsis, :scope > a .md-ellipsis, :scope > div a .md-ellipsis');
      if (!label) return;
      var txt = label.textContent.replace(/[\s\u00a0]+/g, ' ').trim();
      var enName = SIDEBAR_MAP[txt] || TAB_MAP[txt] || txt;

      // 获取子列表
      var subList = item.querySelector('nav > .md-nav__list');
      if (!subList) return;

      // 根据分类名判断是否是当前分类
      var isCurrent = false;
      if (found === 'new' && (txt === '新生手册' || enName === 'New Student Guide')) isCurrent = true;
      if (found === 'live' && (txt === '生活指南' || enName === 'Campus Life')) isCurrent = true;
      if (found === 'study' && (txt === '学习学业' || enName === 'Academics')) isCurrent = true;
      if (found === 'service' && (txt === '校园服务' || enName === 'Campus Services')) isCurrent = true;
      if (found === 'college' && (txt === '学院详情' || enName === 'Colleges' || enName === 'English')) isCurrent = true;
      if (found === 'organization' && (txt === '学生组织' || enName === 'Student Orgs')) isCurrent = true;
      if (found === 'share' && (txt === '文件共享' || enName === 'File Sharing')) isCurrent = true;
      if (found === 'words' && (txt === '有话送你' || enName === 'Messages')) isCurrent = true;
      if (found === 'friends' && (txt === '友情链接' || enName === 'Links')) isCurrent = true;
      if (found === 'about' && (txt === '关于Wiki' || enName === 'About Wiki')) isCurrent = true;

      if (isCurrent) {
        subList.style.display = '';
        item.classList.add('md-nav__item--active');
        item.setAttribute('data-md-state', 'open');
      } else {
        subList.style.display = 'none';
        item.classList.remove('md-nav__item--active');
        item.removeAttribute('data-md-state');
      }
    });
  }

  function rewriteAll() {
    if (!isEN) return;
    forceSidebarHide();
    document.querySelectorAll('.md-tabs__link').forEach(function (a) {
      tr(a, TAB_MAP);
      var h = toEnHref(a.getAttribute('href'));
      if (h) a.setAttribute('href', h);
    });
    document.querySelectorAll('.md-nav--primary .md-nav__link').forEach(function (a) {
      tr(a, SIDEBAR_MAP);
      var h = toEnHref(a.getAttribute('href'));
      if (h) a.setAttribute('href', h);
    });
    document.querySelectorAll('.md-typeset a, .md-footer__link').forEach(function (a) {
      var h = toEnHref(a.getAttribute('href'));
      if (h) a.setAttribute('href', h);
    });
    document.querySelectorAll('[title]').forEach(function (el) {
      var v = el.getAttribute('title');
      if (TAB_MAP[v]) el.setAttribute('title', TAB_MAP[v]);
    });
    document.querySelectorAll('[aria-label]').forEach(function (el) {
      var v = el.getAttribute('aria-label');
      if (TAB_MAP[v]) el.setAttribute('aria-label', TAB_MAP[v]);
    });
    document.querySelectorAll('.md-header__title .md-ellipsis').forEach(function (el) {
      var txt = el.textContent.replace(/[\s\u00a0]+/g, ' ').trim();
      if (TAB_MAP[txt]) el.textContent = TAB_MAP[txt];
    });
    var titleEl = document.querySelector('title');
    if (titleEl) {
      var t = titleEl.textContent;
      for (var k in TAB_MAP) { if (t.indexOf(k) !== -1) { titleEl.textContent = t.replace(k, TAB_MAP[k]); break; } }
    }
  }

  function inject() {
    if (document.querySelector('.i18n-toggle')) return;
    var nav = document.querySelector('nav.md-header__inner');
    if (!nav) return;
    var b = document.createElement('button');
    b.className = 'i18n-toggle md-header__button';
    b.setAttribute('aria-label', 'Switch language');
    b.innerHTML = '<span class="i18n-zh">中</span><span class="i18n-sep">/</span><span class="i18n-en">EN</span>';
    b.onclick = function () {
      var path = location.pathname;
      if (cur === 'zh') {
        var enPath = path.replace('/QDU-Wiki/', '/QDU-Wiki/en/');
        if (enPath === path) enPath = '/QDU-Wiki/en/';
        localStorage.setItem(SK, 'en');
        location.href = enPath;
      } else {
        var zhPath = path.replace('/QDU-Wiki/en/', '/QDU-Wiki/');
        localStorage.setItem(SK, 'zh');
        location.href = zhPath;
      }
    };
    nav.appendChild(b);
    b.classList.toggle('i18n-active-en', cur === 'en');
  }

  function init() {
    inject();
    if (isEN) {
      document.body.classList.add('i18n--en');
      rewriteAll();
      setTimeout(rewriteAll, 100);
      setTimeout(rewriteAll, 400);
      var debounce = null;
      new MutationObserver(function (mutations) {
        var hasNew = false;
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes.length > 0) { hasNew = true; break; }
        }
        if (!hasNew) return;
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(rewriteAll, 200);
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
