// 세무자료 도우미 Service Worker
const CACHE = 'tax-v20260524-v1';
const CORE = [
  './',
  './index.html',
  './main.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  console.log('[SW] install', CACHE);
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE).catch(err => console.warn('[SW] addAll 일부 실패:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  console.log('[SW] activate', CACHE);
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Firebase, Google API는 캐시 안 함
  if(url.hostname.includes('firebase') || 
     url.hostname.includes('google') ||
     url.hostname.includes('gstatic')){
    return; // 기본 동작 (네트워크)
  }
  // 같은 출처만 캐시 (network-first)
  if(url.origin === location.origin){
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // 성공 시 캐시 업데이트
          if(res.ok){
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
