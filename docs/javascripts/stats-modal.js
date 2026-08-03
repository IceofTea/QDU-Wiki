// 主页 Hero 统计卡片：点击弹出详情弹窗（ESI 1‰ / 1% 学科名单、国家一流专业名单），
// 兼容 navigation.instant 返回主页时重建绑定。名单数据以 JS 数组维护，避免 HTML 体积膨胀。
(function () {
  'use strict';

  var DATA = {
    permille: {
      icon: '🔬',
      title: 'ESI 全球前 1‰ 学科',
      sub: '截至 2026-05，全球前 1‰（千分之一）学科',
      note: 'ESI（Essential Science Indicators，基本科学指标数据库）按近 11 年被引论文数据对全球科研机构分学科排序。进入前 1‰ 代表该学科已达到国际顶尖水平。',
      items: ['化学', '工程学', '材料科学', '药理学与毒理学']
    },
    percent: {
      icon: '🏛️',
      title: 'ESI 全球前 1% 学科',
      sub: '截至 2025-11，共 17 个学科进入全球前 1%',
      note: '进入 ESI 全球前 1% 代表该学科已具备较强国际竞争力。其中化学、工程学、材料科学、药理学与毒理学 4 个学科更进入前 1‰。',
      items: [
        '化学', '工程学', '材料科学', '药理学与毒理学',
        '神经科学与行为学', '临床医学', '分子生物学与遗传学', '生物与生化',
        '计算机科学', '一般社会科学', '环境与生态学', '农业科学',
        '免疫学', '精神病学与心理学', '物理学', '经济与商学', '数学'
      ]
    },
    majors: {
      icon: '🎓',
      title: '国家一流专业建设点',
      sub: '2019-2021 年度，共 39 个专业入选',
      note: '教育部自 2019 年起实施「双万计划」，分年度遴选国家级一流本科专业建设点。青岛大学 2019 年度 18 个、2020 年度 14 个、2021 年度 7 个，累计 39 个。',
      items: [
        '经济学', '金融学', '法学', '小学教育', '汉语言文学', '英语', '德语', '日语',
        '新闻学', '历史学', '数学与应用数学', '应用物理学', '应用化学', '生物技术',
        '应用心理学', '机械工程', '高分子材料与工程', '复合材料与工程',
        '电气工程及其自动化', '电子信息工程', '微电子科学与工程', '自动化',
        '计算机科学与技术', '软件工程', '纺织工程', '临床医学', '医学影像学',
        '口腔医学', '预防医学', '药学', '医学检验技术', '护理学',
        '信息管理与信息系统', '工商管理', '会计学', '旅游管理',
        '音乐表演', '音乐学', '绘画'
      ]
    }
  };

  var pop = null;
  var listEl = null;

  function renderItems(items) {
    listEl.textContent = '';
    items.forEach(function (name) {
      var li = document.createElement('li');
      li.textContent = name;
      listEl.appendChild(li);
    });
  }

  function open(key) {
    var d = DATA[key];
    if (!d || !pop) return;
    pop.querySelector('.stats-modal__icon').textContent = d.icon;
    pop.querySelector('.stats-modal__title').textContent = d.title;
    pop.querySelector('.stats-modal__sub').textContent = d.sub;
    pop.querySelector('.stats-modal__note').textContent = d.note;
    renderItems(d.items);
    pop.hidden = false;
    document.body.classList.add('pop-open');
  }

  function close() {
    pop.hidden = true;
    document.body.classList.remove('pop-open');
  }

  function init() {
    pop = document.getElementById('stats-modal');
    listEl = pop ? pop.querySelector('.stats-modal__list') : null;
    if (!pop || !listEl || pop.dataset.bound) return;
    pop.dataset.bound = '1';

    document.querySelectorAll('.hero-stats .stat[data-stat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        open(btn.getAttribute('data-stat'));
      });
    });

    pop.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pop.hidden) close();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('DOMContentSwitch', init);
  document.addEventListener('components:updated', init);

  // Material 9.x instant navigation：监听统计弹窗重新插入后重建绑定
  var observer = null;
  function watch() {
    if (observer) return;
    observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var node = mutations[i].addedNodes;
        for (var j = 0; j < node.length; j++) {
          var n = node[j];
          if (n.nodeType === 1 && (n.id === 'stats-modal' || (n.querySelector && n.querySelector('#stats-modal')))) {
            init();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  watch();
})();
