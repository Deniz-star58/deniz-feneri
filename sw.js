// Arka planda çalışan bildirim merkezi (Service Worker)
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : { title: "Hava Durumu Asistanı", body: "Yeni hava durumu raporu hazır!" };
    
    const options = {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/869/869869.png', // Bildirim ikonu
        badge: 'https://cdn-icons-png.flaticon.com/512/869/869869.png', // Küçük durum çubuğu ikonu
        vibrate: [100, 50, 100], // Telefonun titreme ritmi
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Bildirime tıklandığında siteyi açan kod
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});