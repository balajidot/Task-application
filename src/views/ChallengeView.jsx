import React, { useState, useEffect, useMemo } from 'react';
import { todayKey, toKey, goalVisibleOn, isDoneOn } from '../utils/helpers';
import { useApp } from '../context/AppContext';

const MILESTONES = [
  { day: 1,  icon: '🌱', title: 'First Step',      desc: 'You started your journey!',          xp: 10  },
  { day: 3,  icon: '🔥', title: '3-Day Spark',     desc: '3 days of consistency!',             xp: 30  },
  { day: 7,  icon: '⭐', title: 'One Week Strong',  desc: 'You survived your first week!',      xp: 70  },
  { day: 14, icon: '💎', title: 'Two Week Warrior', desc: 'Habits are forming. Keep going!',    xp: 150 },
  { day: 21, icon: '🏅', title: '21-Day Habit',     desc: 'Science says habits form at 21!',   xp: 210 },
  { day: 30, icon: '🏆', title: 'CHAMPION!',        desc: 'You transformed in 30 days!',       xp: 300 },
];

export default function ChallengeView() {
  const { 
    goals = [], 
    streakDays = 0, 
    appLanguage = 'en', 
    userXP = 0, 
    userLevel = 1,
    challengeStart,
    setChallengeStart
  } = useApp();
  const [started, setStarted] = useState(!!challengeStart);

  useEffect(() => {
    const saved = localStorage.getItem('taskPlanner_challengeStart');
    if (saved) { setChallengeStart(new Date(saved)); setStarted(true); }
  }, []);

  const startChallenge = () => {
    const now = new Date();
    localStorage.setItem('taskPlanner_challengeStart', now.toISOString());
    setChallengeStart(now);
    setStarted(true);
  };

  const daysPassed = useMemo(() => {
    if (!challengeStart) return 0;
    return Math.floor((Date.now() - new Date(challengeStart).getTime()) / (1000 * 60 * 60 * 24));
  }, [challengeStart]);

  const currentDay  = Math.min(daysPassed + 1, 30);
  const pct         = Math.round((daysPassed / 30) * 100);

  // Calculate daily completion for each of 30 days
  const dailyData = useMemo(() => {
    if (!challengeStart) return [];
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(challengeStart);
      d.setDate(d.getDate() + i);
      const key         = toKey(d);
      const dayGoals    = goals.filter(g => goalVisibleOn(g, key));
      const dayDone     = dayGoals.filter(g => isDoneOn(g, key)).length;
      const isPast      = d < new Date() && i < daysPassed;
      const isToday     = i === daysPassed;
      const isFuture    = i > daysPassed;
      const completed   = isPast && dayGoals.length > 0 && dayDone === dayGoals.length;
      const partial     = isPast && dayDone > 0 && dayDone < dayGoals.length;
      const missed      = isPast && dayDone === 0;
      return { day: i + 1, key, dayDone, total: dayGoals.length, isPast, isToday, isFuture, completed, partial, missed };
    });
  }, [challengeStart, goals, daysPassed]);

  const earnedMilestones = MILESTONES.filter(m => daysPassed >= m.day);
  const nextMilestone    = MILESTONES.find(m => daysPassed < m.day);

  // ─── Not Started Screen ───
  if (!started) return (
    <div style={{ padding: '24px 20px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏆</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 12 }}>
          {appLanguage === 'ta' ? '30 நாள் சவால்' : '30-Day Challenge'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 300, margin: '0 auto' }}>
          {appLanguage === 'ta'
            ? '30 நாட்கள் தொடர்ந்து உங்கள் tasks complete பண்ணுங்கள். உங்கள் வாழ்க்கையை மாற்றுங்கள்!'
            : 'Complete your tasks every day for 30 days and transform your life. One day at a time.'}
        </div>
      </div>

      {/* What you'll earn */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 20, marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>
          {appLanguage === 'ta' ? 'நீங்கள் earn செய்வீர்கள்' : "What you'll earn"}
        </div>
        {MILESTONES.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < MILESTONES.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
            <span style={{ fontSize: '1.5rem', width: 32, textAlign: 'center' }}>{m.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Day {m.day} — {m.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{m.desc}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 8px', borderRadius: 999 }}>+{m.xp} XP</div>
          </div>
        ))}
      </div>

      <button onClick={startChallenge}
        style={{ width: '100%', padding: 18, borderRadius: 18, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: '#fff',
          fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800,
          boxShadow: '0 8px 24px var(--accent-glow)' }}>
        {appLanguage === 'ta' ? '🚀 சவாலை ஏற்க' : "🚀 Accept the Challenge"}
      </button>
    </div>
  );

  // ─── Active Challenge Screen ───
  return (
    <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            🏆 {appLanguage === 'ta' ? '30 நாள் சவால்' : '30-Day Challenge'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, fontWeight: 500 }}>
            {appLanguage === 'ta' ? `நாள் ${currentDay} / 30` : `Day ${currentDay} of 30`}
          </div>
        </div>
        <div style={{ textAlign: 'center', background: pct >= 70 ? 'rgba(34,197,94,0.1)' : 'var(--accent-soft)', border: `1px solid ${pct >= 70 ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)'}`, borderRadius: 14, padding: '10px 16px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: pct >= 70 ? '#22c55e' : 'var(--accent)' }}>{pct}%</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Done</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 10, background: 'var(--card-border)', borderRadius: 999, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--purple))', borderRadius: 999, transition: 'width 0.6s ease', boxShadow: '0 0 8px var(--accent-glow)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', fontWeight: 700, marginBottom: 20 }}>
        <span>Day 1</span>
        <span>{30 - daysPassed} {appLanguage === 'ta' ? 'நாட்கள் மீதம்' : 'days left'}</span>
        <span>Day 30</span>
      </div>

      {/* Next milestone */}
      {nextMilestone && (
        <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.06))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 18, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: '2rem' }}>{nextMilestone.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
              {appLanguage === 'ta' ? 'அடுத்த milestone' : 'Next Milestone'} — Day {nextMilestone.day}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{nextMilestone.title} • +{nextMilestone.xp} XP</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>
            {nextMilestone.day - daysPassed} {appLanguage === 'ta' ? 'நாட்கள்' : 'days'}
          </div>
        </div>
      )}

      {/* 30-day grid */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
        {appLanguage === 'ta' ? 'தினசரி முன்னேற்றம்' : 'Daily Progress'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 24 }}>
        {dailyData.map((d) => {
          const milestone = MILESTONES.find(m => m.day === d.day);
          let bg = 'var(--chip)', border = 'var(--card-border)', color = 'var(--muted)';
          if (d.isToday)   { bg = 'var(--accent-soft)'; border = 'var(--accent)'; color = 'var(--accent)'; }
          else if (d.completed) { bg = 'rgba(34,197,94,0.15)'; border = '#22c55e'; color = '#22c55e'; }
          else if (d.partial)   { bg = 'rgba(245,158,11,0.12)'; border = '#f59e0b'; color = '#f59e0b'; }
          else if (d.missed)    { bg = 'rgba(239,68,68,0.1)'; border = '#ef4444'; color = '#ef4444'; }
          return (
            <div key={d.day} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: '6px 2px', textAlign: 'center', position: 'relative' }}>
              {milestone && <span style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.8rem' }}>{milestone.icon}</span>}
              <div style={{ fontSize: 11, fontWeight: 800, color, marginTop: milestone ? 4 : 0 }}>{d.day}</div>
              {d.isToday && <div style={{ fontSize: 7, color: 'var(--accent)', fontWeight: 800, marginTop: 1 }}>TODAY</div>}
              {d.completed && <div style={{ fontSize: 8, color: '#22c55e' }}>✓</div>}
              {d.partial   && <div style={{ fontSize: 7, color: '#f59e0b' }}>{d.dayDone}/{d.total}</div>}
              {d.missed     && <div style={{ fontSize: 8, color: '#ef4444' }}>✗</div>}
            </div>
          );
        })}
      </div>

      {/* Earned milestones */}
      {earnedMilestones.length > 0 && (
        <>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
            {appLanguage === 'ta' ? 'பெற்ற சாதனைகள்' : 'Earned Badges'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            {earnedMilestones.map((m, i) => (
              <div key={i} style={{ background: 'linear-gradient(135deg,var(--accent-soft),rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.3rem' }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)' }}>{m.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>Day {m.day} • +{m.xp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: appLanguage === 'ta' ? 'தொடர்' : 'Streak',  value: `${streakDays}d`, color: '#f59e0b' },
          { label: 'Level',                                      value: `Lv.${userLevel}`,  color: 'var(--accent)' },
          { label: 'XP',                                         value: userXP,            color: '#22c55e' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
