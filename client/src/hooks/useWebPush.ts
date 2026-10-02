import { useState, useEffect, useCallback } from 'react';

type PushState = 'unsupported' | 'denied' | 'prompt' | 'subscribed' | 'error';

export function useWebPush() {
  const [state, setState] = useState<PushState>('prompt');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }

    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        setRegistration(reg);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        setState(sub ? 'subscribed' : 'prompt');
      })
      .catch(() => setState('error'));
  }, []);

  const requestPermission = useCallback(async () => {
    if (!registration) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return false;
      }
      setState('subscribed');
      return true;
    } catch {
      setState('error');
      return false;
    }
  }, [registration]);

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions & { url?: string }) => {
    if (!registration || Notification.permission !== 'granted') return;
    const { url, ...notifOpts } = options || {};
    registration.showNotification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: 'orbitrum-local',
      data: { url: url || '/' },
      vibrate: [200, 100, 200],
      ...notifOpts,
    });
  }, [registration]);

  return { state, requestPermission, showLocalNotification, registration };
}
