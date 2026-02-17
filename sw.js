// sw.js - Enhanced Service Worker untuk Study Companion
const CACHE_NAME = 'study-companion-v1.4.0';
const OFFLINE_QUEUE_KEY = 'offline-queue';
const PROGRESS_BACKUP_KEY = 'progress-backup';

// Assets yang akan di-cache - SESUAIKAN DENGAN STRUKTUR FOLDER ANDA
const ASSETS_TO_CACHE = [
  // HTML dan root
  '/',
  '/index.html',
  
  // Favicon dan icons
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/assets/images/favicon-32x32.png',
  '/assets/images/favicon-16x16.png',
  '/assets/images/icon-180x180.png',
  '/assets/images/icon-152x152.png',
  '/assets/images/icon-167x167.png',
  '/assets/images/icon-120x120.png',
  '/assets/images/mstile-150x150.png',
  
  // Gambar karakter
  '/assets/images/arona.png',
  '/assets/images/plana.png',
  '/assets/images/arona_yukata.jpg', // Tambahkan outfit baru
  
  // Achievement icons
  '/assets/images/achievements/first_steps1.png',
  '/assets/images/achievements/focus_master.png',
  '/assets/images/achievements/marathon_runner.png',
  '/assets/images/achievements/consistency_king.png',
  '/assets/images/achievements/early_bird.png',
  
  // File musik
  '/assets/music/lofi-study.mp3',
  '/assets/music/rainy-coding.mp3', 
  '/assets/music/coffee-vibes.mp3',
  
  // CDN dan fonts
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2'
];

// Domains yang boleh di-cache
const ALLOWED_CACHE_DOMAINS = [
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// Install Event - Cache assets dengan strategi yang lebih baik
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_NAME);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Caching app assets...');
        
        // Cache dengan prioritas: cache inti dulu, kemudian sisanya
        const coreAssets = [
          '/',
          '/index.html',
          '/assets/images/arona.png',
          '/assets/images/plana.png'
        ];
        const otherAssets = ASSETS_TO_CACHE.filter(asset => !coreAssets.includes(asset));
        
        // Cache core assets dulu
        await Promise.allSettled(
          coreAssets.map(url => 
            cache.add(url).catch(error => 
              console.warn(`[SW] Failed to cache core asset ${url}:`, error)
            )
          )
        );
        
        console.log('[SW] Core assets cached, caching remaining assets...');
        
        // Cache remaining assets
        await Promise.allSettled(
          otherAssets.map(url => 
            cache.add(url).catch(error => 
              console.warn(`[SW] Failed to cache asset ${url}:`, error)
            )
          )
        );
        
        console.log('[SW] All assets cached successfully');
        
        // Skip waiting untuk aktivasi cepat
        return self.skipWaiting();
      } catch (error) {
        console.error('[SW] Cache installation failed:', error);
        throw error;
      }
    })()
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        });
        
        await Promise.all(deletePromises);
        console.log('[SW] Old caches cleaned');
        
        // Klaim semua clients
        await self.clients.claim();
        console.log('[SW] Activated and claiming clients');
        
        // Sync offline queue jika ada
        await syncOfflineQueue();
        
        // Kirim notifikasi ke client bahwa SW aktif
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_NAME
          });
        });
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

// Enhanced Fetch Event dengan berbagai strategi
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip browser extensions
  if (url.protocol === 'chrome-extension:') return;
  
  // Skip analytics dan tracking
  if (url.hostname.includes('analytics') || 
      url.hostname.includes('google-analytics') ||
      url.pathname.includes('gtag')) {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.endsWith('.mp3') || 
      request.headers.get('accept')?.includes('audio')) {
    // Audio files - cache dengan fallback khusus
    event.respondWith(handleAudioRequest(request));
  } else if (request.destination === 'image' || 
             url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
    // Images - cache first, network fallback
    event.respondWith(handleImageRequest(request));
  } else if (request.destination === 'document' ||
             request.headers.get('accept')?.includes('text/html')) {
    // HTML - network first dengan cache fallback
    event.respondWith(handleHtmlRequest(request));
  } else if (ALLOWED_CACHE_DOMAINS.includes(url.hostname)) {
    // CDN resources - stale-while-revalidate
    event.respondWith(handleCdnRequest(request));
  } else {
    // Default: cache first dengan network fallback
    event.respondWith(handleDefaultRequest(request));
  }
});

// Strategy: Audio files
async function handleAudioRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Coba dari cache dulu
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Audio served from cache:', request.url);
      return cachedResponse;
    }
    
    // Coba dari network
    const networkResponse = await fetch(request);
    
    // Cache jika sukses
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      console.log('[SW] Audio cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Audio fetch failed, returning silent audio:', error);
    
    // Fallback: return silent audio
    return new Response('', {
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-SW-Fallback': 'silent-audio'
      }
    });
  }
}

