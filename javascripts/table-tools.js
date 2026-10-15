/* QDU-Wiki 表格工具 —— 给正文表格加「点表头排序 + 关键字筛选 + 行数统计」
 * ---------------------------------------------------------------------------
 * 文档站里有大量表格（培养方案、奖学金档位、电话号码、快递点、学院列表…），
 * 静态表格最大的痛点是「想找一行只能靠眼睛扫」。本脚本在每张表格上方注入一条轻量工具条：
 *   · 点表头：升/降序交替排序（数字列按数值排，日期列按时间排，其余按本地化字符串）
 *   · 筛选框：对整张表做包含式过滤，实时隐藏不匹配行
 *   · 统计：显示「匹配 n / 共 m 行」，筛选无结果时给出空态提示
 * 设计取舍：
 *   · 纯前端、零依赖、不改动 Markdown 源文件——因此对上游内容完全无侵入；
 *   · 只处理 .md-typeset 内的 <table>，跳过演示表（.no-table-tools）与不足 3 行的表；
 *   · 排序/筛选都直接操作已有 <tr>，不做 DOM 重建，保留原有样式与链接；
 *   · 移动端工具栏换行显示，不遮挡表格。
 */
(function () {
  'use strict';

  var MIN_ROWS = 3;

  function isNumeric(s) {
    return /^-?\d+(\.\d+)?$/.test(String(s).replace(/[,\s%¥元台人个分]/g, '').trim());
  }

  function numOf(s) {
    var v = parseFloat(String(s).replace(/[,\s%¥元台人个分]/g, ''));
    return isNaN(v) ? -Infinity : v;
  }

  function cellText(td) {
    return (td ? td.textContent || '' : '').replace(/\s+/g, ' ').trim();
  }

  function buildTable(table) {
    if (table.dataset.qduTools) return;
    var body = table.tBodies[table.tBodies.length - 1];
    if (!body) return;
    var rows = Array.prototype.slice.call(body.rows);
    if (rows.length < MIN_ROWS) return;
    table.dataset.qduTools = '1';

    var headRow = table.tHead ? table.tHead.rows[table.tHead.rows.length - 1] : null;
    var cols = rows[0] ? rows[0].cells.length : 0;
    if (!headRow || headRow.cells.length < 2) return;

    // ── 工具条 ──
    var bar = document.createElement('div');
    bar.className = 'qdu-table-tools';

    var box = document.createElement('input');
    box.type = 'search';
    box.className = 'qdu-table-filter';
    box.placeholder = '筛选本表…';
    box.setAttribute('aria-label', '筛选本表内容');

    var info = document.createElement('span');
    info.className = 'qdu-table-info';

    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'qdu-table-reset';
    reset.textContent = '重置';
    reset.hidden = true;

    bar.appendChild(box);
    bar.appendChild(info);
    bar.appendChild(reset);
    table.parentNode.insertBefore(bar, table);

    function syncInfo(visible) {
      info.textContent = visible === rows.length
        ? '共 ' + rows.length + ' 行'
        : '匹配 ' + visible + ' / ' + rows.length + ' 行';
    }

    function applyFilter() {
      var kw = box.value.trim().toLowerCase();
      var visible = 0;
      rows.forEach(function (tr) {
        var hit = !kw || (tr.textContent || '').toLowerCase().indexOf(kw) !== -1;
        tr.classList.toggle('qdu-row-hidden', !hit);
        if (hit) visible++;
      });
      reset.hidden = !kw;
      syncInfo(visible);
      table.classList.toggle('qdu-table-empty', visible === 0);
    }

    box.addEventListener('input', applyFilter);
    reset.addEventListener('click', function () {
      box.value = '';
      applyFilter();
      box.focus();
    });

    // ── 表头排序 ──
    var state = { col: -1, dir: 1 };
    Array.prototype.forEach.call(headRow.cells, function (th, idx) {
      th.classList.add('qdu-sortable');
      th.setAttribute('role', 'button');
      th.setAttribute('tabindex', '0');
      th.title = '点击按此列排序';
      function toggle() {
        if (state.col === idx) state.dir = -state.dir;
        else { state.col = idx; state.dir = 1; }
        Array.prototype.forEach.call(headRow.cells, function (h, i) {
          h.classList.toggle('qdu-sort-asc', i === idx && state.dir === 1);
          h.classList.toggle('qdu-sort-desc', i === idx && state.dir === -1);
        });
        var numeric = rows.filter(function (r) { return r.cells[idx]; })
          .map(function (r) { return cellText(r.cells[idx]); })
          .every(isNumeric);
        var sorted = rows.slice().sort(function (a, b) {
          var x = cellText(a.cells[idx]);
          var y = cellText(b.cells[idx]);
          var cmp = numeric ? (numOf(x) - numOf(y)) : x.localeCompare(y, 'zh-Hans-CN', { numeric: true });
          return cmp * state.dir;
        });
        sorted.forEach(function (tr) { body.appendChild(tr); });
      }
      th.addEventListener('click', toggle);
      th.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });

    applyFilter();
  }

  function scan(scope) {
    (scope || document).querySelectorAll('.md-typeset table').forEach(function (t) {
      if (t.closest('.no-table-tools')) return;
      try { buildTable(t); } catch (e) { /* 单表失败不影响其它表 */ }
    });
  }

  function boot() {
    scan(document);
    // MkDocs Material 启用 instant loading 时内容会被局部替换，需重新扫描
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { scan(document); });
    }
    var target = document.querySelector('.md-content__inner') || document.body;
    if (window.MutationObserver) {
      var t = null;
      new MutationObserver(function () {
        clearTimeout(t);
        t = setTimeout(function () { scan(document); }, 200);
      }).observe(target, { childList: true, subtree: true });
    }
  }

  boot();
})();
