// ✅ useMobileFeatures.js
// Place in: src/hooks/useMobileFeatures.js
// Handles: Back button, Status bar, Safe area,
//          Keyboard avoid, Haptic feedback, Tab swipe

import { useEffect, useCallback, useRef } from "react";

// ✅ Detect Capacitor (Android APK)
const isCapacitor = () =>
  typeof window !== "undefined" && window.Capacitor !== undefined;

// ============================================
// 1. HAPTIC FEEDBACK
// ============================================
export async function triggerHaptic(style = "light") {
  if (!isCapacitor()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] || ImpactStyle.Light });
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
      dark: "#0f0f1a",
      light: "#ffffff",
      "sunset-light": "#ffffff",
      ocean: "#0a1628",
      forest: "#0d1f0d",
    };

    const color = colorMap[themeMode] || "#0f0f1a";
    const isDark = !themeMode.includes("light");

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
        // If form is open → close form
        setShowForm((prev) => {
          if (prev) return false;

          // If more menu open → close menu
          setShowMoreMenu((menuPrev) => {
            if (menuPrev) return false;

            // If not on default tab → go to tasks
            setActiveView((viewPrev) => {
              if (viewPrev !== "tasks") return "tasks";
              // On main tab → minimize app
              App.minimizeApp();
              return viewPrev;
            });
            return menuPrev;
          });
          return prev;
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
  "career",
  "tools",
  "habits",
  "journal",
  "goals",
];

export function useSwipeTabSwitcher(activeView, setActiveView) {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStartX.current === null) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      // Only horizontal swipes (ignore vertical scrolling)
      if (Math.abs(deltaX) < 60 || Math.abs(deltaY) > Math.abs(deltaX)) {
        touchStartX.current = null;
        return;
      }

      const currentIndex = TAB_ORDER.indexOf(activeView);
      if (currentIndex === -1) return;

      if (deltaX < -60 && currentIndex < TAB_ORDER.length - 1) {
        // Swipe Left → Next tab
        triggerSelectionHaptic();
        setActiveView(TAB_ORDER[currentIndex + 1]);
      } else if (deltaX > 60 && currentIndex > 0) {
        // Swipe Right → Previous tab
        triggerSelectionHaptic();
        setActiveView(TAB_ORDER[currentIndex - 1]);
      }

      touchStartX.current = null;
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
  useEffect(() => {
    setStatusBarColor(themeMode);
  }, [themeMode]);

  // Keyboard avoid
  useEffect(() => {
    const cleanup = setupKeyboardAvoid();
    return cleanup;
  }, []);

  // Android back button
  useEffect(() => {
    const cleanup = setupBackButton(
      activeView,
      setActiveView,
      setShowForm,
      setShowMoreMenu
    );
    return cleanup;
  }, []);

  // Safe area meta tag (for notch/punch-hole screens)
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, viewport-fit=cover"
      );
    }
  }, []);
}
