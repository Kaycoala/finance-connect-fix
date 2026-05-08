const CACHE_NAME = 'gestor-financas-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Apenas interceptar requisições de navegação para SPA
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    )
    return
  }
  // Para outros recursos, tenta rede primeiro
  event.respondWith(fetch(event.request))
})
