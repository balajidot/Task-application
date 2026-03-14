import React, { useState, useEffect, useRef, useCallback } from 'react';
import { readPersist, writePersist, todayKey, toKey } from '../utils/helpers';
import { HABITS_KEY } from '../utils/constants';

export default function HabitsView() {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [loaded, setLoaded] = useState(false);
  const saveRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await readPersist(HABITS_KEY);
        if (raw) setHabits(JSON.parse(raw));
      } catch {}
      setLoaded(true);
    };
    load();
  }, []);

  const save = useCallback((data) => {
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => writePersist(HABITS_KEY, JSON.stringify(data)), 300);
  }, []);

  const addHabit = () => {
    const text = newHabit.trim();
    if (!text) return;
    const updated = [...habits, { id: Date.now(), text, checked: {}, createdOn: todayKey() }];
    setHabits(updated); save(updated); setNewHabit('');
  };

  const removeHabit = (id) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated); save(updated);
  };

  const toggleDay = (id, dayKey) => {
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const checked = { ...h.checked };
      checked[dayKey] = !checked[dayKey];
      return { ...h, checked };
    });
    setHabits(updated); save(updated);
  };

  const getStreak = (habit) => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = toKey(d);
      if (!habit.checked?.[key]) break;
      streak++;
    }
    return streak;
  };

  const last7Days = (() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      days.push({ key: toKey(d), label: d.toLocaleDateString('en-IN', { weekday: 'short' }), isToday: i === 0 });
    }
    return days;
  })();

  const today = todayKey();

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>🔁 Daily Habits</h2>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: '4px', fontWeight: 600 }}>Build consistency. Track streaks. Stay disciplined.</p>
        </div>
      </div>

      {/* ADD HABIT */}
      <div className="card" style={{ marginBottom: '16px', background: 'var(--hero)', border: '1.5px solid var(--accent-alpha, rgba(99,102,241,0.2))' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            className="fi"
            placeholder="Add a new habit (e.g. Exercise 30 min)..."
            value={newHabit}
            onChange={e => setNewHabit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addHabit()}
            style={{ flex: 1 }}
          />
          <button className="new-btn" onClick={addHabit} style={{ flexShrink: 0, padding: '14px 20px' }}>
            + Add Habit
          </button>
        </div>
      </div>

      {habits.length === 0 && loaded && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌱</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>No habits yet</div>
          <div style={{ fontSize: '.85rem', marginTop: '6px' }}>Start building powerful daily habits. Type one above!</div>
        </div>
      )}

      {/* 📊 WEEKLY HABIT REPORT */}
      {habits.length > 0 && (() => {
        const totalChecks = habits.reduce((sum, h) => sum + last7Days.filter(d => h.checked?.[d.key]).length, 0);
        const maxChecks = habits.length * 7;
        const weeklyPct = maxChecks > 0 ? Math.round((totalChecks / maxChecks) * 100) : 0;
        return (
          <div className="card" style={{ marginBottom: '16px', border: '1px solid rgba(99,102,241,0.3)', background: 'linear-gradient(135deg, var(--card) 0%, rgba(99,102,241,0.05) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)' }}>📊 Weekly Report</div>
              <span style={{
                fontSize: '.78rem', fontWeight: 900, padding: '4px 12px', borderRadius: '999px',
                color: weeklyPct >= 70 ? '#10b981' : weeklyPct >= 40 ? '#f59e0b' : '#ef4444',
                background: weeklyPct >= 70 ? 'rgba(16,185,129,0.1)' : weeklyPct >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${weeklyPct >= 70 ? 'rgba(16,185,129,0.3)' : weeklyPct >= 40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                {weeklyPct}% weekly
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {habits.map(h => {
                const wk = last7Days.filter(d => h.checked?.[d.key]).length;
                const pctH = Math.round((wk / 7) * 100);
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '120px', fontSize: '.78rem', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text}</div>
                    <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: 'var(--chip)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '999px', width: `${pctH}%`, background: pctH >= 70 ? 'linear-gradient(90deg, #10b981, #059669)' : pctH >= 40 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)', transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontSize: '.72rem', fontWeight: 900, color: 'var(--muted)', minWidth: '35px', textAlign: 'right' }}>{wk}/7</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* HABIT LIST */}
      {habits.map(habit => {
        const streak = getStreak(habit);
        const completedToday = !!habit.checked?.[today];
        const weekCount = last7Days.filter(d => habit.checked?.[d.key]).length;

        return (
          <div key={habit.id} className="card" style={{
            marginBottom: '12px',
            border: completedToday ? '1.5px solid rgba(16,185,129,0.4)' : '1px solid var(--card-border)',
            background: completedToday ? 'linear-gradient(135deg, var(--card) 0%, rgba(16,185,129,0.05) 100%)' : 'var(--card)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => toggleDay(habit.id, today)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: completedToday ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--chip)',
                    color: completedToday ? '#fff' : 'var(--muted)',
                    fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease', boxShadow: completedToday ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
                  }}
                >
                  {completedToday ? '✓' : '○'}
                </button>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>{habit.text}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600, marginTop: '2px' }}>
                    {weekCount}/7 this week
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {streak > 0 && (
                  <span style={{
                    fontSize: '.78rem', fontWeight: 900, color: '#f59e0b',
                    background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: '999px',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}>
                    🔥 {streak}d streak
                  </span>
                )}
                <button onClick={() => removeHabit(habit.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
                  fontSize: '.85rem', padding: '4px 8px', borderRadius: '6px', transition: 'all 0.2s',
                }}>✕</button>
              </div>
            </div>

            {/* 7-DAY GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {last7Days.map(day => {
                const done = !!habit.checked?.[day.key];
                return (
                  <button
                    key={day.key}
                    onClick={() => toggleDay(habit.id, day.key)}
                    style={{
                      padding: '8px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      background: done ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--chip)',
                      color: done ? '#fff' : 'var(--muted)',
                      fontWeight: 800, fontSize: '.7rem', textAlign: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: day.isToday ? '0 0 0 2px var(--accent)' : 'none',
                    }}
                  >
                    <div>{day.label}</div>
                    <div style={{ fontSize: '.9rem', marginTop: '2px' }}>{done ? '✓' : '·'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
