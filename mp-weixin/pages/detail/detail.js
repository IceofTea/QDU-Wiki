// 文件路径: /qdu-wiki/mp-weixin/pages/detail/detail.js
const { fetchDetail } = require('../../utils/api.js');

Page({
  data: { title: '', segs: [], url: '', loading: true, empty: false },
  onShareAppMessage() {
    return { title: this.data.title || '青大百科词条', path: '/pages/index/index' };
  },
  onLoad(q) {
    const loc = decodeURIComponent(q.loc || '');
    const t = q.title ? decodeURIComponent(q.title) : '';
    if (t) wx.setNavigationBarTitle({ title: t });
    this._load(loc);
  },
  async _load(loc) {
    try {
      const d = await fetchDetail(loc);
      this.setData({
        title: d.title, segs: d.segs, url: d.url,
        loading: false, empty: !d.segs.length,
      });
      if (d.title) wx.setNavigationBarTitle({ title: d.title });
    } catch (e) {
      this.setData({ loading: false, empty: true });
    }
  },
  copy() {
    wx.setClipboardData({ data: this.data.url });
  },
});
