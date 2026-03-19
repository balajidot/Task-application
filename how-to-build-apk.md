# 📱 How to Build the Task Planner APK

Follow these steps to generate the native Android application (.apk).

## 1. Prerequisites
Ensure you have the following installed on your system:
- **Node.js**: v18 or later
- **Android Studio**: Latest version
- **Java JDK**: v17 (needed for Android Gradle builds)

## 2. Prepare Android Platform (Skip if already done)
If this is your first time building, run:
```bash
npx cap add android
```

## 3. Run the Build Script
We have provided a helper script to automate the web build and sync process. Run this in PowerShell:
```powershell
./build-apk.ps1
```

## 4. Final Build in Android Studio
1. The script will automatically open **Android Studio**.
2. Wait for the **Gradle Sync** to finish (watch the bottom progress bar).
3. In the top menu, go to: 
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Once finished, a notification will appear on the bottom right. Click **Locate** to find your `app-debug.apk`.

## ⚠️ Important Note for AI Features
The APK is configured to point to the live server at:
`https://task-application-sigma.vercel.app`

Ensure your Gemini API Key is correctly set as an Environment Variable in your Vercel project settings for the AI features (Chat, Decomposition, Suggestions) to work in the APK.
