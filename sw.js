/* 매일매일 이얼영어 - 서비스워커
   앱 껍데기(index.html, 아이콘)를 캐시해 두 번째 방문부터 즉시 로딩.
   단어/진도 데이터는 Supabase(네트워크)에서 항상 최신으로 가져옴. */
const CACHE = 'iyeol-voca-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // 저장(POST 등)은 항상 네트워크
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // Supabase·폰트 등 외부는 캐시 안 함(항상 최신)

  // 앱 문서: 네트워크 우선(새 버전 반영), 실패 시 캐시(오프라인)
  if (req.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(req).then(res => {
        caches.open(CACHE).then(c => c.put('./index.html', res.clone()));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 그 외 동일 출처 정적 파일(아이콘 등): 캐시 우선
  e.respondWith(caches.match(req).then(c => c || fetch(req)));
});
