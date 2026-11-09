// 文件路径: /qdu-wiki/mp-weixin/pages/index/index.js
const { fetchIndex, search, SECTIONS } = require('../../utils/api.js');

const ORDER = ['new', 'study', 'live', 'college', 'service', 'organization', 'words', 'share', 'friends', 'about', 'en'];

Page({
  data: {
    kw: '', searched: false, results: [],
    sections: [], collapsed: { en: true, friends: true, share: true },
    loading: true, total: 0,
  },
  onShow() { this.load(); },
  async load(force) {
    this.setData({ loading: true });
    const { data } = await fetchIndex(force);
    this.setData({ loading: false });
    if (!data) return;
    const bySec = {};
    data.pages.forEach(p => { (bySec[p.section] = bySec[p.section] || []).push(p); });
    const sections = ORDER.filter(k => bySec[k] && bySec[k].length)
      .map(k => ({ key: k, name: SECTIONS[k] || k, pages: bySec[k] }));
    this.setData({ sections, total: data.pages.length });
  },
  onKw(e) { this.setData({ kw: e.detail.value }); },
  doSearch() {
    this.setData({ searched: true, results: search(this.data.kw) });
  },
  clearSearch() { this.setData({ kw: '', searched: false, results: [] }); },
  toggle(e) {
    const k = e.currentTarget.dataset.k;
    this.setData({ [`collapsed.${k}`]: !this.data.collapsed[k] });
  },
  open(e) {
    const p = e.currentTarget.dataset.p;
    wx.navigateTo({ url: '/pages/detail/detail?loc=' + encodeURIComponent(p.loc) + '&title=' + encodeURIComponent(p.title) });
  },
});
