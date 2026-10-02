let swRegistration: ServiceWorkerRegistration | null = null;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    swRegistration = reg;
  }).catch(() => {});
}

export function notify(title: string, opts?: { body?: string; icon?: string; url?: string }) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const notifOpts = {
    body: opts?.body,
    icon: opts?.icon || '/vite.svg',
    tag: 'orbitrum-' + Date.now(),
    data: { url: opts?.url || '/' },
    vibrate: [200, 100, 200] as number[],
  };
  if (swRegistration) {
    swRegistration.showNotification(title, notifOpts);
  } else {
    new Notification(title, { body: notifOpts.body, icon: notifOpts.icon });
  }
}
