// ✅ apiConfig.js
// Location: src/utils/apiConfig.js

/**
 * Detects if the app is running in a native environment (Capacitor).
 */
const isCapacitor = () =>
  typeof window !== "undefined" && 
  (window.Capacitor !== undefined || window.location.host.includes('localhost'));

/**
 * Returns the base URL for API calls.
 * In a native environment (APK), this points to the live Vercel backend.
 * In a web environment, it uses relative paths.
 */
export const getApiUrl = (endpoint) => {
  const isAPK = typeof window !== 'undefined' && window.location.protocol === 'file:';
  
  if (!isAPK) {
    // Web (Localhost, Vercel, etc.) - ALWAYS use relative paths
    return endpoint;
  }
  
  // Only for APK (Capacitor/file protocol)
  const PRODUCTION_URL = "https://task-planner-ai.vercel.app";
  return `${PRODUCTION_URL}${endpoint}`;
};
