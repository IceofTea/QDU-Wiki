// QDU-Wiki 社区评论（文章级评论 + 段落级批注 + 点赞 + AI 归纳 + 纠错反馈）
// ---------------------------------------------------------------------------
// 存储策略（方便部署，不依赖任何第三方账号）：
//   ① 服务器模式：若配置了评论网关（window.QDU_AGENT_API 或 <meta name="qdu-agent-api">），
//      走 /api/comments（QDU-Nav server/comments.mjs，跨用户共享、JSON 落盘）；
//   ② 本地模式：未配置时自动降级 localStorage，开箱即用（跨用户共享需配置①）。
// 本地开发（localhost）默认连 http://localhost:8787。
// 段落批注：鼠标划选正文任意文字即可锚定评论，批注段落自动高亮。
// AI 归纳：纯前端抽取式摘要（词频句子打分），零外部请求。
// 兼容 Material 整页导航与 instant 导航（挂 body + 防重复）。
(function () {
  'use strict';

  var LS_KEY = 'qdu_wiki_comments_v1';
  var LS_NAME_KEY = 'qdu_wiki_commenter';
  var LS_API_KEY = 'qdu_api_base'; // 与 Nav 站 wall/apiBase.js 同键：数据管家页设置的网关地址 Wiki 同步生效
  var CONFIG_API = ''; // 部署评论网关后填入其地址（如 https://your-gateway.onrender.com），留空 = 本地模式
  var PUBLIC_API_DEFAULT = ''; // 公网网关上线后填入缺省地址，手机/静态站直连线上版
  var mode = 'local'; // 'api' | 'local'
  var apiBase = '';
  var pollTimer = null;
  var lastTs = 0;
  var bannedCache = null;
  var replyTarget = null;   // 正在回复的评论 id（楼中楼）
  var sortMode = 'new';    // new | hot —— 评论排序
  var replyDraft = '';
  var QC_EMOJIS = ['👍', '😂', '🤔', '❤️', '🎉'];

  /** 敏感词预检（词库来自评论网关，缓存 10 分钟） */
  function loadWords() {
    if (bannedCache && Date.now() - bannedCache.t < 600000) return Promise.resolve(bannedCache.words);
    if (mode !== 'api') return Promise.resolve([]);
    return fetch(apiBase + '/api/moderation/words', { signal: timeout(5000) })
      .then(function (r) { return r.json() })
      .then(function (d) { bannedCache = { t: Date.now(), words: d.words || [] }; return bannedCache.words; })
      .catch(function () { return []; });
  }
  function precheck(text, words) {
    var t = String(text || '').toLowerCase();
    for (var i = 0; i < words.length; i++) {
      if (words[i] && t.indexOf(String(words[i]).toLowerCase()) >= 0) return words[i];
    }
    return null;
  }

  /** 举报（进管理台队列） */
  function reportComment(id) {
    var reason = prompt('举报原因（管理员将看到）：', '疑似违规/广告');
    if (reason === null) return;
    if (mode !== 'api') { alert('本地模式无法举报，请配置评论网关'); return; }
    fetch(apiBase + '/api/comments/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, reason: reason }),
      signal: timeout(6000)
    }).then(function (r) { return r.json(); }).then(function (d) {
      alert(d.ok ? '已收到举报，管理员将尽快处理 ✓' : (d.error || '举报失败'));
    }).catch(function () { alert('举报失败：评论网关未连接'); });
  }

  /** 准实时轮询（15s 拉取增量，新评论自动出现） */
  var sse = null
  var sseFails = 0
  var sseRetryTimer = null
  function startSse() {
    if (sse || mode !== 'api' || typeof EventSource === 'undefined') return
    // 指数退避重连：5s/15s/30s，连续 4 次失败停建（轮询兜底仍在，手机弱网不空转）
    function connect() {
      if (mode !== 'api' || typeof EventSource === 'undefined') return
      try { if (sse) sse.close() } catch (err) { /* noop */ }
      try {
        sse = new EventSource(apiBase + '/api/events')
        sse.onmessage = function (e) {
          sseFails = 0
          try {
            var d = JSON.parse(e.data)
            if (d.type === 'comment') refreshComments()
          } catch (err) { /* noop */ }
        }
        sse.onerror = function () {
          sseFails++
          try { if (sse) sse.close() } catch (err) { /* noop */ }
          sse = null
          if (sseFails >= 4) return // 停建，重度断线靠 15s 轮询
          var wait = Math.min(30000, 5000 * Math.pow(2, Math.min(2, sseFails - 1)))
          clearTimeout(sseRetryTimer)
          sseRetryTimer = setTimeout(connect, wait)
        }
      } catch (err) { sseFails++; /* noop */ }
    }
    connect()
  }
  function refreshComments() {
    fetchComments().then(function (list) {
      var newest = 0
      list.forEach(function (c) { if (c.ts > newest) newest = c.ts })
      if (newest > lastTs) {
        lastTs = newest
        comments = list
        renderList()
        markAnnotated(comments)
        var cnt = document.getElementById('qcCount')
        if (cnt) cnt.textContent = comments.length + ' 条'
        var badge = document.getElementById('qcBadge')
        if (badge) badge.textContent = '\uD83D\uDCAC ' + comments.length
      }
    }).catch(function () { /* noop */ })
  }
  function startPolling() {
    if (pollTimer || mode !== 'api') return;
    startSse()
    pollTimer = setInterval(function () {
      if (document.hidden) return;
      fetchComments().then(function (list) {
        var newest = 0;
        list.forEach(function (c) { if (c.ts > newest) newest = c.ts; });
        if (newest > lastTs) {
          lastTs = newest;
          comments = list;
          renderList();
          markAnnotated(comments);
          var cnt = document.getElementById('qcCount');
          if (cnt) cnt.textContent = comments.length + ' 条';
          var badge = document.getElementById('qcBadge');
          if (badge) badge.textContent = '💬 ' + comments.length;
        }
      }).catch(function () { /* noop */ });
    }, 15000);
    // 页面回到前台立即刷新
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && mode === 'api') {
        fetchComments().then(function (list) {
          comments = list;
          renderList();
          markAnnotated(comments);
        }).catch(function () {});
      }
    });
  }

  /* ---------- 配置与存储 ---------- */
  function detectApi() {
    if (CONFIG_API) return CONFIG_API.replace(/\/+$/, '');
    try {
      var q = new URLSearchParams(location.search).get('api');
      if (q) return q.replace(/\/+$/, '');
    } catch (e) { /* noop */ }
    try {
      var stored = localStorage.getItem(LS_API_KEY);
      if (stored) return stored.replace(/\/+$/, '');
    } catch (e) { /* noop */ }
    if (window.QDU_AGENT_API) return String(window.QDU_AGENT_API).replace(/\/+$/, '');
    var meta = document.querySelector('meta[name="qdu-agent-api"]');
    if (meta && meta.content) return meta.content.replace(/\/+$/, '');
    if (PUBLIC_API_DEFAULT) return PUBLIC_API_DEFAULT.replace(/\/+$/, '');
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return 'http://localhost:8787';
    return '';
  }

  function pagePath() {
    // 归一化为站点内相对路径（去掉 /QDU-Wiki 前缀与 index.html）
    var p = location.pathname.replace(/index\.html$/, '');
    var seg = p.split('/');
    if (seg[1] === 'QDU-Wiki') seg.splice(1, 1);
    p = seg.join('/');
    if (!p.endsWith('/')) p += '/';
    return p || '/';
  }

  function localRead() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch (e) { return {} }
  }
  function localWrite(db) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(db)) } catch (e) { /* noop */ }
  }

  /* ---------- 评论存取（API 优先，本地兜底） ---------- */
  function fetchComments() {
    var path = pagePath();
    if (mode === 'api') {
      return fetch(apiBase + '/api/comments?path=' + encodeURIComponent(path), { signal: timeout(6000) })
        .then(function (r) { return r.json() })
        .then(function (d) { return (d && d.comments) || [] })
        .catch(function () { mode = 'local'; return localRead()[path] || []; });
    }
    return Promise.resolve(localRead()[path] || []);
  }

  function postComment(c) {
    var path = pagePath();
    c.path = path;
    if (mode === 'api') {
      return fetch(apiBase + '/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
        signal: timeout(8000)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (d) {
        if (!d || !d.ok) throw new Error((d && d.error) || 'bad');
        // 同步一份到本地（离线也能看到自己发的）
        var db = localRead();
        db[path] = (db[path] || []).concat([d.comment]);
        localWrite(db);
        return d.comment;
      }).catch(function () {
        mode = 'local';
        return localPost(c);
      });
    }
    return Promise.resolve(localPost(c));
  }

  function localPost(c) {
    var db = localRead();
    var path = pagePath();
    c.id = 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    c.ts = Date.now();
    c.likes = 0;
    db[path] = (db[path] || []).concat([c]);
    localWrite(db);
    // 写后回读校验：浏览器拒绝存储时给明确提示，而不是“假装成功”
    var ok = false;
    try {
      var back = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      ok = (back[path] || []).some(function (x) { return x.id === c.id; });
    } catch (e) { ok = false; }
    c._volatile = !ok;
    return c;
  }

  function likeComment(id) {
    if (mode === 'api') {
      return fetch(apiBase + '/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id }),
        signal: timeout(6000)
      }).then(function (r) { return r.json() }).catch(function () { return null; });
    }
    var db = localRead();
    var path = pagePath();
    var list = db[path] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { list[i].likes = (list[i].likes || 0) + 1; break; }
    }
    db[path] = list;
    localWrite(db);
    return Promise.resolve({ ok: true });
  }

  function timeout(ms) {
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, ms);
    return c.signal;
  }

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function fmtTime(ts) {
    var d = new Date(ts);
    var now = new Date();
    var diff = (now - d) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function getName() {
    try { return localStorage.getItem(LS_NAME_KEY) || '' } catch (e) { return '' }
  }
  function setName(n) {
    try { localStorage.setItem(LS_NAME_KEY, n) } catch (e) { /* noop */ }
  }

  /* ---------- AI 归纳（抽取式摘要 · 纯前端） ---------- */
  function aiSummarize(list) {
    var texts = list.filter(function (c) { return c.type !== 'correction'; }).map(function (c) { return c.content; });
    if (!texts.length) return null;
    if (texts.length === 1) return '本页仅 1 条讨论：' + texts[0].slice(0, 50);
    // 分句 + 二元词频
    var freq = {};
    var sents = [];
    texts.forEach(function (t) {
      t.split(/[。！？!?\n]/).forEach(function (s) {
        s = s.trim();
        if (s.length < 4) return;
        sents.push(s);
        for (var i = 0; i < s.length - 1; i++) {
          var bg = s.substr(i, 2);
          if (/[\u4e00-\u9fa5]{2}/.test(bg)) freq[bg] = (freq[bg] || 0) + 1;
        }
      });
    });
    var scored = sents.map(function (s) {
      var sc = 0;
      for (var i = 0; i < s.length - 1; i++) sc += freq[s.substr(i, 2)] || 0;
      return { s: s, sc: sc / Math.max(1, s.length) };
    });
    scored.sort(function (a, b) { return b.sc - a.sc; });
    var top = scored.slice(0, 2).map(function (x) { return '“' + x.s.slice(0, 40) + '”'; });
    return '本地 AI 归纳：大家主要在讨论 ' + top.join('；') + '（共 ' + texts.length + ' 条发言，抽取式摘要）';
  }

  /* ---------- 段落批注 ---------- */
  function articleEl() {
    return document.querySelector('.md-content__inner .md-content__article') ||
           document.querySelector('.md-content__inner') ||
           document.querySelector('article');
  }
  function paragraphs() {
    var art = articleEl();
    if (!art) return [];
    return Array.prototype.slice.call(art.querySelectorAll('p'));
  }
  function markAnnotated(comments) {
    var paras = paragraphs();
    paras.forEach(function (p) { p.classList.remove('qdu-anno'); p.removeAttribute('data-anno-n'); });
    var counts = {};
    comments.forEach(function (c) {
      if (c.type === 'para' && typeof c.paraIndex === 'number' && paras[c.paraIndex]) {
        counts[c.paraIndex] = (counts[c.paraIndex] || 0) + 1;
      }
    });
    Object.keys(counts).forEach(function (i) {
      var p = paras[i];
      p.classList.add('qdu-anno');
      p.setAttribute('data-anno-n', counts[i]);
    });
  }

  /* ---------- UI ---------- */
  var rootEl = null;
  var comments = [];
  var busy = false;

  function mount() {
    if (document.querySelector('.qdu-comments')) return;
    var host = document.querySelector('.md-content__inner');
    var art = articleEl();
    if (!host || !art) return;
    // 正文页优先挂载；无 h1 的页面（如索引/404 壳）也挂载，标题取 document.title 兜底，
    // 避免“评论框压根不出现 → 以为发不了评论”。

    rootEl = document.createElement('section');
    rootEl.className = 'qdu-comments';
    rootEl.innerHTML = renderShell();
    host.appendChild(rootEl);

    bindEvents();
    loadAndRender();
    observeSelection();
    addTitleBadge();
  }

  function renderShell() {
    return '' +
      '<style>' + STYLES + '</style>' +
      '<div class="qc-head">' +
      '  <div class="qc-title">💬 社区评论 <span class="qc-count" id="qcCount">…</span></div>' +
      '  <div class="qc-tools">' +
      '    <button type="button" class="qc-tool" id="qcAi">🤖 AI 归纳</button>' +
      '    <button type="button" class="qc-tool qc-tool-warn" id="qcFix">🚩 信息有误？纠错</button>' +
      '  </div>' +
      '</div>' +
      '<div class="qc-mode" id="qcMode"></div>' +
      '<div class="qc-ai" id="qcAiBox" hidden></div>' +
      '<div class="qc-sortbar" id="qcSortBar">' +
      '  <button type="button" class="qc-sortbtn on" data-sort="new">⏱ 最新</button>' +
      '  <button type="button" class="qc-sortbtn" data-sort="hot">🔥 最热</button>' +
      '  <span class="qc-annotip" id="qcAnnoTip" title="划选正文可添加段落批注">📌 段落批注导航</span>' +
      '</div>' +
      '<div class="qc-list" id="qcList"><div class="qc-empty">加载中…</div></div>' +
      '<div class="qc-form">' +
      '  <input class="qc-name" id="qcName" maxlength="24" placeholder="昵称（可匿名）" />' +
      '  <textarea class="qc-text" id="qcText" maxlength="1000" rows="3" placeholder="说点什么吧…支持划选正文添加段落批注 ✍️"></textarea>' +
      '  <div class="qc-form-foot">' +
      '    <span class="qc-tip" id="qcTip">发言前请遵守社区规范，内容保存于本站评论服务</span>' +
      '    <button type="button" class="qc-submit" id="qcSubmit">发表评论</button>' +
      '  </div>' +
      '</div>' +
      // 段落批注浮动按钮
      '<div class="qc-sel-btn" id="qcSelBtn" hidden>✏️ 批注所选</div>' +
      // 批注弹窗
      '<div class="qc-modal" id="qcModal" hidden>' +
      '  <div class="qc-modal-card">' +
      '    <div class="qc-modal-title">✏️ 段落批注</div>' +
      '    <blockquote class="qc-quote" id="qcQuote"></blockquote>' +
      '    <textarea class="qc-text" id="qcAnnoText" rows="3" maxlength="500" placeholder="针对这段话写下你的看法、补充或纠错…"></textarea>' +
      '    <div class="qc-form-foot">' +
      '      <button type="button" class="qc-submit qc-submit-ghost" id="qcAnnoCancel">取消</button>' +
      '      <button type="button" class="qc-submit" id="qcAnnoOk">提交批注</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  function addTitleBadge() {
    var h1 = document.querySelector('.md-content h1') || document.querySelector('h1');
    if (!h1 || document.querySelector('.qc-badge')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'qc-badge';
    b.id = 'qcBadge';
    b.textContent = '💬 …';
    b.addEventListener('click', function () {
      if (rootEl) rootEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    h1.appendChild(b);

    /* 隐秘暗门：连点评论徽章 5 次 → 输入口令 → 打开社区控制台（管理员专属，外人无感知） */
    var taps = 0;
    var timer = null;
    b.addEventListener('click', function () {
      taps++;
      clearTimeout(timer);
      timer = setTimeout(function () { taps = 0; }, 1400);
      if (taps >= 5) {
        taps = 0;
        var t = prompt('🛰️ 社区控制台\n请输入管理口令：');
        if (!t) return;
        // 先验后开：口令错/无网关一律静默，不向普通用户证实入口存在
        var base = detectApi();
        if (!base) return;
        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, 6000);
        fetch(base + '/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: t }),
          signal: ctrl.signal
        }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); }).then(function (ret) {
          clearTimeout(timer);
          if (!ret.ok || (!ret.d.token && !ret.d.ok)) return;
          try { localStorage.setItem('pending_admin_token', t); } catch (e) { /* noop */ }
          window.open(base.replace(/\/+$/, '') + '/admin', '_blank', 'noopener');
        }).catch(function () { clearTimeout(timer); /* 静默 */ });
      }
    });
  }

  function loadAndRender() {
    return fetchComments().then(function (list) {
      comments = list || [];
      lastTs = 0;
      comments.forEach(function (c) { if (c.ts > lastTs) lastTs = c.ts; });
      renderList();
      markAnnotated(comments);
      startPolling();
      var cnt = document.getElementById('qcCount');
      if (cnt) cnt.textContent = comments.length + ' 条';
      var badge = document.getElementById('qcBadge');
      if (badge) badge.textContent = '💬 ' + comments.length;
      var modeEl = document.getElementById('qcMode');
      if (modeEl) {
        modeEl.textContent = mode === 'api'
          ? '🟢 服务器模式：跨用户共享评论（评论网关已连接）'
          : '🟡 本地模式：评论仅保存在本机浏览器；部署评论网关并配置 qdu-agent-api 后自动切换为跨用户共享';
        modeEl.className = 'qc-mode ' + (mode === 'api' ? 'ok' : 'local');
      }
    });
  }

  /* ── 评论列表：楼中楼嵌套渲染 + 表情表态 + 行内回复 ── */
  function commentRow(c, depth) {
    var isAnno = c.type === 'para';
    var isFix = c.type === 'correction';
    var initial = esc((c.author || '匿')[0]);
    var kids = comments.filter(function (x) { return x.parent === c.id; });
    var reactions = c.reactions || {};
    var reactChips = QC_EMOJIS.map(function (e) {
      var n = reactions[e] || 0;
      return '<button type="button" class="qc-react' + (n ? ' on' : '') + '" data-id="' + esc(c.id) + '" data-e="' + e + '">' +
        e + (n ? ' ' + n : '＋') + '</button>';
    }).join('');
    var replyForm = '';
    if (replyTarget === c.id) {
      replyForm = '<div class="qc-replyform">' +
        '<input class="qc-name" id="qcReplyName" maxlength="24" placeholder="昵称（可匿名）" value="' + esc(getName()) + '">' +
        '<textarea class="qc-text" id="qcReplyText" rows="2" maxlength="500" placeholder="回复 ' + esc(c.author) + '…"></textarea>' +
        '<div class="qc-form-foot">' +
        '  <button type="button" class="qc-submit qc-submit-ghost" id="qcReplyCancel">取消</button>' +
        '  <button type="button" class="qc-submit" id="qcReplyOk">回复</button>' +
        '</div></div>';
    }
    var html = '<div class="qc-item' + (isFix ? ' fix' : '') + (isAnno ? ' anno' : '') + (depth ? ' child' : '') + '">' +
      '<div class="qc-avatar">' + initial + '</div>' +
      '<div class="qc-main">' +
      '  <div class="qc-meta"><b>' + esc(c.author) + '</b>' +
      (isFix ? '<span class="qc-tag fix">🚩 纠错</span>' : '') +
      (isAnno ? '<span class="qc-tag anno">📌 段落批注</span>' : '') +
      (c.parent ? '<span class="qc-tag reply">↩ 回复' + esc(c.replyTo || '') + '</span>' : '') +
      '  <span class="qc-time">' + fmtTime(c.ts) + '</span></div>' +
      (isAnno ? '<div class="qc-quote">「' + esc((c.quote || '').slice(0, 80)) + '」</div>' : '') +
      '  <div class="qc-content">' + esc(c.content) + '</div>' +
      '  <div class="qc-foot">' +
      '    <button type="button" class="qc-like" data-id="' + esc(c.id) + '">👍 <span>' + (c.likes || 0) + '</span></button>' +
      '    <button type="button" class="qc-replybtn" data-id="' + esc(c.id) + '" data-author="' + esc(c.author) + '">↩ 回复' + (kids.length ? ' (' + kids.length + ')' : '') + '</button>' +
      '    <button type="button" class="qc-report" data-id="' + esc(c.id) + '" title="举报这条内容">🚩 举报</button>' +
      '    <span class="qc-reacts">' + reactChips + '</span>' +
      '  </div>' + replyForm +
      '</div></div>';
    html += kids.map(function (k) { return commentRow(k, depth + 1); }).join('');
    return html;
  }

  function renderList() {
    var box = document.getElementById('qcList');
    if (!box) return;
    if (!comments.length) {
      box.innerHTML = '<div class="qc-empty">还没有评论，来抢沙发 🛋️（划选正文可添加批注）</div>';
      return;
    }
    var roots = comments.filter(function (c) { return !c.parent; });
    if (sortMode === 'hot') {
      roots = roots.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0) || b.ts - a.ts; });
    } else {
      roots = roots.slice().sort(function (a, b) { return b.ts - a.ts; });
    }
    box.innerHTML = roots.map(function (c) { return commentRow(c, 0); }).join('');

    Array.prototype.forEach.call(box.querySelectorAll('.qc-like'), function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        likeComment(id).then(function () {
          var c = comments.find(function (x) { return x.id === id; });
          if (c) c.likes = (c.likes || 0) + 1;
          renderList();
          syncBadges();
        });
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll('.qc-report'), function (btn) {
      btn.addEventListener('click', function () { reportComment(btn.getAttribute('data-id')); });
    });
    Array.prototype.forEach.call(box.querySelectorAll('.qc-react'), function (btn) {
      btn.addEventListener('click', function () {
        reactComment(btn.getAttribute('data-id'), btn.getAttribute('data-e'));
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll('.qc-replybtn'), function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        replyTarget = replyTarget === id ? null : id;
        renderList();
        var ta = document.getElementById('qcReplyText');
        if (ta) ta.focus();
      });
    });
    var cancel = document.getElementById('qcReplyCancel');
    if (cancel) cancel.addEventListener('click', function () { replyTarget = null; replyDraft = ''; renderList(); });
    var ok = document.getElementById('qcReplyOk');
    if (ok) ok.addEventListener('click', sendReply);
  }

  function syncBadges() {
    var cnt = document.getElementById('qcCount');
    if (cnt) cnt.textContent = comments.length + ' 条';
    var badge = document.getElementById('qcBadge');
    if (badge) badge.textContent = '💬 ' + comments.length;
  }

  /* ── 发送楼中楼回复（走评论接口，parent 指向被回复评论） ── */
  function sendReply() {
    if (busy) return;
    var ta = document.getElementById('qcReplyText');
    var nameEl = document.getElementById('qcReplyName');
    var text = ta ? ta.value.trim() : '';
    if (text.length < 2) { alert('回复内容太短'); return; }
    var target = comments.find(function (c) { return c.id === replyTarget; });
    if (!target) return;
    busy = true;
    loadWords().then(function (words) {
      var hit = precheck(text, words);
      if (hit) { alert('内容包含违规词「' + hit + '」，已被拦截'); busy = false; return null; }
      return postComment({
        author: (nameEl && nameEl.value.trim()) || '匿名同学',
        content: text,
        type: 'reply',
        parent: target.id,
        replyTo: target.author
      });
    }).then(function (res) {
      busy = false;
      if (!res) return;
      replyTarget = null;
      replyDraft = '';
      return loadAndRender();
    }).catch(function (e) {
      alert((e && e.message) || '回复失败');
      busy = false;
    });
  }

  /* ── 表情表态（服务端 /api/react，本地模式合并到本机） ── */
  function reactComment(id, emoji) {
    var c = comments.find(function (x) { return x.id === id; });
    if (!c) return;
    if (mode === 'api') {
      fetch(apiBase + '/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'comments', id: id, emoji: emoji }),
        signal: timeout(6000)
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.ok) { c.reactions = d.reactions; renderList(); }
      }).catch(function () { /* 网关未连则本地兜底 */ localReact(c, emoji); });
    } else {
      localReact(c, emoji);
    }
  }
  function localReact(c, emoji) {
    if (!c.reactions) c.reactions = {};
    c.reactions[emoji] = (c.reactions[emoji] || 0) + 1;
    var db = localRead();
    var path = pagePath();
    var arr = db[path] || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === c.id) arr[i].reactions = c.reactions;
    db[path] = arr;
    localWrite(db);
    renderList();
  }

  function bindEvents() {
    var sortBar = document.getElementById('qcSortBar');
    if (sortBar) {
      Array.prototype.forEach.call(sortBar.querySelectorAll('.qc-sortbtn'), function (b) {
        b.addEventListener('click', function () {
          sortMode = b.getAttribute('data-sort');
          Array.prototype.forEach.call(sortBar.querySelectorAll('.qc-sortbtn'), function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          renderList();
        });
      });
      var tip = document.getElementById('qcAnnoTip');
      if (tip) tip.addEventListener('click', function () {
        var first = document.querySelector('p.qdu-anno');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else alert('本页暂无段落批注——划选正文任意句子即可添加');
      });
    }

    var nameInput = document.getElementById('qcName');
    nameInput.value = getName();

    document.getElementById('qcSubmit').addEventListener('click', submit);
    document.getElementById('qcText').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
    });

    document.getElementById('qcAi').addEventListener('click', function () {
      var box = document.getElementById('qcAiBox');
      if (box.hidden) {
        var s = aiSummarize(comments);
        box.textContent = s || '暂无可归纳的评论——先来发表第一条吧。';
        box.hidden = false;
      } else box.hidden = true;
    });

    document.getElementById('qcFix').addEventListener('click', function () {
      var t = document.getElementById('qcText');
      t.value = '[纠错] ';
      t.focus();
      t.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    function submit() {
      if (busy) return;
      var text = document.getElementById('qcText').value.trim();
      var name = document.getElementById('qcName').value.trim();
      if (text.length < 2) { tip('内容太短，说多一点吧', true); return; }
      busy = true;
      tip('敏感词校验中…');
      // 发送前本地预检（服务端仍会二次校验）
      loadWords().then(function (words) {
        var hit = precheck(text, words);
        if (hit) {
          tip('内容包含违规词「' + hit + '」，已被拦截', true);
          busy = false;
          return null;
        }
        tip('发表中…');
        var isFix = text.indexOf('[纠错]') === 0;
        return postComment({
          author: name || '匿名同学',
          content: isFix ? text.replace('[纠错]', '').trim() : text,
          type: isFix ? 'correction' : 'page',
          title: (document.querySelector('.md-content h1') || document.querySelector('h1') || {}).textContent || ''
        });
      }).then(function (res) {
        if (!res) return;
        setName(name);
        document.getElementById('qcText').value = '';
        // 按模式诚实提示：本机模式不承诺“全站可见”
        tip(res._volatile
          ? '⚠️ 浏览器拒绝了本地存储，评论仅本次可见（换无痕/隐私模式或清存储限制后重试）'
          : (mode === 'api' ? '已发表 ✅ 全站实时可见（维护 Agent 24h 内核验纠错）' : '已发表 ✅ 仅保存在本机浏览器（配网关后全员可见）'));
        busy = false;
        return loadAndRender();
      }).catch(function (e) {
        tip((e && e.message) || '发表失败，请稍后重试', true);
        busy = false;
      });
    }
  }

  function tip(msg, warn) {
    var el = document.getElementById('qcTip');
    if (!el) return;
    el.textContent = msg;
    el.className = 'qc-tip' + (warn ? ' warn' : '');
    setTimeout(function () {
      el.textContent = '发言前请遵守社区规范，内容保存于本站评论服务';
      el.className = 'qc-tip';
    }, 4000);
  }

  /* ---------- 划选批注 ---------- */
  var pendingSel = null;
  function observeSelection() {
    var btn = document.getElementById('qcSelBtn');
    var art = articleEl();
    if (!btn || !art) return;

    document.addEventListener('mouseup', function (e) {
      if (btn.contains(e.target)) return;
      setTimeout(function () {
        var sel = window.getSelection();
        if (!sel || sel.isCollapsed) { btn.hidden = true; pendingSel = null; return; }
        var text = sel.toString().trim();
        if (text.length < 2 || text.length > 300) { btn.hidden = true; pendingSel = null; return; }
        if (!art.contains(sel.anchorNode) || !art.contains(sel.focusNode)) { btn.hidden = true; pendingSel = null; return; }
        // 定位段落 index
        var node = sel.anchorNode;
        while (node && node.nodeName !== 'P' && node !== art) node = node.parentNode;
        var paras = paragraphs();
        var idx = paras.indexOf(node);
        if (idx < 0) { btn.hidden = true; return; }
        pendingSel = { paraIndex: idx, quote: text };
        var rect = sel.getRangeAt(0).getBoundingClientRect();
        btn.style.top = (rect.top + window.scrollY - 40) + 'px';
        btn.style.left = (rect.left + window.scrollX) + 'px';
        btn.hidden = false;
      }, 10);
    });

    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });

    btn.addEventListener('click', function () {
      if (!pendingSel) return;
      btn.hidden = true;
      var modal = document.getElementById('qcModal');
      document.getElementById('qcQuote').textContent = pendingSel.quote;
      document.getElementById('qcAnnoText').value = '';
      modal.hidden = false;
      setTimeout(function () { document.getElementById('qcAnnoText').focus(); }, 50);
    });

    document.getElementById('qcAnnoCancel').addEventListener('click', function () {
      document.getElementById('qcModal').hidden = true;
      pendingSel = null;
    });

    document.getElementById('qcAnnoOk').addEventListener('click', function () {
      if (!pendingSel) return;
      var text = document.getElementById('qcAnnoText').value.trim();
      if (text.length < 2) return;
      var name = (document.getElementById('qcName') || {}).value || '';
      postComment({
        author: (name || '').trim() || '匿名同学',
        content: text,
        type: 'para',
        paraIndex: pendingSel.paraIndex,
        quote: pendingSel.quote,
        title: (document.querySelector('.md-content h1') || {}).textContent || ''
      }).then(function () {
        setName((name || '').trim());
        document.getElementById('qcModal').hidden = true;
        pendingSel = null;
        window.getSelection().removeAllRanges();
        return loadAndRender();
      });
    });
  }

  /* ---------- 样式 ---------- */
  var STYLES = '' +
    '.qdu-comments{margin-top:32px;border-top:2px solid var(--md-primary-fg-color,#1b66c9);padding-top:16px;font-size:14px}' +
    '.qc-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:4px}' +
    '.qc-title{font-size:17px;font-weight:800;color:var(--md-default-fg-color,#111)}' +
    '.qc-count{font-size:12px;font-weight:600;background:var(--md-primary-fg-color,#1b66c9);color:#fff;border-radius:999px;padding:1px 9px;vertical-align:middle;margin-left:6px}' +
    '.qc-tools{display:flex;gap:7px;flex-wrap:wrap}' +
    '.qc-tool{font-size:12.5px;padding:5px 12px;border-radius:999px;border:1px solid var(--md-default-fg-color--lightest,#ddd);background:transparent;color:var(--md-default-fg-color,#333);cursor:pointer;font-family:inherit}' +
    '.qc-tool:hover{border-color:var(--md-primary-fg-color,#1b66c9);color:var(--md-primary-fg-color,#1b66c9)}' +
    '.qc-tool-warn{border-color:rgba(225,29,72,.4);color:#e11d48}' +
    '.qc-mode{font-size:11.5px;padding:5px 10px;border-radius:8px;margin:8px 0;background:rgba(245,158,11,.1);color:#b45309}' +
    '.qc-mode.ok{background:rgba(46,125,50,.1);color:#2e7d32}' +
    '.qc-ai{font-size:13px;padding:10px 12px;border-radius:10px;background:linear-gradient(135deg,rgba(27,102,201,.08),rgba(27,102,201,.02));border:1px dashed var(--md-primary-fg-color,#1b66c9);color:var(--md-default-fg-color,#333);margin:8px 0;line-height:1.7}' +
    '.qc-list{display:flex;flex-direction:column;gap:10px;margin:12px 0}' +
    '.qc-empty{padding:22px;text-align:center;color:var(--md-default-fg-color--light,#999);background:var(--md-default-bg-color,#fafafa);border-radius:10px;font-size:13px}' +
    '.qc-item{display:flex;gap:10px;padding:11px 13px;border:1px solid var(--md-default-fg-color--lightest,#eee);border-radius:11px;background:var(--md-default-bg-color,#fff)}' +
    '.qc-item.fix{border-left:3px solid #e11d48;background:rgba(225,29,72,.03)}' +
    '.qc-item.anno{border-left:3px solid var(--md-primary-fg-color,#1b66c9)}' +
    '.qc-avatar{width:32px;height:32px;border-radius:50%;background:var(--md-primary-fg-color,#1b66c9);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}' +
    '.qc-main{flex:1;min-width:0}' +
    '.qc-meta{font-size:12px;color:var(--md-default-fg-color--light,#999);display:flex;align-items:center;gap:7px;flex-wrap:wrap}' +
    '.qc-meta b{color:var(--md-default-fg-color,#111);font-size:13px}' +
    '.qc-tag{font-size:10.5px;padding:1px 7px;border-radius:999px;font-weight:700}' +
    '.qc-tag.fix{background:#e11d4818;color:#e11d48}' +
    '.qc-tag.anno{background:var(--md-primary-fg-color--lightest,rgba(27,102,201,.1));color:var(--md-primary-fg-color,#1b66c9)}' +
    '.qc-time{margin-left:auto}' +
    '.qc-quote{margin:6px 0 2px;padding:5px 9px;font-size:12px;color:var(--md-default-fg-color--light,#888);background:var(--md-default-bg-color,#f6f6f6);border-left:2px solid var(--md-primary-fg-color,#1b66c9);border-radius:0 6px 6px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.qc-content{margin-top:5px;line-height:1.75;color:var(--md-default-fg-color,#222);word-break:break-word;white-space:pre-wrap}' +
    '.qc-foot{margin-top:7px;display:flex;gap:8px}' +
    '.qc-like{font-size:12px;border:1px solid var(--md-default-fg-color--lightest,#e5e5e5);background:transparent;border-radius:999px;padding:3px 10px;cursor:pointer;color:var(--md-default-fg-color--light,#888);font-family:inherit}' +
    '.qc-like:hover,.qc-like.on{border-color:#e11d48;color:#e11d48}' +
    '.qc-sortbar{display:flex;gap:7px;align-items:center;margin-top:10px}' +
    '.qc-sortbtn{font-size:12px;border:1px solid var(--md-default-fg-color--lightest,#e5e5e5);background:transparent;border-radius:999px;padding:4px 13px;cursor:pointer;font-family:inherit;color:var(--md-default-fg-color--light,#999)}' +
    '.qc-sortbtn.on{border-color:var(--md-primary-fg-color,#1b66c9);color:var(--md-primary-fg-color,#1b66c9);font-weight:700}' +
    '.qc-annotip{margin-left:auto;font-size:11.5px;color:var(--md-primary-fg-color,#1b66c9);cursor:pointer;opacity:.85}' +
    '.qc-annotip:hover{opacity:1;text-decoration:underline}' +
    '.qc-item.child{margin-left:34px;border-left:2px solid rgba(27,102,201,.35);background:rgba(27,102,201,.03)}' +
    '.qc-tag.reply{background:rgba(163,113,247,.15);color:#a371f7}' +
    '.qc-replybtn{font-size:12px;border:1px solid var(--md-default-fg-color--lightest,#e5e5e5);background:transparent;border-radius:999px;padding:3px 10px;cursor:pointer;color:var(--md-default-fg-color--light,#888);font-family:inherit}' +
    '.qc-replybtn:hover{border-color:#a371f7;color:#a371f7}' +
    '.qc-reacts{display:inline-flex;gap:5px;margin-left:auto;flex-wrap:wrap}' +
    '.qc-react{font-size:11.5px;border:1px solid var(--md-default-fg-color--lightest,#e5e5e5);background:transparent;border-radius:999px;padding:2px 8px;cursor:pointer;font-family:inherit;color:var(--md-default-fg-color--light,#999)}' +
    '.qc-react:hover,.qc-react.on{border-color:var(--md-primary-fg-color,#1b66c9);color:var(--md-primary-fg-color,#1b66c9)}' +
    '.qc-replyform{margin-top:8px;padding:9px 11px;background:rgba(27,102,201,.04);border-radius:10px;display:flex;flex-direction:column;gap:7px}' +
    '.qc-replyform .qc-name{width:180px}' +
    '.qc-report{font-size:12px;border:1px solid var(--md-default-fg-color--lightest,#e5e5e5);background:transparent;border-radius:999px;padding:3px 10px;cursor:pointer;color:var(--md-default-fg-color--light,#999);font-family:inherit}' +
    '.qc-report:hover{border-color:#d29922;color:#d29922}' +
    '.qc-form{border:1px solid var(--md-default-fg-color--lightest,#e5e5e5);border-radius:12px;padding:12px;background:var(--md-default-bg-color,#fafafa);display:flex;flex-direction:column;gap:8px}' +
    '.qc-name{border:1px solid var(--md-default-fg-color--lightest,#e0e0e0);border-radius:8px;padding:7px 11px;font-size:13px;font-family:inherit;background:var(--md-default-bg-color,#fff);color:var(--md-default-fg-color,#222);width:180px}' +
    '.qc-text{border:1px solid var(--md-default-fg-color--lightest,#e0e0e0);border-radius:8px;padding:9px 11px;font-size:13.5px;font-family:inherit;resize:vertical;background:var(--md-default-bg-color,#fff);color:var(--md-default-fg-color,#222);line-height:1.6}' +
    '.qc-text:focus,.qc-name:focus{outline:none;border-color:var(--md-primary-fg-color,#1b66c9)}' +
    '.qc-form-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}' +
    '.qc-tip{font-size:11.5px;color:var(--md-default-fg-color--light,#999)}' +
    '.qc-tip.warn{color:#e11d48}' +
    '.qc-submit{border:none;background:var(--md-primary-fg-color,#1b66c9);color:#fff;font-size:13.5px;font-weight:600;padding:8px 20px;border-radius:999px;cursor:pointer;font-family:inherit}' +
    '.qc-submit:hover{filter:brightness(1.1)}' +
    '.qc-submit-ghost{background:transparent;color:var(--md-default-fg-color--light,#999);border:1px solid var(--md-default-fg-color--lightest,#ddd)}' +
    '.qc-badge{margin-left:12px;font-size:12px;font-weight:600;border:none;background:rgba(27,102,201,.1);color:var(--md-primary-fg-color,#1b66c9);border-radius:999px;padding:3px 11px;cursor:pointer;font-family:inherit;vertical-align:middle}' +
    '.qc-badge:hover{background:var(--md-primary-fg-color,#1b66c9);color:#fff}' +
    '.qc-sel-btn{position:absolute;z-index:90;font-size:12.5px;padding:5px 12px;border-radius:999px;background:var(--md-primary-fg-color,#1b66c9);color:#fff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);font-family:inherit}' +
    '.qc-modal{position:fixed;inset:0;z-index:99;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:20px}' +
    '.qc-modal[hidden]{display:none}' +
    '.qc-sel-btn[hidden]{display:none}' +
    '.qc-ai[hidden]{display:none}' +
    '.qc-modal-card{background:var(--md-default-bg-color,#fff);border-radius:14px;padding:18px;width:min(520px,100%);box-shadow:0 20px 60px rgba(0,0,0,.3);display:flex;flex-direction:column;gap:10px}' +
    '.qc-modal-title{font-size:15px;font-weight:800;color:var(--md-default-fg-color,#111)}' +
    '.qc-modal .qc-quote{white-space:normal;font-size:12.5px;max-height:80px;overflow:auto}' +
    'p.qdu-anno{background:rgba(27,102,201,.06);border-left:3px solid var(--md-primary-fg-color,#1b66c9);padding-left:10px;border-radius:0 6px 6px 0;position:relative}' +
    'p.qdu-anno::after{content:"📌 " attr(data-anno-n);position:absolute;right:-4px;top:-9px;font-size:10px;background:var(--md-primary-fg-color,#1b66c9);color:#fff;border-radius:999px;padding:1px 7px}' +
    '[data-md-color-scheme="slate"] .qc-item{background:#161b22;border-color:#30363d}' +
    '[data-md-color-scheme="slate"] .qc-form{background:#0d1117;border-color:#30363d}' +
    '[data-md-color-scheme="slate"] .qc-name,[data-md-color-scheme="slate"] .qc-text,[data-md-color-scheme="slate"] .qc-modal-card{background:#161b22;color:#e6edf3;border-color:#30363d}';

  /* ---------- 阅读增强：顶部进度条 + 键盘快捷键（j/k/s//） ---------- */
  function mountReadingEnhance() {
    if (document.getElementById('qdu-progress')) return;
    var bar = document.createElement('div');
    bar.id = 'qdu-progress';
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,#1b66c9,#4f8df0);z-index:9999;transition:width .1s;pointer-events:none';
    document.body.appendChild(bar);
    var css = document.createElement('style');
    css.textContent = '#qdu-kbd{position:fixed;right:14px;bottom:96px;z-index:995;background:#161b22;color:#e6edf3;font-size:11px;border-radius:10px;padding:9px 13px;opacity:0;transition:opacity .3s;pointer-events:none;line-height:1.9;box-shadow:0 8px 26px #0005}#qdu-kbd.show{opacity:1}';
    document.head.appendChild(css);
    var kbd = document.createElement('div');
    kbd.id = 'qdu-kbd';
    kbd.innerHTML = '⌨ 快捷键<br>j / k 上下滚动<br>s 顶部 · / 搜索<br>c 评论区 · t 顶部';
    document.body.appendChild(kbd);
    var hideT = null;
    function showKbd() {
      kbd.classList.add('show');
      clearTimeout(hideT);
      hideT = setTimeout(function () { kbd.classList.remove('show'); }, 2600);
    }
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    document.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA)$/.test((e.target.tagName || ''))) return;
      var k = e.key;
      if (k === 'j') window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' });
      else if (k === 'k') window.scrollBy({ top: -window.innerHeight * 0.85, behavior: 'smooth' });
      else if (k === 't') window.scrollTo({ top: 0, behavior: 'smooth' });
      else if (k === 's') { var se = document.querySelector('.md-search input'); if (se) { e.preventDefault(); se.focus(); } }
      else if (k === 'c') { var c = document.querySelector('.qdu-comments'); if (c) c.scrollIntoView({ behavior: 'smooth' }); showKbd(); }
      else if (k === '/') { var se2 = document.querySelector('.md-search input'); if (se2) { e.preventDefault(); se2.focus(); } }
      else if (k === '?') showKbd();
    });
  }

  /* ---------- 启动（兼容 instant 导航） ---------- */
  function init() {
    if (detectApi()) { mode = 'api'; apiBase = detectApi(); }
    mount();
    mountReadingEnhance();
  }

  function boot() {
    if (document.querySelector('.qdu-comments')) return;
    init();
    // instant 导航后重新挂载
    if (window.MutationObserver) {
      var fired = false;
      var mo = new MutationObserver(function () {
        if (fired) return;
        fired = true;
        setTimeout(function () { fired = false; mount(); }, 350);
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
