// Minimal service worker to make the app installable and ready for offline strategies.
// You can enhance caching later (e.g., Workbox or vite-plugin-pwa).

self.addEventListener('install', (event) => {
  // Activate immediately after installation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of open pages right away
  self.clients.claim();
});

// Presence of a fetch handler is one of the installability criteria on some browsers.
self.addEventListener('fetch', (event) => {
  // Default to network; you can implement caching here later if needed.
  // event.respondWith(fetch(event.request)); // pass-through
});
