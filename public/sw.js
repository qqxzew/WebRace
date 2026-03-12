// Jídelna Plus — Service Worker
// Handles notification click → opens the orders page

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/orders'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an already open tab
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        // No open tab found — open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Jídelna Plus', {
      body: data.body,
      tag: data.tag || 'jidalnaplus',
      data: { url: data.url || '/orders' },
      vibrate: [200, 100, 200],
      requireInteraction: true,
    })
  )
})
