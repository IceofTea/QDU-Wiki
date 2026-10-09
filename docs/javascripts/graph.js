// Wiki 知识图谱（SVG 无依赖渲染 · 数据来自 scripts/build_graph.py）
// ---------------------------------------------------------------------------
// 只在含 #kgRoot 的页面挂载（docs/graph.md），其它页零开销。
// 布局：分类成环排布，节点大小 = kb chunk 数，边 = 站内真实互链；
// 孤立页（度为 0）单独列出 —— 本身就是一条维护建议。
(function () {
  'use strict';

  var CAT_COLORS = {
    'new': '#e11d48', 'live': '#ea580c', 'study': '#7c3aed',
    'service': '#0891b2', 'college': '#b63a46', 'organization': '#0f766e',
    'share': '#2563eb', 'words': '#78716c', 'about': '#4f46e5',
    'friends': '#65a30d', '主页': '#1b66c9'
  };
  var CAT_NAMES = {
    'new': '新生手册', 'live': '生活指南', 'study': '学习学业',
    'service': '校园服务', 'college': '学院详情', 'organization': '学生组织',
    'share': '文件共享', 'words': '有话送你', 'about': '关于Wiki',
    'friends': '友情链接', '主页': '主页'
  };

  function siteBase() {
    var seg = location.pathname.split('/');
    var root = seg.length > 1 && seg[1] ? '/' + seg[1] + '/' : '/';
    return location.origin + root;
  }
  // 节点 id（md 路径）→ 站内目录式 URL。
  // 必须把 xxx/index 归位成 xxx/：拼成 xxx/index/ 时 GitHub Pages 会按目录找
  // xxx/index/index.html → 404（与青大智答直达链接同源的坑，见 check_kb_links）。
  function pageUrl(id) {
    if (id === 'index') return siteBase();
    if (/\/index$/.test(id)) return siteBase() + id.slice(0, -'/index'.length) + '/';
    return siteBase() + id + '/';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function shortName(id) {
    var parts = String(id).split('/');
    var last = parts[parts.length - 1];
    return last === 'index' ? (parts.length > 1 ? parts[parts.length - 2] : '主页') : last;
  }

  function render(root, data) {
    var W = Math.min(860, root.clientWidth || 860);
    var H = 560;
    var cx = W / 2, cy = H / 2;
    var NS = 'http://www.w3.org/2000/svg';
    // 按分类分组
    var groups = {};
    data.nodes.forEach(function (n) {
      (groups[n.cat] = groups[n.cat] || []).push(n);
    });
    var cats = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; });
    var pos = {};
    // 最大类放中心环，其余按环均布
    var R0 = 90, R1 = 200;
    cats.forEach(function (cat, gi) {
      var members = groups[cat].slice().sort(function (a, b) { return b.n - a.n; });
      var R = gi === 0 ? R0 : R1;
      // 小类多环错峰：同环超过 12 个则内外双环
      members.forEach(function (n, i) {
        var ring = (gi === 0 || members.length <= 12) ? 0 : (i % 2);
        var rr = R + ring * 55 - (members.length <= 12 ? 0 : 27);
        var ang = (i / members.length) * Math.PI * 2 - Math.PI / 2 + gi * 0.35;
        pos[n.id] = { x: cx + rr * Math.cos(ang), y: cy + rr * Math.sin(ang) * 0.82 };
      });
    });
    var maxN = 1;
    data.nodes.forEach(function (n) { if (n.n > maxN) maxN = n.n; });
    function radius(n) { return 7 + 13 * Math.sqrt(n.n / maxN); }

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('class', 'kg-svg');
    // 边
    var deg = {};
    data.edges.forEach(function (e) {
      var a = pos[e[0]], b = pos[e[1]];
      if (!a || !b) return;
      deg[e[0]] = (deg[e[0]] || 0) + 1;
      deg[e[1]] = (deg[e[1]] || 0) + 1;
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.setAttribute('class', 'kg-edge');
      line.dataset.a = e[0]; line.dataset.b = e[1];
      svg.appendChild(line);
    });
    // 节点
    data.nodes.forEach(function (n) {
      var p = pos[n.id];
      if (!p) return;
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'kg-node' + ((deg[n.id] || 0) === 0 ? ' iso' : ''));
      g.dataset.id = n.id;
      g.dataset.cat = n.cat;
      g.dataset.name = shortName(n.id);
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
      c.setAttribute('r', radius(n));
      c.setAttribute('fill', CAT_COLORS[n.cat] || '#888');
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', p.x); t.setAttribute('y', p.y + radius(n) + 12);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'kg-label');
      t.textContent = shortName(n.id);
      var title = document.createElementNS(NS, 'title');
      title.textContent = n.id + ' · ' + (n.n || 0) + ' 知识块 · ' + (deg[n.id] || 0) + ' 条互链';
      g.appendChild(c); g.appendChild(t); g.appendChild(title);
      g.addEventListener('click', function () {
        location.href = pageUrl(n.id);
      });
      // 悬停高亮邻边
      g.addEventListener('mouseenter', function () {
        Array.prototype.forEach.call(svg.querySelectorAll('.kg-edge'), function (e) {
          e.classList.toggle('hot', e.dataset.a === n.id || e.dataset.b === n.id);
        });
      });
      g.addEventListener('mouseleave', function () {
        Array.prototype.forEach.call(svg.querySelectorAll('.kg-edge.hot'), function (e) {
          e.classList.remove('hot');
        });
      });
      svg.appendChild(g);
    });
    // 图例
    var legend = document.createElement('div');
    legend.className = 'kg-legend';
    cats.forEach(function (cat) {
      var s = document.createElement('span');
      s.className = 'kg-leg';
      s.innerHTML = '<i style="background:' + (CAT_COLORS[cat] || '#888') + '"></i>' +
        esc(CAT_NAMES[cat] || cat) + ' ' + groups[cat].length;
      s.addEventListener('click', function () { filterCat(cat === filterState.cat ? '' : cat); });
      legend.appendChild(s);
    });
    var filterState = { cat: '', q: '' };
    function applyFilter() {
      Array.prototype.forEach.call(svg.querySelectorAll('.kg-node'), function (g) {
        var okCat = !filterState.cat || g.dataset.cat === filterState.cat;
        var okQ = !filterState.q || g.dataset.name.toLowerCase().indexOf(filterState.q) >= 0 || g.dataset.id.toLowerCase().indexOf(filterState.q) >= 0;
        g.style.opacity = (okCat && okQ) ? '1' : '0.12';
      });
    }
    function filterCat(cat) {
      filterState.cat = cat;
      Array.prototype.forEach.call(legend.querySelectorAll('.kg-leg'), function (el, i) {
        el.classList.toggle('on', cats[i] === cat);
      });
      applyFilter();
    }
    // 搜索框
    var bar = document.createElement('div');
    bar.className = 'kg-bar';
    var input = document.createElement('input');
    input.placeholder = '搜索页面（如：食堂/转专业）…';
    input.addEventListener('input', function () {
      filterState.q = input.value.trim().toLowerCase();
      applyFilter();
    });
    bar.appendChild(input);
    var stat = document.createElement('div');
    stat.className = 'kg-stat';
    var iso = data.nodes.filter(function (n) { return !(deg[n.id] || 0); });
    stat.innerHTML = '共 <b>' + data.pages + '</b> 页 · <b>' + data.links + '</b> 条互链' +
      ' · <span title="无站内互链的页面，建议补交叉引用">孤立页 <b>' + iso.length + '</b></span>';
    // 孤立页清单（维护建议，可折叠）
    var isoBox = document.createElement('details');
    isoBox.className = 'kg-iso';
    var sum = document.createElement('summary');
    sum.textContent = '孤立页清单（建议补交叉引用，点击直达）';
    isoBox.appendChild(sum);
    iso.slice(0, 30).forEach(function (n) {
      var a = document.createElement('a');
      a.href = pageUrl(n.id);
      a.textContent = n.id;
      isoBox.appendChild(a);
    });
    root.appendChild(bar);
    root.appendChild(svg);
    root.appendChild(legend);
    root.appendChild(stat);
    root.appendChild(isoBox);
  }

  function boot() {
    var root = document.getElementById('kgRoot');
    if (!root || root.dataset.done) return;
    root.dataset.done = '1';
    root.innerHTML = '<div class="kg-loading">图谱加载中…</div>';
    var base = (function () {
      var seg = location.pathname.split('/');
      var r = seg.length > 1 && seg[1] ? '/' + seg[1] + '/' : '/';
      return location.origin + r;
    })();
    fetch(base + 'assets/graph.json').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      root.innerHTML = '';
      if (!data || !data.nodes || !data.nodes.length) {
        root.innerHTML = '<div class="kg-empty">暂无图谱数据（跑 scripts/build_graph.py 生成）</div>';
        return;
      }
      render(root, data);
    }).catch(function () {
      root.innerHTML = '<div class="kg-empty">图谱数据加载失败（assets/graph.json 缺失，跑 scripts/build_graph.py）</div>';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
