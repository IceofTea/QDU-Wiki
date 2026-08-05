// 四季切换：默认按当前日期自动匹配，也支持在页眉手动选择春/夏/秋/冬/自动
(function () {
  'use strict';

  var STORAGE_KEY = 'qdu-wiki-season';
  var SEASONS = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
  var SEASON_COLORS = { spring: '#66bb6a', summer: '#ff7043', autumn: '#ffa000', winter: '#42a5f5' };
  var OPTIONS = [
    { key: 'auto', label: '自动' },
    { key: 'spring', label: '春天' },
    { key: 'summer', label: '夏天' },
    { key: 'autumn', label: '秋天' },
    { key: 'winter', label: '冬天' }
  ];

  // 按日期判断当前季节
  function getSeasonByDate() {
    var now = new Date();
    var year = now.getFullYear();
    var date = now.getTime();
    var seasons = [
      { name: 'spring', start: new Date(year, 2, 20).getTime(), end: new Date(year, 5, 20).getTime() },
      { name: 'summer', start: new Date(year, 5, 21).getTime(), end: new Date(year, 8, 22).getTime() },
      { name: 'autumn', start: new Date(year, 8, 23).getTime(), end: new Date(year, 11, 21).getTime() },
      { name: 'winter', start: new Date(year, 11, 22).getTime(), end: new Date(year + 1, 2, 19).getTime() }
    ];
    for (var i = 0; i < seasons.length; i++) {
      if (date >= seasons[i].start && date <= seasons[i].end) return seasons[i].name;
    }
    return 'spring';
  }

  function getMode() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  // 当前实际生效的季节：手动选择优先，否则按日期
  function getSeason() {
    var mode = getMode();
    return mode === 'auto' ? getSeasonByDate() : mode;
  }

  // 把页面中的四季背景替换为指定季节。
  // 背景图用 CSS background-image 动态设置（而非 <img src>），
  // 避免 HTML 里写死默认季节图导致首屏「默认图 + 目标季节图」双下载。
  function applySeason() {
    var season = getSeason();

    document.querySelectorAll('[data-seasonal]').forEach(function (el) {
      var url = 'url(assets/' + season + '.webp)';
      if ((el.style.backgroundImage || '').indexOf(season + '.webp') === -1) {
        el.style.backgroundImage = url;
        el.setAttribute('aria-label', '校园' + SEASONS[season] + '景');
      }
    });

    var selectors = ['.md-logo img', '.md-header__button img', 'header img[alt="logo"]'];
    document.querySelectorAll(selectors.join(',')).forEach(function (img) {
      var src = img.getAttribute('src') || img.src || '';
      var dir = src.substring(0, src.lastIndexOf('/') + 1);
      var target = dir + 'logo-' + season + '.png';
      if (src !== target && img.src !== target) {
        img.setAttribute('src', target);
      }
    });
  }

  // 刷新页眉季节按钮的显示
  function renderPicker(season) {
    var toggle = document.querySelector('.season-picker__toggle');
    if (!toggle) return;
    var icon = toggle.querySelector('.season-picker__icon');
    var label = toggle.querySelector('.season-picker__label');
    if (icon) icon.style.background = SEASON_COLORS[season];
    if (label) label.textContent = SEASONS[season];
  }

  // 向页眉注入季节选择按钮（每次页面切换后若丢失则重建）
  function ensurePicker() {
    if (document.querySelector('.season-picker')) {
      renderPicker(getSeason());
      return;
    }

    var season = getSeason();
    var mode = getMode();

    var picker = document.createElement('div');
    picker.className = 'season-picker';

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'season-picker__toggle';
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.title = '切换季节';
    toggle.innerHTML =
      '<span class="season-picker__icon" style="background:' + SEASON_COLORS[season] + '"></span>' +
      '<span class="season-picker__label">' + SEASONS[season] + '</span>' +
      '<span class="season-picker__caret">▾</span>';

    var menu = document.createElement('ul');
    menu.className = 'season-picker__menu';
    OPTIONS.forEach(function (opt) {
      var li = document.createElement('li');
      li.className = 'season-picker__item' + (opt.key === mode ? ' active' : '');
      li.setAttribute('data-season', opt.key);
      li.textContent = opt.label;
      menu.appendChild(li);
    });

    picker.appendChild(toggle);
    picker.appendChild(menu);

    var inner = document.querySelector('.md-header__inner');
    var option = document.querySelector('.md-header__option');
    if (option && inner) {
      inner.insertBefore(picker, option);
    } else if (inner) {
      inner.appendChild(picker);
    } else {
      document.body.appendChild(picker);
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = picker.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.addEventListener('click', function (e) {
      var li = e.target.closest('.season-picker__item');
      if (!li) return;
      var key = li.getAttribute('data-season');
      try {
        localStorage.setItem(STORAGE_KEY, key);
      } catch (err) {}
      picker.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      Array.prototype.forEach.call(menu.children, function (child) {
        child.classList.toggle('active', child === li);
      });
      applySeason();
      renderPicker(getSeason());
    });

    document.addEventListener('click', function (e) {
      if (!picker.contains(e.target)) {
        picker.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var pending = null;
  function scheduleApply() {
    if (pending) return;
    pending = setTimeout(function () {
      pending = null;
      applySeason();
      ensurePicker();
    }, 80);
  }

  // 首次进入
  document.addEventListener('DOMContentLoaded', scheduleApply);
  window.addEventListener('load', scheduleApply);

  // 立即应用一次：defer 脚本执行时 DOM 已解析，尽早设置背景图可让目标季节图
  // 第一时间开始下载，避免等待 DOMContentLoaded 造成首屏空白。
  scheduleApply();

  // 启用 navigation.instant 后，页面切换不触发 load，需监听其重渲染事件
  document.addEventListener('DOMContentSwitch', scheduleApply);
  document.addEventListener('components:updated', scheduleApply);

  // 兜底：监听 DOM 变化，捕获任意时刻页眉/横幅的重新渲染
  if (document.documentElement) {
    new MutationObserver(scheduleApply).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
