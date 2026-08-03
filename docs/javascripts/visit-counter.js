// 主页访问统计卡片：读取 Vercount（兼容不蒜子标签）统计值，填充卡片数字并做滚动动画，
// 兼容 navigation.instant 返回主页时回填，外部统计服务不可用时优雅降级为占位符。
(function () {
  'use strict';

  var STORAGE_KEY = 'qdu-wiki-visit-v1';
  var VERC0UNT_SRC = 'https://vercount.one/js';
  var MAX_TRIES = 60; // 轮询上限约 30s，等待 Vercount 首次返回
  var DURATION = 1000; // 数字滚动动画时长 ms

  var last = null;

  function restore() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) last = JSON.parse(raw);
    } catch (e) { last = null; }
  }

  function readValue(id) {
    var el = document.getElementById(id);
    if (!el) return '';
    return (el.textContent || '').trim();
  }

  // 千分位格式化
  function format(n) {
    return n.toLocaleString('en-US');
  }

  // 从当前值滚动到目标值的数字动画（easeOutCubic）
  function animateNum(el, target) {
    var current = parseInt((el.textContent || '').replace(/[^\d]/g, ''), 10) || 0;
    if (current === target) {
      el.textContent = format(target);
      return;
    }
    var start = current;
    var startTs = null;
    function step(ts) {
      if (startTs === null) startTs = ts;
      var p = Math.min((ts - startTs) / DURATION, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(start + (target - start) * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function fillCards() {
    document.querySelectorAll('[data-count="pv"]').forEach(function (el) {
      animateNum(el, parseInt(last.pv, 10) || 0);
    });
    document.querySelectorAll('[data-count="uv"]').forEach(function (el) {
      animateNum(el, parseInt(last.uv, 10) || 0);
    });
  }

  function apply() {
    var pv = readValue('busuanzi_value_site_pv');
    var uv = readValue('busuanzi_value_site_uv');

    if (pv && uv) {
      last = { pv: pv, uv: uv };
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(last)); } catch (e) {}
    }
    if (!last) return;
    fillCards();
  }

  // 异步注入 Vercount 脚本，避免阻塞首屏渲染；脚本就绪后其回调会填充隐藏锚点，随后轮询读取。
  function injectVercount() {
    if (document.querySelector('script[src="' + VERC0UNT_SRC + '"]')) return;
    var s = document.createElement('script');
    s.src = VERC0UNT_SRC;
    s.async = true;
    s.referrerPolicy = 'no-referrer-when-downgrade';
    document.head.appendChild(s);
  }

  var started = false;
  function start() {
    if (started) return;
    started = true;
    injectVercount();
    var tries = 0;
    var timer = setInterval(function () {
      apply();
      if (++tries >= MAX_TRIES) clearInterval(timer);
    }, 500);
  }
  restore();
  document.addEventListener('DOMContentLoaded', start);
  document.addEventListener('DOMContentSwitch', function () { restore(); apply(); });
})();
