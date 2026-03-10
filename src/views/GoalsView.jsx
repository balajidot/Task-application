import React, { useState, useEffect, useRef, useCallback } from 'react';
import { readPersist, writePersist } from '../utils/helpers';
import { GOALS_KEY } from '../utils/constants';

export default function GoalsView() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', target: '', milestones: '' });
  const [loaded, setLoaded] = useState(false);
  const saveRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await readPersist(GOALS_KEY);
        if (raw) setGoals(JSON.parse(raw));
      } catch {}
      setLoaded(true);
    };
    load();
  }, []);

  const save = useCallback((data) => {
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => writePersist(GOALS_KEY, JSON.stringify(data)), 300);
  }, []);

  const addGoal = () => {
    const title = form.title.trim();
    if (!title) return;
    const milestones = form.milestones.split('\n').filter(m => m.trim()).map((text, i) => ({
      id: Date.now() + i, text: text.trim(), done: false,
    }));
    const newGoal = {
      id: Date.now(), title, target: form.target,
      milestones, createdOn: new Date().toISOString(),
    };
    const updated = [...goals, newGoal];
    setGoals(updated); save(updated);
    setForm({ title: '', target: '', milestones: '' });
    setShowForm(false);
  };

  const removeGoal = (id) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated); save(updated);
  };

  const toggleMilestone = (goalId, msId) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      return {
        ...g,
        milestones: g.milestones.map(m =>
          m.id === msId ? { ...m, done: !m.done } : m
        ),
      };
    });
    setGoals(updated); save(updated);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>🎯 Long-Term Goals</h2>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: '4px', fontWeight: 600 }}>Break big dreams into achievable milestones.</p>
        </div>
        <button className="new-btn" onClick={() => setShowForm(!showForm)} style={{ padding: '10px 24px', fontSize: '.9rem' }}>
          {showForm ? '✕ Cancel' : '+ New Goal'}
        </button>
      </div>

      {/* ADD GOAL FORM */}
      {showForm && (
        <div className="card" style={{ marginBottom: '16px', border: '1.5px solid rgba(99,102,241,0.3)', background: 'linear-gradient(135deg, var(--card) 0%, rgba(99,102,241,0.05) 100%)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.85rem', color: 'var(--text)', marginBottom: '6px' }}>Goal Title</div>
              <input
                className="fi"
                placeholder="e.g. Become a Senior Full Stack Engineer"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ fontSize: '.95rem' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.85rem', color: 'var(--text)', marginBottom: '6px' }}>Target Date (optional)</div>
              <input
                className="fi"
                type="date"
                value={form.target}
                onChange={e => setForm({ ...form, target: e.target.value })}
                style={{ fontSize: '.95rem' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.85rem', color: 'var(--text)', marginBottom: '6px' }}>Milestones (one per line)</div>
              <textarea
                className="fi task-box"
                placeholder={"Learn React Advanced Patterns\nBuild 3 Full Stack Projects\nContribute to Open Source\nPrepare for System Design Interviews"}
                value={form.milestones}
                onChange={e => setForm({ ...form, milestones: e.target.value })}
                style={{ minHeight: '120px', fontSize: '.95rem', lineHeight: 1.6 }}
              />
            </div>
            <button className="new-btn" onClick={addGoal} style={{ padding: '12px 24px', fontSize: '.95rem', alignSelf: 'flex-end' }}>
              🎯 Create Goal
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 && loaded && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎯</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>No goals yet</div>
          <div style={{ fontSize: '.85rem', marginTop: '6px' }}>Set your first long-term goal and break it into milestones!</div>
        </div>
      )}

      {/* GOAL CARDS */}
      {goals.map(goal => {
        const total = goal.milestones.length;
        const done = goal.milestones.filter(m => m.done).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const daysLeft = goal.target ? Math.max(0, Math.ceil((new Date(goal.target) - new Date()) / 86400000)) : null;

        return (
          <div key={goal.id} className="card" style={{
            marginBottom: '16px',
            border: pct === 100 ? '1.5px solid rgba(16,185,129,0.4)' : '1px solid var(--card-border)',
            background: pct === 100 ? 'linear-gradient(135deg, var(--card) 0%, rgba(16,185,129,0.05) 100%)' : 'var(--card)',
          }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pct === 100 ? '🏆' : '🎯'} {goal.title}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '.72rem', fontWeight: 900, padding: '3px 10px', borderRadius: '999px',
                    background: pct >= 70 ? 'rgba(16,185,129,0.1)' : pct >= 30 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                    color: pct >= 70 ? '#10b981' : pct >= 30 ? '#f59e0b' : '#ef4444',
                    border: `1px solid ${pct >= 70 ? 'rgba(16,185,129,0.3)' : pct >= 30 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}>
                    {done}/{total} milestones • {pct}%
                  </span>
                  {daysLeft !== null && (
                    <span style={{
                      fontSize: '.72rem', fontWeight: 900, padding: '3px 10px', borderRadius: '999px',
                      background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }}>
                      📅 {daysLeft}d left
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => removeGoal(goal.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
                fontSize: '.85rem', padding: '4px 8px', borderRadius: '6px',
              }}>✕</button>
            </div>

            {/* PROGRESS BAR */}
            <div style={{ height: '8px', borderRadius: '999px', background: 'var(--chip)', marginBottom: '14px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '999px', transition: 'width 0.5s ease',
                width: `${pct}%`,
                background: pct >= 70 ? 'linear-gradient(90deg, #10b981, #059669)' : pct >= 30 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
              }} />
            </div>

            {/* MILESTONES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {goal.milestones.map(ms => (
                <button
                  key={ms.id}
                  onClick={() => toggleMilestone(goal.id, ms.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: ms.done ? 'rgba(16,185,129,0.08)' : 'var(--chip)',
                    textAlign: 'left', transition: 'all 0.2s ease', width: '100%',
                  }}
                >
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: ms.done ? '#10b981' : 'var(--card-border)',
                    color: '#fff', fontSize: '.7rem', fontWeight: 900,
                  }}>
                    {ms.done ? '✓' : ''}
                  </span>
                  <span style={{
                    fontWeight: 700, fontSize: '.88rem',
                    color: ms.done ? 'var(--muted)' : 'var(--text)',
                    textDecoration: ms.done ? 'line-through' : 'none',
                  }}>
                    {ms.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
