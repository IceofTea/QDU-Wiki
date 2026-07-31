// 主页 Hero 动效：打字机欢迎语 + 统计数字滚动，兼容 navigation.instant
(function () {
  'use strict';

  var PHRASES = [
    '在这里，读懂你的校园生活',
    '从新生小白到青大通，只差这一步',
    '浮山 · 金家岭 · 松山，三校区全攻略'
  ];
  var TYPE_SPEED = 90;
  var DELETE_SPEED = 55;
  var HOLD = 3200;

  var typeEl = null;
  var timer = null;

  function clearTimer() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  // 打字机主循环
  function typeLoop(phraseIndex, charIndex, deleting, pendingPause) {
    if (!typeEl) return;
    var phrase = PHRASES[phraseIndex % PHRASES.length];
    var cursor = document.querySelector('#hero-type .cursor');

    if (pendingPause) {
      // 上一句刚删完，稍作停顿再打下一句
      timer = setTimeout(function () {
        typeLoop(phraseIndex, 0, false, false);
      }, 420);
      return;
    }

    if (deleting) {
      charIndex--;
      if (charIndex <= 0) {
        deleting = false;
        phraseIndex++;
        charIndex = 0;
        // 切换到下一句前停顿一下
        timer = setTimeout(function () {
          typeLoop(phraseIndex, 0, false, true);
        }, 260);
        return;
      }
    } else {
      charIndex++;
    }

    typeEl.childNodes[0].nodeValue = phrase.substring(0, charIndex);

    var delay;
    if (charIndex >= phrase.length) {
      // 完整显示后停留 HOLD 时长，再开始回缩
      deleting = true;
      delay = HOLD;
    } else {
      delay = deleting ? DELETE_SPEED : TYPE_SPEED;
    }

    timer = setTimeout(function () {
      typeLoop(phraseIndex, charIndex, deleting, false);
    }, delay);
  }

  function startTyping() {
    typeEl = document.getElementById('hero-type');
    if (!typeEl || typeEl.childNodes.length) return;
    typeEl.appendChild(document.createTextNode(''));
    var cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.textContent = '';
    typeEl.appendChild(cursor);
    clearTimer();
    timer = setTimeout(function () { typeLoop(0, 0, false); }, 300);
  }

  // 数字展示：直接填充最终值，避免从 0 滚动造成"数据为 0"的错觉
  function fillNumbers() {
    var stats = document.querySelectorAll('.stat-num[data-target]');
    Array.prototype.forEach.call(stats, function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      el.textContent = target.toLocaleString('en-US');
    });
  }

  // Hero 手册翻页：第 0 页主视觉 / 第 1 页快速入口 / 第 2 页冷知识
  function initHeroBook() {
    var book = document.getElementById('hero-book');
    if (!book || book.dataset.bound) return;
    book.dataset.bound = '1';

    var pages = Array.prototype.slice.call(book.querySelectorAll('.hero-book__page'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-book__dot'));
    var prevBtn = document.querySelector('.hero-book__prev');
    var nextBtn = document.querySelector('.hero-book__next');
    var cta = document.querySelector('.hero-cta');
    var index = 0;
    var len = pages.length;

    function render() {
      pages.forEach(function (p, i) {
        p.classList.remove('active', 'prev');
        if (i === index) p.classList.add('active');
        else if (i === index - 1) p.classList.add('prev');
      });
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === index);
      });
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === len - 1;
    }

    function go(i) {
      if (i < 0 || i >= len) return;
      index = i;
      render();
    }

    prevBtn.addEventListener('click', function () { go(index - 1); });
    nextBtn.addEventListener('click', function () { go(index + 1); });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { go(i); });
    });
    if (cta) cta.addEventListener('click', function () { go(1); });

    // 触摸 / 鼠标拖拽滑动翻页（Pointer Events 统一处理）
    var dragStartX = null;
    var dragStartIdx = index;
    book.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a')) return;
      dragStartX = e.clientX;
      dragStartIdx = index;
    }, { passive: true });
    book.addEventListener('pointerup', function (e) {
      if (dragStartX === null) return;
      var dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 50) {
        go(dx < 0 ? dragStartIdx + 1 : dragStartIdx - 1);
      }
      dragStartX = null;
    }, { passive: true });
    book.addEventListener('pointercancel', function () {
      dragStartX = null;
    }, { passive: true });

    // 键盘方向键
    book.setAttribute('tabindex', '0');
    book.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    });

    render();
  }

  // 快速入口：注入 hover 预览 + 点击弹窗（简介 + 跳转按钮 + 关闭）
  function initQuickPop() {
    var items = document.querySelectorAll('.hero-quick__item');
    var pop = document.getElementById('quick-pop');
    if (!pop || pop.dataset.bound) return;
    pop.dataset.bound = '1';

    Array.prototype.forEach.call(items, function (item) {
      var preview = document.createElement('span');
      preview.className = 'hero-quick__preview';
      preview.textContent = item.getAttribute('data-desc');
      item.appendChild(preview);

      item.addEventListener('click', function () {
        var icon = item.getAttribute('data-icon');
        var title = item.getAttribute('data-title');
        var desc = item.getAttribute('data-desc');
        var href = item.getAttribute('data-href');
        pop.querySelector('.quick-pop__icon').textContent = icon;
        pop.querySelector('.quick-pop__title').textContent = title;
        pop.querySelector('.quick-pop__desc').textContent = desc;
        pop.querySelector('.quick-pop__go').setAttribute('href', href);
        pop.hidden = false;
        document.body.classList.add('pop-open');
      });
    });

    function close() { pop.hidden = true; document.body.classList.remove('pop-open'); }

    pop.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pop.hidden) close();
    });
  }

  function setup() {
    startTyping();
    fillNumbers();
    initHeroBook();
    initQuickPop();
  }

  // 适配 instant 切换：每次内容更新后重建
  document.addEventListener('DOMContentLoaded', setup);
  document.addEventListener('DOMContentSwitch', setup);
  document.addEventListener('components:updated', setup);
})();
