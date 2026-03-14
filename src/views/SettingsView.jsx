import React, { useState, useCallback } from 'react';
import { THEME_OPTIONS, FONT_OPTIONS, LANGUAGE_OPTIONS } from '../utils/constants';
import { triggerHaptic } from '../hooks/useMobileFeatures';

function Toggle({ value, onChange, color = '#10b981' }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (typeof triggerHaptic === 'function') triggerHaptic('medium');
    onChange(!value);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        width: 58,
        height: 32,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        background: value ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'rgba(255,255,255,0.08)',
        position: 'relative',
        transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        boxShadow: value ? `0 6px 15px ${color}33` : 'none',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 4,
          left: value ? 30 : 4,
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
          transform: `scale(${value ? 1 : 0.95})`,
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
  cardTheme, setCardTheme,
  cardBorderColor, setCardBorderColor,
  showCardDot, setShowCardDot
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


  const [appliedSection, setAppliedSection] = useState(null);

  const triggerApply = (section) => {
    if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
    setAppliedSection(section);
    setTimeout(() => setAppliedSection(null), 2000);
  };

  const saveName = () => {
    const name = tempName.trim();
    if (!name) return;
    setUserName(name);
    localStorage.setItem('taskPlanner_userName', name);
    setEditingName(false);
    triggerApply('profile');
  };

  const isTamil = appLanguage === 'ta';
  const notifLabel = notifPerm === 'granted' 
    ? (isTamil ? 'அனுமதிக்கப்பட்டது' : 'Enabled') 
    : notifPerm === 'denied' 
      ? (isTamil ? 'அனுமதி மறுக்கப்பட்டது' : 'Blocked in settings') 
      : (isTamil ? 'செயல்படுத்தப்படவில்லை' : 'Not enabled yet');
  
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
    setAppLanguage('en');
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
            <div className="title">{copy.settings.title}</div>
            <div className="tip">{copy.settings.subtitle}</div>
          </div>
          <button className="hero-btn" onClick={() => setActiveView('tasks')}>
            {copy.common.tasks}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 4px' }}>
        <Section title={copy.settings.language}>
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)', marginBottom: 8 }}>{copy.settings.languageSubtitle}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setAppLanguage(option.value); triggerApply('language'); }}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 10,
                    border: appLanguage === option.value ? '2px solid #10b981' : '1px solid var(--card-border)',
                    background: appLanguage === option.value ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.10))' : 'var(--card)',
                    color: 'var(--text)',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {appliedSection === 'language' && <div style={{ color: '#10b981', fontSize: '.75rem', fontWeight: 800, textAlign: 'center', marginTop: 8 }}>App Language Applied</div>}
          </div>
        </Section>

        <Section title={copy.settings.profile}>
          <div style={{ padding: '16px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: editingName ? 14 : 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'grid', placeItems: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                {userName ? userName[0].toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>{userName || 'Set your name'}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>Task Planner profile</div>
              </div>
              <button onClick={() => { setEditingName(!editingName); setTempName(userName || ''); }} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: editingName ? 'var(--card-border)' : 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', fontWeight: 800, fontSize: '.8rem' }}>
                {editingName ? copy.common.cancel : 'Edit'}
              </button>
            </div>
            {editingName && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveName()} autoFocus placeholder="Enter your name..." maxLength={30} style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '2px solid rgba(59,130,246,0.35)', background: 'var(--card)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }} />
                <button onClick={saveName} disabled={!tempName.trim()} style={{ padding: '11px 18px', borderRadius: 10, border: 'none', cursor: tempName.trim() ? 'pointer' : 'not-allowed', background: tempName.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--card-border)', color: '#fff', fontWeight: 800, fontSize: '.9rem', opacity: tempName.trim() ? 1 : 0.5 }}>
                  {copy.common.save}
                </button>
              </div>
            )}
            {appliedSection === 'profile' && <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 800, fontSize: '.85rem', marginTop: 8 }}>Profile Updated</div>}
          </div>
        </Section>

        <Section title={copy.settings.notifications}>
          <div style={{ padding: '13px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '.92rem', color: 'var(--text)' }}>Reminder Notifications</div>
                <div style={{ fontSize: '.75rem', fontWeight: 700, marginTop: 3, color: notifColor }}>{notifLabel}</div>
              </div>
              {notifPerm === 'granted' ? (
                <button className="mini-btn" onClick={onRefreshNotifications}>
                  {isTamil ? 'புதுப்பி' : copy.common.refresh}
                </button>
              ) : notifPerm === 'denied' ? (
                <button onClick={() => onOpenAppSettings?.()} className="new-btn" style={{ background: '#ef4444' }}>
                  {isTamil ? 'அமைப்புகள்' : 'Settings'}
                </button>
              ) : (
                <button onClick={() => {
                  if (typeof triggerHaptic === 'function') triggerHaptic('medium');
                  requestNotifPerm?.();
                }} className="new-btn">
                  {isTamil ? 'இயக்கு' : copy.common.enable}
                </button>
              )}
            </div>
          </div>
          <SettingRow icon="V" title="Haptic Feedback" subtitle="Vibration on key task actions" right={<Toggle value={hapticEnabled ?? true} onChange={(value) => setHapticEnabled?.(value)} color="#6366f1" />} />
          <SettingRow icon="L" title="Live Task Highlight" subtitle="Auto-popup and stronger highlight for the current task" right={<Toggle value={liveHighlightEnabled ?? true} onChange={(value) => setLiveHighlightEnabled?.(value)} color="#10b981" />} />
          <SettingRow
            icon="S"
            title="Sound Theme"
            subtitle="Reminder and completion sounds"
            right={
              <select value={soundTheme} onChange={(e) => { setSoundTheme(e.target.value); triggerApply('notif'); }} onClick={(e) => e.stopPropagation()} style={{ padding: '7px 12px', borderRadius: 10, background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--card-border)', fontWeight: 800, fontSize: '.82rem', cursor: 'pointer' }}>
                {SOUND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            }
          />
          {appliedSection === 'notif' && <div style={{ color: '#10b981', fontSize: '.75rem', fontWeight: 800, textAlign: 'center', padding: 8 }}>Preferences Applied</div>}
          <div style={{ marginTop: 8, padding: '12px', background: 'rgba(59,130,246,0.05)', borderRadius: 10, border: '1px dashed rgba(59,130,246,0.3)' }}>
             <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#3b82f6', marginBottom: 8, textTransform: 'uppercase' }}>Troubleshooting</div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="tool-btn" style={{ padding: '8px', fontSize: '.75rem' }} onClick={onRefreshNotifications}>Force Refresh Schedule</button>
                <button className="tool-btn" style={{ padding: '8px', fontSize: '.75rem' }} onClick={onOpenAppSettings}>Open Device Settings</button>
             </div>
             <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 8, fontWeight: 600 }}>
                If reminders stop when app is closed, ensure "Exact Alarms" and "Unrestricted Battery" are enabled in App Settings.
             </div>
          </div>
        </Section>


        <Section title={copy.settings.theme}>
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)', marginBottom: 8 }}>Auto Mode</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {AUTO_THEME_OPTIONS.map((option) => (
                <button key={option.value} onClick={() => { setAutoThemeMode(option.value); triggerApply('theme'); }} style={{ padding: '10px 6px', borderRadius: 10, border: autoThemeMode === option.value ? '2px solid #10b981' : '1.5px solid var(--card-border)', background: autoThemeMode === option.value ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.12))' : 'var(--card)', color: autoThemeMode === option.value ? '#10b981' : 'var(--text)', fontWeight: autoThemeMode === option.value ? 900 : 700, fontSize: '.78rem', cursor: 'pointer' }}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {THEME_OPTIONS.map((theme) => (
              <button key={theme.value} onClick={() => { setAutoThemeMode('off'); setThemeMode(theme.value); triggerApply('theme'); }} style={{ padding: '10px 6px', borderRadius: 10, border: themeMode === theme.value ? '2px solid #3b82f6' : '1.5px solid var(--card-border)', background: themeMode === theme.value ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(16,185,129,0.12))' : 'var(--chip)', color: themeMode === theme.value ? '#3b82f6' : 'var(--text)', fontWeight: themeMode === theme.value ? 900 : 700, fontSize: '.78rem', cursor: 'pointer', textAlign: 'center', lineHeight: 1.3 }}>
                {theme.label}
              </button>
            ))}
          </div>
          {appliedSection === 'theme' && <div style={{ color: '#3b82f6', fontSize: '.75rem', fontWeight: 800, textAlign: 'center', marginTop: 8 }}>Theme Settings Applied</div>}
        </Section>

        <Section title="TASK CARD THEMES">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {['glow', 'border', 'minimal'].map(t => (
                <button key={t} onClick={() => { setCardTheme(t); triggerApply('card'); }} style={{ 
                  padding: '12px 6px', borderRadius: 10, textTransform: 'capitalize',
                  border: cardTheme === t ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                  background: cardTheme === t ? 'var(--chip)' : 'var(--card)',
                  color: cardTheme === t ? 'var(--accent)' : 'var(--text)',
                  fontWeight: 800, fontSize: '.75rem'
                }}>
                  {t}
                </button>
              ))}
            </div>
            
            <SettingRow icon="◎" title="Status Indicator Dot" subtitle="Show priority color dot on task cards" right={<Toggle value={showCardDot} onChange={(v) => { setShowCardDot(v); triggerApply('card'); }} color="#10b981" />} />

            <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
              <div style={{ fontWeight: 800, fontSize: '.8rem', color: 'var(--muted)', marginBottom: 10 }}>Card Accent Color</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'].map(c => (
                  <button key={c} onClick={() => { setCardBorderColor(c); triggerApply('card'); }} style={{ 
                    width: 32, height: 32, borderRadius: '50%', background: c, border: cardBorderColor === c ? '2.5px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: cardBorderColor === c ? `0 0 10px ${c}` : 'none', cursor: 'pointer'
                  }} />
                ))}
              </div>
            </div>
            {appliedSection === 'card' && <div style={{ color: '#10b981', fontSize: '.75rem', fontWeight: 800, textAlign: 'center' }}>Card Style Updated</div>}
          </div>
        </Section>

        <Section title={copy.settings.display}>
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)', marginBottom: 8 }}>Font Style</div>
            <select className="fi" value={taskFontFamily} onChange={(e) => { setTaskFontFamily(e.target.value); triggerApply('display'); }} style={{ fontSize: '14px', width: '100%', background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              {FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
            </select>
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)' }}>Task Font Size</div>
              <span style={{ padding: '3px 10px', borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', fontWeight: 900, fontSize: '.82rem' }}>{taskFontSize}px</span>
            </div>
            <input type="range" min="14" max="42" value={taskFontSize} onChange={(e) => { setTaskFontSize(Number(e.target.value)); }} onMouseUp={() => triggerApply('display')} onTouchEnd={() => triggerApply('display')} style={{ width: '100%', accentColor: '#10b981' }} />
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)' }}>Font Weight</div>
              <span style={{ padding: '3px 10px', borderRadius: 8, background: 'var(--card)', color: 'var(--text)', fontWeight: 900, fontSize: '.82rem', border: '1px solid var(--card-border)' }}>{fontWeight}</span>
            </div>
            <input type="range" min="400" max="900" step="100" value={fontWeight} onChange={(e) => setFontWeight(Number(e.target.value))} onMouseUp={() => triggerApply('display')} onTouchEnd={() => triggerApply('display')} style={{ width: '100%', accentColor: '#6366f1' }} />
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)' }}>UI Scale</div>
              <span style={{ padding: '3px 10px', borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', fontWeight: 900, fontSize: '.82rem' }}>{uiScale}%</span>
            </div>
            <input type="range" min="80" max="130" step="4" value={uiScale} onChange={(e) => setUiScale(Number(e.target.value))} onMouseUp={() => triggerApply('display')} onTouchEnd={() => triggerApply('display')} style={{ width: '100%', accentColor: '#3b82f6' }} />
          </div>
          {appliedSection === 'display' && <div style={{ color: '#10b981', fontSize: '.75rem', fontWeight: 800, textAlign: 'center', marginTop: 8 }}>Display Settings Updated</div>}
        </Section>

        <Section title={copy.settings.behavior}>
          <SettingRow icon="!" title="Overdue Alerts" subtitle="Show warning styling when tasks pass their end time" right={<Toggle value={overdueEnabled} onChange={setOverdueEnabled} color="#f59e0b" />} />
        </Section>

        <Section title={copy.settings.storage}>
          <SettingRow icon="C" title="Clear Completed Tasks" subtitle="Remove finished tasks but keep pending work" onClick={() => setConfirmClear('completed')} right={<span style={{ color: 'var(--muted)', fontSize: '1rem' }}>{'>'}</span>} />
          <SettingRow icon="K" title="Clear Cache" subtitle="Remove service worker and cached files" onClick={onClearCache} right={<span style={{ color: 'var(--muted)', fontSize: '1rem' }}>{copy.common.run}</span>} />
          <SettingRow icon="W" title="Delete All Tasks" subtitle="Wipe the whole task list" onClick={() => setConfirmClear('all')} danger right={<span style={{ color: '#ef4444', fontSize: '1rem' }}>{'>'}</span>} />
          <SettingRow icon="R" title="Reset Full App Data" subtitle="Clear tasks, prefs, habits, journal, and profile" onClick={onClearLocalData} danger right={<span style={{ color: '#ef4444', fontSize: '1rem' }}>{copy.common.run}</span>} />

          {confirmClear === 'completed' && (
            <div style={{ padding: '14px', background: 'rgba(239,68,68,0.08)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.25)' }}>
              <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: 10, fontSize: '.9rem' }}>Remove all completed tasks?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={clearCompleted} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '.85rem' }}>Yes</button>
                <button onClick={() => setConfirmClear(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--card-border)', color: 'var(--text)', fontWeight: 800, fontSize: '.85rem' }}>{copy.common.cancel}</button>
              </div>
            </div>
          )}

          {confirmClear === 'all' && (
            <div style={{ padding: '14px', background: 'rgba(239,68,68,0.12)', borderRadius: 12, border: '1.5px solid rgba(239,68,68,0.4)' }}>
              <div style={{ fontWeight: 900, color: '#ef4444', marginBottom: 6, fontSize: '.95rem' }}>Delete all tasks?</div>
              <div style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 600, marginBottom: 12 }}>This cannot be undone.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={clearAllTasks} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', fontWeight: 900, fontSize: '.85rem' }}>Delete</button>
                <button onClick={() => setConfirmClear(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--card-border)', color: 'var(--text)', fontWeight: 800, fontSize: '.85rem' }}>{copy.common.cancel}</button>
              </div>
            </div>
          )}
        </Section>

        <Section title={copy.settings.preview}>
          <div style={{ padding: '16px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--muted)', marginBottom: 10 }}>Sample task with your current settings:</div>
            <div style={{ padding: '12px 14px', background: 'var(--card)', borderRadius: 10, border: '1px solid var(--card-border)', fontFamily: taskFontFamily, fontSize: taskFontSize, fontWeight: fontWeight, color: 'var(--text)', lineHeight: 1.5 }}>
              Prepare client update - 10:00 AM
            </div>
          </div>
        </Section>

        <Section title={copy.settings.reset}>
          <button onClick={resetSettings} style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1px solid var(--card-border)', cursor: 'pointer', background: 'var(--chip)', color: 'var(--text)', fontWeight: 800, fontSize: '.92rem' }}>
            Reset settings to default
          </button>
        </Section>
      </div>
    </div>
  );
}
