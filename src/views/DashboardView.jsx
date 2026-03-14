import React, { useMemo } from 'react';
import { todayKey, toKey, goalVisibleOn, isDoneOn } from '../utils/helpers';
import { AI_TIPS } from '../utils/constants';

export default function DashboardView({ appLanguage, copy, userName, quote, setActiveView, done, total, pct, weekly, streakDays, dueSoon, goals, journalEntries, generateMonthlyReport, aiPersonalCoach }) {
  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) return { text: "Late Night", icon: "🌙", sub: "Burning the midnight oil?" };
    if (hour < 12) return { text: "Good Morning", icon: "🌅", sub: "Start strong. Execute with purpose." };
    if (hour < 17) return { text: "Good Afternoon", icon: "☀️", sub: "Stay focused. Keep the momentum." };
    if (hour < 21) return { text: "Good Evening", icon: "🌆", sub: "Finish strong. Reflect on progress." };
    return { text: "Good Night", icon: "🌙", sub: "Rest well. Tomorrow awaits." };
  }, []);

  // 30-day heatmap data
  const heatmapData = useMemo(() => {
    if (!goals) return [];
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toKey(d);
      const visible = goals.filter(g => goalVisibleOn(g, key));
      const doneCount = visible.filter(g => isDoneOn(g, key)).length;
      const totalCount = visible.length;
      const pctDay = totalCount ? Math.round((doneCount / totalCount) * 100) : -1;
      data.push({ key, day: d.getDate(), pct: pctDay, done: doneCount, total: totalCount });
    }
    return data;
  }, [goals]);

  const heatmapColor = (pctVal) => {
    if (pctVal === -1) return 'var(--chip)';
    if (pctVal === 0) return 'rgba(239, 68, 68, 0.2)';
    if (pctVal < 50) return 'rgba(245, 158, 11, 0.35)';
    if (pctVal < 100) return 'rgba(16, 185, 129, 0.4)';
    return 'rgba(16, 185, 129, 0.8)';
  };

  // Quick stats
  const todayGoals = useMemo(() => {
    if (!goals) return { high: 0, pending: 0 };
    const today = todayKey();
    const visible = goals.filter(g => goalVisibleOn(g, today));
    const high = visible.filter(g => g.priority === 'High' && !isDoneOn(g, today)).length;
    const pending = visible.filter(g => !isDoneOn(g, today)).length;
    return { high, pending };
  }, [goals]);

  return (
    <div className="animate-fade-in">
      <div className="hero" style={{ marginBottom: '16px' }}>
        <div className="topbar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{ fontSize: '2.2rem' }}>{greeting.icon}</span>
              {/* 🔥 Personalized Name Greeting 🔥 */}
              <div className="title">
                {greeting.text}{userName ? `, ${userName}` : ''}
              </div>
            </div>
            <div className="tip">{greeting.sub}</div>
            <div className="motivation" style={{ marginTop: '14px' }}>
              <div className="motivation-label">DAILY MOTIVATION</div>
              <div className="quote-line">"{quote}"</div>
            </div>
          </div>
          <div className="head-actions" style={{ flexDirection: 'column', gap: '8px' }}>
            <button className="new-btn" onClick={() => setActiveView("tasks")}>
              📋 View Tasks
            </button>
            <button className="hero-btn" onClick={() => setActiveView("planner")}>
              📅 Open Planner
            </button>
          </div>
        </div>

        <div className="progress-area">
          <div className="progress-lbl">
            <span>Today's Progress</span>
            <span>{done}/{total} ({pct}%)</span>
          </div>
          <div className="bar-bg">
            <div className="bar-fill" style={{ width: `${pct}%` }}></div>
          </div>
        </div>
      </div>

      {/* 🔥 STATS GRID 🔥 */}
      <div className="stats" style={{ marginBottom: '16px' }}>
        <div className="pill" style={{ borderLeft: '3px solid #f59e0b' }}>
          <div className="num">{streakDays}</div>
          <div className="lbl">🔥 Day Streak</div>
        </div>
        <div className="pill" style={{ borderLeft: '3px solid #3b82f6' }}>
          <div className="num">{weekly.weekDone}</div>
          <div className="lbl">📊 Week Done</div>
        </div>
        <div className="pill" style={{ borderLeft: '3px solid #ef4444' }}>
          <div className="num">{todayGoals.high}</div>
          <div className="lbl">🔴 High Priority</div>
        </div>
        <div className="pill" style={{ borderLeft: '3px solid #10b981' }}>
          <div className="num">{dueSoon}</div>
          <div className="lbl">⏰ Due Soon</div>
        </div>
      </div>

      {/* 🌙 MOOD TREND (from Journal) */}
      {journalEntries && (() => {
        const MOOD_MAP = { 'Great': { emoji: '😄', color: '#10b981' }, 'Good': { emoji: '🙂', color: '#3b82f6' }, 'Okay': { emoji: '😐', color: '#f59e0b' }, 'Low': { emoji: '😔', color: '#ef4444' }, 'Stressed': { emoji: '😠', color: '#dc2626' } };
        const days = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now); d.setDate(now.getDate() - i);
          const key = toKey(d);
          const entry = journalEntries[key];
          days.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), mood: entry?.mood, isToday: i === 0 });
        }
        const hasMoods = days.some(d => d.mood);
        if (!hasMoods) return null;
        return (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💭 Mood Trend <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)' }}>(from Journal)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {days.map((d, i) => {
                const m = d.mood && MOOD_MAP[d.mood];
                return (
                  <div key={i} style={{
                    textAlign: 'center', padding: '12px 4px', borderRadius: '10px',
                    background: m ? `${m.color}11` : 'var(--chip)',
                    border: d.isToday ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{m ? m.emoji : '·'}</div>
                    <div style={{ fontSize: '.68rem', fontWeight: 800, color: m ? m.color : 'var(--muted)' }}>{d.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 🔥 WEEKLY OVERVIEW 🔥 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="weekly-head">
          <div className="weekly-title">📈 Weekly Overview</div>
          <div className="weekly-meta">{weekly.weekPct}% • {weekly.weekDone}/{weekly.weekTotal} done</div>
        </div>
        <div className="week-bars">
          {weekly.days.map((day) => (
            <div key={day.key} className="w-col">
              <div className="w-track">
                <div className="w-fill" style={{ height: `${day.pct}%` }}></div>
              </div>
              <div className="w-day">{day.name}</div>
            </div>
          ))}
        </div>
        <div className="week-note">
          Best day: {weekly.bestDay?.name} ({weekly.bestDay?.pct}%)
        </div>
      </div>

      {/* 🔥 30-DAY ACTIVITY HEATMAP 🔥 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)' }}>🗓 30-Day Activity</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '.7rem', color: 'var(--muted)', fontWeight: 700 }}>
            <span>Less</span>
            {[0, 25, 50, 75, 100].map(v => (
              <div key={v} style={{ width: '12px', height: '12px', borderRadius: '3px', background: heatmapColor(v) }}></div>
            ))}
            <span>More</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
          {heatmapData.map((d, i) => (
            <div key={d.key} title={`${d.key}: ${d.done}/${d.total} done`} style={{
              aspectRatio: '1', borderRadius: '4px',
              background: heatmapColor(d.pct),
              border: d.key === todayKey() ? '2px solid #3b82f6' : '1px solid var(--card-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.6rem', fontWeight: 800, color: 'var(--muted)',
              cursor: 'pointer', transition: 'transform .2s ease',
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {d.day}
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 AI INSIGHTS & CAREER TIPS 🔥 */}
      <div className="card" style={{ marginBottom: '16px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'linear-gradient(135deg, var(--card) 0%, rgba(139, 92, 246, 0.06) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.2rem' }}>✨</span>
            AI Insights
          </div>
          <span style={{ fontSize: '.7rem', fontWeight: 800, color: '#a855f7', background: 'rgba(139, 92, 246, 0.1)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>SMART TIPS</span>
        </div>

        {/* 🔥 NEW: Gemini Personal Coach Briefing 🔥 */}
        {aiPersonalCoach && (
          <div style={{ 
            padding: '16px', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            marginBottom: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '8px', letterSpacing: '1px' }}>PERSONAL COACH BRIEFING</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{aiPersonalCoach}"
            </div>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4rem', opacity: 0.05, transform: 'rotate(-15deg)' }}>🤖</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(() => {
            const lang = appLanguage === 'ta' ? 'ta' : 'en';
            const pool = AI_TIPS[lang] || AI_TIPS.en;
            
            // Generate dynamic tips based on state
            const dynamicTips = [];
            if (todayGoals.high > 0) {
              const tip = pool.find(t => t.icon === '🔴');
              if (tip) dynamicTips.push(tip.text.replace('{count}', todayGoals.high).replace('{s}', todayGoals.high > 1 ? 's' : '').replace('{target}', todayGoals.high > 1 ? (lang === 'ta' ? 'அவற்றை' : 'them') : (lang === 'ta' ? 'அதை' : 'it')));
            }
            if (todayGoals.pending > 3) {
              const tip = pool.find(t => t.icon === '🍅');
              if (tip) dynamicTips.push(tip.text.replace('{count}', todayGoals.pending));
            }
            if (pct >= 80) {
              const tip = pool.find(t => t.icon === '🏆');
              if (tip) dynamicTips.push(tip.text.replace('{pct}', pct));
            } else if (pct >= 40) {
              const tip = pool.find(t => t.icon === '💪');
              if (tip) dynamicTips.push(tip.text.replace('{pct}', pct));
            } else if (total > 0) {
              const tip = pool.find(t => t.icon === '🚀');
              if (tip) dynamicTips.push(tip.text.replace('{pct}', pct));
            }
            if (streakDays >= 3) {
              const tip = pool.find(t => t.icon === '🔥');
              if (tip) dynamicTips.push(tip.text.replace('{count}', streakDays).replace('{next}', streakDays + 1));
            }
            
            // Add some random tips from the pool that aren't already included
            const usedIcons = ['🔴', '🍅', '🏆', '💪', '🚀', '🔥'];
            const others = pool.filter(t => !usedIcons.includes(t.icon));
            const randomTips = others.sort(() => 0.5 - Math.random()).slice(0, 2).map(t => t.text);
            
            const finalTips = [...dynamicTips, ...randomTips].slice(0, 3);

            return finalTips.map((text, i) => {
              const tipObj = pool.find(t => t.text === text) || pool[0];
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 16px', borderRadius: '12px',
                  background: 'var(--chip)', border: '1px solid var(--card-border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '2px' }}>{tipObj.icon}</span>
                  <span style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.5 }}>{text}</span>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* 🔥 QUICK ACTIONS 🔥 */}
      <div className="card">
        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '14px' }}>⚡ Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {[
            { icon: '➕', label: 'New Task', sub: 'Ctrl+N', action: () => setActiveView('tasks') },
            { icon: '🍅', label: 'Pomodoro', sub: 'Focus timer', action: () => setActiveView('tools') },
            { icon: '📈', label: 'Analytics', sub: 'View insights', action: () => setActiveView('analytics') },
            { icon: '📊', label: 'Monthly Report', sub: 'PDF summary', action: generateMonthlyReport },
            { icon: '🚀', label: 'Career', sub: 'Track growth', action: () => setActiveView('career') },
            { icon: '🔁', label: 'Habits', sub: 'Track daily', action: () => setActiveView('habits') },
            { icon: '🏆', label: 'Achievements', sub: 'View badges', action: () => setActiveView('achievements') },
          ].map((item, idx) => (
            <button key={idx} className="tool-btn" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 16px', textAlign: 'left',
            }} onClick={item.action}>
              <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--text)' }}>{item.label}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: 600, marginTop: '2px' }}>{item.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}