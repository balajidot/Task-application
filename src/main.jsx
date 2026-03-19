import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerPlugin } from '@capacitor/core'
import App from './App.jsx'

registerPlugin('DeviceSettings')

// 🛑 Unregister service workers in development to prevent stale cache issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
