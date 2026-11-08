// Keeps the app's files on the phone so it opens instantly (data always comes fresh from the API).
const CACHE = 'zryc-56ab9fabf4';
const FILES = ['./', 'index.html', 'app.js?v=56ab9fabf4', 'engine.js?v=56ab9fabf4', 'boot.js?v=56ab9fabf4', 'vendor/chart.umd.js', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-32.png', 'logos/afterpay.png', 'logos/ambank.png', 'logos/anz.png', 'logos/asb.png', 'logos/atome.png', 'logos/bankwest.png', 'logos/boost.png', 'logos/cimb.png', 'logos/commbank.png', 'logos/grab.png', 'logos/gxbank.png', 'logos/hlb.png', 'logos/ing.png', 'logos/kwsp.png', 'logos/macquarie.png', 'logos/maybank.png', 'logos/nab.png', 'logos/paypal.png', 'logos/pbb.png', 'logos/revolut.png', 'logos/rhb.png', 'logos/shopee.png', 'logos/stgeorge.png', 'logos/th.png', 'logos/tng.png', 'logos/up.png', 'logos/westpac.png', 'logos/wise.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // API calls go straight to the network
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then(r => r || fetch(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// ---- Phone notifications (Push.gs) ----
// The push itself is empty: on arrival, fetch this phone's messages from the API with its device
// token (saved in IndexedDB by boot.js) and show them. iOS requires a notification for every push.
const API = 'https://script.google.com/macros/s/AKfycbwCJHHo-c-g1w1cmaxhtk2mJoHPa9-KMviPK4LY1PrmuAXcLhm5J0kNenylmUy0bi5TTg/exec';

function deviceToken() {
  return new Promise(resolve => {
    try {
      const open = indexedDB.open('zryc', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('kv');
      open.onsuccess = () => {
        const get = open.result.transaction('kv').objectStore('kv').get('token');
        get.onsuccess = () => resolve(get.result || '');
        get.onerror = () => resolve('');
      };
      open.onerror = () => resolve('');
    } catch (err) {
      resolve('');
    }
  });
}

const FALLBACK = { title: 'ZR & YC Finance', body: 'You have a reminder. Tap to open the app.', url: './' };

self.addEventListener('push', e => {
  e.waitUntil(deviceToken()
    .then(token => (token ? fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ token, fn: 'pushInbox', args: [] }) })
      .then(res => res.json()).then(body => (body.ok ? body.result.messages : [])) : []))
    .catch(() => [])
    .then(list => (list.length ? list : [FALLBACK]))
    .then(list => Promise.all(list.map(m => self.registration.showNotification(m.title, {
      body: m.body, tag: m.tag || undefined, data: { url: m.url || './' }, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
    })).concat(self.clients.matchAll({ type: 'window' }).then(open => open.forEach(c => c.postMessage({ type: 'check' })))))));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list[0];
    if (open) {
      open.postMessage({ type: 'open', url });
      return open.focus();
    }
    return self.clients.openWindow(url);
  }));
});
