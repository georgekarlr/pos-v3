import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register service worker in production for PWA installability
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Check for updates every 1 hour
      setInterval(() => {
        registration.update();
      }, 1000 * 60 * 60);

      // Check for updates when user returns to/focuses the app
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update();
        }
      });
    }).catch((err) => {
      console.error('SW registration failed:', err);
    });

    // Auto-reload page when service worker is updated (only if previously controlled to avoid reload loops)
    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      if (hadController) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}
