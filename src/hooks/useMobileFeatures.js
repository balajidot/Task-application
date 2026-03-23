// ✅ useMobileFeatures.js
// Place in: src/hooks/useMobileFeatures.js
// Handles: Back button, Status bar, Safe area,
//          Keyboard avoid, Haptic feedback, Tab swipe

import React from "react";

// ✅ Detect Capacitor (Android APK)
const isCapacitor = () =>
  typeof window !== "undefined" && window.Capacitor !== undefined;

// ============================================
// 1. HAPTIC FEEDBACK
// ============================================
export async function triggerHaptic(style = "light") {
  if (!isCapacitor()) return;
  // ✅ FIX 5: Check hapticEnabled setting
  const hapticEnabled = localStorage.getItem('taskPlanner_hapticEnabled');
  if (hapticEnabled === 'false') return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    // ✅ FIX 5: Always use Light — never Medium or Heavy. Feels premium not annoying.
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

export async function triggerSelectionHaptic() {
  if (!isCapacitor()) return;
  try {
    const { Haptics } = await import("@capacitor/haptics");
    await Haptics.selectionChanged();
  } catch {}
}

// ============================================
// 2. STATUS BAR COLOR
// ============================================
async function setStatusBarColor(themeMode) {
  if (!isCapacitor()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");

    const colorMap = {
      dark: "#0b0f19",
      midnight: "#08080e",
      "ocean-dark": "#071318",
      "cyber-neon": "#0a0a14",
      "deep-purple": "#0e0a1a",
      "emerald-night": "#071210",
      "lavender-night": "#0f0d18",
      "mocha-espresso": "#1a130e",
      "graphite-lime": "#0f1520",
      light: "#ffffff",
      "sunset-light": "#fef8f0",
      "eye-comfort": "#f0f3da",
      "forest-mist": "#eefcf5",
      "rose-dawn": "#fff0f1",
      "arctic-glass": "#f0f8ff",
      "sakura-bloom": "#fff5f7",
    };

    const color = colorMap[themeMode] || (themeMode.includes("light") || themeMode.includes("bloom") || themeMode.includes("mist") || themeMode.includes("dawn") || themeMode.includes("comfort") ? "#ffffff" : "#0b0f19");
    const isDark = !themeMode.includes("light") && !themeMode.includes("bloom") && !themeMode.includes("mist") && !themeMode.includes("dawn") && !themeMode.includes("comfort") && !themeMode.includes("glass");

    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color });
  } catch {}
}

// ============================================
// 3. KEYBOARD AVOID
// ============================================
function setupKeyboardAvoid() {
  if (!isCapacitor()) {
    // PWA: use visual viewport resize
    if (window.visualViewport) {
      const handler = () => {
        const keyboardHeight =
          window.innerHeight - window.visualViewport.height;
        document.documentElement.style.setProperty(
          "--keyboard-height",
          `${Math.max(0, keyboardHeight)}px`
        );
      };
      window.visualViewport.addEventListener("resize", handler);
      return () => window.visualViewport.removeEventListener("resize", handler);
    }
    return () => {};
  }

  // Capacitor keyboard
  let cleanup = () => {};
  (async () => {
    try {
      const { Keyboard } = await import("@capacitor/keyboard");
      const showListener = await Keyboard.addListener("keyboardWillShow", (info) => {
        document.documentElement.style.setProperty(
          "--keyboard-height",
          `${info.keyboardHeight}px`
        );
        document.body.classList.add("keyboard-open");
      });
      const hideListener = await Keyboard.addListener("keyboardWillHide", () => {
        document.documentElement.style.setProperty("--keyboard-height", "0px");
        document.body.classList.remove("keyboard-open");
      });
      cleanup = () => {
        showListener.remove();
        hideListener.remove();
      };
    } catch {}
  })();
  return () => cleanup();
}

