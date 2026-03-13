import React, { useState, useCallback } from 'react';
import { THEME_OPTIONS, FONT_OPTIONS } from '../utils/constants';

// ─── Reusable toggle switch ───────────────────────────────────────────────────
function Toggle({ value, onChange, color = '#10b981' }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 52, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer',
        background: value ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'var(--card-border)',
        position: 'relative', transition: 'all 0.25s ease',
        boxShadow: value ? `0 2px 8px ${color}55` : 'inset 0 1px 3px rgba(0,0,0,0.1)',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: value ? 27 : 3,
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      }} />
    </button>
  );
}

// ─── Reusable row item ────────────────────────────────────────────────────────
function SettingRow({ icon, title, subtitle, right, onClick, danger }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '13px 14px', background: 'var(--chip)', borderRadius: 12,
        border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'var(--card-border)'}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.15s',
        marginBottom: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontWeight: 800, fontSize: '.92rem',
            color: danger ? '#ef4444' : 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 2, fontWeight: 600 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {right && <div style={{ flexShrink: 0, marginLeft: 12 }}>{right}</div>}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{
        fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em',
        color: 'var(--muted)', textTransform: 'uppercase',
        marginBottom: 12, paddingLeft: 2,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main SettingsView ────────────────────────────────────────────────────────
export default function SettingsView({
  setActiveView,
  // Appearance
  themeMode, setThemeMode,
  taskFontFamily, setTaskFontFamily,
  taskFontSize, setTaskFontSize,
  uiScale, setUiScale,
  fontWeight, setFontWeight,
  // Behavior
  overdueEnabled, setOverdueEnabled,
  soundTheme, setSoundTheme,
  hapticEnabled, setHapticEnabled,
  // Profile
  userName, setUserName,
  // Notifications
  notifPerm, requestNotifPerm,
  // Data
  goals, setGoals,
}) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName || '');
  const [confirmClear, setConfirmClear] = useState(null); // 'completed' | 'all'
  const [justSaved, setJustSaved] = useState(false);

  const SOUND_OPTIONS = [
    { label: '🔔 Default', value: 'default' },
    { label: '🎵 Gentle', value: 'gentle' },
    { label: '🎶 Chime', value: 'chime' },
    { label: '🔇 Silent', value: 'silent' },
  ];

  // ── Name save ──────────────────────────────────────────────────────────────
  const saveName = () => {
    const name = tempName.trim();
    if (!name) return;
    setUserName(name);
    localStorage.setItem('taskPlanner_userName', name);
    setEditingName(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  // ── Notification permission ────────────────────────────────────────────────
  const notifLabel = notifPerm === 'granted'
    ? '✅ Enabled'
    : notifPerm === 'denied'
    ? '🚫 Blocked in phone settings'
    : '⚠️ Not enabled yet';

  const notifColor = notifPerm === 'granted' ? '#10b981' : notifPerm === 'denied' ? '#ef4444' : '#f59e0b';

  // ── Data actions ──────────────────────────────────────────────────────────
  const clearCompleted = useCallback(() => {
    const updated = goals.filter(g => !Object.keys(g.doneOn || {}).length && !g.done);
    setGoals(updated);
    setConfirmClear(null);
  }, [goals, setGoals]);

  const clearAllTasks = useCallback(() => {
    setGoals([]);
    setConfirmClear(null);
  }, [setGoals]);

  // ── Reset all settings ────────────────────────────────────────────────────
  const resetSettings = () => {
    setThemeMode('dark');
    setTaskFontSize(18);
    setTaskFontFamily(FONT_OPTIONS[0].value);
    setUiScale(96);
    setFontWeight(500);
    setSoundTheme('default');
    setHapticEnabled?.(true);
    setOverdueEnabled(true);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title">⚙️ Settings</div>
            <div className="tip">Personalize your experience</div>
          </div>
          <button className="hero-btn" onClick={() => setActiveView('tasks')}>
            ✅ Tasks
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 4px' }}>

        {/* ══════════════════════════════════════
            1. PROFILE
        ══════════════════════════════════════ */}
        <Section title="👤 Profile">
          <div style={{
            padding: '16px 14px', background: 'var(--chip)', borderRadius: 12,
            border: '1px solid var(--card-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: editingName ? 14 : 0 }}>
              {/* Avatar */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                display: 'grid', placeItems: 'center',
                fontSize: '1.4rem', fontWeight: 900, color: '#fff',
                boxShadow: '0 4px 14px rgba(168,85,247,0.35)',
              }}>
                {userName ? userName[0].toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>
                  {userName || 'Set your name'}
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
                  Task Planner User
                </div>
              </div>
              <button
                onClick={() => { setEditingName(!editingName); setTempName(userName || ''); }}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: editingName ? 'var(--card-border)' : 'linear-gradient(135deg, #a855f7, #6366f1)',
                  color: '#fff', fontWeight: 800, fontSize: '.8rem',
                }}
              >
                {editingName ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>

            {editingName && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  autoFocus
                  placeholder="Enter your name..."
                  maxLength={30}
                  style={{
                    flex: 1, padding: '11px 14px', borderRadius: 10,
                    border: '2px solid rgba(99,102,241,0.4)',
                    background: 'var(--card)', color: 'var(--text)',
                    fontSize: '1rem', outline: 'none',
                  }}
                />
                <button
                  onClick={saveName}
                  disabled={!tempName.trim()}
                  style={{
                    padding: '11px 18px', borderRadius: 10, border: 'none',
                    cursor: tempName.trim() ? 'pointer' : 'not-allowed',
                    background: tempName.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--card-border)',
                    color: '#fff', fontWeight: 800, fontSize: '.9rem',
                    opacity: tempName.trim() ? 1 : 0.5,
                  }}
                >
                  Save
                </button>
              </div>
            )}

            {justSaved && (
              <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 800, fontSize: '.85rem', marginTop: 8 }}>
                ✅ Name saved!
              </div>
            )}
          </div>
        </Section>

        {/* ══════════════════════════════════════
            2. NOTIFICATIONS
        ══════════════════════════════════════ */}
        <Section title="🔔 Notifications">
          <div style={{
            padding: '13px 14px', background: 'var(--chip)', borderRadius: 12,
            border: '1px solid var(--card-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '.92rem', color: 'var(--text)' }}>
                  🔔 Push Notifications
                </div>
                <div style={{ fontSize: '.75rem', fontWeight: 700, marginTop: 3, color: notifColor }}>
                  {notifLabel}
                </div>
              </div>
              {notifPerm !== 'granted' && notifPerm !== 'denied' && (
                <button
                  onClick={() => requestNotifPerm?.()}
                  style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff', fontWeight: 800, fontSize: '.82rem',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.35)',
                  }}
                >
                  Enable
                </button>
              )}
              {notifPerm === 'denied' && (
                <span style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(239,68,68,0.12)',
                  color: '#ef4444', fontWeight: 800, fontSize: '.78rem',
                }}>
                  Go to Phone Settings
                </span>
              )}
              {notifPerm === 'granted' && (
                <span style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(16,185,129,0.12)',
                  color: '#10b981', fontWeight: 800, fontSize: '.82rem',
                }}>
                  Active ✓
                </span>
              )}
            </div>
          </div>

          <SettingRow
            icon="📳"
            title="Haptic Feedback"
            subtitle="Vibration on task complete & swipe"
            right={
              <Toggle
                value={hapticEnabled ?? true}
                onChange={v => setHapticEnabled?.(v)}
                color="#6366f1"
              />
            }
          />

          <SettingRow
            icon="🔊"
            title="Sound Theme"
            subtitle="Notification & completion sounds"
            right={
              <select
                value={soundTheme}
                onChange={e => setSoundTheme(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  padding: '7px 12px', borderRadius: 10,
                  background: 'var(--card)', color: 'var(--text)',
                  border: '1px solid var(--card-border)',
                  fontWeight: 800, fontSize: '.82rem', cursor: 'pointer',
                }}
              >
                {SOUND_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            }
          />
        </Section>

        {/* ══════════════════════════════════════
            3. APPEARANCE — THEME
        ══════════════════════════════════════ */}
        <Section title="🎨 Theme">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}>
            {THEME_OPTIONS.map(theme => (
              <button
                key={theme.value}
                onClick={() => setThemeMode(theme.value)}
                style={{
                  padding: '10px 6px',
                  borderRadius: 10,
                  border: themeMode === theme.value
                    ? '2px solid #a855f7'
                    : '1.5px solid var(--card-border)',
                  background: themeMode === theme.value
                    ? 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(99,102,241,0.12))'
                    : 'var(--chip)',
                  color: themeMode === theme.value ? '#a855f7' : 'var(--text)',
                  fontWeight: themeMode === theme.value ? 900 : 700,
                  fontSize: '.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════
            4. DISPLAY
        ══════════════════════════════════════ */}
        <Section title="🖊️ Display">

          {/* Font Style */}
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)', marginBottom: 8 }}>Font Style</div>
            <select
              className="fi"
              value={taskFontFamily}
              onChange={e => setTaskFontFamily(e.target.value)}
              style={{ fontSize: '14px', width: '100%' }}
            >
              {FONT_OPTIONS.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>

          {/* Font Size slider */}
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)' }}>Task Font Size</div>
              <span style={{
                padding: '3px 10px', borderRadius: 8,
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: '#fff', fontWeight: 900, fontSize: '.82rem',
              }}>{taskFontSize}px</span>
            </div>
            <input
              type="range" min="12" max="32" value={taskFontSize}
              onChange={e => setTaskFontSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#a855f7' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--muted)', fontWeight: 700, marginTop: 4 }}>
              <span>Small (12px)</span><span>Large (32px)</span>
            </div>
          </div>

          {/* Font Weight slider */}
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)' }}>Font Weight</div>
              <span style={{
                padding: '3px 10px', borderRadius: 8,
                background: 'var(--card)', color: 'var(--text)',
                fontWeight: 900, fontSize: '.82rem',
                border: '1px solid var(--card-border)',
              }}>
                {fontWeight <= 400 ? 'Light' : fontWeight <= 500 ? 'Normal' : fontWeight <= 600 ? 'Semi-Bold' : fontWeight <= 700 ? 'Bold' : fontWeight <= 800 ? 'Heavy' : 'Black'}
              </span>
            </div>
            <input
              type="range" min="400" max="900" step="100" value={fontWeight}
              onChange={e => setFontWeight(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
          </div>

          {/* UI Scale slider */}
          <div style={{ padding: '12px 14px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--muted)' }}>UI Scale</div>
              <span style={{
                padding: '3px 10px', borderRadius: 8,
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#fff', fontWeight: 900, fontSize: '.82rem',
              }}>{uiScale}%</span>
            </div>
            <input
              type="range" min="80" max="130" step="4" value={uiScale}
              onChange={e => setUiScale(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--muted)', fontWeight: 700, marginTop: 4 }}>
              <span>Compact (80%)</span><span>Large (130%)</span>
            </div>
          </div>

        </Section>

        {/* ══════════════════════════════════════
            5. BEHAVIOR
        ══════════════════════════════════════ */}
        <Section title="⚙️ Behavior">
          <SettingRow
            icon="⚠️"
            title="Overdue Alerts"
            subtitle="Warning badge on tasks past end time"
            right={<Toggle value={overdueEnabled} onChange={setOverdueEnabled} color="#f59e0b" />}
          />
        </Section>

        {/* ══════════════════════════════════════
            6. PREVIEW
        ══════════════════════════════════════ */}
        <Section title="👁 Preview">
          <div style={{ padding: '16px', background: 'var(--chip)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--muted)', marginBottom: 10 }}>
              Sample task with your settings:
            </div>
            <div style={{
              padding: '12px 14px',
              background: 'var(--card)', borderRadius: 10,
              border: '1px solid var(--card-border)',
              fontFamily: taskFontFamily,
              fontSize: taskFontSize,
              fontWeight: fontWeight,
              color: 'var(--text)',
              lineHeight: 1.5,
            }}>
              📋 Study CASA & NPA concepts — 10:00 AM
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════
            7. DATA MANAGEMENT
        ══════════════════════════════════════ */}
        <Section title="🗑 Data Management">

          {/* Confirm dialogs */}
          {confirmClear === 'completed' && (
            <div style={{
              padding: '14px', background: 'rgba(239,68,68,0.08)', borderRadius: 12,
              border: '1px solid rgba(239,68,68,0.25)',
            }}>
              <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: 10, fontSize: '.9rem' }}>
                ⚠️ Remove all completed tasks?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={clearCompleted} style={{
                  flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '.85rem',
                }}>Yes, Clear</button>
                <button onClick={() => setConfirmClear(null)} style={{
                  flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'var(--card-border)', color: 'var(--text)', fontWeight: 800, fontSize: '.85rem',
                }}>Cancel</button>
              </div>
            </div>
          )}

          {confirmClear === 'all' && (
            <div style={{
              padding: '14px', background: 'rgba(239,68,68,0.12)', borderRadius: 12,
              border: '1.5px solid rgba(239,68,68,0.4)',
            }}>
              <div style={{ fontWeight: 900, color: '#ef4444', marginBottom: 6, fontSize: '.95rem' }}>
                🚨 Delete ALL tasks? Cannot undo!
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 600, marginBottom: 12 }}>
                This will permanently delete every task.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={clearAllTasks} style={{
                  flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#fff', fontWeight: 900, fontSize: '.85rem',
                }}>🗑 Delete All</button>
                <button onClick={() => setConfirmClear(null)} style={{
                  flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'var(--card-border)', color: 'var(--text)', fontWeight: 800, fontSize: '.85rem',
                }}>Cancel</button>
              </div>
            </div>
          )}

          {!confirmClear && (
            <>
              <SettingRow
                icon="✅"
                title="Clear Completed Tasks"
                subtitle={`Remove all finished tasks`}
                onClick={() => setConfirmClear('completed')}
                right={<span style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>›</span>}
              />
              <SettingRow
                icon="🗑"
                title="Delete All Tasks"
                subtitle="Wipe everything — cannot undo"
                onClick={() => setConfirmClear('all')}
                danger
                right={<span style={{ color: '#ef4444', fontSize: '1.1rem' }}>›</span>}
              />
            </>
          )}
        </Section>

        {/* ══════════════════════════════════════
            8. ACTIONS
        ══════════════════════════════════════ */}
        <Section title="🔄 Reset">
          <button
            onClick={resetSettings}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'var(--chip)', color: 'var(--text)',
              border: '1px solid var(--card-border)',
              fontWeight: 800, fontSize: '.92rem',
              transition: 'opacity 0.15s',
            }}
          >
            🔄 Reset All Settings to Default
          </button>
        </Section>

        {/* ══════════════════════════════════════
            9. APP INFO
        ══════════════════════════════════════ */}
        <Section title="ℹ️ App Info">
          <div style={{
            padding: '16px 14px', background: 'var(--chip)', borderRadius: 12,
            border: '1px solid var(--card-border)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {[
              ['📱 App Name', 'Task Planner'],
              ['🔢 Version', '2.0.0'],
              ['⚡ Stack', 'React 18 + Vite + PWA'],
              ['📦 Platform', 'Android (Capacitor) + Web'],
              ['👨‍💻 Built by', 'Balaji'],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingBottom: 8, borderBottom: '1px solid var(--card-border)',
              }}>
                <span style={{ fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>{label}</span>
                <span style={{ fontSize: '.85rem', color: 'var(--text)', fontWeight: 800 }}>{value}</span>
              </div>
            ))}
            <div style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--muted)', fontWeight: 700, paddingTop: 4 }}>
              Made with ❤️ for productivity
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
