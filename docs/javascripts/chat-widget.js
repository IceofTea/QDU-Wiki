// 青大智答：全站右下角悬浮智能问答（新生客服）
// 原理：构建时由 scripts/build_kb.py 生成 BM25 倒排索引（docs/assets/kb.json），
// 本脚本在浏览器内完成「分词 → BM25 打分 → 展示相关 wiki 片段 + 原文链接」，
// 全程本地计算、零外部请求、零密钥。
// 兼容 Material instant 导航：组件挂在 body 下，导航切换不销毁。
(function () {
  'use strict';

  var CHIPS = [
    '宿舍晚上几点熄灯',
    '宿舍有空调吗',
    '怎么转专业',
    '食堂几点营业',
    '医保在哪报销',
    '校园网怎么办理',
    '军训要注意什么',
    '报到要带什么'
  ];

  var kb = null;
  var kbPromise = null;
  var bodyEl = null;
  var panelEl = null;
  var msgListEl = null;
  var inputEl = null;
  var launcherEl = null;

  /* ---------- URL 工具 ---------- */
  // 站点根推导：优先取 <base> 标签（若 Material 输出了它），否则从 location.pathname 取第一段。
  // 兼容 GitHub Pages 子路径（/QDU-Wiki/）与根路径部署；origin 始终取当前域名，避免本地调试误请求线上。
  function siteBase() {
    var base = document.querySelector('base');
    if (base) {
      var u = new URL(base.getAttribute('href'), location.origin);
      return location.origin + u.pathname.replace(/\/+$/, '') + '/';
    }
    var seg = location.pathname.split('/');
    var root = seg.length > 1 && seg[1] ? '/' + seg[1] + '/' : '/';
    return location.origin + root;
  }
  function kbUrl() {
    return new URL('assets/kb.json', siteBase()).href;
  }
  function pageUrl(rel) {
    return new URL(rel, siteBase()).href;
  }

  /* ---------- 加载知识库（懒加载 + 缓存） ---------- */
  function loadKb() {
    if (kb) return Promise.resolve(kb);
    if (kbPromise) return kbPromise;
    kbPromise = fetch(kbUrl())
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        data._idx = Object.create(null);
        data._set = Object.create(null);
        for (var i = 0; i < data.vocab.length; i++) {
          data._idx[data.vocab[i]] = i;
          data._set[data.vocab[i]] = true;
        }
        data._stop = Object.create(null);
        for (var j = 0; j < data.stopwords.length; j++) {
          data._stop[data.stopwords[j]] = true;
        }
        kb = data;
        return data;
      });
    return kbPromise;
  }

  /* ---------- 前端分词：前向最大匹配（FMM），词表来自 kb ---------- */
  function tokenizeQuery(q, kb) {
    var maxlen = kb.meta.maxlen;
    var set = kb._set;
    var res = [];
    var i = 0;
    var n = q.length;
    while (i < n) {
      var found = null;
      for (var l = Math.min(maxlen, n - i); l >= 1; l--) {
        var sub = q.substr(i, l);
        if (set[sub] !== undefined) { found = sub; break; }
      }
      if (found) { res.push(found); i += found.length; }
      else { res.push(q.charAt(i)); i++; }
    }
    var out = [];
    for (var k = 0; k < res.length; k++) {
      var w = res[k];
      if (kb._stop[w] === undefined && /[\u4e00-\u9fff0-9A-Za-z]/.test(w)) {
        out.push(w);
      }
    }
    return out;
  }

  /* ---------- BM25 打分 ---------- */
  function bm25TopK(qtokens, kb, topK) {
    var idxMap = kb._idx;
    var scores = {};
    var hit = 0;
    var meta = kb.meta;
    var k1 = meta.k1;
    var b = meta.b;
    var avgdl = meta.avgdl;
    var n = meta.n;

    for (var i = 0; i < qtokens.length; i++) {
      var vi = idxMap[qtokens[i]];
      if (vi === undefined) continue;
      var dfi = kb.df[vi];
      var idf = Math.log(1 + (n - dfi + 0.5) / (dfi + 0.5));
      var ps = kb.postings[vi];
      for (var j = 0; j < ps.length; j++) {
        var cid = ps[j][0];
        var tf = ps[j][1];
        var dl = kb.chunks[cid].len;
        var s = idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / avgdl));
        scores[cid] = (scores[cid] || 0) + s;
      }
      hit++;
    }
    if (!hit) return [];

    var arr = [];
    for (var c in scores) arr.push([+c, scores[c]]);
    arr.sort(function (a, b) { return b[1] - a[1]; });
    return arr.slice(0, topK);
  }

  /* ---------- 消息渲染 ---------- */
  function addMsg(kind, htmlEl) {
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg chat-msg--' + kind;
    var avatar = document.createElement('span');
    avatar.className = 'chat-avatar';
    avatar.textContent = kind === 'user' ? '🙂' : '🤖';
    avatar.setAttribute('aria-hidden', 'true');
    var content = document.createElement('div');
    content.className = 'chat-msg__content';
    content.appendChild(htmlEl);
    wrap.appendChild(avatar);
    wrap.appendChild(content);
    msgListEl.appendChild(wrap);
    scrollBottom();
  }

  function addUserMsg(text) {
    var el = document.createElement('div');
    el.className = 'chat-bubble chat-bubble--user';
    el.textContent = text;
    addMsg('user', el);
  }

  function addTyping() {
    var el = document.createElement('div');
    el.className = 'chat-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg chat-msg--bot';
    var avatar = document.createElement('span');
    avatar.className = 'chat-avatar';
    avatar.textContent = '🤖';
    avatar.setAttribute('aria-hidden', 'true');
    var content = document.createElement('div');
    content.className = 'chat-msg__content';
    content.appendChild(el);
    wrap.appendChild(avatar);
    wrap.appendChild(content);
    msgListEl.appendChild(wrap);
    return wrap;
  }

  function scrollBottom() {
    var body = panelEl.querySelector('.chat-panel__body');
    body.scrollTop = body.scrollHeight;
  }

  function renderAnswer(results) {
    if (!results.length) {
      var empty = document.createElement('div');
      empty.className = 'chat-empty';
      empty.textContent = '没在 Wiki 里找到直接相关的内容，换个关键词试试，或者去「站内搜索」翻翻。';
      addMsg('bot', empty);
      return;
    }

    var box = document.createElement('div');
    box.className = 'chat-answer';
    var head = document.createElement('div');
    head.className = 'chat-answer__head';
    head.textContent = '在 Wiki 中找到 ' + results.length + ' 条相关内容：';
    box.appendChild(head);

    results.forEach(function (r, idx) {
      var chunk = r[1];
      var score = r[2];
      var card = document.createElement('a');
      card.className = 'chat-result' + (idx === 0 ? ' chat-result--top' : '');
      card.href = pageUrl(chunk.u);
      card.target = '_blank';
      card.rel = 'noopener';

      var title = document.createElement('div');
      title.className = 'chat-result__title';
      title.textContent = (idx === 0 ? '⭐ ' : '') + chunk.t;
      card.appendChild(title);

      var crumb = document.createElement('div');
      crumb.className = 'chat-result__crumb';
      crumb.textContent = chunk.c === chunk.p ? chunk.p : (chunk.c + ' › ' + chunk.p);
      card.appendChild(crumb);

      var snip = document.createElement('p');
      snip.className = 'chat-result__snip';
      snip.textContent = chunk.s;
      card.appendChild(snip);

      var foot = document.createElement('span');
      foot.className = 'chat-result__go';
      foot.textContent = '查看原文 →';
      card.appendChild(foot);
      void score;

      box.appendChild(card);
    });

    var note = document.createElement('div');
    note.className = 'chat-answer__note';
    note.textContent = '回答为 Wiki 原文片段检索结果，仅供参考，请以官方最新通知为准。';
    box.appendChild(note);

    addMsg('bot', box);
  }

  function ask(q) {
    q = (q || '').trim();
    if (!q) return;
    addUserMsg(q);
    inputEl.value = '';

    var typing = addTyping();
    loadKb().then(function (data) {
      var tokens = tokenizeQuery(q, data);
      var top = bm25TopK(tokens, data, 3);
      var results = [];
      for (var i = 0; i < top.length; i++) {
        var cid = top[i][0];
        var score = top[i][1];
        if (score > 0) results.push([cid, data.chunks[cid], score]);
      }
      if (typing.parentNode) typing.remove();
      renderAnswer(results);
    }).catch(function () {
      if (typing.parentNode) typing.remove();
      var err = document.createElement('div');
      err.className = 'chat-empty';
      err.textContent = '知识库加载失败，请检查网络后重试。';
      addMsg('bot', err);
    });
  }

  /* ---------- 欢迎语（首次进入 / 清空对话后） ---------- */
  function showWelcome() {
    var welcome = document.createElement('div');
    welcome.className = 'chat-welcome';
    welcome.textContent = '你好呀，我是「青大智答」✨ 宿舍、食堂、选课、转专业、军训、保研……想问啥直接问，我从 Wiki 里给你找答案。也可以直接点下面的问题试试：';
    addMsg('bot', welcome);

    var chips = document.createElement('div');
    chips.className = 'chat-chips';
    CHIPS.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chat-chip';
      b.type = 'button';
      b.textContent = c;
      b.addEventListener('click', function () { ask(c); });
      chips.appendChild(b);
    });
    addMsg('bot', chips);
  }

  /* ---------- UI 构建 ---------- */
  function buildUI() {
    bodyEl = document.body;

    launcherEl = document.createElement('button');
    launcherEl.className = 'chat-launcher';
    launcherEl.setAttribute('aria-label', '打开智能问答');
    launcherEl.innerHTML =
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '  <defs>' +
      '    <linearGradient id="chatGrad" x1="0" y1="0" x2="1" y2="1">' +
      '      <stop offset="0" stop-color="#ffffff"/>' +
      '      <stop offset="0.55" stop-color="#ffe9c7"/>' +
      '      <stop offset="1" stop-color="#ffb36b"/>' +
      '    </linearGradient>' +
      '  </defs>' +
      '  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="rgba(255,255,255,0.12)" stroke="url(#chatGrad)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '  <circle cx="8.2" cy="11.6" r="1.25" fill="url(#chatGrad)"/>' +
      '  <circle cx="12" cy="11.6" r="1.25" fill="url(#chatGrad)"/>' +
      '  <circle cx="15.8" cy="11.6" r="1.25" fill="url(#chatGrad)"/>' +
      '</svg>';
    bodyEl.appendChild(launcherEl);

    panelEl = document.createElement('div');
    panelEl.className = 'chat-panel';
    panelEl.hidden = true;
    panelEl.innerHTML =
      '<div class="chat-panel__head">' +
      '  <div class="chat-panel__titles">' +
      '    <div class="chat-panel__title">青大智答</div>' +
      '    <div class="chat-panel__sub">校园 AI 客服 · 本地检索，秒回不卡</div>' +
      '  </div>' +
      '  <div class="chat-panel__actions">' +
      '    <button type="button" class="chat-clear" aria-label="清空对话">↺</button>' +
      '    <button type="button" class="chat-panel__close" aria-label="关闭">×</button>' +
      '  </div>' +
      '</div>' +
      '<div class="chat-panel__body"></div>' +
      '<div class="chat-panel__foot">' +
      '  <input class="chat-input" type="text" enterkeyhint="send" maxlength="100" placeholder="输入问题，回车发送" autocomplete="off">' +
      '  <button class="chat-send" aria-label="发送">发送</button>' +
      '</div>';
    bodyEl.appendChild(panelEl);

    msgListEl = panelEl.querySelector('.chat-panel__body');
    inputEl = panelEl.querySelector('.chat-input');

    showWelcome();

    launcherEl.addEventListener('click', open);
    panelEl.querySelector('.chat-panel__close').addEventListener('click', close);
    panelEl.querySelector('.chat-clear').addEventListener('click', function () {
      msgListEl.textContent = '';
      showWelcome();
      inputEl.focus();
    });
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') ask(inputEl.value);
    });
    panelEl.querySelector('.chat-send').addEventListener('click', function () {
      ask(inputEl.value);
    });
  }

  function open() {
    panelEl.hidden = false;
    document.body.classList.add('chat-open');
    setTimeout(function () { inputEl.focus(); }, 60);
  }

  function close() {
    panelEl.hidden = true;
    document.body.classList.remove('chat-open');
  }

  function init() {
    if (bodyEl && bodyEl.querySelector('.chat-launcher')) return;
    buildUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();