import React, { useMemo } from 'react';
import { todayKey, goalVisibleOn, isDoneOn, analyzeHabits } from '../utils/helpers';
import ProductivityHeatmap from '../components/ProductivityHeatmap';

export default function DashboardView({
  appLanguage, copy, userName, quote, setActiveView,
  done, total, pct, weekly, streakDays, dueSoon, goals,
  generateMonthlyReport, aiPersonalCoach,
  liveCurrentGoal, liveClockLabel, userXP = 0, userLevel = 1
}) {
  const isTa = appLanguage === 'ta';

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5)  return { text: isTa ? 'இரவு வணக்கம்'   : 'Good Night',      icon: '🌙' };
    if (h < 12) return { text: isTa ? 'காலை வணக்கம்'   : 'Good Morning',    icon: '☀️' };
    if (h < 17) return { text: isTa ? 'மதிய வணக்கம்'   : 'Good Afternoon',  icon: '🌤️' };
    if (h < 21) return { text: isTa ? 'மாலை வணக்கம்'   : 'Good Evening',    icon: '🌆' };
    return       { text: isTa ? 'இரவு வணக்கம்'         : 'Good Night',      icon: '🌙' };
  }, [isTa]);

  const todayGoals = useMemo(() => {
    if (!goals?.length) return { high: 0, pending: 0 };
    const today = todayKey();
    const vis = goals.filter(g => goalVisibleOn(g, today));
    return {
      high:    vis.filter(g => g.priority === 'High' && !isDoneOn(g, today)).length,
      pending: vis.filter(g => !isDoneOn(g, today)).length,
    };
  }, [goals]);

  const circumference = 2 * Math.PI * 30;
  const dashOffset    = circumference - (pct / 100) * circumference;

  return (
    <div style={{ padding: '0 0 16px' }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '24px 10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6, opacity: 0.9 }}>
            {new Date().toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
          <div className="greeting-name">
            {greeting.text}{userName ? `, ${userName}` : ''}
          </div>
          {quote && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, fontWeight: 500, lineHeight: 1.6, maxWidth: '90%' }}>{quote}</div>}
        </div>
        <div style={{ width: 52, height: 52, borderRadius: 18, background: 'linear-gradient(135deg,var(--accent),#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: '0 8px 24px var(--accent-glow)' }}>
          {userName?.[0]?.toUpperCase() || 'B'}
        </div>
      </div>

      {/* ── LIVE TASK STRIP ── */}
      {liveCurrentGoal && (
        <div style={{ margin: '0 0 10px', background: 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(59,130,246,0.06))', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 18, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#22c55e', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
              {isTa ? '▶ இப்போது' : '▶ Now Active'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {liveCurrentGoal.text}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--text)', background: 'rgba(34,197,94,0.1)', padding: '6px 10px', borderRadius: 10, flexShrink: 0 }}>
            {liveClockLabel}
          </div>
        </div>
      )}

      {/* ── PROGRESS CARD ── */}
      <div className="card" style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 24, padding: '24px 20px' }}>
        <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
          <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
            <circle cx="42" cy="42" r="36" fill="none" stroke="var(--accent)" strokeWidth="7"
              strokeDasharray={226} strokeDashoffset={226 - (pct / 100) * 226}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)', filter: 'drop-shadow(0 0 8px var(--accent-glow))' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px' }}>{pct}%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.5px' }}>
            {isTa ? 'இன்றைய முன்னேற்றம்' : "Today's Progress"}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
            {isTa ? `${doneCount} முடிந்தது • ${remCount} மீதமுள்ளது` : `${doneCount} done • ${remCount} remaining`}
          </p>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', boxShadow: '0 0 10px var(--accent-glow)' }} />
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, margin: '0 0 16px' }}>
        {[
          { val: `${streakDays}d`, label: isTa ? 'STREAK' : 'STREAK',  color: '#f59e0b' },
          { val: `Lv.${userLevel}`, label: isTa ? 'LEVEL' : 'LEVEL',   color: 'var(--accent)' },
          { val: dueSoon,          label: isTa ? 'URGENT' : 'URGENT', color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.val === '0' || s.val === '0d' ? 'var(--muted)' : s.color, letterSpacing: '-0.5px' }}>{s.val}</div>
            <div style={{ fontSize: 8, fontWeight: 800, color: 'var(--muted)', marginTop: 4, letterSpacing: '1px' }}>{s.label}</div>
            {i === 1 && (
              <div style={{ height: 3, background: 'var(--card-border)', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${userXP % 100}%`, background: 'var(--accent,#6366f1)', borderRadius: 999 }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── AI COACH MESSAGE ── */}
      {aiPersonalCoach && (
        <div className="card" style={{ margin: '0 0 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
            ✦ AI INSIGHT
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic', letterSpacing: '-0.2px' }}>
            "{aiPersonalCoach}"
          </div>
        </div>
      )}

      {/* ── WEEKLY OVERVIEW ── */}
      <div className="card" style={{ margin: '0 0 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', letterSpacing: '0.5px' }}>
            WEEKLY PROGRESS
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: 20 }}>
            {weekly.weekDone}/{weekly.weekTotal}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 52 }}>
          {weekly.days.map((day, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: '100%', borderRadius: 6, background: day.pct > 0 ? (day.pct >= 70 ? '#22c55e' : day.pct >= 40 ? 'var(--accent,#6366f1)' : '#f59e0b') : 'var(--chip)', height: `${Math.max(4, (day.pct / 100) * 40)}px`, transition: 'height 0.5s ease' }} />
              <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase' }}>{day.name}</div>
            </div>
          ))}
        </div>
        {weekly.bestDay && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)', fontWeight: 600, textAlign: 'center' }}>
            {isTa ? `சிறந்த நாள்: ${weekly.bestDay.name} (${weekly.bestDay.pct}%)` : `Best: ${weekly.bestDay.name} (${weekly.bestDay.pct}%)`}
          </div>
        )}
      </div>

      {/* ── HEATMAP ── */}
      <div className="card" style={{ margin: '0 0 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1px' }}>ACTIVITY HEATMAP</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>Last 90 Days</div>
        </div>
        <ProductivityHeatmap goals={goals} />
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{ margin: '12px 0 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12, paddingLeft: 10 }}>
          Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '➕', label: isTa ? 'பணி சேர்' : 'Add Task',     color: 'rgba(99,102,241,0.12)',  c: 'var(--accent,#6366f1)', view: 'tasks'     },
            { icon: '🤖', label: isTa ? 'AI திட்டம்' : 'AI Plan',    color: 'rgba(168,85,247,0.12)',  c: '#a855f7',               view: 'tasks'     },
            { icon: '🔁', label: isTa ? 'பழக்கங்கள்' : 'Habits',     color: 'rgba(34,197,94,0.1)',   c: '#22c55e',               view: 'habits'    },
            { icon: '🏆', label: isTa ? '30 நாள்' : '30-Day',        color: 'rgba(245,158,11,0.1)',  c: '#f59e0b',               view: 'challenge' },
          ].map((q, i) => (
            <button key={i} onClick={() => setActiveView(q.view)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 12px', borderRadius: 18, border: '1px solid var(--card-border)', background: 'var(--card)', cursor: 'pointer', textAlign: 'left', transition: 'all .2s' }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: q.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{q.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{q.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── MONTHLY REPORT ── */}
      <div style={{ margin: '0 0 24px' }}>
        <button className="card" onClick={generateMonthlyReport}
          style={{ width: '100%', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>📊 Generate Productivity Audit</span>
        </button>
      </div>
    </div>
  );
}
