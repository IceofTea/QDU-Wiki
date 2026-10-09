// 阅读体验包：字号三档 + 行距两档 + PWA 注册（离线读已缓存页）
// ---------------------------------------------------------------------------
// 右下角小圆钮（A- / A / A+），偏好存本机；PWA 部分静默增强，失败不打扰。
(function () {
  'use strict';

  var LS_FS = 'qdu_read_fs';
  var LS_LH = 'qdu_read_lh';
  var FS_STEPS = [15, 16.5, 18];
  var LH_STEPS = [1.65, 1.9];

  function apply() {
    var fs = parseFloat(localStorage.getItem(LS_FS) || '') || FS_STEPS[1];
    var lh = parseFloat(localStorage.getItem(LS_LH) || '') || LH_STEPS[0];
    try {
      document.querySelectorAll('.md-typeset').forEach(function (el) {
        el.style.fontSize = fs + 'px';
        el.style.lineHeight = lh;
      });
    } catch (e) { /* noop */ }
    var lab = document.getElementById('qduFSLabel');
    if (lab) lab.textContent = 'A';
  }

  function mount() {
    if (document.getElementById('qduReadBar')) { apply(); return; }
    var bar = document.createElement('div');
    bar.id = 'qduReadBar';
    bar.innerHTML =
      '<button type="button" data-a="fs-" title="字号减小">A-</button>' +
      '<button type="button" data-a="fs+" title="字号增大">A+</button>' +
      '<button type="button" data-a="lh" title="切换行距">☰</button>';
    document.body.appendChild(bar);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var fs = parseFloat(localStorage.getItem(LS_FS) || '') || FS_STEPS[1];
      var lh = parseFloat(localStorage.getItem(LS_LH) || '') || LH_STEPS[0];
      if (b.dataset.a === 'fs-') fs = Math.max(FS_STEPS[0], fs - 1.5);
      else if (b.dataset.a === 'fs+') fs = Math.min(FS_STEPS[2], fs + 1.5);
      else lh = lh === LH_STEPS[0] ? LH_STEPS[1] : LH_STEPS[0];
      try {
        localStorage.setItem(LS_FS, String(fs));
        localStorage.setItem(LS_LH, String(lh));
      } catch (err) { /* noop */ }
      apply();
    });
    apply();
  }

  /* ---------- PWA：manifest 注入 + SW 注册（纯增强） ---------- */
  function siteBase() {
    var seg = location.pathname.split('/');
    var root = seg.length > 1 && seg[1] ? '/' + seg[1] + '/' : '/';
    return location.origin + root;
  }
  function mountPwa() {
    try {
      if (!document.querySelector('link[rel="manifest"]')) {
        var link = document.createElement('link');
        link.rel = 'manifest';
        link.href = siteBase() + 'manifest.webmanifest';
        document.head.appendChild(link);
      }
      if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
        navigator.serviceWorker.register(siteBase() + 'sw.js').catch(function () { /* 无SW文件时静默 */ });
      }
    } catch (e) { /* noop */ }
  }

  function boot() { mount(); mountPwa(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
