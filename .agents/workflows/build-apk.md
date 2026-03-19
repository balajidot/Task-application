---
description: How to perform a clean APK build for Task Planner
---

Follow these steps to generate a fresh APK with all the latest AI fixes and permission updates:

### 1. Build the Web Project
First, create the production bundle of the React app:
```powershell
npm run build
```

### 2. Sync with Android
Copy the new build files into the Android project:
```powershell
npx cap sync
```

### 3. Build the APK (Command Line)
You can build the APK directly from the terminal:
```powershell
cd android
./gradlew clean
./gradlew assembleDebug
```
The APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Build via Android Studio (Alternative)
If you prefer using Android Studio:
1. Open the `android` folder in Android Studio.
2. Go to **Build > Clean Project**.
3. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Once done, click the **Locate** pop-up to find the APK.

### Important Note
Make sure your `GEMINI_API_KEY` is set in your Vercel Environment Variables before building, so the backend can respond to the app!
