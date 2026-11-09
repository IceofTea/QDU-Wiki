// 文件路径: /qdu-wiki/mp-weixin/app.js
App({
  onLaunch() {
    const { fetchIndex } = require('./utils/api.js');
    fetchIndex().catch(() => {});
  },
});
