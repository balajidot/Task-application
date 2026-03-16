import React, { useMemo } from 'react';
import { todayKey, toKey, goalVisibleOn, isDoneOn, analyzeHabits, formatTimeRange } from '../utils/helpers';
import { AI_TIPS } from '../utils/constants';
import ProductivityHeatmap from '../components/ProductivityHeatmap';

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

  // Quick stats
  const todayGoals = useMemo(() => {
    if (!goals) return { high: 0, pending: 0 };
    const today = todayKey();
    const visible = goals.filter(g => goalVisibleOn(g, today));
    const high = visible.filter(g => g.priority === 'High' && !isDoneOn(g, today)).length;
    const pending = visible.filter(g => !isDoneOn(g, today)).length;
    return { high, pending };
  }, [goals]);

  const smartSuggestions = useMemo(() => {
    return analyzeHabits(goals);
  }, [goals]);

  return (
    <div className="animate-fade-in">
      <div className="hero" style={{ marginBottom: '16px', background: 'var(--hero)', border: '1px solid var(--card-border)' }}>
        <div className="topbar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{ fontSize: '2.2rem' }}>{greeting.icon}</span>
              {/* 🔥 Personalized Name Greeting 🔥 */}
              <div className="title" style={{ color: 'var(--text)' }}>
                {greeting.text}{userName ? `, ${userName}` : ''}
              </div>
            </div>
            <div className="tip" style={{ color: 'var(--muted)' }}>{greeting.sub}</div>
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
        <div className="pill" style={{ borderLeft: '3px solid #f59e0b', background: 'var(--chip)', color: 'var(--text)' }}>
          <div className="num" style={{ color: 'var(--text)' }}>{streakDays}</div>
          <div className="lbl" style={{ color: 'var(--muted)' }}>🔥 Day Streak</div>
        </div>
        <div className="pill" style={{ borderLeft: '3px solid #3b82f6', background: 'var(--chip)', color: 'var(--text)' }}>
          <div className="num" style={{ color: 'var(--text)' }}>{weekly.weekDone}</div>
          <div className="lbl" style={{ color: 'var(--muted)' }}>📊 Week Done</div>
        </div>
        <div className="pill" style={{ borderLeft: '3px solid #ef4444', background: 'var(--chip)', color: 'var(--text)' }}>
          <div className="num" style={{ color: 'var(--text)' }}>{todayGoals.high}</div>
          <div className="lbl" style={{ color: 'var(--muted)' }}>🔴 High Priority</div>
        </div>
        <div className="pill" style={{ borderLeft: '3px solid #10b981', background: 'var(--chip)', color: 'var(--text)' }}>
          <div className="num" style={{ color: 'var(--text)' }}>{dueSoon}</div>
          <div className="lbl" style={{ color: 'var(--muted)' }}>⏰ Due Soon</div>
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

      {/* 🔥 ADVANCED HEATMAP 🔥 */}
      <ProductivityHeatmap goals={goals} />

      {/* 🔥 AI INSIGHTS & CAREER TIPS 🔥 */}
      <div className="card" style={{ marginBottom: '16px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'linear-gradient(135deg, var(--card) 0%, rgba(139, 92, 246, 0.06) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.2rem' }}>✨</span>
            AI Insights
          </div>
          <span style={{ fontSize: '.7rem', fontWeight: 800, color: '#a855f7', background: 'rgba(139, 92, 246, 0.1)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>SMART TIPS</span>
        </div>

        {/* 🔥 NEW: Smart AI Habit Suggestions 🔥 */}
        {smartSuggestions.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {smartSuggestions.map((s, si) => (
              <div key={si} style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.08))',
                border: '1.5px solid rgba(37, 99, 235, 0.2)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '1.8rem' }}>🧠</div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                    {appLanguage === 'ta' 
                      ? `நீங்கள் வழக்கமாக ${s.timeStr}-க்கு "${s.text}" செய்வீர்கள்.` 
                      : `You usually do "${s.text}" around ${s.timeStr}.`}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {appLanguage === 'ta' ? 'இப்போது அதைத் தொடங்கலாமா?' : 'Should we start it now?'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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