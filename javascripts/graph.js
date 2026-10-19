// Wiki 知识图谱（SVG 无依赖渲染 · 数据来自 scripts/build_graph.py）
// ---------------------------------------------------------------------------
// 只在含 #kgRoot 的页面挂载（docs/graph.md），其它页零开销。
// v2：力导向布局（斥力 + 连边弹簧 + 分类锚点）+ 滚轮缩放/空白拖拽平移/节点拖拽
//     + 悬浮信息卡 + 邻域高亮 + 搜索聚焦。边 = 站内真实互链；
//     孤立页（度为 0）单独列出 —— 本身就是一条维护建议。
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
  var CAT_NAMES_EN = {
    'new': 'New Students', 'live': 'Campus Life', 'study': 'Academics',
    'service': 'Services', 'college': 'Colleges', 'organization': 'Orgs',
    'share': 'Sharing', 'words': 'Messages', 'about': 'About',
    'friends': 'Links', '主页': 'Home'
  };

  function isEnPage() { return location.pathname.indexOf('/en/') !== -1; }
  function siteBase() {
    var root = location.pathname.replace(/\/(en\/)?graph\/?$/, '/');
    if (root.charAt(root.length - 1) !== '/') root += '/';
    return location.origin + root;
  }
  function pageUrl(id) {
    var pre = isEnPage() ? 'en/' : '';
    if (id === 'index') return siteBase() + pre;
    if (/\/index$/.test(id)) return siteBase() + pre + id.slice(0, -'/index'.length) + '/';
    return siteBase() + pre + id + '/';
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
  /* 节点显示名：优先用 build_graph.py 提取的页面 H1 中文标题（n.t），
     其次 mkdocs nav 段名，最后回退路径段；不再裸显英文路径 */
  var NAV_TITLES = {
    'new': '新生手册', 'live': '生活指南', 'study': '学习学业',
    'service': '校园服务', 'college': '学院详情', 'organization': '学生组织',
    'share': '文件共享', 'words': '有话送你', 'about': '关于Wiki',
    'friends': '友情链接', 'index': '主页'
  };
  function nodeName(n) {
    return n.t || NAV_TITLES[n.id] || shortName(n.id);
  }

  /* ---------- 力导向布局：斥力 O(n²) + 连边弹簧 + 分类锚点吸引 ---------- */
  function forceLayout(nodes, edges, W, H) {
    var pos = {}, vel = {};
    var cats = {};
    nodes.forEach(function (n) { (cats[n.cat] = cats[n.cat] || []).push(n.id); });
    var catIds = Object.keys(cats);
    // 每个分类一个锚点：同类聚簇但不死绑（锚力弱，让互链决定细节）
    var anchors = {};
    catIds.forEach(function (c, i) {
      var a = (i / catIds.length) * Math.PI * 2;
      var r = Math.min(W, H) * 0.3;
      anchors[c] = { x: W / 2 + r * Math.cos(a), y: H / 2 + r * Math.sin(a) };
    });
    nodes.forEach(function (n, i) {
      var a = (i / nodes.length) * Math.PI * 2;
      var an = anchors[n.cat] || { x: W / 2, y: H / 2 };
      pos[n.id] = { x: an.x + 26 * Math.cos(a + i), y: an.y + 26 * Math.sin(a + i) };
      vel[n.id] = { x: 0, y: 0 };
    });
    var ITER = 260, REP = 26000, SPRING = 0.012, LEN = 110, GRAV = 0.006, DAMP = 0.82;
    for (var it = 0; it < ITER; it++) {
      var cool = 1 - it / ITER; // 模拟退火：后期步长收敛防抖动
      for (var i = 0; i < nodes.length; i++) {
        var A = nodes[i].id;
        for (var j = i + 1; j < nodes.length; j++) {
          var B = nodes[j].id;
          var dx = pos[A].x - pos[B].x, dy = pos[A].y - pos[B].y;
          var d2 = Math.max(400, dx * dx + dy * dy);
          var f = (REP * cool) / d2;
          var fx = dx / Math.sqrt(d2) * f, fy = dy / Math.sqrt(d2) * f;
          vel[A].x += fx; vel[A].y += fy;
          vel[B].x -= fx; vel[B].y -= fy;
        }
      }
      edges.forEach(function (e) {
        var a = pos[e[0]], b = pos[e[1]];
        if (!a || !b) return;
        var dx = b.x - a.x, dy = b.y - a.y;
        var d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        var f = (d - LEN) * SPRING * cool;
        vel[e[0]].x += dx / d * f; vel[e[0]].y += dy / d * f;
        vel[e[1]].x -= dx / d * f; vel[e[1]].y -= dy / d * f;
      });
      nodes.forEach(function (n) {
        var an = anchors[n.cat] || { x: W / 2, y: H / 2 };
        vel[n.id].x += (an.x - pos[n.id].x) * GRAV * cool;
        vel[n.id].y += (an.y - pos[n.id].y) * GRAV * cool;
        vel[n.id].x += (W / 2 - pos[n.id].x) * GRAV * 0.4 * cool;
        vel[n.id].y += (H / 2 - pos[n.id].y) * GRAV * 0.4 * cool;
        pos[n.id].x += vel[n.id].x * DAMP;
        pos[n.id].y += vel[n.id].y * DAMP;
        vel[n.id].x *= DAMP; vel[n.id].y *= DAMP;
      });
    }
    // 归一化到画布内：等比缩放 + 居中，留边距防溢出
    var xs = [], ys = [];
    nodes.forEach(function (n) { xs.push(pos[n.id].x); ys.push(pos[n.id].y); });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var PAD = 60;
    var k = Math.min((W - PAD * 2) / Math.max(1, x1 - x0), (H - PAD * 2) / Math.max(1, y1 - y0), 1.6);
    var ox = (W - (x1 - x0) * k) / 2 - x0 * k;
    var oy = (H - (y1 - y0) * k) / 2 - y0 * k;
    nodes.forEach(function (n) {
      pos[n.id].x = pos[n.id].x * k + ox;
      pos[n.id].y = pos[n.id].y * k + oy;
    });
    return pos;
  }

  function render(root, data) {
    var en = isEnPage();
    var W = Math.min(1100, Math.max(560, root.clientWidth || 900));
    var H = 620;
    var NS = 'http://www.w3.org/2000/svg';
    var pos = forceLayout(data.nodes, data.edges, W, H);
    var deg = {}, neighbors = {};
    data.edges.forEach(function (e) {
      deg[e[0]] = (deg[e[0]] || 0) + 1;
      deg[e[1]] = (deg[e[1]] || 0) + 1;
      (neighbors[e[0]] = neighbors[e[0]] || []).push(e[1]);
      (neighbors[e[1]] = neighbors[e[1]] || []).push(e[0]);
    });
    var maxN = 1;
    data.nodes.forEach(function (n) { if (n.n > maxN) maxN = n.n; });
    function radius(n) { return 9 + 15 * Math.sqrt(n.n / maxN); }

    /* ---------- SVG 画布（外层 svg 负责视口，内层 g 负责 pan/zoom） ---------- */
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('class', 'kg-svg');
    var view = { x: 0, y: 0, k: 1 };
    var vp = document.createElementNS(NS, 'g');
    vp.setAttribute('class', 'kg-viewport');
    svg.appendChild(vp);
    function applyView() {
      vp.setAttribute('transform', 'translate(' + view.x + ',' + view.y + ') scale(' + view.k + ')');
    }
    applyView();
    function toWorld(px, py) {
      var r = svg.getBoundingClientRect();
      return { x: (px - r.left) * (W / r.width) / view.k - view.x / view.k,
               y: (py - r.top) * (W / r.width) / view.k - view.y / view.k };
    }
    // 转换写成 world = (screen-svgcoord)/k - offset：translate 先平移后缩放，
    // screen = (world + translate) * k → world = screen/k - translate

    /* ---------- 连边（贝塞尔弧线，比直线更耐看） ---------- */
    var edgeEls = [];
    data.edges.forEach(function (e) {
      var a = pos[e[0]], b = pos[e[1]];
      if (!a || !b) return;
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      var dx = b.x - a.x, dy = b.y - a.y;
      var bend = Math.min(24, Math.sqrt(dx * dx + dy * dy) * 0.12);
      var nx = mx - dy * 0.15, ny = my + dx * 0.15; // 轻微弯向法线方向
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', 'M' + a.x + ' ' + a.y + ' Q' + (mx + (nx - mx)) + ' ' + (my + (ny - my) - bend * 0.2) + ' ' + b.x + ' ' + b.y);
      path.setAttribute('class', 'kg-edge');
      path.dataset.a = e[0]; path.dataset.b = e[1];
      vp.appendChild(path);
      edgeEls.push(path);
    });

    /* ---------- 悬浮信息卡 ---------- */
    var tip = document.createElement('div');
    tip.className = 'kg-tip';
    tip.hidden = true;
    root.appendChild(tip);

    /* ---------- 节点 ---------- */
    var nodeEls = {};
    var drag = null; // {id, sx, sy, moved} | 'pan' state
    data.nodes.forEach(function (n) {
      var p = pos[n.id];
      if (!p) return;
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'kg-node' + ((deg[n.id] || 0) === 0 ? ' iso' : ''));
      g.dataset.id = n.id; g.dataset.cat = n.cat;
      g.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
      var r = radius(n);
      var halo = document.createElementNS(NS, 'circle');
      halo.setAttribute('r', r + 5); halo.setAttribute('class', 'kg-halo');
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', r);
      c.setAttribute('fill', CAT_COLORS[n.cat] || '#888');
      c.setAttribute('class', 'kg-dot');
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('y', r + 13);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'kg-label');
      t.textContent = nodeName(n);
      g.appendChild(halo); g.appendChild(c); g.appendChild(t);
      vp.appendChild(g);
      nodeEls[n.id] = g;

      g.addEventListener('mouseenter', function (e) {
        // 邻域高亮：相连节点与连边提亮，其余压暗
        var nb = neighbors[n.id] || [];
        var set = {}; set[n.id] = 1; nb.forEach(function (x) { set[x] = 1; });
        Object.keys(nodeEls).forEach(function (id) {
          nodeEls[id].classList.toggle('dim', !set[id]);
        });
        edgeEls.forEach(function (el) {
          el.classList.toggle('hot', el.dataset.a === n.id || el.dataset.b === n.id);
          el.classList.toggle('dim', !(el.dataset.a === n.id || el.dataset.b === n.id));
        });
        tip.hidden = false;
        tip.innerHTML = '<b>' + esc(nodeName(n)) + '</b>' +
          '<span class="kg-tip-meta">' + esc((en ? CAT_NAMES_EN[n.cat] : CAT_NAMES[n.cat]) || n.cat) +
          ' · ' + (n.n || 0) + (en ? ' chunks' : ' 知识块') + ' · ' + (deg[n.id] || 0) + (en ? ' links' : ' 互链') + '</span>' +
          '<span class="kg-tip-go">' + (en ? 'Click to open →' : '点击进入 →') + '</span>';
      });
      g.addEventListener('mousemove', function (e) {
        var rr = root.getBoundingClientRect();
        tip.style.left = Math.min(rr.width - 190, Math.max(6, e.clientX - rr.left + 14)) + 'px';
        tip.style.top = Math.max(6, e.clientY - rr.top - 10) + 'px';
      });
      g.addEventListener('mouseleave', function () {
        tip.hidden = true;
        Object.keys(nodeEls).forEach(function (id) { nodeEls[id].classList.remove('dim'); });
        edgeEls.forEach(function (el) { el.classList.remove('hot'); el.classList.remove('dim'); });
      });
      g.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        var w = toWorld(e.clientX, e.clientY);
        drag = { id: n.id, ox: pos[n.id].x - w.x, oy: pos[n.id].y - w.y, moved: 0 };
        g.setPointerCapture(e.pointerId);
      });
    });

    /* ---------- 平移 / 缩放 / 节点拖拽 ---------- */
    var pan = null;
    svg.addEventListener('pointerdown', function (e) {
      pan = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', function (e) {
      if (drag) {
        var w = toWorld(e.clientX, e.clientY);
        var p = pos[drag.id];
        p.x = w.x + drag.ox; p.y = w.y + drag.oy;
        drag.moved += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
        nodeEls[drag.id].setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
        // 拖拽时连边跟随重绘
        edgeEls.forEach(function (el) {
          if (el.dataset.a !== drag.id && el.dataset.b !== drag.id) return;
          var a = pos[el.dataset.a], b = pos[el.dataset.b];
          var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          var dx = b.x - a.x, dy = b.y - a.y;
          var bend = Math.min(24, Math.sqrt(dx * dx + dy * dy) * 0.12);
          el.setAttribute('d', 'M' + a.x + ' ' + a.y + ' Q' + mx + ' ' + (my - bend * 0.2) + ' ' + b.x + ' ' + b.y);
        });
      } else if (pan) {
        var r = svg.getBoundingClientRect();
        var sc = W / r.width;
        view.x = pan.ox + (e.clientX - pan.sx) * sc;
        view.y = pan.oy + (e.clientY - pan.sy) * sc;
        applyView();
      }
    });
    svg.addEventListener('pointerup', function (e) {
      if (drag && drag.moved < 6) {
        location.href = pageUrl(drag.id); // 视为点击（未拖动）
      }
      drag = null; pan = null;
    });
    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = svg.getBoundingClientRect();
      var sc = W / r.width;
      var px = (e.clientX - r.left) * sc, py = (e.clientY - r.top) * sc;
      var k2 = Math.min(4, Math.max(0.35, view.k * (e.deltaY < 0 ? 1.15 : 0.87)));
      // 以指针位置为中心缩放：保持 (px - x)/k 不变
      view.x = px - (px - view.x) * (k2 / view.k);
      view.y = py - (py - view.y) * (k2 / view.k);
      view.k = k2;
      applyView();
    }, { passive: false });

    /* ---------- 工具条：搜索 + 分类图例 + 复位 ---------- */
    var filterState = { cat: '', q: '' };
    function applyFilter() {
      Object.keys(nodeEls).forEach(function (id) {
        var g = nodeEls[id], n = data.nodes.find(function (x) { return x.id === id; });
        var okCat = !filterState.cat || g.dataset.cat === filterState.cat;
        var nm = nodeName(n).toLowerCase();
        var okQ = !filterState.q || nm.indexOf(filterState.q) >= 0 || id.toLowerCase().indexOf(filterState.q) >= 0;
        g.classList.toggle('dim', !(okCat && okQ));
      });
    }
    var groups = {};
    data.nodes.forEach(function (n) { (groups[n.cat] = groups[n.cat] || []).push(n); });
    var cats = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; });

    var bar = document.createElement('div');
    bar.className = 'kg-bar';
    var input = document.createElement('input');
    input.placeholder = en ? 'Search pages (e.g. cafeteria / transfer)…' : '搜索页面（如：食堂/转专业），回车直达…';
    input.addEventListener('input', function () {
      filterState.q = input.value.trim().toLowerCase();
      applyFilter();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var hit = data.nodes.find(function (n) {
        return nodeName(n).toLowerCase().indexOf(filterState.q) >= 0 || n.id.toLowerCase().indexOf(filterState.q) >= 0;
      });
      if (hit && filterState.q) location.href = pageUrl(hit.id);
    });
    bar.appendChild(input);
    var resetBtn = document.createElement('button');
    resetBtn.className = 'kg-reset';
    resetBtn.textContent = en ? 'Reset view' : '复位视图';
    resetBtn.addEventListener('click', function () { view = { x: 0, y: 0, k: 1 }; applyView(); });
    bar.appendChild(resetBtn);

    var legend = document.createElement('div');
    legend.className = 'kg-legend';
    cats.forEach(function (cat) {
      var s = document.createElement('span');
      s.className = 'kg-leg';
      s.innerHTML = '<i style="background:' + (CAT_COLORS[cat] || '#888') + '"></i>' +
        esc((en ? CAT_NAMES_EN[cat] : CAT_NAMES[cat]) || cat) + ' ' + groups[cat].length;
      s.addEventListener('click', function () {
        filterState.cat = (filterState.cat === cat) ? '' : cat;
        Array.prototype.forEach.call(legend.querySelectorAll('.kg-leg'), function (el, i) {
          el.classList.toggle('on', cats[i] === filterState.cat);
        });
        applyFilter();
      });
      legend.appendChild(s);
    });

    var stat = document.createElement('div');
    stat.className = 'kg-stat';
    var iso = data.nodes.filter(function (n) { return !(deg[n.id] || 0); });
    var isoBox = document.createElement('details');
    isoBox.className = 'kg-iso';
    var sum = document.createElement('summary');
    sum.textContent = en ? 'Orphan pages (add cross-links, click to open)' : '孤立页清单（建议补交叉引用，点击直达）';
    isoBox.appendChild(sum);
    iso.slice(0, 30).forEach(function (n) {
      var a = document.createElement('a');
      a.href = pageUrl(n.id);
      a.textContent = nodeName(n);
      a.title = n.id;
      isoBox.appendChild(a);
    });
    stat.innerHTML = en
      ? 'Nodes: <b>' + data.pages + '</b> · links: <b>' + data.links + '</b> · drag to rearrange, wheel to zoom, <span title="Pages with no inbound links">orphans <b>' + iso.length + '</b></span>'
      : '共 <b>' + data.pages + '</b> 页 · <b>' + data.links + '</b> 条互链 · 拖拽节点整理布局、滚轮缩放、空白处拖动平移 · <span title="无站内互链的页面，建议补交叉引用">孤立页 <b>' + iso.length + '</b></span>';

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
    var base = siteBase();
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
