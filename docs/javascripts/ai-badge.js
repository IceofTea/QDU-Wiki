// 本页 AI 贡献徽标（专家“全过程可溯源”：AI 在本页做了什么，可见可量化）
// ---------------------------------------------------------------------------
// 统计本页本地评论中的 AI 归纳次数 + 纠错条数，挂在 H1 评论徽章旁。
// 纯本机计算、零请求；无评论时显示默认态，不打扰阅读。
(function () {
  'use strict';

  var LS_KEY = 'qdu_wiki_comments_v1';

  function pagePath() {
    var p = location.pathname.replace(/index\.html$/, '');
    var seg = p.split('/');
    if (seg[1] === 'QDU-Wiki') seg.splice(1, 1);
    p = seg.join('/');
    if (!p.endsWith('/')) p += '/';
    return p || '/';
  }

  function mount() {
    if (document.querySelector('.qc-ai-badge')) return;
    var h1 = document.querySelector('.md-content h1') || document.querySelector('h1');
    if (!h1) return;
    var list = [];
    try {
      var db = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      list = db[pagePath()] || [];
    } catch (e) { /* noop */ }
    var fixes = list.filter(function (c) { return c.type === 'correction'; }).length;
    var b = document.createElement('span');
    b.className = 'qc-ai-badge';
    b.title = '本页 AI 贡献：抽取式归纳可用（评论区 AI 归纳按钮）· 已收纠错 ' + fixes + ' 条（进维护队列）';
    b.textContent = '🤖 AI 共建' + (fixes ? ' · 纠错' + fixes : '');
    b.style.cssText = 'margin-left:8px;font-size:11px;font-weight:600;background:rgba(124,58,237,.1);color:#7c3aed;border-radius:999px;padding:3px 10px;vertical-align:middle;cursor:default';
    h1.appendChild(b);
  }

  function boot() {
    mount();
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
