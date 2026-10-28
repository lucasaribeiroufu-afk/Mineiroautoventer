self.addEventListener('push', event => {
  let message = {};
  try { message = event.data ? event.data.json() : {}; } catch {}
  const safeUrl = message.url === '/#admin' ? '/#admin' : '/#meus-agendamentos';
  event.waitUntil(self.registration.showNotification(message.title || 'Mineiro Auto Center', {
    body: message.body || 'Há uma atualização no seu atendimento.',
    icon: '/icons/app-192.png', badge: '/icons/app-192.png',
    tag: message.tag || 'mineiro-update', data: { url: safeUrl },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/#meus-agendamentos', self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async windows => {
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) { await client.navigate(url); return client.focus(); }
    }
    return clients.openWindow(url);
  }));
});
// No caching of appointments, access tokens, API responses or administrative sessions.
