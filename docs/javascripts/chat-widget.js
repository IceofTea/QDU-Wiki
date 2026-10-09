// 青大智答：全站右下角悬浮智能问答（新生客服）
// 原理：构建时由 scripts/build_kb.py 生成 BM25 倒排索引（docs/assets/kb.json），
// 本脚本在浏览器内完成「分词 → BM25 打分 → 展示相关 wiki 片段 + 原文链接」，
// 全程本地计算、零外部请求、零密钥。
// 兼容 Material instant 导航：组件挂在 body 下，导航切换不销毁。
// —— 智能体升级（挑战杯 v2）——
// ① 三层识别：强意图（办事跳转）→ BM25 知识检索 → 建议兜底；
// ② 跨站联动：命中办事意图时直达 QDU-Nav 智能体（一句话办事的工作流在 Nav 端执行）。
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

  // ── 办事意图（换校落点：NAV_URL 随一键换校脚本切换） ──
  // v2 升级：kind=agent 的意图会把【用户原话】通过 ?q= 带到导航站智能体
  //          直接执行对应工作流（跨站委托，localStorage 不跨域的替代方案）
  var NAV_URL = 'https://iceoftea.github.io/QDU-Nav/';
  var NAV_AGENT_URL = NAV_URL + '#/app/assistant';
  var INTENTS = [
    { patterns: ['智能体', '助手', '帮我办', 'AI办事', '一句话办事', '对话说'], kind: 'agent', desc: '打开导航站智能体，说一句话就能办事（查课表 / 找空教室 / 加日程 / 发校园墙）' },
    { patterns: ['今日简报', '每日简报', '今天有什么安排'], kind: 'agent', desc: '委托导航站智能体执行「今日简报」：课表 + 日程 + 通知一次看全' },
    { patterns: ['签到', '每日打卡'], kind: 'agent', desc: '委托执行每日签到（+2 积分）并查看积分钱包' },
    { patterns: ['发墙', '发帖', '校园墙发帖', '发失物', '发悬赏'], kind: 'agent', desc: '委托在校园墙发帖（失物/悬赏/普通帖，敏感词双端校验）' },
    { patterns: ['看校园墙', '逛墙', '热门帖子'], kind: 'agent', desc: '打开校园墙热榜（12 分区 / 投票 / 悬赏 / 资源）' },
    { patterns: ['协作看板', '运行统计'], kind: 'agent', desc: '委托执行「协作看板」：双 Agent 飞轮量化数据一屏看全' },
    { patterns: ['空教室', '自习室', '哪里自习'], kind: 'app', app: 'classroomNav', desc: '实时空教室查询 · 教室占用 · 分步路线' },
    { patterns: ['课表', '课程表', '明天上课'], kind: 'app', app: 'timetable', desc: '班级 / 教室 / 教师三视图课表' },
    { patterns: ['提醒我', '加日程', '备忘'], kind: 'agent', desc: '对智能体说"提醒我明天下午三点开会"，确认即写入日程' },
    { patterns: ['吃什么', '食堂空座', '人多吗'], kind: 'app', app: 'whatToEat', desc: '今天吃什么 · 食堂实时空座' },
    { patterns: ['记账', '生活费', '账单'], kind: 'app', app: 'budget', desc: '收支随手记 · 账单导入 · 预算分配' },
    { patterns: ['vpn', 'VPN', '织网', '知网', '校外访问'], kind: 'app', app: 'officialSites', desc: '校园服务直达：织网 / VPN / 图书馆 / 办事大厅' },
    { patterns: ['校园导航', '打开导航', '去导航', '导航站'], kind: 'home', desc: '打开校园导航首页（18+ 应用一站式聚合）' }
  ];

  function matchIntent(q) {
    var t = (q || '').toLowerCase().replace(/[？?！!。，,、\s]/g, '');
    if (!t) return null;
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < INTENTS.length; i++) {
      var it = INTENTS[i];
      for (var j = 0; j < it.patterns.length; j++) {
        var p = it.patterns[j].toLowerCase();
        var score = 0;
        if (t === p) score = 100;
        else if (t.indexOf(p) >= 0) score = 60 + p.length * 2;
        else if (p.indexOf(t) >= 0 && t.length >= 2) score = 40 + t.length * 3;
        if (score > bestScore) { bestScore = score; best = it; }
      }
    }
    return bestScore >= 40 ? best : null;
  }

  var lastMs = 0;   // 最近一次回答耗时（徽标展示，对齐 Nav 智能体）
  var LS_HISTORY = 'qdu_chat_history_v1';  // 最近问题历史（快捷重发）
  function pushHistory(q) {
    try {
      var h = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
      h = [q].concat(h.filter(function (x) { return x !== q; })).slice(0, 12);
      localStorage.setItem(LS_HISTORY, JSON.stringify(h));
    } catch (e) { /* noop */ }
  }
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch (e) { return []; }
  }
  var FEEDBACK_API = '';  // 反馈回流地址（与评论网关同源；留空=本地模式自动尝试 localhost）
  function feedbackBase() {
    if (FEEDBACK_API) return FEEDBACK_API.replace(/\/+$/, '');
    if (apiBaseKnown()) return apiBaseKnown();
    return 'http://localhost:8787';
  }
  var _apiBase = '';
  function apiBaseKnown() { return _apiBase; }
  var kb = null;
  var kbPromise = null;
  var lastCtx = null; // 上轮问答上下文 {q, results}（“还有呢/那X呢”追问用）
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

  function renderAnswer(results, rawQ) {
    if (!results.length) {
      var empty = document.createElement('div');
      empty.className = 'chat-empty';
      empty.textContent = '没在 Wiki 里找到直接相关的内容，换个关键词试试；要办事可以说「空教室」「今日简报」等，会直达导航站智能体。';
      addMsg('bot', empty);
      return;
    }

    var box = document.createElement('div');
    box.className = 'chat-answer';

    // 徽标行：知识检索层 · 置信度 · 耗时（对齐 Nav 智能体语言）
    var conf = Math.min(95, 55 + Math.round(results[0][2] * 6));
    var meta = document.createElement('div');
    meta.className = 'chat-meta';
    meta.innerHTML = '<span class="chat-badge">知识检索 BM25</span>' +
      '<span class="chat-conf">置信度 ' + conf + '%</span>' +
      '<span class="chat-conf">耗时 ' + (lastMs || 0).toFixed(2) + 's</span>';
    box.appendChild(meta);

    // 执行轨迹（三步可视）
    var steps = document.createElement('div');
    steps.className = 'chat-steps';
    steps.innerHTML =
      '<div class="chat-step done">✅ 分词与 BM25 打分（' + results.length + ' 个候选）</div>' +
      '<div class="chat-step done">✅ 锁定最佳条目《' + results[0][1].t + '》</div>' +
      '<div class="chat-step done">✅ 生成直达入口 · 附出处可溯源</div>';
    box.appendChild(steps);

    // 主结果：同页预览直达（不单开标签）
    var topChunk = results[0][1];
    var go = document.createElement('div');
    go.className = 'chat-result chat-result--top chat-result--go';
    go.innerHTML = '<div class="chat-result__title">🚀 直达《' + topChunk.t + '》</div>' +
      '<div class="chat-result__crumb">' + (topChunk.c === topChunk.p ? topChunk.p : topChunk.c + ' › ' + topChunk.p) + '</div>' +
      '<p class="chat-result__snip">' + topChunk.s + '</p>';
    var golink = document.createElement('div');
    golink.className = 'chat-golink';
    // 主操作：当前页面直接跳转
    var goNow = document.createElement('a');
    goNow.className = 'chat-btn-main';
    goNow.href = pageUrl(topChunk.u);
    goNow.target = '_self';
    goNow.textContent = '🚀 立即前往（当前页跳转）';
    var ob = document.createElement('a');
    ob.className = 'chat-btn-ghost';
    ob.href = pageUrl(topChunk.u);
    ob.target = '_blank';
    ob.rel = 'noopener';
    ob.textContent = '↗ 新标签';
    golink.appendChild(goNow);
    golink.appendChild(ob);
    go.appendChild(golink);
    box.appendChild(go);

    var head = document.createElement('div');
    head.className = 'chat-answer__head';
    head.textContent = '其他相关（' + Math.max(0, results.length - 1) + '）：';
    box.appendChild(head);

    results.slice(1).forEach(function (r) {
      var chunk = r[1];
      var card = document.createElement('a');
      card.className = 'chat-result';
      card.href = pageUrl(chunk.u);
      card.target = '_blank';
      card.rel = 'noopener';
      card.innerHTML = '<div class="chat-result__title">' + chunk.t + '</div>' +
        '<div class="chat-result__crumb">' + (chunk.c === chunk.p ? chunk.p : chunk.c + ' › ' + chunk.p) + '</div>' +
        '<p class="chat-result__snip">' + chunk.s + '</p>' +
        '<span class="chat-result__go">查看原文 →</span>';
      box.appendChild(card);
    });

    var note = document.createElement('div');
    note.className = 'chat-answer__note';
    note.textContent = '回答为 Wiki 原文片段检索结果，附出处可溯源；要办事请直接说需求（如"今日简报"），会委托导航站智能体执行。';
    box.appendChild(note);

    addMsg('bot', box);

    // 消息操作：复制 / 反馈回流（与 Nav 智能体同一套语言）
    addOpsRow(box, '知识检索：' + topChunk.t);
    // 动态追问
    addFollowChips([
      results[1] ? '《' + results[1][1].t + '》讲了什么' : '这篇文章还讲了什么',
      '今日简报'
    ]);
  }

  /* ── 消息操作行：复制 / 👍 / 👎（👎 回流社区网关反馈队列） ── */
  function addOpsRow(box, labelText) {
    var row = document.createElement('div');
    row.className = 'chat-ops';
    var copyBtn = document.createElement('button');
    copyBtn.className = 'chat-op';
    copyBtn.type = 'button';
    copyBtn.textContent = '⧉ 复制';
    copyBtn.addEventListener('click', function () {
      try {
        navigator.clipboard.writeText(labelText || box.innerText);
        copyBtn.textContent = '✓ 已复制';
        setTimeout(function () { copyBtn.textContent = '⧉ 复制'; }, 1500);
      } catch (e) { /* noop */ }
    });
    var likeBtn = document.createElement('button');
    likeBtn.className = 'chat-op';
    likeBtn.type = 'button';
    likeBtn.textContent = '👍';
    likeBtn.addEventListener('click', function () {
      likeBtn.classList.add('on');
      likeBtn.textContent = '👍 已赞';
    });
    var dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'chat-op';
    dislikeBtn.type = 'button';
    dislikeBtn.textContent = '👎';
    dislikeBtn.addEventListener('click', function () {
      dislikeBtn.classList.add('bad');
      dislikeBtn.textContent = '👎 已反馈';
      // 回流：进管理台「👎 反馈」聚合视图
      try {
        fetch(feedbackBase() + '/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: (labelText || box.innerText).slice(0, 200), kind: 'wiki-dislike', detail: 'Wiki 客服点踩', path: location.pathname })
        }).catch(function () { /* 网关未连：静默 */ });
      } catch (e) { /* noop */ }
    });
    row.appendChild(copyBtn);
    row.appendChild(likeBtn);
    row.appendChild(dislikeBtn);
    box.appendChild(row);
  }

  /* ── 跨站委托执行：把用户原话带进导航站智能体（?q= 协议） ── */
  function agentHref(rawQ) {
    return NAV_AGENT_URL + '?q=' + encodeURIComponent(rawQ || '你能做什么')
  }

  /**
   * 办事意图卡片 v2 —— 对齐 Nav 智能体的展示语言：
   * 置信度徽标 + 三步执行轨迹 + 跨站委托直达按钮（带原话执行工作流）
   */
  function renderJump(intent, rawQ) {
    var box = document.createElement('div');
    box.className = 'chat-answer chat-answer--agent';

    // 徽标行（对齐 Nav：识别层 + 置信度 + 耗时由 ask 记录）
    var meta = document.createElement('div');
    meta.className = 'chat-meta';
    meta.innerHTML = '<span class="chat-badge">意图命中</span><span class="chat-conf">置信度 100%</span>' +
      '<span class="chat-conf">耗时 ' + (lastMs || 0).toFixed(2) + 's</span>';
    box.appendChild(meta);

    // 执行轨迹（三步可视）
    var steps = document.createElement('div');
    steps.className = 'chat-steps';
    steps.innerHTML =
      '<div class="chat-step done">✅ 识别为「' + (intent.kind === 'agent' ? '跨站办事' : intent.kind === 'home' ? '导航直达' : '应用直达') + '」</div>' +
      '<div class="chat-step done">✅ 组装目标与参数' + (intent.kind === 'agent' && rawQ ? '（携带话术：' + String(rawQ).slice(0, 18) + (rawQ.length > 18 ? '…' : '') + '）' : '') + '</div>' +
      '<div class="chat-step done">✅ 生成直达链接 · 点击即达</div>';
    box.appendChild(steps);

    var url, title;
    if (intent.kind === 'agent') {
      url = agentHref(rawQ);
      title = '🤖 委托导航站智能体执行';
    } else if (intent.kind === 'home') {
      url = NAV_URL;
      title = '🧭 打开校园导航首页';
    } else {
      url = NAV_URL + '#/app/' + intent.app;
      title = '🚀 直达 · ' + (INTENT_APP_NAMES[intent.app] || intent.app);
    }

    var wrap = document.createElement('div');
    wrap.className = 'chat-golink';
    // 主操作：当前页面直接跳转（不新开标签，避免越用越冗余）
    var goNow = document.createElement('a');
    goNow.className = 'chat-btn-main';
    goNow.href = url;
    goNow.target = '_self';
    goNow.textContent = '🚀 立即前往（当前页跳转）';
    // 次操作：确需保留当前页时新标签打开
    var openBtn = document.createElement('a');
    openBtn.className = 'chat-btn-ghost';
    openBtn.href = url;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener';
    openBtn.textContent = '↗ 新标签打开';
    wrap.appendChild(goNow);
    wrap.appendChild(openBtn);
    box.appendChild(wrap);

    var note = document.createElement('div');
    note.className = 'chat-answer__note';
    note.textContent = intent.kind === 'agent'
      ? '问答在 Wiki · 办事在 Nav：当前页直接跳转执行，返回键即可回来（原话已携带）。'
      : '问答在 Wiki · 办事在 Nav —— 当前页跳转，避免标签堆积。';
    box.appendChild(note);
    addMsg('bot', box);
    lastCtx = { q: rawQ, results: null }; // 跳转类回答无更多，但保留 q 供“那X呢”转问
    // 追问建议
    addFollowChips(['这篇文章还讲了什么', '换一种问法', '打开校园导航']);
  }


  /* ── 动态追问 chips ── */
  function addFollowChips(list) {
    var chips = document.createElement('div');
    chips.className = 'chat-chips';
    (list || []).forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chat-chip';
      b.type = 'button';
      b.textContent = c;
      b.addEventListener('click', function () { ask(c); });
      chips.appendChild(b);
    });
    msgListEl.appendChild(chips);
    scrollBottom();
  }

  /* 常用应用中文名（直达按钮文案） */
  var INTENT_APP_NAMES = {
    classroomNav: '教室导航', timetable: '课程表', whatToEat: '今天吃什么',
    budget: '生活费计数器', officialSites: '学校官网与服务'
  };

  /* ── 上下文追问（“还有呢”翻更多，“那X呢”转问X） ── */
  function renderMore() {
    if (!lastCtx || !lastCtx.results || !lastCtx.results.length) {
      var hint = document.createElement('div');
      hint.className = 'chat-empty';
      hint.textContent = lastCtx && lastCtx.q ? '上条是跳转回答，没有更多条目——换个关键词问问，或说“今日简报”办事。' : '先问一个问题，再说“还有呢”看更多。';
      addMsg('bot', hint);
      return;
    }
    lastCtx.shown = lastCtx.shown || 3;
    var next = lastCtx.results.slice(lastCtx.shown, lastCtx.shown + 3);
    if (!next.length) {
      var done = document.createElement('div');
      done.className = 'chat-empty';
      done.textContent = ' related 已全部列出（共 ' + lastCtx.results.length + ' 条），换个问法试试。';
      addMsg('bot', done);
      addFollowChips(['换一种问法', '今日简报']);
      return;
    }
    lastCtx.shown += next.length;
    var box = document.createElement('div');
    box.className = 'chat-answer';
    var head = document.createElement('div');
    head.className = 'chat-answer__head';
    head.textContent = '更多相关（' + next.length + '）：';
    box.appendChild(head);
    next.forEach(function (r) {
      var chunk = r[1];
      var card = document.createElement('a');
      card.className = 'chat-result';
      card.href = pageUrl(chunk.u);
      card.target = '_blank';
      card.rel = 'noopener';
      card.innerHTML = '<div class="chat-result__title">' + chunk.t + '</div>' +
        '<div class="chat-result__crumb">' + (chunk.c === chunk.p ? chunk.p : chunk.c + ' › ' + chunk.p) + '</div>' +
        '<p class="chat-result__snip">' + chunk.s + '</p>' +
        '<span class="chat-result__go">查看原文 →</span>';
      box.appendChild(card);
    });
    addMsg('bot', box);
    if (lastCtx.shown < lastCtx.results.length) addFollowChips(['还有呢', '换一种问法']);
    else addFollowChips(['换一种问法', '今日简报']);
  }

  function ask(q) {
    q = (q || '').trim();
    if (!q) return;
    // 追问拦截（短输入优先不断上下文；强意图由后续流程自然处理）
    if (/^(还有呢|还有吗|再来点|更多|还有什么)$/.test(q)) {
      pushHistory(q);
      addUserMsg(q);
      inputEl.value = '';
      renderMore();
      return;
    }
    var inner = /^(那|那么)(.+?)(呢|吗)?$/.exec(q);
    if (inner && inner[2] && inner[2].length >= 2 && lastCtx) {
      ask(inner[2]); // 转问实质内容（如“那食堂呢”→搜“食堂”）
      return;
    }
    pushHistory(q);
    addUserMsg(q);
    inputEl.value = '';
    var t0 = performance.now();

    // 第一层：办事意图（跳转 Nav 端智能体/应用）
    var intent = matchIntent(q);
    if (intent) {
      lastMs = (performance.now() - t0) / 1000;
      renderJump(intent, q);
      return;
    }

    var typing = addTyping();
    loadKb().then(function (data) {
      var tokens = tokenizeQuery(q, data);
      var top = bm25TopK(tokens, data, 8); // 取 8 条：前 3 主答，其余供“还有呢”翻页
      var results = [];
      for (var i = 0; i < top.length; i++) {
        var cid = top[i][0];
        var score = top[i][1];
        if (score > 0) results.push([cid, data.chunks[cid], score]);
      }
      lastMs = (performance.now() - t0) / 1000;
      if (typing.parentNode) typing.remove();
      lastCtx = { q: q, results: results, shown: 3 }; // 全量 8 条进上下文，首答只展前 3
      renderAnswer(results.slice(0, 3), q);
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
    // 历史提问快捷入口（本机最近 5 问，有记录才出现）
    try {
      var hist = getHistory().slice(0, 5);
      if (hist.length) {
        var hw = document.createElement('div');
        hw.className = 'chat-chips';
        var cap = document.createElement('span');
        cap.className = 'chat-chips__cap';
        cap.textContent = '🕘 最近问过';
        hw.appendChild(cap);
        hist.forEach(function (h) {
          var b = document.createElement('button');
          b.className = 'chat-chip';
          b.type = 'button';
          b.textContent = h.length > 14 ? h.slice(0, 14) + '…' : h;
          b.title = h;
          b.addEventListener('click', function () { ask(h); });
          hw.appendChild(b);
        });
        addMsg('bot', hw);
      }
    } catch (e) { /* noop */ }
  }

  /* ---------- 对话导出 txt（问答对逐条，方便粘进反馈/作业） ---------- */
  function exportDialogue() {
    try {
      var rows = msgListEl.querySelectorAll('.chat-msg');
      var lines = ['青大智答 · 对话导出 ' + new Date().toLocaleString('zh-CN'), ''];
      Array.prototype.forEach.call(rows, function (w) {
        var isUser = w.className.indexOf('chat-msg--user') >= 0;
        var t = (w.innerText || '').trim().replace(/\n{3,}/g, '\n\n');
        if (!t) return;
        lines.push((isUser ? '【我】' : '【智答】') + t);
        lines.push('');
      });
      var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'qdu-chat-' + new Date().toISOString().slice(0, 10) + '.txt';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    } catch (e) { /* noop */ }
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
      '    <div class="chat-panel__sub">三层识别 · 百科问答可溯源 · 办事直达导航站</div>' +
      '  </div>' +
      '  <div class="chat-panel__actions">' +
      '    <button type="button" class="chat-export" aria-label="导出对话">⬇</button>' +
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
    mountHistoryBtn();

    launcherEl.addEventListener('click', open);
    panelEl.querySelector('.chat-panel__close').addEventListener('click', close);
    panelEl.querySelector('.chat-export').addEventListener('click', exportDialogue);
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

  /* ---------- 划词提问：选中正文 → 「❓ 问这段」→ 带上下文向 AI 提问 ---------- */
  function mountAskSelection() {
    if (document.getElementById('chat-ask-btn')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'chat-ask-btn';
    btn.textContent = '❓ 问这段';
    btn.style.cssText = 'position:absolute;z-index:91;display:none;font-size:12.5px;padding:5px 13px;border-radius:999px;background:#1b66c9;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);font-family:inherit';
    document.body.appendChild(btn);
    document.addEventListener('mouseup', function (e) {
      if (btn.contains(e.target)) return;
      var panel = document.querySelector('.chat-panel');
      if (panel && panel.contains(e.target)) return;
      setTimeout(function () {
        var sel = window.getSelection();
        if (!sel || sel.isCollapsed) { btn.style.display = 'none'; return; }
        var text = sel.toString().trim();
        var inContent = document.querySelector('.md-content') && document.querySelector('.md-content').contains(sel.anchorNode);
        if (text.length < 4 || text.length > 300 || !inContent) { btn.style.display = 'none'; return; }
        var rect = sel.getRangeAt(0).getBoundingClientRect();
        btn.style.top = (rect.top + window.scrollY - 42) + 'px';
        btn.style.left = Math.max(8, rect.left + window.scrollX + 72) + 'px';
        btn.style.display = 'inline-block';
        btn._selText = text;
      }, 10);
    });
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
    btn.addEventListener('click', function () {
      var text = btn._selText || '';
      btn.style.display = 'none';
      if (!text) return;
      open();
      ask('请解释这段话：' + text.slice(0, 160));
      var sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    });
  }

  /* ---------- 历史快捷（面板头部 🕘 按钮） ---------- */
  function mountHistoryBtn() {
    if (!panelEl) return;
    var actions = panelEl.querySelector('.chat-panel__actions');
    if (!actions || actions.querySelector('.chat-history')) return;
    var hb = document.createElement('button');
    hb.type = 'button';
    hb.className = 'chat-history';
    hb.title = '最近问过';
    hb.textContent = '🕘';
    hb.addEventListener('click', function () {
      var list = getHistory();
      if (!list.length) { alert('暂无历史提问'); return; }
      var pick = prompt('最近问过（输入序号重发，或点取消）：\n' + list.map(function (q, i) { return (i + 1) + '. ' + q; }).join('\n'));
      var n = parseInt(pick, 10);
      if (n >= 1 && n <= list.length) ask(list[n - 1]);
    });
    actions.insertBefore(hb, actions.firstChild);
  }

  function init() {
    if (bodyEl && bodyEl.querySelector('.chat-launcher')) return;
    buildUI();
    // 事件委托兜底：i18n 等脚本若替换 launcher 节点会丢监听，
    // document 级委托保证点击永远可达（幂等，init 仅一次）
    document.addEventListener('click', function delegateChatLauncher(e) {
      var t = e.target;
      if (t && t.closest && t.closest('.chat-launcher') && panelEl && panelEl.hidden) {
        open();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();