// 文件路径: /qdu-wiki/mp-weixin/pages/detail/detail.js
const { pageUrl } = require('../../utils/api.js');

Page({
  data: { url: '', showFallback: false },
  onShareAppMessage() { return { title: '青大百科词条', path: '/pages/index/index' }; },
  onLoad(q) {
    const loc = decodeURIComponent(q.loc || '');
    this.setData({ url: pageUrl(loc) });
    if (q.title) wx.setNavigationBarTitle({ title: decodeURIComponent(q.title) });
  },
  copy() {
    wx.setClipboardData({ data: this.data.url });
  },
});
