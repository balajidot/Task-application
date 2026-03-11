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

// Initialize OneSignal
window.addEventListener('load', () => {
  initializeOneSignal().then(success => {
    if (success) {
      setupNotificationClickHandler();
    }
  });
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)