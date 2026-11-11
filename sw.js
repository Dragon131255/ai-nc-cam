// AI NC CAM Service Worker: 自サイトの静的ファイルのみキャッシュ。図面データ・API通信はキャッシュしない。
const CACHE = "ai-nc-cam-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    // 同じドメインに他のアプリ（GitHub Pages の別リポジトリ等）があるため、自分の古いキャッシュだけ消す
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("ai-nc-cam-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return; // 外部(API)は対象外
  // ネットワーク優先 → 失敗時キャッシュ（オフライン対応）
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match(self.registration.scope))),
  );
});