// Strategy: Images
async function handleImageRequest(request) {
  const url = new URL(request.url);
  
  // Skip placeholder.com - jangan di-cache
  if (url.hostname.includes('placeholder.com')) {
    try {
      return await fetch(request);
    } catch (error) {
      // Return fallback image lokal
      return caches.match('/assets/images/arona.png');
    }
  }
  
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  // Jika tidak ada di cache, fetch dari network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Image fetch failed:', error);
    
    // Fallback untuk achievement icons
    if (request.url.includes('achievements/')) {
      const fallbackSvg = generateFallbackIcon(request.url);
      return new Response(fallbackSvg, {
        headers: { 'Content-Type': 'image/svg+xml' }
      });
    }
    
    // Fallback untuk character images
    if (request.url.includes('arona') || request.url.includes('plana')) {
      return caches.match('/assets/images/arona.png');
    }
    
    throw error;
  }
}

// Strategy: HTML - Network first
async function handleHtmlRequest(request) {
  try {
    // Coba network dulu
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    
    // Cache response yang sukses
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for HTML');
    
    // Fallback ke cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback ultimate: return offline page
    return caches.match('/')
      .then(response => response || createOfflinePage());
  }
}

// Strategy: CDN resources - Stale while revalidate
async function handleCdnRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Return cached version immediately
  if (cachedResponse) {
    // Update cache di background
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  // Jika tidak ada di cache, fetch dari network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] CDN fetch failed:', error);
    throw error;
  }
}

// Strategy: Default - Cache first
async function handleDefaultRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache jika sukses dan dari origin yang diizinkan
    if (networkResponse.ok) {
      const url = new URL(request.url);
      if (url.origin === self.location.origin || 
          ALLOWED_CACHE_DOMAINS.includes(url.hostname)) {
        await cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Fetch failed for:', request.url);
    
    // Untuk API requests, return error yang lebih spesifik
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({
        error: 'Network unavailable',
        offline: true,
        timestamp: Date.now()
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Background cache update
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      console.log('[SW] Cache updated in background:', request.url);
    }
  } catch (error) {
    // Silent fail untuk background update
    console.debug('[SW] Background update failed:', request.url);
  }
}

// Offline queue management
async function syncOfflineQueue() {
  try {
    const cache = await caches.open('offline-data');
    const queueResponse = await cache.match(OFFLINE_QUEUE_KEY);
    
    if (!queueResponse) return;
    
    const queue = await queueResponse.json();
    
    if (queue.length > 0) {
      console.log('[SW] Syncing', queue.length, 'offline items');
      
      // Kirim ke semua tabs bahwa sync sedang berjalan
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_STARTED',
          count: queue.length
        });
      });
      
      // Process queue
      const results = await Promise.allSettled(
        queue.map(item => processQueueItem(item))
      );
      
      // Hapus queue setelah berhasil
      await cache.delete(OFFLINE_QUEUE_KEY);
      
      // Kirim hasil sync
      const successful = results.filter(r => r.status === 'fulfilled').length;
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          successful,
          total: queue.length
        });
      });
      
      console.log('[SW] Offline queue synced:', successful, '/', queue.length);
    }
  } catch (error) {
    console.error('[SW] Offline queue sync failed:', error);
  }
}

async function processQueueItem(item) {
  // Implementasi sync data ke server
  try {
    const response = await fetch(item.url, {
      method: item.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return { success: true, item };
  } catch (error) {
    console.warn('[SW] Failed to sync item:', item, error);
    throw error;
  }
}

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgressData());
  } else if (event.tag === 'sync-achievements') {
    event.waitUntil(syncAchievements());
  }
});

async function syncProgressData() {
  try {
    const cache = await caches.open('offline-data');
    const progressKey = 'progress-backup';
    const progressResponse = await cache.match(progressKey);
    
    if (progressResponse) {
      const progress = await progressResponse.json();
      console.log('[SW] Found progress data to sync');
      
      // Kirim notifikasi ke client
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PROGRESS_BACKUP_FOUND',
          data: progress
        });
      });
    }
  } catch (error) {
    console.error('[SW] Progress sync failed:', error);
  }
}

async function syncAchievements() {
  try {
    const cache = await caches.open('offline-data');
    const achievementsResponse = await cache.match('achievements-backup');
    
    if (achievementsResponse) {
      console.log('[SW] Found achievements backup');
    }
  } catch (error) {
    console.error('[SW] Achievements sync failed:', error);
  }
}

// Periodic Sync (jika didukung)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-assets') {
    console.log('[SW] Periodic sync for assets');
    event.waitUntil(updateCachedAssets());
  }
});

