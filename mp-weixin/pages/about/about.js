// 文件路径: /qdu-wiki/mp-weixin/pages/about/about.js
const { fetchIndex, cacheTime, SITE_URL } = require('../../utils/api.js');

Page({
  data: { refreshText: '点击同步' },
  onShow() {
    const t = cacheTime();
    if (t) this.setData({ refreshText: `上次 ${t}` });
  },
  async refresh() {
    this.setData({ refreshText: '同步中…' });
    const { data } = await fetchIndex(true);
    this.setData({ refreshText: data ? `已更新 ${cacheTime()}（${data.pages.length} 词条）` : '同步失败' });
  },
  copySite() { wx.setClipboardData({ data: SITE_URL }); },
});
