// ✅ apiConfig.js
// Location: src/utils/apiConfig.js

/**
 * Detects if the app is running in a native environment (Capacitor).
 */
const isCapacitor = () =>
  typeof window !== "undefined" && window.Capacitor !== undefined;

/**
 * Returns the base URL for API calls.
 * In a native environment (APK), this points to the live Vercel backend.
 * In a web environment, it uses relative paths.
 */
export const getApiUrl = (endpoint) => {
  // 🔴 Updated to the correct Vercel URL found in the project backup
  const PRODUCTION_URL = "https://task-application-sigma.vercel.app";
  
  if (isCapacitor()) {
    // Ensure absolute URL for native app
    return `${PRODUCTION_URL}${endpoint}`;
  }
  
  // Use relative path for web/PWA
  return endpoint;
};
