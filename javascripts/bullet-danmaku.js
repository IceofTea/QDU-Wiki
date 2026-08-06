// 首页 hero 大卡片弹幕：随机洗牌轮播社区梗句，兼容 navigation.instant。
// 采用「洗牌池」策略——把全部话术随机打乱后逐条播放，播完一轮重新洗牌，
// 既保证顺序随机，又保证每轮内每句话至少出现一次，不会出现某句一直刷不出来。
(function () {
  'use strict';

  var MESSAGES = [
    '夏🐭🐭在莘园吃午饭',
    '下水道鬻锅 again',
    '魏🐭🐭批空调经费中',
    '拷打文工团大海的女儿',
    '为青大之崛起而读书',
    '开始推销校园卡',
    '游戏本五黑跳闸',
    '在醉爱很内向，吃饱了也不说，一直吃',
    '在双子楼连上客机 Wi-Fi',
    '胡🐭🐭赶上延迟退休 6 个月',
    '闪击青科食堂',
    '围攻海洋大学',
    '我放宿舍充电的电瓶呢？',
    '入镜青大国国宣传视频',
    '导员，我已经在回校的火车上了',
    '去西伯利亚挖教务服务器',
    '骑上我心爱的校易行',
    '胡🐭🐭早上在西院操场跑步',
    '偷偷你的外卖',
    '金焱 +3，告辞',
    '距早八还剩一小时：9 点了'
  ];
  var GAP = 1500; // 两条弹幕之间停顿 ms

  function shuffle(a) {
    var i = a.length, j, t;
    while (i > 1) {
      j = Math.floor(Math.random() * i);
      i--;
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var seq = 0;
  var pool = [];

  function render(box, text) {
    var el = document.createElement('span');
    el.className = 'hero-danmaku__item';
    el.textContent = text;
    box.textContent = '';
    box.appendChild(el);
    // 时长随文案长度浮动，保证速度均匀、可读
    var dur = Math.min(12, Math.max(8, 6 + text.length * 0.07));
    el.style.animationDuration = dur + 's';
    return (dur + GAP / 1000) * 1000;
  }

  function start() {
    var box = document.getElementById('hero-danmaku');
    if (!box) return;
    var my = ++seq; // 新会话接管，旧循环自然退出
    (function play() {
      if (my !== seq) return;
      if (pool.length === 0) pool = shuffle(MESSAGES.slice());
      var wait = render(box, pool.shift());
      setTimeout(play, wait + GAP);
    })();
  }

  document.addEventListener('DOMContentLoaded', start);
  document.addEventListener('DOMContentSwitch', start);

  // MutationObserver 兜底：Material 9.x 高版本 instant navigation 不再派发
  // DOMContentSwitch 事件，监听 hero-danmaku 重新插入即重启弹幕。
  var inited = false;
  function initWatcher() {
    if (inited) return;
    inited = true;
    var mo = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType === 1 && (node.id === 'hero-danmaku' || (node.querySelector && node.querySelector('#hero-danmaku')))) {
            start();
            return;
          }
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) initWatcher();
  else document.addEventListener('DOMContentLoaded', initWatcher);
})();