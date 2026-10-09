// Wiki 全网评论（Giscus · GitHub Discussions 当数据库，零自建后端）
// ---------------------------------------------------------------------------
// 启用（5 分钟）：仓库开 Discussions → 建一个分类（如"评论"）→
//   打开 https://giscus.app 填仓库名取四件套 → 写进 mkdocs.yml 的 meta 插件
//   或直接在下面 GISCUS_DEFAULT 填好（与 meta 二选一）。
// 未配置时本文件静默无事（本地 comments.js 照常用，互不干扰）。
// 有 GitHub 账号才能发言（天然防 spam）；手机直接可用。
(function () {
  'use strict';

  // 已配置（仓库 IceofTea/QDU-Wiki）：meta 标签可覆盖此处缺省
  var GISCUS_DEFAULT = { repo: 'IceofTea/QDU-Wiki', repoId: 'R_kgDOTkjRBQ', category: '评论', categoryId: 'DIC_kwDOTkjRBc4DHYbl' };

  function meta(name) {
    var m = document.querySelector('meta[name="' + name + '"]');
    return (m && m.content || '').trim();
  }
  function cfg() {
    return {
      repo: meta('giscus-repo') || GISCUS_DEFAULT.repo,
      repoId: meta('giscus-repo-id') || GISCUS_DEFAULT.repoId,
      category: meta('giscus-category') || GISCUS_DEFAULT.category,
      categoryId: meta('giscus-category-id') || GISCUS_DEFAULT.categoryId,
      mapping: meta('giscus-mapping') || 'pathname'
    };
  }

  function mount() {
    var c = cfg();
    if (!c.repo || !c.repoId || !c.categoryId) return; // 未配置：静默
    if (document.querySelector('.giscus-frame')) { tidyLocal(); return; }
    // 只在正文页挂载（与 comments.js 同策略：找正文容器）
    var host = document.querySelector('.md-content__inner');
    if (!host) return;
    var sec = document.createElement('section');
    sec.className = 'giscus-wrap';
    sec.innerHTML =
      '<div style="margin-top:26px;border-top:2px solid var(--md-primary-fg-color,#1b66c9);padding-top:12px">' +
      '<div style="font-size:17px;font-weight:800;margin-bottom:4px">🌐 全网评论 <span style="font-size:11px;font-weight:400;color:#888">（GitHub 登录发言，全员可见）</span></div>' +
      '<div class="giscus"></div></div>';
    host.appendChild(sec);
    var s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-repo', c.repo);
    s.setAttribute('data-repo-id', c.repoId);
    s.setAttribute('data-category', c.category);
    s.setAttribute('data-category-id', c.categoryId);
    s.setAttribute('data-mapping', c.mapping);
    s.setAttribute('data-strict', '0');
    s.setAttribute('data-reactions-enabled', '1');
    s.setAttribute('data-emit-metadata', '0');
    s.setAttribute('data-input-position', 'bottom');
    s.setAttribute('data-theme', 'preferred_color_scheme');
    s.setAttribute('data-lang', 'zh-CN');
    sec.querySelector('.giscus').appendChild(s);
    tidyLocal();
  }

  /* ---------- 版面整理：全网评论置顶 + 本地评论折叠（静态区太占地方） ── */
  var foldCssDone = false;
  var localOpen = false; // 用户亲手点开过 → 观察者不再强行折叠（此前 bug：展开后下一次 DOM 变动即被收回）
  function tidyLocal() {
    try {
      var local = document.querySelector('.qdu-comments');
      var wrap = document.querySelector('.giscus-wrap');
      if (!wrap) return;
      // 全网评论挪到本地评论前面
      if (local && (local.compareDocumentPosition(wrap) & 4)) {
        local.parentNode.insertBefore(wrap, local);
      }
      if (!local || (local.classList.contains('qdu-folded') && localOpen)) return;
      if (!local.classList.contains('qdu-folded') && !localOpen) local.classList.add('qdu-folded');
      if (!foldCssDone) {
        foldCssDone = true;
        var st = document.createElement('style');
        st.textContent = '.qdu-comments.qdu-folded .qc-list,.qdu-comments.qdu-folded .qc-form,' +
          '.qdu-comments.qdu-folded .qc-sortbar,.qdu-comments.qdu-folded .qc-ai,' +
          '.qdu-comments.qdu-folded .qc-sel-btn,.qdu-comments.qdu-folded .qc-modal{display:none!important}' +
          '.qdu-comments.qdu-folded{opacity:.92}' +
          '.qc-unfold{margin-left:8px}';
        document.head.appendChild(st);
      }
      var head = local.querySelector('.qc-head');
      if (head && !local.querySelector('.qc-unfold')) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'qc-tool qc-unfold';
        btn.textContent = '📦 本地评论（仅本机） ▸ 展开';
        btn.addEventListener('click', function () {
          var folded = local.classList.toggle('qdu-folded');
          localOpen = !folded;
          btn.textContent = folded ? '📦 本地评论（仅本机） ▸ 展开' : '📦 本地评论（仅本机） ▾ 收起';
        });
        head.appendChild(btn);
      }
    } catch (e) { /* noop */ }
  }

  function boot() {
    mount();
    // 兼容 instant 导航：DOM 大变时补挂载
    if (window.MutationObserver) {
      var fired = false;
      var mo = new MutationObserver(function () {
        if (fired) return;
        fired = true;
        setTimeout(function () { fired = false; mount(); }, 400);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
