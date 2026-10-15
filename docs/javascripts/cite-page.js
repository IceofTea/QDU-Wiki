/* QDU-Wiki 引用此页 —— 一键复制规范的引用文本
 * ---------------------------------------------------------------------------
 * 学生写课程论文 / 实践报告时经常要引用本 Wiki 的资料，格式却各不相同。
 * 本脚本在正文末尾注入一个「引用此页」小卡片：
 *   · 复制内容为「标题 · 站点名 · 发布日期 · URL · 访问日期」的规范引用串；
 *   · 使用 navigator.clipboard，失败（http / 旧浏览器 / 无权限）回退到 textarea + execCommand；
 *   · 复制成功给出短暂的「已复制」反馈，不阻断阅读；
 *   · 纯前端零依赖，不新增网络请求，不上报任何数据。
 */
(function () {
  'use strict';

  if (document.querySelector('.qdu-cite')) return;

  function meta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? (el.getAttribute('content') || '') : '';
  }

  function pageTitle() {
    var h1 = document.querySelector('.md-content h1');
    var t = h1 ? (h1.textContent || '').trim() : '';
    if (t) return t;
    return (document.title || '').split(' - ')[0].trim();
  }

  function siteName() {
    var m = meta('site_name');
    if (m) return m;
    var t = (document.title || '').split(' - ');
    return t.length > 1 ? t[t.length - 1].trim() : 'QDU-Wiki';
  }

  function pubDate() {
    var el = document.querySelector('.md-source-file__fact time, time[datetime]');
    var raw = el ? (el.getAttribute('datetime') || el.textContent || '') : '';
    var m = String(raw).match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : '';
  }

  function today() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function buildText() {
    var parts = [];
    parts.push(pageTitle());
    var s = siteName();
    if (s) parts.push(s);
    var d = pubDate();
    if (d) parts.push(d);
    parts.push('访问日期：' + today());
    return parts.join(' · ') + '\n' + location.href;
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function mount() {
    var inner = document.querySelector('.md-content__inner');
    if (!inner || document.querySelector('.qdu-cite')) return;
    if (document.body.classList.contains('qdu-page-home')) return;

    var wrap = document.createElement('div');
    wrap.className = 'qdu-cite';
    wrap.innerHTML =
      '<span class="qdu-cite-icon">📎</span>' +
      '<span class="qdu-cite-label">引用此页</span>' +
      '<button type="button" class="qdu-cite-btn">复制引用</button>' +
      '<span class="qdu-cite-tip" role="status" aria-live="polite"></span>';
    var btn = wrap.querySelector('.qdu-cite-btn');
    var tip = wrap.querySelector('.qdu-cite-tip');

    btn.addEventListener('click', function () {
      var text = buildText();
      function done(ok) {
        tip.textContent = ok ? '已复制' : '复制失败，请手动选中地址栏';
        tip.classList.toggle('ok', ok);
        setTimeout(function () { tip.textContent = ''; tip.classList.remove('ok'); }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });

    if (inner.lastElementChild && inner.lastElementChild.classList.contains('md-source-file')) {
      inner.insertBefore(wrap, inner.lastElementChild);
    } else {
      inner.appendChild(wrap);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
