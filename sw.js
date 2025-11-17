// // sw.js - Service Worker untuk Offline Functionality
// const CACHE_NAME = 'study-companion-v1.3.0';
// const ASSETS_TO_CACHE = [
//   '/',
//   '/index.html',
//   '/assets/images/arona.png',
//   '/assets/images/plana.png',
//   '/assets/music/lofi-study.mp3',
//   '/assets/music/rainy-coding.mp3', 
//   '/assets/music/coffee-vibes.mp3',
//   'https://cdn.tailwindcss.com',
//   'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap',
//   'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2'
// ];

// // Install Event - Cache assets
// self.addEventListener('install', (event) => {
//   console.log('Service Worker installing...');
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then((cache) => {
//         console.log('Caching app assets');
//         // Cache critical assets, ignore failures for non-critical ones
//         return Promise.allSettled(
//           ASSETS_TO_CACHE.map(url => {
//             return cache.add(url).catch(error => {
//               console.warn(`Failed to cache: ${url}`, error);
//               return Promise.resolve();
//             });
//           })
//         );
//       })
//       .then(() => {
//         console.log('All assets cached successfully');
//         return self.skipWaiting();
//       })
//       .catch((error) => {
//         console.error('Cache installation failed:', error);
//       })
//   );
// });

// // Activate Event - Clean up old caches
// self.addEventListener('activate', (event) => {
//   console.log('Service Worker activating...');
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cacheName) => {
//           if (cacheName !== CACHE_NAME) {
//             console.log('Deleting old cache:', cacheName);
//             return caches.delete(cacheName);
//           }
//         })
//       );
//     })
//     .then(() => {
//       console.log('Service Worker activated');
//       return self.clients.claim();
//     })
//   );
// });

// // Fetch Event - Serve from cache when offline
// self.addEventListener('fetch', (event) => {
//   // Skip non-GET requests and external resources that don't need caching
//   if (event.request.method !== 'GET' || 
//       event.request.url.startsWith('chrome-extension') ||
//       event.request.url.includes('extension') ||
//       event.request.url.includes('analytics')) {
//     return;
//   }

//   event.respondWith(
//     caches.match(event.request)
//       .then((response) => {
//         // Return cached version if available
//         if (response) {
//           console.log('Serving from cache:', event.request.url);
//           return response;
//         }

//         // Otherwise fetch from network
//         return fetch(event.request)
//           .then((fetchResponse) => {
//             // Check if we received a valid response
//             if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
//               return fetchResponse;
//             }

//             // Clone the response
//             const responseToCache = fetchResponse.clone();

//             // Cache successful requests
//             caches.open(CACHE_NAME)
//               .then((cache) => {
//                 // Only cache same-origin resources and important CDNs
//                 const url = new URL(event.request.url);
//                 const shouldCache = 
//                   url.origin === self.location.origin ||
//                   url.hostname === 'cdn.tailwindcss.com' ||
//                   url.hostname === 'fonts.googleapis.com' ||
//                   url.hostname === 'fonts.gstatic.com';
                
//                 if (shouldCache) {
//                   cache.put(event.request, responseToCache);
//                   console.log('Cached new resource:', event.request.url);
//                 }
//               })
//               .catch(error => {
//                 console.warn('Cache put failed:', error);
//               });

//             return fetchResponse;
//           })
//           .catch((error) => {
//             console.log('Fetch failed; returning offline page:', error);
            
//             // If request is for HTML, return the cached homepage
//             if (event.request.destination === 'document' || 
//                 event.request.headers.get('accept').includes('text/html')) {
//               return caches.match('/')
//                 .then(response => response || new Response('Offline - Study Companion'));
//             }
            
//             // For other requests, you could return a fallback
//             return new Response('Network error', {
//               status: 408,
//               statusText: 'Network error'
//             });
//           });
//       })
//   );
// });

// // Background Sync for data persistence
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'background-sync') {
//     console.log('Background sync triggered');
//     event.waitUntil(doBackgroundSync());
//   }
// });

// // Periodic Sync for updates (requires permission)
// self.addEventListener('periodicsync', (event) => {
//   if (event.tag === 'content-update') {
//     console.log('Periodic sync for content updates');
//     event.waitUntil(updateContent());
//   }
// });

// async function doBackgroundSync() {
//   // Sync any pending data when back online
//   console.log('Performing background sync...');
  
//   // Example: Sync any pending progress data
//   try {
//     const cache = await caches.open(CACHE_NAME);
//     // Perform any background sync operations here
//     console.log('Background sync completed');
//   } catch (error) {
//     console.error('Background sync failed:', error);
//   }
// }

// async function updateContent() {
//   // Update cached content periodically
//   console.log('Updating cached content...');
  
//   try {
//     const cache = await caches.open(CACHE_NAME);
    
//     // Update critical assets
//     const updatePromises = ASSETS_TO_CACHE.map(url => {
//       return fetch(url, { cache: 'reload' })
//         .then(response => {
//           if (response.status === 200) {
//             return cache.put(url, response);
//           }
//         })
//         .catch(error => {
//           console.warn(`Failed to update: ${url}`, error);
//         });
//     });
    
//     await Promise.allSettled(updatePromises);
//     console.log('Content update completed');
//   } catch (error) {
//     console.error('Content update failed:', error);
//   }
// }

// // Push notifications (optional)
// self.addEventListener('push', (event) => {
//   if (!event.data) return;
  
//   const data = event.data.json();
//   const options = {
//     body: data.body || 'Study Companion Notification',
//     icon: '/assets/images/arona.png',
//     badge: '/assets/images/badge.png',
//     tag: data.tag || 'study-companion',
//     requireInteraction: true,
//     actions: [
//       {
//         action: 'focus',
//         title: 'Start Focusing'
//       },
//       {
//         action: 'dismiss', 
//         title: 'Dismiss'
//       }
//     ]
//   };
  
//   event.waitUntil(
//     self.registration.showNotification(data.title || 'Study Companion', options)
//   );
// });

// self.addEventListener('notificationclick', (event) => {
//   event.notification.close();
  
//   if (event.action === 'focus') {
//     event.waitUntil(
//       clients.matchAll({type: 'window'})
//         .then((clientList) => {
//           for (const client of clientList) {
//             if (client.url.includes(self.location.origin) && 'focus' in client) {
//               return client.focus();
//             }
//           }
//           if (clients.openWindow) {
//             return clients.openWindow('/');
//           }
//         })
//     );
//   }
// });

// // Handle messages from the main thread
// self.addEventListener('message', (event) => {
//   if (event.data && event.data.type === 'SKIP_WAITING') {
//     self.skipWaiting();
//   }
// });