import { useState, useEffect } from 'react';
import { Bell, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const C = { navy: '#0a1628', card: '#0d1f3c', cyan: '#00E5FF', blue: '#00AEEF', border: 'rgba(0,174,255,0.15)', ink2: '#91A9BD' };

export default function AppPromptBanner() {
  const [show, setShow] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('orbitrum-prompt-dismissed');
    if (dismissed) return;

    const notifOk = 'Notification' in window && Notification.permission === 'granted';
    setNotifGranted(notifOk);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setInstalled(!!standalone);

    if (!notifOk || !standalone) {
      setTimeout(() => setShow(true), 3000);
    }

    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const requestNotif = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifGranted(perm === 'granted');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  };

  const doInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('orbitrum-prompt-dismissed', '1');
  };

  if (!show || (notifGranted && (installed || !installPrompt))) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9999, maxWidth: 400, margin: '0 auto',
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      >
        <button onClick={dismiss} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: C.ink2, cursor: 'pointer' }}>
          <X size={16} />
        </button>

        <div style={{ fontSize: 14, fontWeight: 600, color: C.cyan, marginBottom: 12 }}>
          Aproveite melhor o Orbitrum
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!notifGranted && (
            <button onClick={requestNotif} style={{ display: 'flex', alignItems: 'center', gap: 10, background: `${C.cyan}15`, border: `1px solid ${C.cyan}40`, borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
              <Bell size={18} color={C.cyan} />
              <div>
                <div style={{ fontWeight: 600 }}>Ativar Notificações</div>
                <div style={{ fontSize: 11, color: C.ink2, marginTop: 2 }}>Saiba quando um profissional responder</div>
              </div>
            </button>
          )}

          {installPrompt && !installed && (
            <button onClick={doInstall} style={{ display: 'flex', alignItems: 'center', gap: 10, background: `${C.blue}15`, border: `1px solid ${C.blue}40`, borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
              <Download size={18} color={C.blue} />
              <div>
                <div style={{ fontWeight: 600 }}>Baixar App</div>
                <div style={{ fontSize: 11, color: C.ink2, marginTop: 2 }}>Instale na tela inicial, acesso rápido</div>
              </div>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