async function updateCachedAssets() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const updateTime = Date.now();
    
    console.log('[SW] Updating cached assets...');
    
    // Update hanya file yang penting
    const assetsToUpdate = [
      '/assets/images/arona.png',
      '/assets/images/plana.png',
      '/assets/images/arona_yukata.jpg',
      '/index.html'
    ];
    
    const updatePromises = assetsToUpdate.map(async (url) => {
      try {
        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          await cache.put(url, response);
          console.log('[SW] Updated:', url);
          return { url, status: 'updated' };
        }
      } catch (error) {
        console.warn('[SW] Failed to update:', url, error);
        return { url, status: 'failed', error: error.message };
      }
    });
    
    const results = await Promise.allSettled(updatePromises);
    
    console.log('[SW] Asset update completed');
  } catch (error) {
    console.error('[SW] Asset update failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'Study Companion',
      body: event.data?.text() || 'New notification'
    };
  }
  
  const options = {
    body: data.body || 'Time to focus! Your study companion is waiting.',
    icon: '/assets/images/arona.png',
    badge: '/assets/images/badge.png',
    tag: data.tag || 'study-reminder',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'start-timer',
        title: 'Start Timer'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Study Companion', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      
      // Cari tab yang sudah terbuka
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          await client.focus();
          
          // Handle action jika ada
          if (event.action === 'start-timer') {
            client.postMessage({
              type: 'START_TIMER_FROM_NOTIFICATION'
            });
          }
          
          return;
        }
      }
      
      // Jika tidak ditemukan, buka tab baru
      if (self.clients.openWindow) {
        const newClient = await self.clients.openWindow(urlToOpen);
        
        // Kirim message setelah window terbuka
        setTimeout(() => {
          if (event.action === 'start-timer' && newClient) {
            newClient.postMessage({
              type: 'START_TIMER_FROM_NOTIFICATION'
            });
          }
        }, 1000);
      }
    })()
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Message handling dari main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_ASSET':
      cacheAsset(data.url);
      break;
      
    case 'GET_CACHE_INFO':
      sendCacheInfo(event);
      break;
      
    case 'QUEUE_OFFLINE_ACTION':
      queueOfflineAction(data);
      break;
      
    case 'CLEAR_CACHE':
      clearCache();
      break;
      
    case 'GET_SW_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_NAME });
      break;
      
    case 'BACKUP_PROGRESS':
      backupProgress(data);
      break;
  }
});

// Helper functions
async function cacheAsset(url) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response);
      console.log('[SW] Asset cached on demand:', url);
      return true;
    }
  } catch (error) {
    console.warn('[SW] Failed to cache asset:', url, error);
  }
  return false;
}

async function backupProgress(progress) {
  try {
    const cache = await caches.open('offline-data');
    await cache.put(
      PROGRESS_BACKUP_KEY,
      new Response(JSON.stringify({
        data: progress,
        timestamp: Date.now()
      }))
    );
    console.log('[SW] Progress backed up');
    return true;
  } catch (error) {
    console.error('[SW] Failed to backup progress:', error);
    return false;
  }
}

async function sendCacheInfo(event) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const cacheInfo = {
      name: CACHE_NAME,
      size: keys.length,
      urls: keys.map(req => req.url),
      timestamp: Date.now()
    };
    
    event.ports[0]?.postMessage(cacheInfo);
  } catch (error) {
    event.ports[0]?.postMessage({ error: error.message });
  }
}

async function queueOfflineAction(action) {
  try {
    const cache = await caches.open('offline-data');
    const queueResponse = await cache.match(OFFLINE_QUEUE_KEY);
    let queue = [];
    
    if (queueResponse) {
      queue = await queueResponse.json();
    }
    
    queue.push({
      ...action,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });
    
    await cache.put(
      OFFLINE_QUEUE_KEY,
      new Response(JSON.stringify(queue))
    );
    
    console.log('[SW] Action queued:', action.type);
    
    // Request background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register('sync-progress');
    }
    
    return true;
  } catch (error) {
    console.error('[SW] Failed to queue action:', error);
    return false;
  }
}

async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
    return true;
  } catch (error) {
    console.error('[SW] Failed to clear cache:', error);
    return false;
  }
}

function createOfflinePage() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Study Companion - Offline</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            color: #0c4a6e;
          }
          .container {
            text-align: center;
            max-width: 400px;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          p {
            margin-bottom: 2rem;
            line-height: 1.5;
          }
          .emoji {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          button {
            background: #38bdf8;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s;
          }
          button:hover {
            background: #0ea5e9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="emoji">📚</div>
          <h1>You're Offline</h1>
          <p>Study Companion is working offline. Your progress is saved locally.</p>
          <p>Basic timer functionality is available.</p>
          <button onclick="location.reload()">Retry Connection</button>
        </div>
      </body>
    </html>
  `;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
}

function generateFallbackIcon(url) {
  const colors = {
    'first_steps': '#38bdf8',
    'focus_master': '#10b981',
    'marathon_runner': '#f59e0b',
    'consistency_king': '#8b5cf6',
    'early_bird': '#ef4444'
  };
  
  const iconName = url.split('/').pop().replace('.png', '').split('_')[0];
  const color = colors[iconName] || '#94a3b8';
  
  return `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="12" fill="${color}" fill-opacity="0.2"/>
      <circle cx="32" cy="24" r="8" fill="${color}"/>
      <rect x="16" y="38" width="32" height="12" rx="6" fill="${color}"/>
    </svg>
  `;
}

// Export untuk testing (jika menggunakan module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CACHE_NAME,
    ASSETS_TO_CACHE,
    handleAudioRequest,
    handleImageRequest,
    handleHtmlRequest,
    handleCdnRequest,
    handleDefaultRequest
  };
}