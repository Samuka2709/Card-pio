/* Service worker: rede primeiro (preços sempre atualizados), cópia salva quando estiver sem internet. */
const CACHE = "cardapio-v15";
const BASE = ["./", "index.html", "css/estilo.css?v=15", "js/config.js?v=15", "js/pix.js?v=15", "js/app.js?v=15", "img/logo-exemplo.svg", "img/icone-192.png", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const mesmoSite = url.origin === location.origin;
  const imagem = req.destination === "image";
  if (!mesmoSite && !imagem && !url.hostname.endsWith("fonts.googleapis.com") && !url.hostname.endsWith("fonts.gstatic.com") && !url.hostname.endsWith("cdnjs.cloudflare.com")) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok || res.type === "opaque") {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia));
      }
      return res;
    }).catch(() => caches.match(req).then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : undefined)))
  );
});
