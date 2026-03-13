import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ✅ 1. Service Worker Registration (Keeping this for PWA functionality)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        console.log('Service Worker registered successfully');
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// ✅ 2. OneSignal initialization logic removed to fix build error

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)