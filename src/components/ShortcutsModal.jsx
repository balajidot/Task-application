import React from 'react';

const SHORTCUTS = [
  { keys: ['Ctrl', '1'], action: 'Dashboard' },
  { keys: ['Ctrl', '2'], action: 'Tasks' },
  { keys: ['Ctrl', '3'], action: 'Planner' },
  { keys: ['Ctrl', '4'], action: 'Analytics' },
  { keys: ['Ctrl', 'N'], action: 'New Task' },
  { keys: ['Ctrl', 'F'], action: 'Search Tasks' },
  { keys: ['?'], action: 'Toggle Shortcuts Guide' },
  { keys: ['Esc'], action: 'Close Modal / Cancel' },
];

export default function ShortcutsModal({ onClose }) {
  return (
    <div
      className="overlay"
      onClick={onClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', border: '1.5px solid var(--card-border)',
          borderRadius: '16px', padding: '28px 32px', width: '100%', maxWidth: '420px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'eodSlideIn 0.3s ease both',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⌨️ Keyboard Shortcuts
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--chip)', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 800, color: 'var(--muted)', fontSize: '.85rem' }}
          >
            ESC
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SHORTCUTS.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: '10px',
                background: 'var(--chip)', border: '1px solid var(--card-border)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text)' }}>{s.action}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    style={{
                      background: 'var(--card)', color: 'var(--text)',
                      padding: '3px 10px', borderRadius: '6px', fontWeight: 800,
                      border: '1px solid var(--card-border)', fontSize: '.78rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600 }}>
          Press <kbd style={{ background: 'var(--chip)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, border: '1px solid var(--card-border)' }}>?</kbd> anywhere to toggle this guide
        </div>
      </div>
    </div>
  );
}
