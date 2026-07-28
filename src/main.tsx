import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

console.log('main.tsx starting');

// Register service worker using official vite-plugin-pwa API
registerSW({
  immediate: true,
  onRegisteredSW(_swScriptUrl, registration) {
    if (!registration) return;

    // Check for updates every 5 minutes (300,000 ms)
    setInterval(async () => {
      if (!registration.installing && registration.waiting) return;
      if (navigator.onLine) {
        await registration.update();
      }
    }, 5 * 60 * 1000);

    // Check for updates when document/app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        registration.update();
      }
    });
  },
  onNeedRefresh() {
    window.location.reload();
  },

  onOfflineReady() {
    console.log('App is ready even when offline');
  },

  onRegisterError(error) {
    console.error('SW registration failed:', error);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

