import React, { useMemo } from 'react';
import { readPersist } from '../utils/helpers';
import { HABITS_KEY, JOURNAL_KEY, GOALS_KEY } from '../utils/constants';

const BADGE_DEFS = [
  { id: 'first_task', icon: '⭐', title: 'First Step', desc: 'Complete your first task', check: (s) => s.totalDone >= 1 },
  { id: 'ten_tasks', icon: '🔟', title: 'Getting Going', desc: 'Complete 10 tasks', check: (s) => s.totalDone >= 10 },
  { id: 'fifty_tasks', icon: '🏅', title: 'Half Century', desc: 'Complete 50 tasks', check: (s) => s.totalDone >= 50 },
  { id: 'hundred_tasks', icon: '💯', title: 'Centurion', desc: 'Complete 100 tasks', check: (s) => s.totalDone >= 100 },
  { id: 'streak_3', icon: '🔥', title: 'On Fire', desc: '3-day streak', check: (s) => s.streak >= 3 },
  { id: 'streak_7', icon: '⚡', title: 'Lightning Week', desc: '7-day streak', check: (s) => s.streak >= 7 },
  { id: 'streak_21', icon: '🏆', title: 'Habit Master', desc: '21-day streak', check: (s) => s.streak >= 21 },
  { id: 'streak_30', icon: '👑', title: 'Monthly King', desc: '30-day streak', check: (s) => s.streak >= 30 },
  { id: 'perfect_day', icon: '💎', title: 'Perfect Day', desc: '100% completion in a day', check: (s) => s.hadPerfectDay },
  { id: 'early_bird', icon: '🌅', title: 'Early Bird', desc: 'Complete a task before 7 AM', check: (s) => s.earlyBird },
  { id: 'journal_1', icon: '📓', title: 'Dear Diary', desc: 'Write your first journal entry', check: (s) => s.journalCount >= 1 },
  { id: 'journal_7', icon: '📝', title: 'Reflective Mind', desc: 'Journal for 7 days', check: (s) => s.journalCount >= 7 },
  { id: 'habit_3', icon: '🔁', title: 'Habit Builder', desc: 'Track 3 habits', check: (s) => s.habitCount >= 3 },
  { id: 'goal_1', icon: '🎯', title: 'Goal Setter', desc: 'Create your first goal', check: (s) => s.goalCount >= 1 },
  { id: 'goal_complete', icon: '🏁', title: 'Goal Achiever', desc: 'Complete a goal 100%', check: (s) => s.goalCompleted },
  { id: 'five_hundred', icon: '🚀', title: 'Unstoppable', desc: 'Complete 500 tasks', check: (s) => s.totalDone >= 500 },
];

export default function AchievementBadges({ stats }) {
  const unlocked = useMemo(() =>
    BADGE_DEFS.filter(b => b.check(stats)), [stats]);
  const locked = useMemo(() =>
    BADGE_DEFS.filter(b => !b.check(stats)), [stats]);

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>🏆 Achievements</h2>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: '4px', fontWeight: 600 }}>
            {unlocked.length}/{BADGE_DEFS.length} unlocked
          </p>
        </div>
        <span style={{
          fontSize: '.85rem', fontWeight: 900, padding: '6px 16px', borderRadius: '999px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
          color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
        }}>
          Level {Math.floor(unlocked.length / 3) + 1}
        </span>
      </div>

      {/* PROGRESS */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--text)' }}>Progress</span>
          <span style={{ fontWeight: 900, fontSize: '.85rem', color: '#f59e0b' }}>
            {Math.round((unlocked.length / BADGE_DEFS.length) * 100)}%
          </span>
        </div>
        <div style={{ height: '10px', borderRadius: '999px', background: 'var(--chip)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '999px', transition: 'width 0.5s ease',
            width: `${(unlocked.length / BADGE_DEFS.length) * 100}%`,
            background: 'linear-gradient(90deg, #f59e0b, #ef4444, #a855f7)',
          }} />
        </div>
      </div>

      {/* UNLOCKED */}
      {unlocked.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 900, fontSize: '.95rem', color: '#10b981', marginBottom: '10px' }}>✅ Unlocked</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {unlocked.map(b => (
              <div key={b.id} className="card" style={{
                textAlign: 'center', padding: '16px 12px',
                border: '1.5px solid rgba(16,185,129,0.3)',
                background: 'linear-gradient(135deg, var(--card) 0%, rgba(16,185,129,0.05) 100%)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{b.icon}</div>
                <div style={{ fontWeight: 900, fontSize: '.88rem', color: 'var(--text)' }}>{b.title}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: 600, marginTop: '4px' }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOCKED */}
      {locked.length > 0 && (
        <div>
          <div style={{ fontWeight: 900, fontSize: '.95rem', color: 'var(--muted)', marginBottom: '10px' }}>🔒 Locked</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {locked.map(b => (
              <div key={b.id} className="card" style={{
                textAlign: 'center', padding: '16px 12px', opacity: 0.5,
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px', filter: 'grayscale(1)' }}>{b.icon}</div>
                <div style={{ fontWeight: 900, fontSize: '.88rem', color: 'var(--muted)' }}>{b.title}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: 600, marginTop: '4px' }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
