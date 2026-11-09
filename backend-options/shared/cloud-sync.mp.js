// 文件路径: /fjnu-nav/backend-options/shared/cloud-sync.mp.js
// 微信小程序专用云端同步适配器（CJS，wx.request）。
// ⚠️ 小程序包可被反编译——只放只读 endpoint；写 token 绝不进小程序代码。

let CFG = null;

function configure(cfg) { CFG = cfg || null; }
function enabled() { return !!CFG; }

function req(url, opt = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url, timeout: 15000, method: opt.method || 'GET',
      data: opt.data, header: opt.header,
      success: r => (r.statusCode >= 200 && r.statusCode < 300 ? resolve(r.data) : reject(new Error('HTTP ' + r.statusCode))),
      fail: reject,
    });
  });
}

/* GitHub 仓内 JSON（只读，走 jsDelivr——request 域名加 cdn.jsdelivr.net） */
async function ghPull(key) {
  const p = `${CFG.dir || 'data/dynamic'}/${key}.json`;
  for (const u of [
    `https://cdn.jsdelivr.net/gh/${CFG.repo}@${CFG.branch || 'main'}/${p}`,
    `https://raw.githubusercontent.com/${CFG.repo}/${CFG.branch || 'main'}/${p}`,
  ]) {
    try { return { data: await req(u + '?t=' + Date.now()), rev: '' }; } catch (e) { /* 下一源 */ }
  }
  return null;
}

/* Cloudflare Workers + KV（request 域名加 workers.dev 子域或自定义域） */
async function cfPull(key) {
  try { return { data: await req(`${CFG.base}/doc/${key}?t=` + Date.now()), rev: '' }; }
  catch (e) { return null; }
}
async function cfPush(key, data) {
  return req(`${CFG.base}/doc/${key}`, {
    method: 'PUT',
    header: { 'Content-Type': 'application/json', 'X-Write-Token': CFG.token || '' },
    data,
  });
}

/* LeanCloud */
const lcH = () => ({ 'X-LC-Id': CFG.appId, 'X-LC-Key': CFG.appKey, 'Content-Type': 'application/json' });
async function lcPull(key) {
  const cls = CFG.class || 'DynDoc';
  const r = await req(`${CFG.base}/1.1/classes/${cls}?where=${encodeURIComponent(JSON.stringify({ key }))}&limit=1`, { header: lcH() });
  const o = r.results && r.results[0];
  return o ? { data: o.data, rev: o.objectId } : null;
}
async function lcPush(key, data) {
  const cls = CFG.class || 'DynDoc';
  const exist = await lcPull(key);
  return req(`${CFG.base}/1.1/classes/${cls}${exist ? '/' + exist.rev : ''}`, {
    method: exist ? 'PUT' : 'POST', header: lcH(), data: { key, data },
  });
}

/* PocketBase */
const pbH = () => ({ 'Content-Type': 'application/json', ...(CFG.token ? { Authorization: 'Bearer ' + CFG.token } : {}) });
async function pbPull(key) {
  const c = CFG.collection || 'dyn_docs';
  try {
    const r = await req(`${CFG.base}/api/collections/${c}/records?filter=${encodeURIComponent(`key="${key}"`)}&perPage=1`, { header: pbH() });
    const o = r.items && r.items[0];
    return o ? { data: o.data, rev: o.id } : null;
  } catch (e) { return null; }
}
async function pbPush(key, data) {
  const c = CFG.collection || 'dyn_docs';
  const exist = await pbPull(key);
  return req(`${CFG.base}/api/collections/${c}/records${exist ? '/' + exist.rev : ''}`, {
    method: exist ? 'PATCH' : 'POST', header: pbH(), data: { key, data },
  });
}

const IMPL = {
  github: { pull: ghPull, push: null },          // 小程序侧 GitHub 只读
  cfkv: { pull: cfPull, push: cfPush },
  leancloud: { pull: lcPull, push: lcPush },
  pocketbase: { pull: pbPull, push: pbPush },
};

async function pull(key) {
  const impl = CFG && IMPL[CFG.type];
  return impl ? impl.pull(key) : null;
}
async function push(key, data) {
  const impl = CFG && IMPL[CFG.type];
  if (!impl || !impl.push) throw new Error('该端不支持写操作或 Cloud sync 未配置');
  return impl.push(key, data);
}

module.exports = { configure, enabled, pull, push };
