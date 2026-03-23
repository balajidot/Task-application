import React, { Suspense, lazy, useEffect } from "react";
import { useApp } from "./context/AppContext";

// UI Components
import PomodoroTimer          from "./components/PomodoroTimer";
import TaskImportExport        from "./components/TaskImportExport";
import ShortcutsModal          from "./components/ShortcutsModal";
import WeeklyPlannerWizard     from "./components/WeeklyPlannerWizard";
import TaskTemplates           from "./components/TaskTemplates";
import BottomSheet             from "./components/BottomSheet";
import EnhancedFocusMode       from "./components/EnhancedFocusMode";
import { LiveTaskPopup }       from "./components/SharedUI";

// Hooks
import useKeyboardShortcuts                                    from "./hooks/useKeyboardShortcuts";
import { useMobileFeatures, triggerHaptic, useSwipeTabSwitcher } from "./hooks/useMobileFeatures";

// Notifications — ✅ FIX: correct import path
import { showAppNotification } from "./notifications.fixed";

import './App.css';

// ─── Lazy Views ───────────────────────────────────────────────────────────────
const DashboardView     = lazy(() => import("./views/DashboardView"));
const SubscriptionView  = lazy(() => import("./views/SubscriptionView"));
const ChallengeView     = lazy(() => import("./views/ChallengeView"));
const CheckInView       = lazy(() => import("./views/CheckInView"));
const ReferralView      = lazy(() => import("./views/ReferralView"));
const TasksView         = lazy(() => import("./views/TasksView"));
const PlannerView       = lazy(() => import("./views/PlannerView"));
const AnalyticsView     = lazy(() => import("./views/AnalyticsView"));
const SettingsView      = lazy(() => import("./views/SettingsView"));
const ToolsView         = lazy(() => import("./views/ToolsView"));
const HabitsView        = lazy(() => import("./views/HabitsView"));
const GoalsView         = lazy(() => import("./views/GoalsView"));
const ChatAssistantView = lazy(() => import("./views/ChatAssistantView"));

// ─── Error Boundary ───────────────────────────────────────────────────────────
// ✅ FIX: Added error boundary — prevents full app crash on view errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("View error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <div className="empty-state-title">Something went wrong</div>
          <div className="empty-state-sub">Please restart the app</div>
          <button
            className="empty-state-btn"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="loader-center">
      <div className="dot-typing" />
      <div className="dot-typing" />
      <div className="dot-typing" />
    </div>
  );
}

