import React, { useState, useEffect, useRef, useCallback } from 'react';
import { readPersist, writePersist, todayKey, toKey } from '../utils/helpers';
import { JOURNAL_KEY } from '../utils/constants';

const MOODS = [
  { emoji: '😄', label: 'Great', color: '#10b981' },
  { emoji: '🙂', label: 'Good', color: '#3b82f6' },
  { emoji: '😐', label: 'Okay', color: '#f59e0b' },
  { emoji: '😔', label: 'Low', color: '#ef4444' },
  { emoji: '😠', label: 'Stressed', color: '#dc2626' },
];

export default function JournalView() {
  const [entries, setEntries] = useState({});
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [loaded, setLoaded] = useState(false);
  const saveRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await readPersist(JOURNAL_KEY);
        if (raw) setEntries(JSON.parse(raw));
      } catch {}
      setLoaded(true);
    };
    load();
  }, []);

  const save = useCallback((data) => {
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => writePersist(JOURNAL_KEY, JSON.stringify(data)), 400);
  }, []);

  const entry = entries[selectedDate] || { mood: '', wellText: '', improveText: '', gratitudeText: '' };

  const updateEntry = (field, value) => {
    const updated = {
      ...entries,
      [selectedDate]: { ...entry, [field]: value },
    };
    setEntries(updated);
    save(updated);
  };

  const wordCount = [entry.wellText, entry.improveText, entry.gratitudeText]
    .join(' ').trim().split(/\s+/).filter(Boolean).length;

  const recentDates = (() => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      dates.push(toKey(d));
    }
    return dates;
  })();

  const today = todayKey();

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>📓 Daily Journal</h2>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: '4px', fontWeight: 600 }}>Reflect. Grow. Appreciate.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '.75rem', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(16,185,129,0.2)' }}>
            Auto-saved ✓
          </span>
          <span style={{ fontSize: '.75rem', fontWeight: 800, color: 'var(--muted)', background: 'var(--chip)', padding: '4px 10px', borderRadius: '999px' }}>
            {wordCount} words
          </span>
        </div>
      </div>

      {/* DATE SELECTOR */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {recentDates.map(dateKey => {
          const d = new Date(`${dateKey}T00:00:00`);
          const isSelected = dateKey === selectedDate;
          const hasEntry = entries[dateKey] && (entries[dateKey].wellText || entries[dateKey].mood);
          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              style={{
                padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: isSelected ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--chip)',
                color: isSelected ? '#fff' : 'var(--text)',
                fontWeight: 800, fontSize: '.8rem', textAlign: 'center',
                transition: 'all 0.2s ease', flexShrink: 0,
                boxShadow: isSelected ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
                position: 'relative',
              }}
            >
              <div>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
              <div style={{ fontSize: '.7rem', opacity: 0.8, marginTop: '2px' }}>
                {dateKey === today ? 'Today' : d.getDate()}
              </div>
              {hasEntry && !isSelected && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', position: 'absolute', top: '4px', right: '4px' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* MOOD SELECTOR */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text)', marginBottom: '12px' }}>How are you feeling?</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {MOODS.map(mood => {
            const isActive = entry.mood === mood.label;
            return (
              <button
                key={mood.label}
                onClick={() => updateEntry('mood', mood.label)}
                style={{
                  padding: '10px 18px', borderRadius: '12px', cursor: 'pointer',
                  background: isActive ? `linear-gradient(135deg, ${mood.color}22, ${mood.color}11)` : 'var(--chip)',
                  border: `2px solid ${isActive ? mood.color : 'transparent'}`,
                  color: isActive ? mood.color : 'var(--muted)',
                  fontWeight: 800, fontSize: '.85rem',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{mood.emoji}</span>
                {mood.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* JOURNAL PROMPTS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#10b981', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>✅</span> What went well today?
          </div>
          <textarea
            className="fi task-box"
            placeholder="Celebrate your wins, no matter how small..."
            value={entry.wellText || ''}
            onChange={e => updateEntry('wellText', e.target.value)}
            style={{ minHeight: '120px', fontSize: '.95rem', lineHeight: 1.6 }}
          />
        </div>

        <div className="card">
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#f59e0b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📈</span> What could be improved?
          </div>
          <textarea
            className="fi task-box"
            placeholder="Identify friction points and plan fixes..."
            value={entry.improveText || ''}
            onChange={e => updateEntry('improveText', e.target.value)}
            style={{ minHeight: '120px', fontSize: '.95rem', lineHeight: 1.6 }}
          />
        </div>

        <div className="card">
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#a855f7', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🙏</span> Gratitude
          </div>
          <textarea
            className="fi task-box"
            placeholder="3 things you're grateful for today..."
            value={entry.gratitudeText || ''}
            onChange={e => updateEntry('gratitudeText', e.target.value)}
            style={{ minHeight: '100px', fontSize: '.95rem', lineHeight: 1.6 }}
          />
        </div>
      </div>
    </div>
  );
}
