const CACHE_VERSION = 'zamar-v5-20250820';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const SUPABASE_CACHE = `supabase-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/lovable-uploads/78355eae-a8bc-4167-9f39-fec08c253f60.png',
  '/lovable-uploads/78355eae-a8bc-4167-9f39-fec08c253f60.png',
  OFFLINE_URL,
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (![STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE, SUPABASE_CACHE].includes(key)) {
          return caches.delete(key);
        }
      })
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Pass-through range requests (media streaming)
  if (request.headers.get('range')) return;

  const isNavigation = request.mode === 'navigate';
  const isSameOrigin = url.origin === self.location.origin;
  const isStaticAsset = isSameOrigin && /\.(?:css|js|woff2?|ttf|eot)$/.test(url.pathname);
  const isImage = /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname);
  const isSupabaseStorage = url.hostname.endsWith('supabase.co') && url.pathname.includes('/storage/v1/object/public/');
  const isSupabaseApi = (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) && !isSupabaseStorage;

  // Network-first for HTML navigations to always get latest version
  if (isNavigation) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE, true));
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts) with long cache time
  if (isStaticAsset) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Cache-first for images (local and Supabase storage) with long cache time
  if (isImage || isSupabaseStorage) {
    const cacheToUse = isSupabaseStorage ? SUPABASE_CACHE : IMAGE_CACHE;
    event.respondWith(cacheFirst(request, cacheToUse));
    return;
  }

  // Bypass caching for Supabase API and Realtime to prevent stale data
  if (isSupabaseApi) {
    event.respondWith(fetch(request));
    return;
  }

  // Default: stale-while-revalidate for other resources
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  return cached || (await networkPromise) || fetch(request).catch(async () => {
    if (request.destination === 'document') {
      return (await caches.match(OFFLINE_URL)) || new Response('Offline', { status: 503 });
    }
  });
}

async function networkFirst(request, cacheName, isDocument = false) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (isDocument) {
      return (await caches.match(OFFLINE_URL)) || new Response('Offline', { status: 503 });
    }
    throw _;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // If network fails and we have no cached version, return offline fallback
    if (request.destination === 'document') {
      return (await caches.match(OFFLINE_URL)) || new Response('Offline', { status: 503 });
    }
    throw error;
  }
}
