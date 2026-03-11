import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initializeOneSignal, setupNotificationClickHandler } from './services/oneSignal'

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        // Service Worker registered successfully
      })
      .catch(() => {
        // Service Worker registration failed
      });
  });
}

// Initialize OneSignal with proper PWA configuration
window.addEventListener('load', () => {
  initializeOneSignal().then(success => {
    if (success) {
      setupNotificationClickHandler();
      
      // Request notification permission for push notifications
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  });
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)