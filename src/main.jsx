import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerPlugin } from '@capacitor/core'
import App from './App.jsx'
import { AppProvider } from './context/AppContext'
import { TimerProvider } from './context/TimerContext'

registerPlugin('DeviceSettings')

// ✅ FIX: Unregister service workers in DEV only
// Production-ல் PWA offline work ஆகும்
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach(r => r.unregister());
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </AppProvider>
  </React.StrictMode>,
)
