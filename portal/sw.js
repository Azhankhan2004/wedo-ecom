/* WeDo Ecom Client Portal: service worker
   Caches the portal's own files so it opens fast and installs as an app.
   API calls (/api/...) are never cached: client data always comes fresh. */
const CACHE = "wedo-portal-v1";
const SHELL = ["/portal/", "/portal/login.html", "/portal/admin.html", "/portal/portal.css", "/portal/portal.js", "/portal/client.js", "/portal/admin.js", "/portal/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !url.pathname.startsWith("/portal/")) return;
  // Network first, so updates show right away; fall back to the cache when offline.
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
