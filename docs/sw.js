// Wiki Service Worker（离线包）：静态资源缓存优先，HTML/数据 JSON 网络优先回退缓存
// 版本号变更即整体更新（发版时改 CACHE 值）。
// v2：CORE 只留壳（manifest）——kb.json/graph.json 是每次构建都变的数据，
//     走网络优先（下方 isData 分支），杜绝预缓存旧 kb 直达 404/旧数据。
var CACHE = 'qdu-wiki-v2';
var CORE = ['manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE.map(function (u) { return new URL(u, self.registration.scope).href; })).catch(function () {}); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  var isData = /\/assets\/(kb|graph)\.json$/.test(url.pathname);
  if (isData) {
    // 数据 JSON：网络优先，断网回退缓存（内容每次构建都变，不能缓存优先）
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
  } else if (/\.(js|css|png|jpg|ico|webmanifest)$/.test(url.pathname)) {
    // 静态资源：缓存优先，后台更新
    e.respondWith(
      caches.match(e.request).then(function (hit) {
        var net = fetch(e.request).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          }
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      })
    );
  } else {
    // 页面 HTML：网络优先，断网回退缓存
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
  }
});
