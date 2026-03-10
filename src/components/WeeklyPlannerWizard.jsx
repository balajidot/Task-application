import React, { useState, useMemo } from 'react';
import { todayKey, toKey, goalVisibleOn, isDoneOn } from '../utils/helpers';

export default function WeeklyPlannerWizard({ goals, onClose, onAddGoals }) {
  const [step, setStep] = useState(0);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [newTasks, setNewTasks] = useState('');

  const nextMonday = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }, []);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(nextMonday);
      d.setDate(nextMonday.getDate() + i);
      days.push({
        key: toKey(d),
        label: d.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' }),
      });
    }
    return days;
  }, [nextMonday]);

  // Get recurring/recent tasks that could be reused
  const reusableTasks = useMemo(() => {
    if (!goals) return [];
    const seen = new Set();
    return goals
      .filter(g => {
        if (seen.has(g.text)) return false;
        seen.add(g.text);
        return g.repeat !== 'None' || g.priority === 'High';
      })
      .slice(0, 15);
  }, [goals]);

  const toggleTask = (text) => {
    setSelectedTasks(prev =>
      prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]
    );
  };

  const handleFinish = () => {
    // Parse new tasks
    const parsedNew = newTasks.split('\n').filter(t => t.trim()).map(t => t.trim());
    const allTasks = [...selectedTasks, ...parsedNew];

    if (allTasks.length > 0 && onAddGoals) {
      onAddGoals(allTasks, weekDays.map(d => d.key));
    }
    onClose();
  };

  const steps = [
    {
      title: '📋 Review Last Week',
      content: (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '14px', fontWeight: 600 }}>
            Select recurring tasks to carry forward:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {reusableTasks.map((g, i) => (
              <button
                key={i}
                onClick={() => toggleTask(g.text)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: selectedTasks.includes(g.text) ? 'rgba(16,185,129,0.1)' : 'var(--chip)',
                  border: `2px solid ${selectedTasks.includes(g.text) ? '#10b981' : 'transparent'}`,
                  textAlign: 'left', transition: 'all 0.2s', width: '100%',
                }}
              >
                <span style={{
                  width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: selectedTasks.includes(g.text) ? '#10b981' : 'var(--card-border)',
                  color: '#fff', fontSize: '.7rem', fontWeight: 900,
                }}>
                  {selectedTasks.includes(g.text) ? '✓' : ''}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--text)' }}>{g.text}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: 600 }}>
                    {g.repeat} • {g.priority} priority
                  </div>
                </div>
              </button>
            ))}
            {reusableTasks.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '.9rem' }}>
                No recurring tasks found. Add new ones in the next step!
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '➕ Add New Tasks',
      content: (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '14px', fontWeight: 600 }}>
            Add new tasks for next week (one per line):
          </p>
          <textarea
            className="fi task-box"
            placeholder={"Morning workout\nProject deadline review\nTeam standup call\nRead 30 pages"}
            value={newTasks}
            onChange={e => setNewTasks(e.target.value)}
            style={{ minHeight: '200px', fontSize: '.95rem', lineHeight: 1.7 }}
          />
        </div>
      ),
    },
    {
      title: '✅ Review & Confirm',
      content: (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '14px', fontWeight: 600 }}>
            {selectedTasks.length + newTasks.split('\n').filter(t => t.trim()).length} tasks will be added for the week of {weekDays[0]?.label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto' }}>
            {[...selectedTasks, ...newTasks.split('\n').filter(t => t.trim())].map((t, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: '8px',
                background: 'var(--chip)', border: '1px solid var(--card-border)',
                fontWeight: 700, fontSize: '.88rem', color: 'var(--text)',
              }}>
                ✅ {t}
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--card)', border: '1.5px solid var(--card-border)',
        borderRadius: '16px', padding: '28px 32px', width: '100%', maxWidth: '520px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'eodSlideIn 0.3s ease both',
      }}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text)' }}>📅 Weekly Planning</div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', fontWeight: 600, marginTop: '4px' }}>
              Step {step + 1} of {steps.length} — {steps[step].title}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--chip)', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 800, color: 'var(--muted)', fontSize: '.85rem' }}>✕</button>
        </div>

        {/* STEP INDICATORS */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '4px', borderRadius: '999px',
              background: i <= step ? 'linear-gradient(90deg, #6366f1, #a855f7)' : 'var(--chip)',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>

        {/* CONTENT */}
        {steps[step].content}

        {/* ACTIONS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="tool-btn"
            style={{ padding: '10px 20px' }}
          >
            {step > 0 ? '← Back' : 'Cancel'}
          </button>
          <button
            onClick={() => step < steps.length - 1 ? setStep(step + 1) : handleFinish()}
            className="new-btn"
            style={{ padding: '10px 24px' }}
          >
            {step < steps.length - 1 ? 'Next →' : '🚀 Plan Week'}
          </button>
        </div>
      </div>
    </div>
  );
}
