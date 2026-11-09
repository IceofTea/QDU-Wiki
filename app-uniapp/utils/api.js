// 文件路径: /qdu-wiki/app-uniapp/utils/api.js
// 词条索引：复用网站 search/search_index.json（mkdocs 生成的全站索引），多源容错
import { ref } from 'vue';

export const SITE_URL = 'https://iceoftea.github.io/QDU-Wiki';
const INDEX_URLS = [
  `${SITE_URL}/search/search_index.json`,
  'https://cdn.jsdelivr.net/gh/IceofTea/QDU-Wiki@main/site/search/search_index.json',
  'https://raw.githubusercontent.com/IceofTea/QDU-Wiki/main/site/search/search_index.json',
];
const CACHE_KEY = 'qdu_wiki_index_v1';
const CACHE_T = 'qdu_wiki_index_time';

export const indexData = ref(null);   // {pages:[{loc,title,text,section}]}
export const indexSource = ref('');

export const SECTIONS = {
  new: '新生指南', study: '学习资料', live: '校园生活', college: '学院专业',
  service: '办事服务', organization: '组织社团', words: '黑话词典',
  friends: '友情链接', share: '分享交流', about: '关于本站', en: 'English',
};

function req(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    uni.request({
      url, timeout, method: 'GET',
      success: r => (r.statusCode === 200 && r.data ? resolve(r.data) : reject(new Error('HTTP ' + r.statusCode))),
      fail: reject,
    });
  });
}

/** search_index docs[] → 页面级去重（去掉 #anchor 子条目），带 section 归类 */
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

export async function fetchIndex(force = false) {
  if (indexData.value && !force) return indexData.value;
  if (!indexData.value) {
    const cached = uni.getStorageSync(CACHE_KEY);
    if (cached) { indexData.value = cached; indexSource.value = 'cache'; }
  }
  for (const url of INDEX_URLS) {
    try {
      const j = await req(url + '?t=' + Date.now());
      const norm = normalize(j);
      if (norm.pages.length) {
        indexData.value = norm;
        indexSource.value = 'live';
        uni.setStorageSync(CACHE_KEY, norm);
        uni.setStorageSync(CACHE_T, Date.now());
        return norm;
      }
    } catch (e) { /* 下一源 */ }
  }
  return indexData.value;
}

export function preloadIndex() { fetchIndex().catch(() => {}); }

/** 关键词搜索（标题+正文片段），返回前 50 条 */
export function search(kw) {
  kw = (kw || '').trim().toLowerCase();
  if (!kw || !indexData.value) return [];
  return indexData.value.pages
    .filter(p => p.title.toLowerCase().includes(kw) || p.text.toLowerCase().includes(kw))
    .slice(0, 50);
}

export function pageUrl(loc) { return SITE_URL + '/' + loc; }

export function cacheTime() {
  const t = uni.getStorageSync(CACHE_T);
  if (!t) return '';
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
