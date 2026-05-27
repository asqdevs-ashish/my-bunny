const CACHE_NAME = "chefcupid-v1";
const ASSETS = ["/dashboard", "/chat", "/login"];

// Install event - cache basic assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Push event - show notification from server push
self.addEventListener("push", (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      // Use a clean notification icon from the site's available assets
      const iconUrl = data.icon || "/icon-192.jpeg";
      const options = {
        body: data.body || "Hey baby! 💕",
        icon: iconUrl,
        badge: "/icon-192.jpeg",
        vibrate: data.vibrate || [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          url: data.url || "/dashboard",
        },
        actions: data.actions || [
          { action: "open", title: "Open App 💕" },
        ],
        tag: data.tag || "chef-cupid",
        requireInteraction: true, // Keep notification visible until user interacts
      };
      // Title from push data (now "Suar's Care 💕" from web-push.ts)
      event.waitUntil(self.registration.showNotification(data.title || "Suar's Care 💕", options));
    } catch {
      // If not JSON, show raw text
      const options = {
        body: event.data.text(),
        icon: "/icon-192.jpeg",
        badge: "/icon-192.jpeg",
        vibrate: [100, 50, 100],
      };
      event.waitUntil(self.registration.showNotification("Suar's Care 💕", options));
    }
  }
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  // Handle action buttons
  if (event.action === "reply") {
    // Reply action - just open the chat page to reply
  }

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // If app is already open, focus it and navigate
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(urlToOpen);
            }
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Periodic sync for background reminders (when supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "water-reminder") {
    event.waitUntil(
      self.registration.showNotification("💧 Water Reminder", {
        body: "Time to hydrate, baby! 💧",
        icon: "/icon-192.jpeg",
        badge: "/icon-192.jpeg",
        vibrate: [100, 50, 100],
        tag: "water-reminder",
      })
    );
  }
  if (event.tag === "love-note") {
    event.waitUntil(
      self.registration.showNotification("💕 Love Note", {
        body: "Just a reminder — you're amazing! 💕",
        icon: "/icon-192.jpeg",
        badge: "/icon-192.jpeg",
        vibrate: [100, 50, 100],
        tag: "love-note",
      })
    );
  }
});
