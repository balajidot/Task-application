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
  // Use the main production domain as the fallback for Mobile APKs
  const PRODUCTION_URL = "https://task-planner-ai.vercel.app"; 
  
  const isWeb = typeof window !== "undefined" && !window.Capacitor;
  
  if (isWeb) {
    // On Vercel or Localhost web, always use relative paths to avoid CORS
    return endpoint;
  }
  
  // For Capacitor/APK, use absolute URL
  return `${PRODUCTION_URL}${endpoint}`;
};
