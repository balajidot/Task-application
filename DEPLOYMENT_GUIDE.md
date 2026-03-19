# 🚀 DEPLOYMENT GUIDE — Task Planner AI Coach
# Complete step-by-step from your laptop to live app

---

## ✅ STEP 1 — Extract & Copy Fixed Files

1. Extract the ZIP: `task-planner-fixed.zip`
2. Copy ALL contents to your project folder:
   ```
   D:\task-planner-exe-project\task-app
   ```
3. When asked to overwrite → click **Yes to All**

---

## ✅ STEP 2 — Push to GitHub (Preview Branch)

Open PowerShell in your project folder. Run ONE BY ONE:

```powershell
# Switch to preview branch
git checkout -b preview-fixes
```

```powershell
# Stage all changes
git add .
```

```powershell
# Commit with message
git commit -m "feat: AI coach + XP + 30day challenge + referral + Razorpay + Phase 1-2-3 complete"
```

```powershell
# Push to GitHub
git push origin preview-fixes
```

✅ Vercel auto-deploys in ~2 minutes!

---

## ✅ STEP 3 — Add Environment Variables to Vercel

Go to: **vercel.com → Your Project → Settings → Environment Variables**

Add these (click Add for each):

| Key | Value | Where to get |
|-----|-------|-------------|
| `GEMINI_API_KEY` | `AIza...` | aistudio.google.com |
| `RAZORPAY_KEY_ID` | `rzp_test_...` | razorpay.com → Dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | `your_secret` | razorpay.com → Dashboard → API Keys |

⚠️ Use `rzp_test_` keys first for testing, then switch to `rzp_live_` for production!

---

## ✅ STEP 4 — Verify Vercel Preview Deployment

1. Go to: **vercel.com → Deployments → Find preview-fixes**
2. Click **Visit** → opens your preview URL
3. Test on mobile — open URL in Chrome on your phone

**Test Checklist:**
```
□ App loads with loading screen animation
□ 3-step onboarding shows for new user
□ AI Schedule button → returns 6 tasks
□ Complete a task → XP increases
□ Bottom nav → all tabs work
□ Settings → AI Coach Tone works
□ Challenge tab → 30-day grid shows
□ Check-in tab → mood/energy/focus flow works
□ More menu → Referral tab works
```

---

## ✅ STEP 5 — Test Razorpay Payment

1. Open your preview URL
2. Click 👑 Premium button (bottom right)
3. Select Monthly ₹99 plan
4. Click "Start Now"
5. Use test card:
   ```
   Card: 4111 1111 1111 1111
   Expiry: Any future date
   CVV: Any 3 digits
   OTP: 1234
   ```
6. Verify success message appears ✅

---

## ✅ STEP 6 — Merge to Main (Go Live!)

Once everything tested, run:

```powershell
git checkout main
```

```powershell
git merge preview-fixes
```

```powershell
git push origin main
```

✅ Your LIVE site at **task-application-sigma.vercel.app** is now updated!

---

## ✅ STEP 7 — Build Android APK

```powershell
# Build production React bundle
npm run build
```

```powershell
# Sync with Capacitor
npx cap sync android
```

```
# Then in Android Studio:
Build → Generate Signed Bundle/APK → Android App Bundle
→ Use your keystore → release
→ Output: android/app/release/app-release.aab
```

---

## ✅ STEP 8 — Play Store Publish

See full guide: **PLAYSTORE_GUIDE.md** (also in this ZIP)

Quick checklist:
```
□ Google Play Console account created ($25 one-time)
□ App created in console
□ AAB file uploaded
□ Store listing filled (title, description, screenshots)
□ Content rating completed
□ Data safety form filled
□ Published to Production
```

---

## 🔑 IMPORTANT — Switch to Live Razorpay Keys Before Launch

In Vercel → Environment Variables:
```
RAZORPAY_KEY_ID     → Change from rzp_test_ to rzp_live_
RAZORPAY_KEY_SECRET → Change to live secret
```

---

## 🛟 IF SOMETHING BREAKS

**Rollback in 30 seconds:**
```
vercel.com → Deployments → Find previous working deploy
→ Click ••• → Promote to Production
```

**Check logs:**
```
vercel.com → Deployments → Click deploy → Functions tab → View logs
```

---

## 📞 Razorpay KYC Checklist

To enable live payments (2-3 business days):
```
□ Aadhaar card
□ PAN card  
□ Bank account (savings/current)
□ Business type: Individual
□ Business category: Software/SaaS
```

Go to: razorpay.com → Complete KYC
