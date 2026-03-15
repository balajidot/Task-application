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
  showCardDot, setShowCardDot,
  cardDensity, setCardDensity,
  cardCornerRadius, setCardCornerRadius,
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
    cardTheme,
    cardBorderColor,
    showCardDot,
    cardDensity,
    cardCornerRadius,
    userName,
    bgTheme
  });

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify({
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
    cardTheme,
    cardBorderColor,
    showCardDot,
    cardDensity,
    cardCornerRadius,
    userName,
    bgTheme
  });

  const handleLocalChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const applyAll = () => {
    if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
    
    // Apply all local settings to main state
    setThemeMode(localSettings.themeMode);
    setTaskFontFamily(localSettings.taskFontFamily);
    setTaskFontSize(localSettings.taskFontSize);
    setUiScale(localSettings.uiScale);
    setFontWeight(localSettings.fontWeight);
    setOverdueEnabled(localSettings.overdueEnabled);
    setSoundTheme(localSettings.soundTheme);
    setHapticEnabled?.(localSettings.hapticEnabled);
    setAutoThemeMode(localSettings.autoThemeMode);
    setLiveHighlightEnabled(localSettings.liveHighlightEnabled);
    setAppLanguage(localSettings.appLanguage);
    setCardTheme(localSettings.cardTheme);
    setCardBorderColor(localSettings.cardBorderColor);
    setShowCardDot(localSettings.showCardDot);
    setCardDensity(localSettings.cardDensity);
    setCardCornerRadius(localSettings.cardCornerRadius);
    setBgTheme(localSettings.bgTheme);
    
    if (localSettings.userName !== userName) {
      setUserName(localSettings.userName);
      localStorage.setItem('taskPlanner_userName', localSettings.userName);
    }

    setAppliedMessage('All changes applied successfully!');
    setTimeout(() => setAppliedMessage(''), 3000);
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
      {hasChanges && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 4000,
          width: '94%',
          maxWidth: 420,
          background: 'rgba(37,99,235,0.98)',
          backdropFilter: 'blur(12px)',
          padding: '14px 22px',
          borderRadius: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 12px 40px rgba(37,99,235,0.45)',
          border: '1.5px solid rgba(255,255,255,0.25)',
          animation: 'slideUp 0.3s cubic-bezier(0.19, 1, 0.22, 1)'
        }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '.95rem', letterSpacing: '-0.01em' }}>Unsaved Changes</div>
          <button onClick={applyAll} className="new-btn" style={{ background: '#fff', color: '#2563eb', padding: '8px 20px', fontSize: '.9rem', minHeight: 44, borderRadius: 14, border: 'none', fontWeight: 900 }}>
            Apply Changes
          </button>
        </div>
      )}

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
          </div>
        </Section>

        <Section title={copy.settings.profile}>
          <div style={{ padding: '16px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: editingName ? 14 : 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'grid', placeItems: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                {userName ? userName[0].toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>{localSettings.userName || 'Set your name'}</div>
              </div>
              <button onClick={() => setEditingName(!editingName)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: editingName ? 'var(--card-border)' : 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', fontWeight: 800, fontSize: '.8rem' }}>
                {editingName ? 'Done' : 'Edit'}
              </button>
            </div>
            {editingName && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={localSettings.userName} onChange={(e) => handleLocalChange('userName', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)} autoFocus placeholder="Enter your name..." maxLength={30} className="fi" style={{ flex: 1 }} />
              </div>
            )}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {THEME_OPTIONS.map((theme) => (
              <button key={theme.value} onClick={() => { handleLocalChange('autoThemeMode', 'off'); handleLocalChange('themeMode', theme.value); }} style={{ padding: '10px 6px', borderRadius: 10, border: localSettings.themeMode === theme.value ? '2px solid #3b82f6' : '1.5px solid var(--card-border)', background: localSettings.themeMode === theme.value ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(16,185,129,0.12))' : 'var(--chip)', color: localSettings.themeMode === theme.value ? '#3b82f6' : 'var(--text)', fontWeight: localSettings.themeMode === theme.value ? 900 : 700, fontSize: '.78rem', cursor: 'pointer', textAlign: 'center', lineHeight: 1.3 }}>
                {theme.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="BACKGROUND STYLE">
          <div style={{ background: 'var(--chip)', padding: '14px', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontWeight: 800, fontSize: '.8rem', color: 'var(--muted)', marginBottom: 12 }}>Choose Dynamic Background</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { id: 'none', label: 'Solid Color', icon: '🎨' },
                { id: 'mesh', label: 'Mesh Gradient', icon: '🌀' },
                { id: 'aurora', label: 'Aurora Flow', icon: '🌌' },
                { id: 'blobs', label: 'Floating Blobs', icon: '🫧' }
              ].map(b => (
                <button key={b.id} onClick={() => handleLocalChange('bgTheme', b.id)} style={{ 
                  padding: '16px 8px', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  border: localSettings.bgTheme === b.id ? '2px solid #3b82f6' : '1px solid var(--card-border)',
                  background: localSettings.bgTheme === b.id ? 'rgba(59,130,246,0.15)' : 'var(--card)',
                  color: localSettings.bgTheme === b.id ? '#3b82f6' : 'var(--text)',
                  fontWeight: 900, fontSize: '.78rem', transition: 'all 0.2s ease',
                  boxShadow: localSettings.bgTheme === b.id ? '0 4px 15px rgba(59,130,246,0.2)' : 'none'
                }}>
                  <span style={{ fontSize: '1.4rem' }}>{b.icon}</span>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="CARD PERSONALIZATION">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--chip)', padding: '14px', borderRadius: 12, border: '1px solid var(--card-border)' }}>
              <div style={{ fontWeight: 800, fontSize: '.8rem', color: 'var(--muted)', marginBottom: 12 }}>Layout Density (Reduced Gaps)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { id: 'compact', label: 'Compact', icon: '◾' },
                  { id: 'balanced', label: 'Balanced', icon: '▫️' },
                  { id: 'spacious', label: 'Spacious', icon: '◻️' }
                ].map(d => (
                  <button key={d.id} onClick={() => handleLocalChange('cardDensity', d.id)} style={{ 
                    padding: '12px 4px', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    border: localSettings.cardDensity === d.id ? '2px solid #3b82f6' : '1px solid var(--card-border)',
                    background: localSettings.cardDensity === d.id ? 'rgba(59,130,246,0.1)' : 'var(--card)',
                    color: localSettings.cardDensity === d.id ? '#3b82f6' : 'var(--text)',
                    fontWeight: 800, fontSize: '.72rem'
                  }}>
                    <span>{d.icon}</span>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--chip)', padding: '14px', borderRadius: 12, border: '1px solid var(--card-border)' }}>
              <div style={{ fontWeight: 800, fontSize: '.8rem', color: 'var(--muted)', marginBottom: 12 }}>Visual Style</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { id: 'glass', label: 'Glass' },
                  { id: 'solid', label: 'Solid' },
                  { id: 'minimal', label: 'Minimal' },
                  { id: 'glow', label: 'Glow' }
                ].map(s => (
                  <button key={s.id} onClick={() => handleLocalChange('cardTheme', s.id)} style={{ 
                    padding: '12px 4px', borderRadius: 10,
                    border: localSettings.cardTheme === s.id ? '2px solid #3b82f6' : '1px solid var(--card-border)',
                    background: localSettings.cardTheme === s.id ? 'rgba(59,130,246,0.1)' : 'var(--card)',
                    color: localSettings.cardTheme === s.id ? '#3b82f6' : 'var(--text)',
                    fontWeight: 800, fontSize: '.75rem'
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--chip)', padding: '14px', borderRadius: 12, border: '1px solid var(--card-border)' }}>
              <div style={{ fontWeight: 800, fontSize: '.8rem', color: 'var(--muted)', marginBottom: 12 }}>Corner Rounding</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[8, 12, 18, 26].map(r => (
                  <button key={r} onClick={() => handleLocalChange('cardCornerRadius', r)} style={{ 
                    padding: '10px 4px', borderRadius: Math.min(r, 12),
                    border: localSettings.cardCornerRadius === r ? '2px solid #3b82f6' : '1px solid var(--card-border)',
                    background: localSettings.cardCornerRadius === r ? 'rgba(59,130,246,0.1)' : 'var(--card)',
                    color: localSettings.cardCornerRadius === r ? '#3b82f6' : 'var(--text)',
                    fontWeight: 800, fontSize: '.75rem'
                  }}>
                    {r}px
                  </button>
                ))}
              </div>
            </div>
            
            <SettingRow icon="◎" title="Priority Dot" subtitle="Show color dot on cards" right={<Toggle value={localSettings.showCardDot} onChange={(v) => handleLocalChange('showCardDot', v)} color="#10b981" />} />

            <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
              <div style={{ fontWeight: 800, fontSize: '.8rem', color: 'var(--muted)', marginBottom: 10 }}>Accent Color</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'].map(c => (
                  <button key={c} onClick={() => handleLocalChange('cardBorderColor', c)} style={{ 
                    width: 30, height: 30, borderRadius: '50%', background: c, border: localSettings.cardBorderColor === c ? '2.5px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: localSettings.cardBorderColor === c ? `0 0 10px ${c}` : 'none', cursor: 'pointer'
                  }} />
                ))}
              </div>
            </div>
          </div>
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
          </div>
        </Section>

        <Section title="BEHAVIOR">
          <SettingRow icon="!" title="Overdue Alerts" subtitle="Show warning color when time passes" right={<Toggle value={localSettings.overdueEnabled} onChange={(v) => handleLocalChange('overdueEnabled', v)} color="#f59e0b" />} />
        </Section>

        <Section title={copy.settings.notifications}>
          <SettingRow icon="V" title="Haptic Feedback" subtitle="Vibrate on actions" right={<Toggle value={localSettings.hapticEnabled ?? true} onChange={(v) => handleLocalChange('hapticEnabled', v)} color="#6366f1" />} />
          <SettingRow icon="L" title="Live Highlight" subtitle="Auto-popup current task" right={<Toggle value={localSettings.liveHighlightEnabled ?? true} onChange={(v) => handleLocalChange('liveHighlightEnabled', v)} color="#10b981" />} />
          <SettingRow
            icon="S"
            title="Sound Theme"
            right={
              <select value={localSettings.soundTheme} onChange={(e) => handleLocalChange('soundTheme', e.target.value)} className="fs" style={{ width: 'auto', padding: '6px 12px' }}>
                {['default', 'gentle', 'chime', 'silent'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            }
          />
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
                 cardTheme: 'glow',
                 cardBorderColor: '#3b82f6',
                 showCardDot: true,
                 cardDensity: 'balanced',
                 cardCornerRadius: 18,
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
              <button onClick={() => { if(confirmClear==='all') onClearLocalData(); else onReplaceGoals([]); setConfirmClear(null); }} className="new-btn btn-block" style={{ background: '#ef4444' }}>Yes, Delete</button>
              <button onClick={() => setConfirmClear(null)} className="hero-btn btn-block">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

