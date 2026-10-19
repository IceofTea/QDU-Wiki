// 最近阅读 + 顶部阅读进度条：本地 localStorage 记录，首页 hero 区渲染「继续上次」
// ---------------------------------------------------------------------------
(function () {
  'use strict';

  var KEY = 'qdu_recent_reads';
  var MAX = 8;

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch (e) { return [] } }
  function save(l) { try { localStorage.setItem(KEY, JSON.stringify(l)) } catch (e) { /* noop */ } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) }

  var lastPath = '';
  function record() {
    var path = location.pathname;
    if (path === lastPath) return;
    lastPath = path;
    if (document.querySelector('.hero')) return; // 首页不记
    var h1 = document.querySelector('.md-content h1');
    var title = (h1 && h1.textContent.trim()) || document.title.replace(/ - .+$/, '');
    if (!title) return;
    var list = load().filter(function (r) { return r.path !== path });
    list.unshift({ path: path, title: title, ts: Date.now() });
    save(list.slice(0, MAX));
  }

  function renderHome() {
    var box = document.getElementById('recent-reads');
    if (!box) return;
    var list = load().slice(0, 6);
    if (!list.length) { box.hidden = true; return; }
    var zh = location.pathname.indexOf('/en/') === -1;
    box.hidden = false;
    box.innerHTML = '<span class="recent-reads__label">' + (zh ? '继续阅读' : 'Resume') + '</span>' +
      list.map(function (r) { return '<a class="recent-chip" href="' + r.path + '">' + esc(r.title) + '</a>' }).join('');
  }

  function setup() { renderHome(); record(); }

  document.addEventListener('DOMContentLoaded', setup);
  document.addEventListener('DOMContentSwitch', setup);

  // instant navigation 不派发标准事件：监听 .md-content 节点替换来记录新页
  var observer = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var t = muts[i].target;
      if (t && t.querySelector && t.querySelector('.md-content')) { setup(); return }
    }
  });
  function watch() {
    if (!document.body) { setTimeout(watch, 50); return }
    observer.observe(document.body, { childList: true, subtree: true });
  }
  watch();
})();