// ============================================
// 4. ANDROID BACK BUTTON
// ============================================
function setupBackButton(activeView, setActiveView, setShowForm, setShowMoreMenu) {
  if (!isCapacitor()) return () => {};

  let cleanup = () => {};
  (async () => {
    try {
      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("backButton", ({ canGoBack }) => {
        // 1. If form is open → close it
        setShowForm((formOpen) => {
          if (formOpen) return false;

          // 2. If focus mode is open? (We need a way to track this if it's external, for now let's assume it's handled by other means or add a setter here if needed)

          // 3. If more menu is open → close it
          let menuHandled = false;
          setShowMoreMenu((menuOpen) => {
            if (menuOpen) {
              menuHandled = true;
              return false;
            }
            return menuOpen;
          });
          if (menuHandled) return formOpen;

          // 4. If not on tasks view → go to tasks
          let viewHandled = false;
          setActiveView((currentView) => {
            if (currentView !== "tasks") {
              viewHandled = true;
              return "tasks";
            }
            return currentView;
          });
          if (viewHandled) return formOpen;

          // 5. If on tasks view → minimize
          App.minimizeApp();
          return formOpen;
        });
      });
      cleanup = () => listener.remove();
    } catch {}
  })();
  return () => cleanup();
}

// ============================================
// 5. SWIPE TO SWITCH TABS
// ============================================
const TAB_ORDER = [
  "insights",
  "tasks",
  "planner",
  "analytics",
  "settings",
  "habits",
  "goals",
  "chat",
  "challenge",
  "checkin",
  "subscription",
  "referral",
  "tools"
];

/**
 * Enhanced global swipe-to-switch tabs.
 * Consolidates directional logic, edge-zone protection, and interactive target rejection.
 */
export function useSwipeTabSwitcher(activeView, setActiveView) {
  const touchStartX = React.useRef(null);
  const touchStartY = React.useRef(null);

  const handleTouchStart = React.useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = React.useCallback(
    (e) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchStartX.current - touchEndX; // +ve = swipe left (finger moves left)
      const deltaY = touchStartY.current - touchEndY;
      const screenW = window.innerWidth;
      const startX = touchStartX.current;

      touchStartX.current = null;
      touchStartY.current = null;

      // 1. Edge Zone check: swipe must start in the middle 56% for gestures?
      // Actually, standard is usually the middle area is for content, edges are for navigation.
      // But the user's logic in App.jsx said: screenW * 0.22 (Edges only).
      const EDGE = screenW * 0.22;
      if (startX > EDGE && startX < screenW - EDGE) return;

      // 2. Threshold
      const THRESHOLD = 120;
      if (Math.abs(deltaX) < THRESHOLD) return;

      // 3. Horizontal check
      if (Math.abs(deltaY) > Math.abs(deltaX) * 0.35) return;

      // 4. Target check
      const t = e.target;
      if (
        t.closest('.goal-item') || t.closest('.swipeable-task-container') ||
        t.closest('.filters') || t.closest('.modal') || t.closest('.overlay') ||
        t.closest('.live-strip') || t.closest('.tab-nav') || t.closest('.pomodoro-timer')
      ) return;

      const currentIndex = TAB_ORDER.indexOf(activeView);
      if (currentIndex === -1) return;

      if (deltaX > THRESHOLD && currentIndex < TAB_ORDER.length - 1) {
        // Finger moved left → Next tab
        triggerSelectionHaptic();
        setActiveView(TAB_ORDER[currentIndex + 1]);
      } else if (deltaX < -THRESHOLD && currentIndex > 0) {
        // Finger moved right → Previous tab
        triggerSelectionHaptic();
        setActiveView(TAB_ORDER[currentIndex - 1]);
      }
    },
    [activeView, setActiveView]
  );

  return { handleTouchStart, handleTouchEnd };
}

// ============================================
// MAIN HOOK — USE THIS IN App.jsx
// ============================================
export function useMobileFeatures({
  themeMode,
  activeView,
  setActiveView,
  setShowForm,
  setShowMoreMenu,
}) {
  // Status bar color sync
  React.useEffect(() => {
    setStatusBarColor(themeMode);
  }, [themeMode]);

  // Keyboard avoid
  React.useEffect(() => {
    const cleanup = setupKeyboardAvoid();
    return cleanup;
  }, []);

  // Android back button
  React.useEffect(() => {
    const cleanup = setupBackButton(
      activeView,
      setActiveView,
      setShowForm,
      setShowMoreMenu
    );
    return cleanup;
  }, []);

  // Safe area meta tag (for notch/punch-hole screens)
  React.useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, viewport-fit=cover"
      );
    }
  }, []);
}
