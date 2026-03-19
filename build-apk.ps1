# ✅ APK Build Script for Task Planner
# Run this in PowerShell to build and sync the app

Write-Host "🚀 Starting APK Build Process..." -ForegroundColor Cyan

# 1. Build Web Assets
Write-Host "📦 Building web assets (Vite)..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Web build failed! Check errors above." -ForegroundColor Red
    exit
}

# 2. Sync with Capacitor
Write-Host "🔄 Syncing with Capacitor..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed! Make sure you have the android platform added." -ForegroundColor Red
    exit
}

# 3. Open Android Studio
Write-Host "📱 Opening Android Studio for Gradle build..." -ForegroundColor Green
Write-Host "💡 Note: Once Android Studio opens, wait for Gradle sync, then click Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor White
npx cap open android

Write-Host "✅ Done! Follow the instructions in Android Studio to finish." -ForegroundColor Cyan
