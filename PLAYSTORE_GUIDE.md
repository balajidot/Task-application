# 🚀 Play Store Publishing Guide — Task Planner

## Step 1 — One-time Setup (Do this first!)

### 1.1 Create Google Play Console Account
1. Go to: https://play.google.com/console
2. Click "Get Started"
3. Pay one-time fee: **$25 USD (~₹2,100)**
4. Fill developer profile

### 1.2 Create App in Console
1. Click "Create app"
2. App name: **Task Planner — AI Coach**
3. Language: English
4. App / Game: **App**
5. Free / Paid: **Free** (we use in-app subscription)
6. Click "Create app"

---

## Step 2 — Build Signed APK/AAB

### 2.1 Create Signing Keystore (ONE TIME — NEVER LOSE THIS!)
Run in PowerShell:
```powershell
keytool -genkey -v -keystore task-planner-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias task-planner-key
```
**⚠️ BACK UP task-planner-key.jks to Google Drive/USB immediately!**

### 2.2 Build Production AAB
1. Run: `npm run build`
2. Run: `npx cap sync android`
3. Open Android Studio
4. Build → Generate Signed Bundle/APK
5. Choose: **Android App Bundle (.aab)**
6. Select your keystore file
7. Choose: **release**
8. Find AAB at: `android/app/release/app-release.aab`

---

## Step 3 — App Store Listing

### 3.1 Required Assets
| Asset | Size | Tips |
|-------|------|-------|
| App icon | 512×512 PNG | Already have it ✅ |
| Feature graphic | 1024×500 PNG | Create on Canva |
| Screenshots (phone) | Min 2, max 8 | 1080×1920 recommended |

### 3.2 Store Listing Text

**Short description (max 80 chars):**
```
AI Personal Coach for Tasks, Habits & Daily Productivity
```

**Full description:**
```
Transform your productivity with Task Planner — your AI-powered personal coach.

🤖 DAILY AI COACHING
Get personalized morning and evening messages from your AI coach — motivating you, tracking your progress, and keeping you accountable every single day.

✅ SMART TASK MANAGEMENT
Plan your day with smart time-blocking. Set priorities, reminders, and sessions. Your AI generates a complete daily schedule in one tap.

🎯 HABIT TRACKER
Build life-changing habits with a 7-day streak tracker. Your personal best is always visible — keeping you motivated to go further.

📊 WEEKLY PROGRESS REPORT
Every week, your AI coach analyses your productivity patterns and gives you a personal performance report.

⭐ XP + LEVEL SYSTEM
Earn XP for every completed task. Level up as you become more productive. Watch your discipline grow every day.

FREE FOR 30 DAYS — then ₹99/month or ₹999/year.
Cancel anytime.
```

### 3.3 Content Rating
- Complete questionnaire
- Violence: None
- Sexual content: None
- → Rating: **Everyone**

### 3.4 Data Safety
- Data collected: Name (user-provided)
- Data NOT shared with third parties: ✅
- Data encrypted: ✅

---

## Step 4 — Upload & Review

1. Go to: Production → Create new release
2. Upload your `.aab` file
3. Add release notes:
   ```
   Initial release — AI Personal Coach for daily productivity
   ```
4. Click Review release → Start rollout

**Review time: 3–7 days for first submission**

---

## Step 5 — After Approval

1. Set up Razorpay in-app purchase (already done in code ✅)
2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to Vercel environment variables
3. Test payment end-to-end
4. Monitor ratings and reviews daily

---

## 🔑 Vercel Environment Variables to Add

Go to: vercel.com → Your project → Settings → Environment Variables

```
GEMINI_API_KEY        = (your Gemini API key)
RAZORPAY_KEY_ID       = rzp_live_XXXXXXXXXX
RAZORPAY_KEY_SECRET   = (your secret — never share!)
```

**Test mode first:** Use `rzp_test_XXXXXXXXXX` for testing
**Live mode:** Switch to `rzp_live_XXXXXXXXXX` after testing

---

## 📞 Where to Get Razorpay Keys

1. Go to: https://razorpay.com
2. Sign up (free)
3. Complete KYC (need Aadhaar + PAN + bank account)
4. Dashboard → Settings → API Keys
5. Generate test keys first, live keys after KYC approval

**KYC approval: 2–3 business days**
