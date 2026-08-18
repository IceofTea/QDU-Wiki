// 主页访问统计卡片：读取 Vercount（兼容不蒜子标签）统计值，填充卡片数字并做滚动动画，
// 兼容 navigation.instant 返回主页时回填，外部统计服务不可用时优雅降级为占位符。
// 数据来源有两路：
//   1) 首次整页加载：异步注入 Vercount 脚本，脚本回填隐藏锚点后，本地轮询读取回填卡片（不额外发请求，避免首屏缓冲）。
//   2) instant 返回主页：新 DOM 的隐藏锚点是空的，Vercount 脚本不会重跑，故直接直连其 API 拉取最新值并回填，
//      同时用 sessionStorage 缓存先行回填，避免空白闪烁；同一时刻也只发一次请求并加节流，避免连发。
(function () {
  'use strict';

  var STORAGE_KEY = 'qdu-wiki-visit-v1';
  var VERC0UNT_SRC = 'https://vercount.one/js';
  var API_URL = 'https://events.vercount.one/api/v2/log';
  var UV_COOKIE_PREFIX = 'vercount_uv_';
  var MAX_TRIES = 60; // 锚点轮询上限约 30s，等待 Vercount 首次返回
  var REFRESH_MS = 5000; // 返回主页时 API 刷新的节流窗口，防止快速往返连发

  var last = null;
  var lastRefresh = 0;

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

  function fillCards() {
    document.querySelectorAll('[data-count="pv"]').forEach(function (el) {
      el.textContent = format(parseInt(last.pv, 10) || 0);
    });
    document.querySelectorAll('[data-count="uv"]').forEach(function (el) {
      el.textContent = format(parseInt(last.uv, 10) || 0);
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

  // ---- Vercount API 直连（返回主页刷新用），与官方脚本保持同一套 UV cookie 去重逻辑 ----
  function hostKey() {
    return (window.location.host || 'unknown-host').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  function hasUvCookie() {
    var name = UV_COOKIE_PREFIX + hostKey() + '=1';
    return document.cookie.split('; ').indexOf(name) !== -1;
  }

  function setUvCookie() {
    document.cookie = UV_COOKIE_PREFIX + hostKey() + '=1; path=/; max-age=31536000; samesite=lax';
  }

  // 异步拉取最新 site_pv / site_uv；永不抛错，失败返回 null 由调用方降级
  function fetchVisit() {
    var url = window.location.href;
    if (!url || url.indexOf('http') !== 0) return Promise.resolve(null);

    var isNewUv = !hasUvCookie();
    if (isNewUv) setUvCookie();

    return fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, isNewUv: isNewUv })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (res) {
      var data = (res && res.data) || res;
      if (!data || data.site_pv === undefined) return null;
      return { pv: String(data.site_pv), uv: String(data.site_uv) };
    }).catch(function () {
      return null;
    });
  }

  // 返回主页时刷新：先用缓存立即回填（避免空白闪烁），再直连 API 拉最新值，节流防连发
  function refresh() {
    restore();
    if (last) fillCards();

    var now = Date.now();
    if (now - lastRefresh < REFRESH_MS) return;
    lastRefresh = now;

    fetchVisit().then(function (d) {
      if (!d) return;
      last = d;
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) {}
      fillCards();
    });
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
  document.addEventListener('DOMContentSwitch', function () {
    if (document.getElementById('busuanzi_value_site_pv')) {
      refresh();
    } else {
      restore(); apply();
    }
  });

  // MutationObserver 兜底：Material 9.x 高版本的 instant navigation 用 fetch 替换
  // DOM 且不再派发 DOMContentSwitch 事件（home-hero.js 同款问题），需监听主页锚点
  // 重新插入来触发刷新，确保返回主页后统计卡片一定能回填。
  function watchHome() {
    if (document.body && document.body.dataset.visitWatch) return;
    if (!document.body) return;
    document.body.dataset.visitWatch = '1';
    var mo = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType === 1 && node.querySelector && node.querySelector('#busuanzi_value_site_pv')) {
            refresh();
            return;
          }
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) {
    watchHome();
  } else {
    document.addEventListener('DOMContentLoaded', watchHome);
  }
})();