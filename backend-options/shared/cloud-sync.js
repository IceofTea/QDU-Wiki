// 文件路径: /fjnu-nav/backend-options/shared/cloud-sync.js
// Web / uni-app 通用云端同步适配器（ESM，零依赖 fetch）。
// 所有后端统一抽象为「按 key 读写 JSON 文档」。未 configure() 前全部返回 null，默认关闭。

let CFG = null;

export function configure(cfg) {
  // cfg: { type:'github'|'cfkv'|'leancloud'|'pocketbase', base, token, repo, branch, path, appId, appKey, collection }
  CFG = cfg || null;
}
export function enabled() { return !!CFG; }

async function req(url, opt = {}, timeout = 15000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { ...opt, signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r;
  } finally { clearTimeout(t); }
}
const jreq = async (url, opt) => (await req(url, opt)).json();
const b64 = s => btoa(unescape(encodeURIComponent(s)));
const ub64 = s => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));

/* ---------------- GitHub 仓内 JSON 文件 ----------------
   读走 jsDelivr/raw（公开免凭据）；写走 Contents API（需 token）。
   cfg: { type:'github', repo:'IceofTea/FJNU-Nav', branch:'main', dir:'data/dynamic', token? } */
const ghPath = key => `${CFG.dir || 'data/dynamic'}/${key}.json`;
async function ghPull(key) {
  const p = ghPath(key);
  for (const u of [
    `https://cdn.jsdelivr.net/gh/${CFG.repo}@${CFG.branch || 'main'}/${p}`,
    `https://raw.githubusercontent.com/${CFG.repo}/${CFG.branch || 'main'}/${p}`,
  ]) {
    try { return { data: await jreq(u + '?t=' + Date.now()), rev: '' }; } catch (e) { /* 下一源 */ }
  }
  return null;
}
async function ghPush(key, data) {
  if (!CFG.token) throw new Error('缺少写 token');
  const api = `https://api.github.com/repos/${CFG.repo}/contents/${ghPath(key)}`;
  let sha;
  try { sha = (await jreq(api, { headers: ghH() })).sha; } catch (e) { /* 新建 */ }
  const body = { message: `chore(data): update ${key}.json`, content: b64(JSON.stringify(data, null, 2)) };
  if (sha) body.sha = sha;
  await req(api, { method: 'PUT', headers: ghH(), body: JSON.stringify(body) });
  return true;
}
const ghH = () => ({ Authorization: `Bearer ${CFG.token}`, Accept: 'application/vnd.github+json' });

/* ---------------- Cloudflare Workers + KV ----------------
   cfg: { type:'cfkv', base:'https://xxx.workers.dev', token? }（token 走 X-Write-Token） */
async function cfPull(key) {
  try { return { data: await jreq(`${CFG.base}/doc/${key}?t=` + Date.now()), rev: '' }; }
  catch (e) { return null; }
}
async function cfPush(key, data) {
  await req(`${CFG.base}/doc/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Write-Token': CFG.token || '' },
    body: JSON.stringify(data),
  });
  return true;
}

/* ---------------- LeanCloud ----------------
   cfg: { type:'leancloud', base:'https://xxx.lc-cn-n1-shared.com', appId, appKey, class:'DynDoc' } */
const lcH = () => ({
  'X-LC-Id': CFG.appId, 'X-LC-Key': CFG.appKey, 'Content-Type': 'application/json',
});
async function lcPull(key) {
  const cls = CFG.class || 'DynDoc';
  const r = await jreq(`${CFG.base}/1.1/classes/${cls}?where=${encodeURIComponent(JSON.stringify({ key }))}&limit=1`, { headers: lcH() });
  const o = r.results && r.results[0];
  return o ? { data: o.data, rev: o.objectId } : null;
}
async function lcPush(key, data) {
  const cls = CFG.class || 'DynDoc';
  const exist = await lcPull(key);
  const url = `${CFG.base}/1.1/classes/${cls}${exist ? '/' + exist.rev : ''}`;
  await req(url, { method: exist ? 'PUT' : 'POST', headers: lcH(), body: JSON.stringify({ key, data }) });
  return true;
}

/* ---------------- PocketBase ----------------
   cfg: { type:'pocketbase', base:'https://pb.example.com', collection:'dyn_docs', token? } */
const pbH = () => ({ 'Content-Type': 'application/json', ...(CFG.token ? { Authorization: 'Bearer ' + CFG.token } : {}) });
async function pbPull(key) {
  const c = CFG.collection || 'dyn_docs';
  try {
    const r = await jreq(`${CFG.base}/api/collections/${c}/records?filter=${encodeURIComponent(`key="${key}"`)}&perPage=1`, { headers: pbH() });
    const o = r.items && r.items[0];
    return o ? { data: o.data, rev: o.id } : null;
  } catch (e) { return null; }
}
async function pbPush(key, data) {
  const c = CFG.collection || 'dyn_docs';
  const exist = await pbPull(key);
  const url = `${CFG.base}/api/collections/${c}/records${exist ? '/' + exist.rev : ''}`;
  await req(url, { method: exist ? 'PATCH' : 'POST', headers: pbH(), body: JSON.stringify({ key, data }) });
  return true;
}

const IMPL = {
  github: { pull: ghPull, push: ghPush },
  cfkv: { pull: cfPull, push: cfPush },
  leancloud: { pull: lcPull, push: lcPush },
  pocketbase: { pull: pbPull, push: pbPush },
};

export async function pull(key) {
  const impl = CFG && IMPL[CFG.type];
  return impl ? impl.pull(key) : null;
}
export async function push(key, data) {
  const impl = CFG && IMPL[CFG.type];
  if (!impl) throw new Error('Cloud sync 未配置');
  return impl.push(key, data);
}
