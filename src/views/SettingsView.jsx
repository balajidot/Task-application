import React, { useState, useCallback } from 'react';
import { THEME_OPTIONS, FONT_OPTIONS, LANGUAGE_OPTIONS } from '../utils/constants';
import { triggerHaptic } from '../hooks/useMobileFeatures';

function Toggle({ value, onChange, color = '#6366f1' }) {
  const handleClick = (e) => {
    e.stopPropagation();
    // ✅ FIX 5: Light haptic only
    if (typeof triggerHaptic === 'function') triggerHaptic('light');
    onChange(!value);
  };

  return (
    <button
      onClick={handleClick}
      aria-checked={value}
      role="switch"
      style={{
        width: 56,
        height: 30,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        background: value
          ? `linear-gradient(135deg, ${color}, #818cf8)`
          : 'rgba(100,116,139,0.25)',
        position: 'relative',
        transition: 'background 0.3s ease',
        boxShadow: value ? `0 3px 12px ${color}55` : 'none',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 4,
          left: value ? 30 : 4,
          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
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
        padding: '14px 16px',
        background: 'var(--chip)',
        borderRadius: 14,
        border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'var(--card-border)'}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <span style={{ fontSize: '1.25rem', flexShrink: 0, opacity: 0.9 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: danger ? '#ef4444' : 'var(--text)', letterSpacing: '-0.01em' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 3, fontWeight: 600, lineHeight: 1.3 }}>{subtitle}</div>}
        </div>
      </div>
      {right && <div style={{ flexShrink: 0, marginLeft: 12 }}>{right}</div>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 0, padding: '16px 12px' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 14, paddingLeft: 4, opacity: 0.8 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
  appLanguage, setAppLanguage,
  copy,
  userName, setUserName,
  notifPerm, requestNotifPerm,
  goals, onReplaceGoals,
  onClearCache,
  onClearLocalData,
  onRefreshNotifications,
  onOpenBatterySettings,
  onOpenAppSettings,
  bgTheme, setBgTheme
}) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName || '');
  const [confirmClear, setConfirmClear] = useState(null);
  const [appliedMessage, setAppliedMessage] = useState('');

  // Local state for buffered settings
  const [localSettings, setLocalSettings] = useState({
    themeMode,
    taskFontFamily,
    taskFontSize,
    uiScale,
    fontWeight,
    overdueEnabled,
    soundTheme,
    hapticEnabled,
    autoThemeMode,
    liveHighlightEnabled,
    appLanguage,
    userName,
    bgTheme
  });


  const handleLocalChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const applySection = (keys) => {
    if (typeof triggerHaptic === 'function') triggerHaptic('light');

    keys.forEach(key => {
      const value = localSettings[key];
      switch (key) {
        case 'themeMode': setThemeMode(value); break;
        case 'taskFontFamily': setTaskFontFamily(value); break;
        case 'taskFontSize': setTaskFontSize(value); break;
        case 'uiScale': setUiScale(value); break;
        case 'fontWeight': setFontWeight(value); break;
        case 'overdueEnabled': setOverdueEnabled(value); break;
        case 'soundTheme': setSoundTheme(value); break;
        case 'hapticEnabled': setHapticEnabled?.(value); break;
        case 'autoThemeMode': setAutoThemeMode(value); break;
        case 'liveHighlightEnabled': setLiveHighlightEnabled(value); break;
        case 'appLanguage': setAppLanguage(value); break;
        case 'bgTheme': setBgTheme(value); break;
        case 'userName':
          if (value !== userName) {
            setUserName(value);
            localStorage.setItem('taskPlanner_userName', value);
          }
          break;
        default: break;
      }
    });

    setAppliedMessage('Changes applied!');
    setTimeout(() => setAppliedMessage(''), 2000);
  };

  const isDirty = (keys) => {
    const current = {
      themeMode, taskFontFamily, taskFontSize, uiScale, fontWeight,
      overdueEnabled, soundTheme, hapticEnabled, autoThemeMode,
      liveHighlightEnabled, appLanguage, userName, bgTheme
    };
    return keys.some(key => localSettings[key] !== current[key]);
  };

  const ApplyButton = ({ keys }) => {
    if (!isDirty(keys)) return null;
    return (
      <button
        onClick={() => applySection(keys)}
        style={{
          marginTop: 12, width: '100%', padding: '10px', borderRadius: 10,
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
          border: 'none', fontWeight: 900, fontSize: '.85rem', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37,99,235,0.25)', animation: 'fadeUp 0.2s ease'
        }}
      >
        Apply {keys.length > 1 ? 'Changes' : 'Setting'}
      </button>
    );
  };

  const isTamil = localSettings.appLanguage === 'ta';
  const notifLabel = notifPerm === 'granted'
    ? (isTamil ? 'அனுமதிக்கப்பட்டது' : 'Enabled')
    : notifPerm === 'denied'
      ? (isTamil ? 'அனுமதி மறுக்கப்பட்டது' : 'Blocked in settings')
      : (isTamil ? 'செயல்படுத்தப்படவில்லை' : 'Not enabled yet');

  const notifColor = notifPerm === 'granted' ? '#10b981' : notifPerm === 'denied' ? '#ef4444' : '#f59e0b';

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 100 }}>

      {appliedMessage && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3000,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          padding: '10px 20px',
          borderRadius: 99,
          color: '#fff',
          fontWeight: 900,
          boxShadow: '0 10px 30px rgba(16,185,129,0.3)',
          animation: 'fadeUp 0.3s ease'
        }}>
          {appliedMessage}
        </div>
      )}

      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title">{copy.settings.title}</div>
            <div className="tip">{copy.settings.subtitle}</div>
          </div>
          <button className="hero-btn" onClick={() => setActiveView('tasks')}>
            {copy.common.tasks}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 4px' }}>
        <Section title={copy.settings.language}>
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleLocalChange('appLanguage', option.value)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 10,
                    border: localSettings.appLanguage === option.value ? '2px solid #10b981' : '1px solid var(--card-border)',
                    background: localSettings.appLanguage === option.value ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.10))' : 'var(--card)',
                    color: 'var(--text)',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <ApplyButton keys={['appLanguage']} />
          </div>
        </Section>

        <Section title={copy.settings.profile}>
          <div style={{ padding: '16px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: editingName ? 14 : 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'grid', placeItems: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                {localSettings.userName ? localSettings.userName[0].toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>{localSettings.userName || 'Set your name'}</div>
              </div>
              <button onClick={() => setEditingName(!editingName)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: editingName ? 'var(--card-border)' : 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', fontWeight: 800, fontSize: '.8rem' }}>
                {editingName ? 'Hide' : 'Edit'}
              </button>
            </div>
            {editingName && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <input type="text" value={localSettings.userName} onChange={(e) => handleLocalChange('userName', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)} autoFocus placeholder="Enter your name..." maxLength={30} className="fi" style={{ flex: 1 }} />
              </div>
            )}
            <ApplyButton keys={['userName']} />
          </div>
        </Section>

        {/* ✅ FIX 14: AI Coach Tone Selector */}
        <Section title="🤖 AI Coach Tone">
          <div style={{ padding: '14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700, marginBottom: 12 }}>
              How should your AI coach speak to you?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[
                { value: 'strict', label: '💪 Strict', sub: 'No excuses' },
                { value: 'motivational', label: '🔥 Hype', sub: 'Energizing' },
                { value: 'friendly', label: '😊 Friendly', sub: 'Supportive' },
              ].map(t => {
                const saved = localStorage.getItem('taskPlanner_coachTone') || 'motivational';
                const isActive = saved === t.value;
                return (
                  <button key={t.value} onClick={() => { localStorage.setItem('taskPlanner_coachTone', t.value); window.location.reload(); }}
                    style={{
                      padding: '12px 6px', borderRadius: 12, border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--card-border)'}`,
                      background: isActive ? 'var(--accent-soft)' : 'var(--card)',
                      color: isActive ? 'var(--accent)' : 'var(--text)',
                      fontWeight: 800, fontSize: '.75rem', cursor: 'pointer', textAlign: 'center'
                    }}>
                    <div>{t.label}</div>
                    <div style={{ fontSize: '.65rem', color: isActive ? 'var(--accent)' : 'var(--muted)', fontWeight: 600, marginTop: 2 }}>{t.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ✅ Phase 3: Data Privacy Statement */}
        <Section title="🔒 Privacy & Data">
          <div style={{ padding: '14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            {[
              { icon: '📱', text: 'Your tasks and habits are stored only on your device' },
              { icon: '🤖', text: 'AI features send only task counts and dates — never personal content' },
              { icon: '🚫', text: 'We never sell your data to third parties' },
              { icon: '💳', text: 'Payments are processed securely by Razorpay — we never see your card details' },
              { icon: '🗑️', text: 'Delete all your data anytime from Settings → Clear Data' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--card-border)' : 'none' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title={copy.settings.theme}>
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)', marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)', marginBottom: 8 }}>Auto Switch Mode</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Manual', value: 'off' },
                { label: 'System', value: 'system' },
                { label: 'Time', value: 'time' }
              ].map((option) => (
                <button key={option.value} onClick={() => handleLocalChange('autoThemeMode', option.value)} style={{ padding: '10px 6px', borderRadius: 10, border: localSettings.autoThemeMode === option.value ? '2px solid #10b981' : '1.5px solid var(--card-border)', background: localSettings.autoThemeMode === option.value ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.12))' : 'var(--card)', color: localSettings.autoThemeMode === option.value ? '#10b981' : 'var(--text)', fontWeight: localSettings.autoThemeMode === option.value ? 900 : 700, fontSize: '.78rem', cursor: 'pointer' }}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {THEME_OPTIONS.map((theme) => (
              <button key={theme.value} onClick={() => { handleLocalChange('autoThemeMode', 'off'); handleLocalChange('themeMode', theme.value); }} style={{ padding: '16px 10px', borderRadius: 14, border: localSettings.themeMode === theme.value ? '2.5px solid #3b82f6' : '1.5px solid var(--card-border)', background: localSettings.themeMode === theme.value ? 'rgba(59,130,246,0.15)' : 'var(--chip)', color: localSettings.themeMode === theme.value ? '#3b82f6' : 'var(--text)', fontWeight: 900, fontSize: '.9rem', cursor: 'pointer', textAlign: 'center', boxShadow: localSettings.themeMode === theme.value ? '0 4px 12px rgba(59,130,246,0.2)' : 'none' }}>
                {theme.label}
              </button>
            ))}
          </div>
          <ApplyButton keys={['themeMode', 'autoThemeMode']} />
        </Section>

        <Section title={copy.settings.display}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div className="fl">Font Family</div>
              <select className="fi" value={localSettings.taskFontFamily} onChange={(e) => handleLocalChange('taskFontFamily', e.target.value)}>
                {FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="fl">Font Size</span>
                <span style={{ fontWeight: 900, color: '#10b981' }}>{localSettings.taskFontSize}px</span>
              </div>
              <input type="range" min="14" max="42" value={localSettings.taskFontSize} onChange={(e) => handleLocalChange('taskFontSize', Number(e.target.value))} style={{ width: '100%', accentColor: '#10b981' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="fl">Font Weight</span>
                <span style={{ fontWeight: 900, color: '#6366f1' }}>{localSettings.fontWeight}</span>
              </div>
              <input type="range" min="400" max="900" step="100" value={localSettings.fontWeight} onChange={(e) => handleLocalChange('fontWeight', Number(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="fl">UI Scale</span>
                <span style={{ fontWeight: 900, color: '#3b82f6' }}>{localSettings.uiScale}%</span>
              </div>
              <input type="range" min="80" max="130" step="4" value={localSettings.uiScale} onChange={(e) => handleLocalChange('uiScale', Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
            </div>
            <ApplyButton keys={['taskFontFamily', 'taskFontSize', 'fontWeight', 'uiScale']} />
          </div>
        </Section>

        <Section title={copy.settings.notifications}>
          {/* ✅ FIX 2+3: Toggles apply instantly — no Apply button needed */}
          <SettingRow icon="🔔" title="Haptic Feedback" subtitle="Vibrate on actions" right={
            <Toggle value={localSettings.hapticEnabled ?? true} onChange={(v) => {
              handleLocalChange('hapticEnabled', v);
              setHapticEnabled?.(v);
              localStorage.setItem('taskPlanner_hapticEnabled', String(v));
              if (v) import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light })).catch(() => { });
            }} color="#6366f1" />
          } />
          <SettingRow icon="⚡" title="Live Highlight" subtitle="Auto-popup current task" right={
            <Toggle value={localSettings.liveHighlightEnabled ?? true} onChange={(v) => {
              handleLocalChange('liveHighlightEnabled', v);
              setLiveHighlightEnabled?.(v);
            }} color="#10b981" />
          } />
          <SettingRow icon="🔊" title="Sound Theme" right={
            <select value={localSettings.soundTheme} onChange={(e) => { handleLocalChange('soundTheme', e.target.value); setSoundTheme?.(e.target.value); }} className="fs" style={{ width: 'auto', padding: '6px 12px' }}>
              {['default', 'gentle', 'chime', 'silent'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          } />
          <SettingRow icon="⚠️" title="Overdue Alerts" subtitle="Show warning color when time passes" right={
            <Toggle value={localSettings.overdueEnabled} onChange={(v) => { handleLocalChange('overdueEnabled', v); setOverdueEnabled?.(v); }} color="#f59e0b" />
          } />
        </Section>

        <Section title={copy.settings.storage}>
          <SettingRow icon="C" title="Clear Completed" onClick={() => setConfirmClear('completed')} right={<span>&gt;</span>} />
          <SettingRow icon="W" title="Delete All Tasks" onClick={() => setConfirmClear('all')} danger right={<span>&gt;</span>} />
          <button className="tool-btn" onClick={onOpenAppSettings} style={{ width: '100%' }}>Open App Settings</button>
        </Section>

        <Section title={copy.settings.reset}>
          <button onClick={() => {
            if (window.confirm('Reset all settings to default?')) {
              setLocalSettings({
                themeMode: 'dark',
                taskFontFamily: FONT_OPTIONS[0].value,
                taskFontSize: 18,
                uiScale: 96,
                fontWeight: 500,
                overdueEnabled: true,
                soundTheme: 'default',
                hapticEnabled: true,
                autoThemeMode: 'off',
                liveHighlightEnabled: true,
                appLanguage: 'en',
                bgTheme: 'none'
              });
            }
          }} style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--chip)', color: 'var(--text)', fontWeight: 800 }}>
            Reset Settings Defaults
          </button>
        </Section>
      </div>

      {confirmClear && (
        <div className="overlay" style={{ zIndex: 5000 }}>
          <div className="modal">
            <div className="m-title">Confirm {confirmClear === 'all' ? 'Full Delete' : 'Clear'}</div>
            <div style={{ marginBottom: 20, color: 'var(--muted)', fontWeight: 600 }}>
              Are you sure you want to {confirmClear === 'all' ? 'delete ALL tasks' : 'clear completed tasks'}? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { if (confirmClear === 'all') onClearLocalData(); else onReplaceGoals([]); setConfirmClear(null); }} className="new-btn btn-block" style={{ background: '#ef4444' }}>Yes, Delete</button>
              <button onClick={() => setConfirmClear(null)} className="hero-btn btn-block">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

