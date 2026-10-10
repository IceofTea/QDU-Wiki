// 纠错聚合看板（维护者页）：汇总本机各页 type=correction 评论 + CSV 导出
// ---------------------------------------------------------------------------
// 挂载页：docs/about/fixes.md（#fixRoot）。数据来自本地评论库，
// 跨页聚合；CSV 可直接粘进维护 Agent 待办（飞轮回流的 Wiki 侧入口）。
// 无纠错时显示空态 + 去百科逛逛的引导，不制造焦虑。
(function () {
  'use strict';

  var LS_KEY = 'qdu_wiki_comments_v1';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function fmtTime(ts) {
    var d = new Date(ts || 0);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function siteBase() {
    var seg = location.pathname.split('/');
    var root = seg.length > 1 && seg[1] ? '/' + seg[1] + '/' : '/';
    return location.origin + root;
  }
  // 纠错记录的 path 由 comments.js 写入 location.pathname（已含站点前缀 /QDU-Wiki/），
  // 直接拿 siteBase() 再拼一次会变成 /QDU-Wiki/QDU-Wiki/xxx → 404，故按格式分流。
  function fixHref(p) {
    p = String(p || '');
    if (/^https?:\/\//.test(p)) return p;
    if (p.charAt(0) === '/') return location.origin + p;  // 绝对路径（线上/本地均适用）
    return siteBase() + p.replace(/^\/+/, '');            // 兜底：相对路径
  }
  function collect() {
    var db = {};
    try { db = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { db = {}; }
    var out = [];
    Object.keys(db).forEach(function (path) {
      (db[path] || []).forEach(function (c) {
        if (c && c.type === 'correction') {
          out.push({
            path: path,
            quote: (c.quote || c.title || '').slice(0, 60),
            content: (c.content || '').slice(0, 140),
            author: c.author || '匿名同学',
            ts: c.ts || 0
          });
        }
      });
    });
    out.sort(function (a, b) { return b.ts - a.ts; });
    return out;
  }
  function toCSV(rows) {
    var q = function (s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; };
    var lines = ['页面,原文/标题,纠错内容,作者,时间'];
    rows.forEach(function (r) {
      lines.push([r.path, r.quote, r.content, r.author, fmtTime(r.ts)].map(q).join(','));
    });
    return '﻿' + lines.join('\n');
  }

  function render(root) {
    var rows = collect();
    var html = '<div class="fx-summary">本机共 <b>' + rows.length + '</b> 条纠错' +
      (rows.length ? '（CSV 可导入维护待办）' : '——去百科页面点“信息有误？纠错”来第一条吧') + '</div>';
    if (rows.length) {
      html += '<div class="fx-ops"><button type="button" class="fx-btn" id="fxCsv">⬇ 导出 CSV</button></div>';
      html += '<div class="fx-list">' + rows.map(function (r) {
        return '<div class="fx-item">' +
          '<div class="fx-meta"><a href="' + fixHref(r.path) + '">' + esc(r.path) + '</a>' +
          '<span>' + esc(r.author) + ' · ' + fmtTime(r.ts) + '</span></div>' +
          (r.quote ? '<div class="fx-quote">「' + esc(r.quote) + '」</div>' : '') +
          '<div class="fx-content">' + esc(r.content) + '</div></div>';
      }).join('') + '</div>';
    }
    root.innerHTML = html;
    var btn = document.getElementById('fxCsv');
    if (btn) btn.addEventListener('click', function () {
      var blob = new Blob([toCSV(collect())], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'wiki-fixes-' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    });
  }

  function boot() {
    var root = document.getElementById('fixRoot');
    if (!root || root.dataset.done) return;
    root.dataset.done = '1';
    render(root);
    // 本页停留时别处提交的纠错也能即时出现
    window.addEventListener('storage', function (e) {
      if (e.key === LS_KEY) render(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
