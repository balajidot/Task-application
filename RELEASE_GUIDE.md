# 🚀 Play Store Release Guide

This document explains how to generate a **Signed Android App Bundle (AAB)** for publishing to the Google Play Store.

## 1. Production Build Settings
I have updated your `android/app/build.gradle` with:
- `versionCode` incremented for the new release.
- `minifyEnabled true` to protect your code and reduce app size.
- `shrinkResources true` to remove unused assets.

## 2. Generating your Signing Key (Keystore)
Google Play requires every app to be signed with a private key. **DO NOT LOSE THIS FILE.**

1. Open a terminal (PowerShell) in the root of your project.
2. Run this command (Replace `YOUR_PASSWORD` with a strong password):
```powershell
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```
3. This creates `my-release-key.jks`. **Back this up somewhere safe (Google Drive/Dropbox).**

## 3. Creating the Signed Release AAB
1. Open **Android Studio**.
2. Go to **Build > Generate Signed Bundle / APK...**
3. Select **Android App Bundle** and click **Next**.
4. Click **Choose existing...** and select the `my-release-key.jks` you just created.
5. Enter your password and alias details.
6. Click **Next**, select **release** destination folder, and click **Finish**.
7. Once finished, locate the `.aab` file in `android/app/release/`.

## 4. Uploading to Google Play Console
1. Go to [Google Play Console](https://play.google.com/console).
2. Create a new app if you haven't already.
3. Go to **Production > Create new release**.
4. Upload the `.aab` file.
5. Complete the Store Listing, Content Rating, and Data Safety sections.

---
### ⚠️ Security Warning
Never check your `.jks` file or your signing passwords into GitHub. Add `*.jks` to your `.gitignore` to keep it safe.
