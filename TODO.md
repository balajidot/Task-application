# Task Planner - Implementation Plan

## Tasks to Complete:

1. **Remove Text Truncation** - Fix CSS to remove ellipsis/overflow hidden, wrap full task name
2. **Remove Shortlist Button** - Delete from all task cards and fix layout spacing
3. **Live Task Popup** - Floating popup window with task details and glowing border animation
4. **Live Countdown Timer** - Real-time countdown "⏱ 23 min 45 sec remaining" updated every second
5. **Next Task Alert** - 5 mins before task ends, show toast + Electron notification
6. **Windows Reminder Notification + Sound** - Trigger Electron Notification + play reminder.mp3
7. **Completion Sound** - Play complete.mp3 on task completion with checkmark animation
8. **Claude Font** - Apply font stack globally, import Inter from Google Fonts
9. **Optimization** - Fix memory leaks, clear intervals properly, separate logic
10. **Build .exe** - Add electron-builder config, bundle sounds/fonts

## Files to Modify:
- src/App.jsx (main logic)
- electron/main.js (Electron main process)
- package.json (build config)
- index.html (font imports)

## New Files to Create:
- src/services/taskManager.js
- src/services/notifier.js
- src/services/renderer.js
- public/sounds/ (audio files)

