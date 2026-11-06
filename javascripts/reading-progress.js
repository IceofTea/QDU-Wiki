/**
 * 阅读进度条 + 外链标记
 * - 顶部 3px 品牌蓝进度条，随滚动实时填充（rAF 节流，尊重 prefers-reduced-motion 用渐变无动画）
 * - 站外链接自动补 rel="noopener" + target="_blank" + ↗ 视觉标记（Material 主题未内置）
 * 兼容 instant navigation：进度条挂在 document 级滚动监听，链接标注在每次内容替换后重跑。
 */
(function () {
  'use strict';

  /* ── 顶部阅读进度条 ── */
  var bar = document.createElement('div');
  bar.className = 'read-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var ticking = false;
  function update() {
    ticking = false;
    var doc = document.documentElement;
    var total = doc.scrollHeight - doc.clientHeight;
    var pct = total > 0 ? Math.min(100, Math.max(0, (doc.scrollTop / total) * 100)) : 0;
    bar.style.width = pct + '%';
    bar.style.opacity = pct > 0.5 && pct < 99.8 ? '1' : '0';
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // instant navigation 会替换正文但不刷新页面 → 内容变化时重算
  if (window.MutationObserver) {
    var main = document.querySelector('.md-main');
    if (main) new MutationObserver(onScroll).observe(main, { childList: true, subtree: true });
  }
  update();

  /* ── 外链新窗口 + ↗ 标记 ── */
  function tagExternalLinks() {
    var host = location.hostname;
    document.querySelectorAll('.md-content a[href^="http"]').forEach(function (a) {
      if (a.dataset.extTagged) return;
      try {
        var u = new URL(a.href);
        if (u.hostname === host || u.hostname.endsWith('.github.io') && host.endsWith('.github.io')) return;
      } catch (e) { return; }
      a.dataset.extTagged = '1';
      a.target = '_blank';
      a.rel = 'noopener';
      a.classList.add('ext-link');
    });
  }
  tagExternalLinks();
  if (window.MutationObserver) {
    var content = document.querySelector('.md-content');
    if (content) new MutationObserver(function () { tagExternalLinks(); }).observe(content, { childList: true, subtree: true });
  }
})();
