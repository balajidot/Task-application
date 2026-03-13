import React, { useState, useCallback } from 'react';
import { THEME_OPTIONS, FONT_OPTIONS } from '../utils/constants';

function Toggle({ value, onChange, color = '#10b981' }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 52,
        height: 28,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        background: value ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'var(--card-border)',
        position: 'relative',
        transition: 'all 0.25s ease',
        boxShadow: value ? `0 2px 8px ${color}55` : 'inset 0 1px 3px rgba(0,0,0,0.1)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 3,
          left: value ? 27 : 3,
          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}
      />
    </button>
  );
}

function SettingRow({ icon, title, subtitle, right, onClick, danger = false }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '13px 14px',
        background: 'var(--chip)',
        borderRadius: 12,
        border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'var(--card-border)'}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '.92rem', color: danger ? '#ef4444' : 'var(--text)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 2, fontWeight: 600 }}>{subtitle}</div>}
        </div>
      </div>
      {right && <div style={{ flexShrink: 0, marginLeft: 12 }}>{right}</div>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 2 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

export default function SettingsView({
  setActiveView,
  themeMode, setThemeMode,
  taskFontFamily, setTaskFontFamily,
  taskFontSize, setTaskFontSize,
  uiScale, setUiScale,
  fontWeight, setFontWeight,
  overdueEnabled, setOverdueEnabled,
  soundTheme, setSoundTheme,
  hapticEnabled, setHapticEnabled,
  autoThemeMode, setAutoThemeMode,
  liveHighlightEnabled, setLiveHighlightEnabled,
  userName, setUserName,
  notifPerm, requestNotifPerm,
  goals, onReplaceGoals,
  onClearCache,
  onClearLocalData,
  onRefreshNotifications,
}) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName || '');
  const [confirmClear, setConfirmClear] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  const SOUND_OPTIONS = [
    { label: 'Default', value: 'default' },
    { label: 'Gentle', value: 'gentle' },
    { label: 'Chime', value: 'chime' },
    { label: 'Silent', value: 'silent' },
  ];

  const AUTO_THEME_OPTIONS = [
    { label: 'Manual', value: 'off' },
    { label: 'System', value: 'system' },
    { label: 'Day/Night', value: 'time' },
  ];

  const saveName = () => {
    const name = tempName.trim();
    if (!name) return;
    setUserName(name);
    localStorage.setItem('taskPlanner_userName', name);
    setEditingName(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const notifLabel = notifPerm === 'granted'
    ? 'Enabled'
    : notifPerm === 'denied'
      ? 'Blocked in device settings'
      : 'Not enabled yet';

  const notifColor = notifPerm === 'granted' ? '#10b981' : notifPerm === 'denied' ? '#ef4444' : '#f59e0b';

  const clearCompleted = useCallback(() => {
    const updated = goals.filter((goal) => {
      if (goal.repeat === 'None') return !goal.done;
      return !Object.keys(goal.doneOn || {}).length;
    });
    onReplaceGoals(updated);
    setConfirmClear(null);
  }, [goals, onReplaceGoals]);

  const clearAllTasks = useCallback(() => {
    onReplaceGoals([]);
    setConfirmClear(null);
  }, [onReplaceGoals]);

  const resetSettings = () => {
    setThemeMode('dark');
    setAutoThemeMode('off');
    setTaskFontSize(18);
    setTaskFontFamily(FONT_OPTIONS[0].value);
    setUiScale(96);
    setFontWeight(500);
    setSoundTheme('default');
    setHapticEnabled?.(true);
    setOverdueEnabled(true);
    setLiveHighlightEnabled(true);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title">Settings</div>
            <div className="tip">Personalize, clean up, and keep the app healthy</div>
          </div>
          <button className="hero-btn" onClick={() => setActiveView('tasks')}>
            Tasks
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 4px' }}>
        <Section title="Profile">
          <div style={{ padding: '16px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: editingName ? 14 : 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'grid', placeItems: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                {userName ? userName[0].toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>{userName || 'Set your name'}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>Task Planner profile</div>
              </div>
              <button
                onClick={() => { setEditingName(!editingName); setTempName(userName || ''); }}
                style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: editingName ? 'var(--card-border)' : 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', fontWeight: 800, fontSize: '.8rem' }}
              >
                {editingName ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingName && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  autoFocus
                  placeholder="Enter your name..."
                  maxLength={30}
                  style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '2px solid rgba(59,130,246,0.35)', background: 'var(--card)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                />
                <button
                  onClick={saveName}
                  disabled={!tempName.trim()}
                  style={{ padding: '11px 18px', borderRadius: 10, border: 'none', cursor: tempName.trim() ? 'pointer' : 'not-allowed', background: tempName.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--card-border)', color: '#fff', fontWeight: 800, fontSize: '.9rem', opacity: tempName.trim() ? 1 : 0.5 }}
                >
                  Save
                </button>
              </div>
            )}

            {justSaved && <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 800, fontSize: '.85rem', marginTop: 8 }}>Name saved</div>}
          </div>
        </Section>

        <Section title="Notifications">
          <div style={{ padding: '13px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '.92rem', color: 'var(--text)' }}>Reminder Notifications</div>
                <div style={{ fontSize: '.75rem', fontWeight: 700, marginTop: 3, color: notifColor }}>{notifLabel}</div>
              </div>
              {notifPerm !== 'granted' ? (
                <button
                  onClick={() => requestNotifPerm?.()}
                  style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 800, fontSize: '.82rem' }}
                >
                  Enable
                </button>
              ) : (
                <button className="mini-btn" onClick={onRefreshNotifications}>Refresh</button>
              )}
            </div>
          </div>

          <SettingRow
            icon="V"
            title="Haptic Feedback"
            subtitle="Vibration on key task actions"
            right={<Toggle value={hapticEnabled ?? true} onChange={(value) => setHapticEnabled?.(value)} color="#6366f1" />}
          />

          <SettingRow
            icon="L"
            title="Live Task Highlight"
            subtitle="Auto-popup and stronger highlight for the current task"
            right={<Toggle value={liveHighlightEnabled ?? true} onChange={(value) => setLiveHighlightEnabled?.(value)} color="#10b981" />}
          />

          <SettingRow
            icon="S"
            title="Sound Theme"
            subtitle="Reminder and completion sounds"
            right={
              <select
                value={soundTheme}
                onChange={(e) => setSoundTheme(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{ padding: '7px 12px', borderRadius: 10, background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--card-border)', fontWeight: 800, fontSize: '.82rem', cursor: 'pointer' }}
              >
                {SOUND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            }
          />
        </Section>

        <Section title="Theme">
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)', marginBottom: 8 }}>Auto Mode</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {AUTO_THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAutoThemeMode(option.value)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: 10,
                    border: autoThemeMode === option.value ? '2px solid #10b981' : '1.5px solid var(--card-border)',
                    background: autoThemeMode === option.value ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.12))' : 'var(--card)',
                    color: autoThemeMode === option.value ? '#10b981' : 'var(--text)',
                    fontWeight: autoThemeMode === option.value ? 900 : 700,
                    fontSize: '.78rem',
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.value}
                onClick={() => { setAutoThemeMode('off'); setThemeMode(theme.value); }}
                style={{
                  padding: '10px 6px',
                  borderRadius: 10,
                  border: themeMode === theme.value ? '2px solid #3b82f6' : '1.5px solid var(--card-border)',
                  background: themeMode === theme.value ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(16,185,129,0.12))' : 'var(--chip)',
                  color: themeMode === theme.value ? '#3b82f6' : 'var(--text)',
                  fontWeight: themeMode === theme.value ? 900 : 700,
                  fontSize: '.78rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Display">
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)', marginBottom: 8 }}>Font Style</div>
            <select className="fi" value={taskFontFamily} onChange={(e) => setTaskFontFamily(e.target.value)} style={{ fontSize: '14px', width: '100%' }}>
              {FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
            </select>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)' }}>Task Font Size</div>
              <span style={{ padding: '3px 10px', borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', fontWeight: 900, fontSize: '.82rem' }}>{taskFontSize}px</span>
            </div>
            <input type="range" min="12" max="32" value={taskFontSize} onChange={(e) => setTaskFontSize(Number(e.target.value))} style={{ width: '100%', accentColor: '#10b981' }} />
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)' }}>Font Weight</div>
              <span style={{ padding: '3px 10px', borderRadius: 8, background: 'var(--card)', color: 'var(--text)', fontWeight: 900, fontSize: '.82rem', border: '1px solid var(--card-border)' }}>{fontWeight}</span>
            </div>
            <input type="range" min="400" max="900" step="100" value={fontWeight} onChange={(e) => setFontWeight(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)' }}>UI Scale</div>
              <span style={{ padding: '3px 10px', borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', fontWeight: 900, fontSize: '.82rem' }}>{uiScale}%</span>
            </div>
            <input type="range" min="80" max="130" step="4" value={uiScale} onChange={(e) => setUiScale(Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
          </div>
        </Section>

        <Section title="Behavior">
          <SettingRow
            icon="!"
            title="Overdue Alerts"
            subtitle="Show warning styling when tasks pass their end time"
            right={<Toggle value={overdueEnabled} onChange={setOverdueEnabled} color="#f59e0b" />}
          />
        </Section>

        <Section title="Storage">
          <SettingRow
            icon="C"
            title="Clear Completed Tasks"
            subtitle="Remove finished tasks but keep pending work"
            onClick={() => setConfirmClear('completed')}
            right={<span style={{ color: 'var(--muted)', fontSize: '1rem' }}>{'>'}</span>}
          />
          <SettingRow
            icon="K"
            title="Clear Cache"
            subtitle="Remove service worker and cached files"
            onClick={onClearCache}
            right={<span style={{ color: 'var(--muted)', fontSize: '1rem' }}>Run</span>}
          />
          <SettingRow
            icon="W"
            title="Delete All Tasks"
            subtitle="Wipe the whole task list"
            onClick={() => setConfirmClear('all')}
            danger
            right={<span style={{ color: '#ef4444', fontSize: '1rem' }}>{'>'}</span>}
          />
          <SettingRow
            icon="R"
            title="Reset Full App Data"
            subtitle="Clear tasks, prefs, habits, journal, and profile"
            onClick={onClearLocalData}
            danger
            right={<span style={{ color: '#ef4444', fontSize: '1rem' }}>Run</span>}
          />

          {confirmClear === 'completed' && (
            <div style={{ padding: '14px', background: 'rgba(239,68,68,0.08)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.25)' }}>
              <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: 10, fontSize: '.9rem' }}>Remove all completed tasks?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={clearCompleted} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '.85rem' }}>Yes, clear</button>
                <button onClick={() => setConfirmClear(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--card-border)', color: 'var(--text)', fontWeight: 800, fontSize: '.85rem' }}>Cancel</button>
              </div>
            </div>
          )}

          {confirmClear === 'all' && (
            <div style={{ padding: '14px', background: 'rgba(239,68,68,0.12)', borderRadius: 12, border: '1.5px solid rgba(239,68,68,0.4)' }}>
              <div style={{ fontWeight: 900, color: '#ef4444', marginBottom: 6, fontSize: '.95rem' }}>Delete all tasks?</div>
              <div style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 600, marginBottom: 12 }}>This cannot be undone.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={clearAllTasks} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', fontWeight: 900, fontSize: '.85rem' }}>Delete all</button>
                <button onClick={() => setConfirmClear(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--card-border)', color: 'var(--text)', fontWeight: 800, fontSize: '.85rem' }}>Cancel</button>
              </div>
            </div>
          )}
        </Section>

        <Section title="Preview">
          <div style={{ padding: '16px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--muted)', marginBottom: 10 }}>Sample task with your current settings:</div>
            <div style={{ padding: '12px 14px', background: 'var(--card)', borderRadius: 10, border: '1px solid var(--card-border)', fontFamily: taskFontFamily, fontSize: taskFontSize, fontWeight: fontWeight, color: 'var(--text)', lineHeight: 1.5 }}>
              Prepare client update - 10:00 AM
            </div>
          </div>
        </Section>

        <Section title="Reset">
          <button
            onClick={resetSettings}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1px solid var(--card-border)', cursor: 'pointer', background: 'var(--chip)', color: 'var(--text)', fontWeight: 800, fontSize: '.92rem' }}
          >
            Reset settings to default
          </button>
        </Section>
      </div>
    </div>
  );
}
