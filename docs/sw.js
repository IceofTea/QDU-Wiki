// Wiki Service Worker（离线包）：静态资源缓存优先，HTML 网络优先回退缓存
// 版本号变更即整体更新（发版时改 CACHE 值）。
var CACHE = 'qdu-wiki-v1';
var CORE = ['manifest.webmanifest', 'assets/kb.json', 'assets/graph.json'];

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
  if (/\.(js|css|png|jpg|ico|json|webmanifest)$/.test(url.pathname)) {
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
