// 主页滚动统计栏：读取 Vercount（兼容不蒜子标签）统计值，填充到滚动栏并缓存，
// 兼容 navigation.instant 返回主页时回填，外部统计服务不可用时优雅降级为占位符。
(function () {
  'use strict';

  var STORAGE_KEY = 'qdu-wiki-visit-v1';
  var MAX_TRIES = 24; // 轮询上限约 12s，等待 Vercount 首次返回

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

  function apply() {
    var pv = readValue('busuanzi_value_site_pv');
    var uv = readValue('busuanzi_value_site_uv');

    if (pv && uv) {
      last = { pv: pv, uv: uv };
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(last)); } catch (e) {}
    }
    if (!last) return;

    document.querySelectorAll('[data-counter="pv"]').forEach(function (el) {
      el.textContent = last.pv;
    });
    document.querySelectorAll('[data-counter="uv"]').forEach(function (el) {
      el.textContent = last.uv;
    });
  }

  var started = false;
  function start() {
    if (started) return;
    started = true;
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
