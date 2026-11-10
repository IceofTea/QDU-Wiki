// 文件路径: /qdu-wiki/mp-weixin/utils/api.js
// 词条索引：复用网站 search/search_index.json，多源容错
const SITE_URL = 'https://iceoftea.github.io/QDU-Wiki';
const INDEX_URLS = [
  `${SITE_URL}/search/search_index.json`,
  'https://cdn.jsdelivr.net/gh/IceofTea/QDU-Wiki@gh-pages/search/search_index.json',
  'https://raw.githubusercontent.com/IceofTea/QDU-Wiki/gh-pages/search/search_index.json',
];
const CACHE_KEY = 'qdu_wiki_index_v1';
const CACHE_T = 'qdu_wiki_index_time';

const SECTIONS = {
  new: '新生指南', study: '学习资料', live: '校园生活', college: '学院专业',
  service: '办事服务', organization: '组织社团', words: '黑话词典',
  friends: '友情链接', share: '分享交流', about: '关于本站', en: 'English',
};

let _data = null;
let _source = '';
let _raw = null;

function req(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    wx.request({
      url, timeout, method: 'GET',
      success: r => (r.statusCode === 200 && r.data ? resolve(r.data) : reject(new Error('HTTP ' + r.statusCode))),
      fail: reject,
    });
  });
}

function normalize(j) {
  const docs = (j && j.docs) || [];
  const seen = new Set();
  const pages = [];
  for (const d of docs) {
    let loc = d.location || '';
    if (loc.startsWith('#') || !loc) continue;
    loc = loc.split('#')[0];
    if (seen.has(loc)) continue;
    seen.add(loc);
    const section = loc.split('/')[0] || 'about';
    pages.push({
      loc,
      title: (d.title || loc).replace(/​/g, '').trim(),
      text: (d.text || '').slice(0, 200),
      section,
    });
  }
  return { pages };
}

async function fetchIndex(force = false) {
  if (_data && !force) return { data: _data, source: _source };
  if (!_data) {
    const cached = wx.getStorageSync(CACHE_KEY);
    if (cached) { _data = cached; _source = 'cache'; }
  }
  for (const url of INDEX_URLS) {
    try {
      const j = await req(url + '?t=' + Date.now());
      const norm = normalize(j);
      if (norm.pages.length) {
        _data = norm; _source = 'live'; _raw = j;
        wx.setStorageSync(CACHE_KEY, norm);
        wx.setStorageSync(CACHE_T, Date.now());
        return { data: norm, source: 'live' };
      }
    } catch (e) { /* 下一源 */ }
  }
  return { data: _data, source: _source };
}

function search(kw) {
  kw = (kw || '').trim().toLowerCase();
  if (!kw || !_data) return [];
  return _data.pages
    .filter(p => p.title.toLowerCase().includes(kw) || p.text.toLowerCase().includes(kw))
    .slice(0, 50);
}

function pageUrl(loc) { return SITE_URL + '/' + loc; }

// 词条正文：合并同一页面（location 基串相同）的全部分段文档。
// mkdocs 搜索索引按标题把一页拆成多条：基串=页首，基串#锚点=各小节。
async function fetchDetail(loc) {
  loc = (loc || '').split('#')[0];
  let j = _raw;
  if (!j) {
    for (const url of INDEX_URLS) {
      try { j = await req(url + '?t=' + Date.now()); _raw = j; break; } catch (e) { /* 下一源 */ }
    }
  }
  const segs = [];
  let title = '';
  for (const d of ((j && j.docs) || [])) {
    const dl = (d.location || '');
    if (dl.split('#')[0] !== loc) continue;
    const dt = (d.title || '').replace(/​/g, '').trim();
    if (!title && !dl.includes('#')) title = dt;
    const text = (d.text || '').replace(/​/g, '').replace(/\s+/g, ' ').trim();
    if (text) segs.push({ h: dl.includes('#') ? dt : '', text });
  }
  return { title, segs, url: pageUrl(loc) };
}

function cacheTime() {
  const t = wx.getStorageSync(CACHE_T);
  if (!t) return '';
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

module.exports = { SITE_URL, SECTIONS, fetchIndex, fetchDetail, search, pageUrl, cacheTime };
