import React, { useState } from 'react';
import { THEME_OPTIONS, FONT_OPTIONS, LANGUAGE_OPTIONS } from '../utils/constants';
import { triggerHaptic } from '../hooks/useMobileFeatures';
import { useApp } from '../context/AppContext';

// ─── Toggle Component ─────────────────────────────────────────────────────────
function Toggle({ value, onChange, color = '#6366f1' }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); triggerHaptic?.('light'); onChange(!value); }}
      aria-checked={value}
      role="switch"
      className="settings-toggle-btn"
      style={{ background: value ? `linear-gradient(135deg, ${color}, #818cf8)` : 'rgba(100,116,139,0.25)' }}
    />
  );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────
function SettingRow({ icon, title, subtitle, right, onClick, danger = false }) {
  return (
    <div
      onClick={onClick}
      className={`settings-row${danger ? ' settings-row-danger' : ''}${onClick ? ' settings-row-clickable' : ''}`}
    >
      <div className="settings-row-left">
        <span className="settings-row-icon">{icon}</span>
        <div>
          <div className={`settings-row-title${danger ? ' settings-row-title-danger' : ''}`}>{title}</div>
          {subtitle && <div className="settings-row-subtitle">{subtitle}</div>}
        </div>
      </div>
      {right && <div className="settings-row-right">{right}</div>}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="card settings-section-card">
      <div className="settings-section-title">{title}</div>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsView() {
  const app = useApp();
  const {
    themeMode, setThemeMode,
    taskFontSize, setTaskFontSize,
    uiScale, setUiScale,
    overdueEnabled, setOverdueEnabled,
    hapticEnabled, setHapticEnabled,
    autoThemeMode, setAutoThemeMode,
    liveHighlightEnabled, setLiveHighlightEnabled,
    appLanguage, setAppLanguage,
    copy, userName,
    notifPerm, requestNotifPerm,
    goals, onReplaceGoals,
    onClearLocalData, onOpenAppSettings,
    bgTheme, setBgTheme,
    showConfirm,
  } = app;

  const [appliedMsg, setAppliedMsg] = useState('');

  const showApplied = () => {
    setAppliedMsg('✅ Applied!');
    setTimeout(() => setAppliedMsg(''), 2000);
  };

  // ─── Theme Section ────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in settings-view">

      {/* Header */}
      <div className="hero">
        <div className="title">⚙️ {copy?.settings?.title || 'Settings'}</div>
        <div className="tip">
          {appLanguage === 'ta'
            ? `வணக்கம் ${userName}! உங்கள் விருப்பங்களை மாற்றுங்கள்.`
            : `Hello ${userName}! Customize your experience.`}
        </div>
      </div>

      {/* Applied message */}
      {appliedMsg && (
        <div className="settings-applied-msg">{appliedMsg}</div>
      )}

      {/* ── Language ── */}
      <Section title="🌐 Language">
        <div className="settings-chip-row">
          {(LANGUAGE_OPTIONS || [{ value: 'en', label: '🇬🇧 English' }, { value: 'ta', label: '🇮🇳 Tamil' }]).map(lang => (
            <button
              key={lang.value}
              className={`settings-chip${appLanguage === lang.value ? ' active' : ''}`}
              onClick={() => { setAppLanguage(lang.value); triggerHaptic?.('light'); showApplied(); }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Theme ── */}
      <Section title={`🎨 ${copy?.settings?.theme || 'Theme'}`}>
        <div className="settings-theme-grid">
          {(THEME_OPTIONS || [{ value: 'dark', label: 'Pure Dark' }, { value: 'light', label: 'Light' }]).map(t => (
            <button
              key={t.value}
              className={`settings-theme-btn${themeMode === t.value ? ' active' : ''}`}
              onClick={() => { setThemeMode(t.value); setAutoThemeMode('off'); triggerHaptic?.('light'); showApplied(); }}
            >
              {t.value === 'dark' ? '🌙' : '☀️'} {t.label}
            </button>
          ))}
        </div>

        {/* Auto mode */}
        <div className="settings-sub-label">Auto Switch</div>
        <div className="settings-chip-row">
          {[
            { label: 'Manual', value: 'off' },
            { label: 'System', value: 'system' },
            { label: 'Time',   value: 'time'   },
          ].map(opt => (
            <button
              key={opt.value}
              className={`settings-chip${autoThemeMode === opt.value ? ' active' : ''}`}
              onClick={() => { setAutoThemeMode(opt.value); triggerHaptic?.('light'); showApplied(); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Display ── */}
      <Section title={`📐 ${copy?.settings?.display || 'Display'}`}>
        {/* Font Size */}
        <div className="settings-slider-row">
          <div className="settings-slider-header">
            <span className="fl">Font Size</span>
            <span className="settings-slider-val" style={{ color: '#10b981' }}>{taskFontSize}px</span>
          </div>
          <input
            type="range" min="14" max="28" value={taskFontSize}
            onChange={e => setTaskFontSize(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#10b981' }}
          />
          <div className="settings-slider-preview" style={{ fontSize: `${taskFontSize}px` }}>
            Sample Task Text
          </div>
        </div>

        {/* UI Scale */}
        <div className="settings-slider-row">
          <div className="settings-slider-header">
            <span className="fl">UI Scale</span>
            <span className="settings-slider-val" style={{ color: '#3b82f6' }}>{uiScale}%</span>
          </div>
          <input
            type="range" min="80" max="115" step="4" value={uiScale}
            onChange={e => setUiScale(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6' }}
          />
        </div>

        <button
          className="new-btn btn-block"
          onClick={() => { triggerHaptic?.('medium'); showApplied(); }}
        >
          Apply Display Settings
        </button>
      </Section>

      {/* ── Notifications ── */}
      <Section title={`🔔 ${copy?.settings?.notifications || 'Notifications'}`}>
        <SettingRow
          icon="📳" title="Haptic Feedback" subtitle="Vibrate on actions"
          right={
            <Toggle value={hapticEnabled ?? true} onChange={v => { setHapticEnabled?.(v); triggerHaptic?.('light'); }} color="#6366f1" />
          }
        />
        <SettingRow
          icon="⚡" title="Live Highlight" subtitle="Auto-popup current task"
          right={
            <Toggle value={liveHighlightEnabled ?? true} onChange={v => setLiveHighlightEnabled?.(v)} color="#10b981" />
          }
        />
        <SettingRow
          icon="⚠️" title="Overdue Alerts" subtitle="Warn when tasks are late"
          right={
            <Toggle value={overdueEnabled} onChange={v => setOverdueEnabled?.(v)} color="#f59e0b" />
          }
        />
      </Section>

      {/* ── Privacy ── */}
      <Section title="🔒 Privacy & Data">
        <div className="settings-privacy-list">
          {[
            { icon: '📱', text: 'All tasks stored only on your device' },
            { icon: '🤖', text: 'AI uses only task counts — never personal content' },
            { icon: '🚫', text: 'We never sell your data' },
            { icon: '💳', text: 'Payments via Razorpay — card details never stored' },
          ].map((item, i) => (
            <div key={i} className="settings-privacy-item">
              <span>{item.icon}</span>
              <span className="settings-privacy-text">{item.text}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Storage ── */}
      <Section title={`🗂 ${copy?.settings?.storage || 'Storage'}`}>
        <SettingRow
          icon="🧹" title="Clear Completed Tasks" subtitle="Remove all done tasks"
          onClick={() => showConfirm(
            appLanguage === 'ta' ? 'முடிந்த பணிகளை நீக்கவா?' : 'Clear all completed tasks?',
            () => onReplaceGoals(goals.filter(g => !g.done && !Object.values(g.doneOn || {}).some(Boolean)))
          )}
          right={<span className="settings-chevron">›</span>}
        />
        <SettingRow
          icon="🗑️" title="Delete All Tasks" subtitle="This cannot be undone"
          danger
          onClick={() => showConfirm(
            appLanguage === 'ta' ? 'அனைத்து பணிகளையும் நீக்கவா?' : 'Delete ALL tasks? This cannot be undone.',
            onClearLocalData
          )}
          right={<span className="settings-chevron">›</span>}
        />
        <button className="tool-btn" style={{ width: '100%' }} onClick={onOpenAppSettings}>
          Open App Settings
        </button>
      </Section>

      {/* ── Reset ── */}
      <Section title="🔄 Reset">
        <button
          className="hero-btn btn-block"
          onClick={() => showConfirm(
            appLanguage === 'ta' ? 'அமைப்புகளை மீட்டமைக்கவா?' : 'Reset all settings to default?',
            () => {
              setThemeMode('dark');
              setTaskFontSize(18);
              setUiScale(96);
              setOverdueEnabled(true);
              setHapticEnabled?.(true);
              setLiveHighlightEnabled?.(true);
              setAutoThemeMode('off');
              setBgTheme('none');
              showApplied();
            }
          )}
        >
          Reset to Defaults
        </button>
      </Section>

    </div>
  );
}