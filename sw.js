// ── Incrémente ce numéro à chaque mise à jour de l'appli ──
const VERSION = '2026-05-31-v2';
const CACHE = 'factures-' + VERSION;

const FILES = [
  '/facturation-app/',
  '/facturation-app/index.html',
  '/facturation-app/manifest.json'
];

// INSTALLATION — mise en cache des fichiers essentiels
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES).catch(() => {}))
      .then(() => self.skipWaiting()) // Active immédiatement sans attendre
  );
});

// ACTIVATION — supprime les anciens caches automatiquement
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE)
          .map(k => {
            console.log('[SW] Suppression ancien cache :', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim()) // Prend le contrôle immédiatement
  );
});

// FETCH — réseau en priorité, cache en fallback
self.addEventListener('fetch', e => {
  // Ne pas intercepter les appels API GitHub
  if (e.request.url.includes('api.github.com')) return;
  if (e.request.url.includes('fonts.googleapis.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Mettre en cache la nouvelle version
        if (resp && resp.status === 200 && resp.type !== 'opaque') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => {
        // Hors ligne → utiliser le cache
        return caches.match(e.request)
          .then(cached => cached || caches.match('/facturation-app/index.html'));
      })
  );
});

// MESSAGE — permet de forcer la mise à jour depuis l'appli
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
