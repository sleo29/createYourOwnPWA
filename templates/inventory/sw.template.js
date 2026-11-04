const CACHE_NAME = "inventory-app-shell-v1";
const APP_SHELL = [
  "/index.html",
  "/products.html",
  "/categories.html",
  "/stock.html",
  "/reports.html",
  "/settings.html",
  "/manifest.json",
  "/assets/css/style.css",
  "/assets/js/app.js",
  "/assets/js/data.js",
  "/assets/js/dashboard.js",
  "/assets/js/products.js",
  "/assets/js/categories.js",
  "/assets/js/stock.js",
  "/assets/js/reports.js",
  "/assets/js/settings.js",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg"
];
const CACHE_PREFIX = "inventory-app-shell-";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (response.ok && APP_SHELL.includes(url.pathname)) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
        }
        return response;
      });
    })
  );
});
