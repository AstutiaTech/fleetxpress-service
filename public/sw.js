const CACHE_NAME = "3f-logistics-cache-v1"
const urlsToCache = ["/", "/styles/main.css", "/script/main.js", "/images/icon-512x512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)))
})