// ─── Onboarding Modal ─────────────────────────────────────────────────────────
// ✅ FIX: Extracted from App — no more inline styles
function OnboardingModal() {
  const app = useApp();
  if (!app.showNameSetup && app.userName) return null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal animate-fade-in">

        {app.onboardStep === 1 && (
          <>
            <div className="onboarding-emoji">👋</div>
            <h2 className="onboarding-title">
              {app.appLanguage === 'ta' ? 'வணக்கம்! உங்கள் பெயர்?' : "Welcome! What's your name?"}
            </h2>
            <p className="onboarding-sub">
              {app.appLanguage === 'ta'
                ? 'உங்களின் உற்பத்தித்திறன் பயணத்தைத் தொடங்கலாம்.'
                : "Let's personalize your productivity journey."}
            </p>
            <input
              type="text"
              className="fi onboarding-input"
              placeholder={app.appLanguage === 'ta' ? 'பெயர்...' : 'Type your name...'}
              value={app.tempName}
              onChange={e => app.setTempName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && app.tempName.trim() && app.setOnboardStep(2)}
              autoFocus
            />
            <button
              className="new-btn btn-block"
              onClick={() => app.tempName.trim() && app.setOnboardStep(2)}
            >
              Next
            </button>
          </>
        )}

        {app.onboardStep === 2 && (
          <>
            <div className="onboarding-emoji">🎯</div>
            <h2 className="onboarding-title">
              {app.appLanguage === 'ta'
                ? `${app.tempName}, உங்கள் இலக்கு?`
                : `${app.tempName}, your main goal?`}
            </h2>
            <p className="onboarding-sub">
              {app.appLanguage === 'ta'
                ? 'நாங்கள் உங்களுக்குச் சிறப்பாக உதவ இது உதவும்.'
                : 'This helps us tailor the AI Coach to your needs.'}
            </p>
            <button className="new-btn btn-block" onClick={() => app.setOnboardStep(3)}>
              Continue
            </button>
          </>
        )}

        {app.onboardStep === 3 && (
          <>
            <div className="onboarding-emoji">🚀</div>
            <h2 className="onboarding-title">
              {app.appLanguage === 'ta' ? 'தயார்!' : "You're All Set!"}
            </h2>
            <p className="onboarding-sub">
              {app.appLanguage === 'ta'
                ? 'உங்களின் புதிய Life OS-க்கு வரவேற்கிறோம்.'
                : 'Welcome to your new AI-powered Life OS.'}
            </p>
            <button className="new-btn btn-block" onClick={app.handleSaveName}>
              Get Started
            </button>
          </>
        )}

      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
// ✅ FIX: Replaces window.confirm — works on Android/Capacitor
function ConfirmDialog() {
  const app = useApp();
  if (!app.confirmDialog) return null;
  return (
    <div className="overlay confirm-overlay">
      <div className="modal confirm-modal">
        <p className="confirm-message">{app.confirmDialog.message}</p>
        <div className="confirm-actions">
          <button className="new-btn" onClick={app.handleConfirmYes}>
            {app.appLanguage === 'ta' ? 'ஆம்' : 'Yes'}
          </button>
          <button className="hero-btn" onClick={app.handleConfirmNo}>
            {app.appLanguage === 'ta' ? 'இல்லை' : 'No'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Form Modal ──────────────────────────────────────────────────────────
function TaskFormModal() {
  const app = useApp();
  if (!app.showForm) return null;
  return (
    <div className="overlay" onClick={() => app.setShowForm(false)}>
      <div
        className="modal task-form-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="m-title">
          {app.editingGoal ? app.copy.taskForm.editTask : app.copy.taskForm.newTask}
        </div>
        <textarea
          className="fi task-box"
          placeholder={app.copy.taskForm.taskPlaceholder}
          value={app.form.text}
          onChange={e => app.setForm({ ...app.form, text: e.target.value })}
          autoFocus
        />
        <div className="task-form-time-grid">
          <input
            type="time"
            className="fi"
            value={app.form.startTime}
            onChange={e => app.setForm({ ...app.form, startTime: e.target.value })}
          />
          <input
            type="time"
            className="fi"
            value={app.form.endTime}
            onChange={e => app.setForm({ ...app.form, endTime: e.target.value })}
          />
        </div>
        <div className="task-form-actions">
          <button className="new-btn task-form-submit" onClick={app.submitForm}>
            {app.copy.common.addTask}
          </button>
          <button className="hero-btn task-form-cancel" onClick={() => app.setShowForm(false)}>
            {app.copy.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App Entry ───────────────────────────────────────────────────────────
export default function App() {
  return <AppShell />;
}

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell() {
  const app = useApp();

  useMobileFeatures({
    themeMode:      app.themeMode,
    activeView:     app.activeView,
    setActiveView:  app.setActiveView,
    setShowForm:    app.setShowForm,
    setShowMoreMenu: app.setShowMoreMenu,
  });

  const { handleTouchStart, handleTouchEnd } =
    useSwipeTabSwitcher(app.activeView, app.setActiveView);

  useKeyboardShortcuts([
    { key: '1', ctrl: true, action: () => app.setActiveView('insights')  },
    { key: '2', ctrl: true, action: () => app.setActiveView('tasks')     },
    { key: '3', ctrl: true, action: () => app.setActiveView('planner')   },
    { key: '4', ctrl: true, action: () => app.setActiveView('settings')  },
    { key: 'w', ctrl: true, action: () =>
      app.setPlannerView(p => p === 'monthly' ? 'weekly' : 'monthly') },
    { key: '?', action: () => app.setShowShortcuts(s => !s) },
  ]);

  // ✅ FIX: Keyboard shortcuts — useEffect cleaned up
  useEffect(() => {
    const onKey = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key.toLowerCase() === "n") {
        e.preventDefault();
        app.setForm({
          text: "", date: app.activeDate, reminder: "",
          startTime: "", endTime: "", repeat: "None",
          session: "Morning", priority: "Medium"
        });
        app.setEditingGoal(null);
        app.setShowForm(true);
        return;
      }
      if (ctrl && e.key.toLowerCase() === "f") {
        e.preventDefault();
        app.searchRef.current?.focus();
        return;
      }
      if (ctrl && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        app.setUiScale(s => Math.min(130, s + 4));
        return;
      }
      if (ctrl && e.key === "-") {
        e.preventDefault();
        app.setUiScale(s => Math.max(80, s - 4));
        return;
      }
      if (ctrl && e.key === "0") {
        e.preventDefault();
        app.setUiScale(100);
        return;
      }
      if (app.showForm && e.key === "Escape") {
        e.preventDefault();
        app.setShowForm(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [app]);

  const mainTabItems = [
    { id: "insights",  label: app.copy.tabs.insights  || "Dashboard", icon: "🏠" },
    { id: "tasks",     label: app.copy.tabs.tasks     || "Tasks",     icon: "✅" },
    { id: "planner",   label: app.copy.tabs.planner   || "Planner",   icon: "📅" },
    { id: "analytics", label: app.copy.tabs.analytics || "Analytics", icon: "📈" },
    { id: "settings",  label: app.copy.tabs.settings  || "Settings",  icon: "⚙️" },
  ];

  const moreTabItems = [
    { id: "habits",    label: app.copy.tabs.habits    || "Habits",    icon: "🔁" },
    { id: "goals",     label: app.copy.tabs.goals     || "Goals",     icon: "🎯" },
    { id: "tools",     label: app.copy.tabs.tools     || "Tools",     icon: "🛠" },
    { id: "challenge", label: app.copy.tabs.challenge || "Challenge", icon: "🏆" },
    { id: "checkin",   label: app.copy.tabs.checkin   || "Check-in",  icon: "☀️" },
    { id: "chat",      label: app.copy.tabs.chat      || "AI Coach",  icon: "🤖" },
    { id: "referral",  label: app.copy.tabs.referral  || "Refer",     icon: "🎁" },
  ];

  const themeClass       = `theme-${app.themeMode}`;
  const isPlannerMode    = app.activeView === "tasks";

  return (
    <div
      className={`page ${themeClass}${isPlannerMode ? " planner-mode" : ""}`}
      style={{
        "--task-font-size":   `${app.taskFontSize}px`,
        "--task-font-family":  app.taskFontFamily,
        "--ui-scale":         `${app.uiScale / 100}`,
        "--global-font-weight": app.fontWeight,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="app g-lg">

        {/* ── Desktop Tab Navigation ── */}
        <div className="tab-nav">
          {[...mainTabItems, ...moreTabItems].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${app.activeView === tab.id ? 'active' : ''}`}
              onClick={() => { triggerHaptic('light'); app.setActiveView(tab.id); }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Onboarding ── */}
        <OnboardingModal />

        {/* ── Task Form ── */}
        <TaskFormModal />

        {/* ── Confirm Dialog ── */}
        <ConfirmDialog />

        {/* ── Floating Overlays ── */}
        {app.liveTaskPopup && (
          <LiveTaskPopup
            task={app.liveTaskPopup}
            onClose={() => app.setLiveTaskPopup(null)}
          />
        )}

        {app.reminderPopup && (
          <div className="overlay" onClick={() => app.setReminderPopup(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="m-title">{app.copy.alerts.taskReminder}</div>
              <div className="fi reminder-text">{app.reminderPopup.text}</div>
              <button
                className="new-btn btn-block"
                onClick={() => app.setReminderPopup(null)}
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {app.focusMode && (
          <EnhancedFocusMode
            task={app.liveCurrentGoal}
            isActive={app.focusMode}
            onExit={() => app.setFocusMode(false)}
          />
        )}

        {/* ── Main Views ── */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <div className="view-container">
              {app.activeView === "insights"     && <DashboardView />}
              {app.activeView === "tasks"        && <TasksView />}
              {app.activeView === "planner"      && <PlannerView />}
              {app.activeView === "analytics"    && <AnalyticsView />}
              {app.activeView === "settings"     && <SettingsView />}
              {app.activeView === "habits"       && <HabitsView />}
              {app.activeView === "goals"        && <GoalsView />}
              {app.activeView === "chat"         && <ChatAssistantView />}
              {app.activeView === "challenge"    && <ChallengeView />}
              {app.activeView === "checkin"      && <CheckInView />}
              {app.activeView === "subscription" && <SubscriptionView />}
              {app.activeView === "referral"     && <ReferralView />}
              {app.activeView === "tools"        && <ToolsView />}
            </div>
          </Suspense>
        </ErrorBoundary>

        {/* ── Smart Notice Banner ── */}
        {app.smartNotice && (
          <div className={`smart-notice-banner ${app.smartNotice.type}`}>
            <span className="smart-notice-icon">{app.smartNotice.icon}</span>
            <span className="smart-notice-text">{app.smartNotice.text}</span>
            <button
              className="smart-notice-close"
              onClick={() => app.setSmartNotice(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Pomodoro Modal ── */}
        {app.showPomodoro && (
          <div className="overlay" onClick={() => app.setShowPomodoro(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <PomodoroTimer
                onTaskComplete={() => showAppNotification('Pomodoro Done!')}
                onBreakComplete={() => showAppNotification('Break Over!')}
              />
              <button
                className="mini-btn btn-block"
                onClick={() => app.setShowPomodoro(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── Import/Export Modal ── */}
        {app.showImportExport && (
          <div className="overlay" onClick={() => app.setShowImportExport(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <TaskImportExport
                goals={app.goals}
                onImport={app.handleImportTasks}
              />
              <button
                className="mini-btn btn-block"
                onClick={() => app.setShowImportExport(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── Offline Banner ── */}
        {app.isOffline && (
          <div className="offline-banner">📵 Offline</div>
        )}

        {/* ── Rating Prompt ── */}
        {app.showRatingPrompt && (
          <div className="overlay rating-overlay">
            <div className="modal rating-modal">
              <div className="onboarding-emoji">⭐</div>
              <h3 className="rating-title">
                {app.appLanguage === 'ta'
                  ? 'Task Planner பிடித்திருக்கிறதா?'
                  : 'Enjoying Task Planner?'}
              </h3>
              <div className="confirm-actions">
                <button
                  className="new-btn"
                  onClick={() => app.setShowRatingPrompt(false)}
                >
                  {app.appLanguage === 'ta' ? 'மதிப்பிடு' : 'Rate Now'}
                </button>
                <button
                  className="hero-btn"
                  onClick={() => app.setShowRatingPrompt(false)}
                >
                  {app.appLanguage === 'ta' ? 'பின்னர்' : 'Later'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Mobile Bottom Nav ── */}
        {app.userName && (
          <div className="mobile-bottom-nav">
            <div className="mobile-bottom-nav-inner">
              {mainTabItems.map(tab => (
                <button
                  key={tab.id}
                  className={`mobile-nav-btn ${app.activeView === tab.id ? 'active' : ''}`}
                  onClick={() => { triggerHaptic('light'); app.setActiveView(tab.id); }}
                >
                  <span className="mobile-nav-icon">{tab.icon}</span>
                  <span className="mobile-nav-label">{tab.label}</span>
                </button>
              ))}
              <button
                className="mobile-nav-btn"
                onClick={() => app.setShowMoreMenu(!app.showMoreMenu)}
              >
                <span className="mobile-nav-icon">⠿</span>
                <span className="mobile-nav-label">More</span>
              </button>
            </div>
          </div>
        )}

        {/* ── More Menu Bottom Sheet ── */}
        <BottomSheet
          title="More"
          isOpen={app.showMoreMenu}
          onClose={() => app.setShowMoreMenu(false)}
        >
          <div className="more-menu-items">
            {moreTabItems.map(tab => (
              <button
                key={tab.id}
                className={`more-menu-item ${app.activeView === tab.id ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  app.setActiveView(tab.id);
                  app.setShowMoreMenu(false);
                }}
              >
                <span className="more-menu-icon">{tab.icon}</span>
                <span className="more-menu-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </BottomSheet>

        {/* ── Premium Button ── */}
        {!app.isPremium && (
          <div
            className="floating-premium-btn"
            onClick={() => app.setActiveView('subscription')}
          >
            👑 Premium
          </div>
        )}

        {/* ── AI Coach Button ── */}
        {app.activeView !== 'chat' && (
          <div
            className="floating-ai-btn"
            onClick={() => app.setActiveView('chat')}
          >
            🤖
            {app.aiPersonalCoach && <div className="ai-badge">NEW</div>}
          </div>
        )}

      </div>
    </div>
  );
}
