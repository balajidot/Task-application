// CheckInView.jsx — Daily Check-in & AI Auto-schedule
// ✅ Phase 2: Builds emotional connection + retention

import React, { useState, useEffect } from 'react';
import { todayKey } from '../utils/helpers';
import { getApiUrl } from '../utils/apiConfig';

const MOODS = [
  { id: 'great',    emoji: '😄', label: 'Great',    color: '#22c55e' },
  { id: 'good',     emoji: '🙂', label: 'Good',     color: '#3b82f6' },
  { id: 'okay',     emoji: '😐', label: 'Okay',     color: '#f59e0b' },
  { id: 'low',      emoji: '😔', label: 'Low',      color: '#ef4444' },
  { id: 'stressed', emoji: '😤', label: 'Stressed', color: '#dc2626' },
];

const ENERGY = [
  { id: 'high',   emoji: '⚡', label: 'High'   },
  { id: 'medium', emoji: '🔋', label: 'Medium' },
  { id: 'low',    emoji: '😴', label: 'Low'    },
];

const FOCUS_AREAS = [
  { id: 'banking',  emoji: '🏦', label: 'Banking Prep'   },
  { id: 'coding',   emoji: '💻', label: 'Coding / Dev'   },
  { id: 'english',  emoji: '📖', label: 'English'        },
  { id: 'exercise', emoji: '🏃', label: 'Exercise'       },
  { id: 'work',     emoji: '💼', label: 'Work Tasks'     },
  { id: 'personal', emoji: '🌱', label: 'Personal Goals' },
];

export default function CheckInView({ userName = 'User', appLanguage = 'en', goals = [], onAddTasks }) {
  const [step, setStep]             = useState(1); // 1=mood, 2=energy, 3=focus, 4=generating, 5=done
  const [mood, setMood]             = useState(null);
  const [energy, setEnergy]         = useState(null);
  const [focusAreas, setFocusAreas] = useState([]);
  const [aiSchedule, setAiSchedule] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [todayCheckIn, setTodayCheckIn] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(`taskPlanner_checkin_${todayKey()}`);
    if (saved) {
      setAlreadyCheckedIn(true);
      setTodayCheckIn(JSON.parse(saved));
    }
  }, []);

  const toggleFocus = (id) => {
    setFocusAreas(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const generateSchedule = async () => {
    setStep(4);
    setLoading(true);

    const context = [
      `Mood: ${mood}`,
      `Energy: ${energy}`,
      `Focus areas: ${focusAreas.join(', ')}`,
      `Existing tasks today: ${goals.filter(g => g.date === todayKey()).length}`,
    ].join('. ');

    try {
      const res  = await fetch(getApiUrl('/api/gemini'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userName, date: todayKey(), context, language: appLanguage }),
      });
      const data = await res.json();

      if (data.schedule) {
        const lines = data.schedule.split('\n').filter(Boolean);
        setAiSchedule(lines);
      }
    } catch (e) {
      setAiSchedule([
        '09:00 - 10:30 - Deep focus work session',
        '12:30 - 13:15 - Lunch break',
        '14:00 - 15:30 - Skill building session',
        '17:30 - 18:15 - Review and planning',
      ]);
    }

    // Save check-in data
    const checkInData = { mood, energy, focusAreas, date: todayKey() };
    localStorage.setItem(`taskPlanner_checkin_${todayKey()}`, JSON.stringify(checkInData));

    setLoading(false);
    setStep(5);
  };

  const handleAddToTasks = () => {
    if (onAddTasks && aiSchedule.length > 0) {
      onAddTasks(aiSchedule.join('\n'));
      setAlreadyCheckedIn(true);
      setTodayCheckIn({ mood, energy, focusAreas });
    }
  };

  // ─── Already checked in ───
  if (alreadyCheckedIn && todayCheckIn) {
    const moodObj = MOODS.find(m => m.id === todayCheckIn.mood);
    return (
      <div style={{ padding: '24px 20px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '32px 20px', background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(59,130,246,0.05))', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 24, marginBottom: 20 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>{moodObj?.emoji || '✅'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            {appLanguage === 'ta' ? 'இன்று check-in செய்தீர்கள்!' : "Today's Check-in Done!"}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
            {appLanguage === 'ta' ? 'மீண்டும் நாளை காலை சந்திப்போம்!' : 'See you tomorrow morning!'}
          </div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 18 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>
            {appLanguage === 'ta' ? 'இன்றைய நிலை' : "Today's Status"}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'var(--chip)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>{moodObj?.emoji}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, marginTop: 4 }}>MOOD</div>
            </div>
            <div style={{ flex: 1, background: 'var(--chip)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>{ENERGY.find(e => e.id === todayCheckIn.energy)?.emoji || '🔋'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, marginTop: 4 }}>ENERGY</div>
            </div>
            <div style={{ flex: 2, background: 'var(--chip)', borderRadius: 12, padding: '12px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Focus</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(todayCheckIn.focusAreas || []).map((f, i) => {
                  const fa = FOCUS_AREAS.find(x => x.id === f);
                  return <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: 999 }}>{fa?.label || f}</span>;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 1: Mood ───
  if (step === 1) return (
    <div style={{ padding: '24px 20px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
          {appLanguage === 'ta' ? `காலை வணக்கம், ${userName}! 👋` : `Good morning, ${userName}! 👋`}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
          {appLanguage === 'ta' ? 'இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?' : 'How are you feeling today?'}
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ height: 4, width: step === s ? 32 : 16, borderRadius: 999,
            background: step >= s ? 'var(--accent)' : 'var(--card-border)', transition: 'all 0.3s' }} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 28 }}>
        {MOODS.map(m => (
          <button key={m.id} onClick={() => setMood(m.id)}
            style={{ padding: '14px 6px', borderRadius: 16, border: `2px solid ${mood === m.id ? m.color : 'var(--card-border)'}`,
              background: mood === m.id ? `${m.color}18` : 'var(--chip)',
              cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{m.emoji}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: mood === m.id ? m.color : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{m.label}</div>
          </button>
        ))}
      </div>

      <button onClick={() => mood && setStep(2)} disabled={!mood}
        style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none',
          background: mood ? 'linear-gradient(135deg,var(--accent),var(--purple))' : 'var(--chip)',
          color: mood ? '#fff' : 'var(--muted)',
          fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, cursor: mood ? 'pointer' : 'not-allowed' }}>
        {appLanguage === 'ta' ? 'தொடர் →' : 'Continue →'}
      </button>
    </div>
  );

  // ─── Step 2: Energy ───
  if (step === 2) return (
    <div style={{ padding: '24px 20px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
          {appLanguage === 'ta' ? 'உங்கள் energy level?' : "What's your energy level?"}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {appLanguage === 'ta' ? 'AI இதன் அடிப்படையில் திட்டமிடும்.' : 'Your AI coach will plan around this.'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {ENERGY.map(e => (
          <button key={e.id} onClick={() => setEnergy(e.id)} style={{ flex: 1, padding: '20px 10px', borderRadius: 18,
            border: `2px solid ${energy === e.id ? 'var(--accent)' : 'var(--card-border)'}`,
            background: energy === e.id ? 'var(--accent-soft)' : 'var(--chip)',
            cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>{e.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: energy === e.id ? 'var(--accent)' : 'var(--text)' }}>{e.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setStep(1)} style={{ flex: 1, padding: 16, borderRadius: 16, border: '1.5px solid var(--card-border)', background: 'var(--chip)', color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>← Back</button>
        <button onClick={() => energy && setStep(3)} disabled={!energy}
          style={{ flex: 2, padding: 16, borderRadius: 16, border: 'none',
            background: energy ? 'linear-gradient(135deg,var(--accent),var(--purple))' : 'var(--chip)',
            color: energy ? '#fff' : 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, cursor: energy ? 'pointer' : 'not-allowed' }}>
          Continue →
        </button>
      </div>
    </div>
  );

  // ─── Step 3: Focus ───
  if (step === 3) return (
    <div style={{ padding: '24px 20px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
          {appLanguage === 'ta' ? 'இன்று எதில் கவனம்?' : "What to focus on today?"}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {appLanguage === 'ta' ? 'ஒன்று அல்லது அதிகம் தேர்வு செய்யுங்கள்' : 'Select one or more'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {FOCUS_AREAS.map(f => (
          <button key={f.id} onClick={() => toggleFocus(f.id)}
            style={{ padding: '14px 12px', borderRadius: 16,
              border: `1.5px solid ${focusAreas.includes(f.id) ? 'var(--accent)' : 'var(--card-border)'}`,
              background: focusAreas.includes(f.id) ? 'var(--accent-soft)' : 'var(--chip)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              transition: 'all .2s' }}>
            <span style={{ fontSize: '1.3rem' }}>{f.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: focusAreas.includes(f.id) ? 'var(--accent)' : 'var(--text)' }}>{f.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setStep(2)} style={{ flex: 1, padding: 16, borderRadius: 16, border: '1.5px solid var(--card-border)', background: 'var(--chip)', color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>← Back</button>
        <button onClick={() => focusAreas.length > 0 && generateSchedule()} disabled={focusAreas.length === 0}
          style={{ flex: 2, padding: 16, borderRadius: 16, border: 'none',
            background: focusAreas.length > 0 ? 'linear-gradient(135deg,var(--accent),var(--purple))' : 'var(--chip)',
            color: focusAreas.length > 0 ? '#fff' : 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, cursor: focusAreas.length > 0 ? 'pointer' : 'not-allowed' }}>
          🤖 {appLanguage === 'ta' ? 'AI திட்டம் உருவாக்கு' : 'Generate AI Plan'}
        </button>
      </div>
    </div>
  );

  // ─── Step 4: Generating ───
  if (step === 4) return (
    <div style={{ padding: '40px 20px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 20 }}>🤖</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
        {appLanguage === 'ta' ? 'AI திட்டம் உருவாக்குகிறது...' : 'Creating your plan...'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>
        {appLanguage === 'ta' ? `${userName} க்கான இன்றைய திட்டம்` : `Personalizing today's schedule for ${userName}`}
      </div>
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 8 }}>
        {[0,1,2].map(i => (
          <div key={i} className="dot-typing" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );

  // ─── Step 5: Result ───
  if (step === 5) return (
    <div style={{ padding: '24px 20px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
          {appLanguage === 'ta' ? 'உங்கள் AI திட்டம் தயார்!' : "Your AI Plan is Ready!"}
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 18, marginBottom: 20 }}>
        {aiSchedule.map((task, i) => {
          const parts    = task.split(' - ');
          const timeStr  = parts.length >= 2 ? `${parts[0]} - ${parts[1]}` : '';
          const taskText = parts.slice(2).join(' - ') || task;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < aiSchedule.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{taskText}</div>
                {timeStr && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>🕐 {timeStr}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={handleAddToTasks}
        style={{ width: '100%', padding: 18, borderRadius: 18, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,var(--accent),var(--purple))', color: '#fff',
          fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800,
          boxShadow: '0 8px 24px var(--accent-glow)', marginBottom: 10 }}>
        {appLanguage === 'ta' ? '✅ Tasks-ல் சேர்' : '✅ Add to My Tasks'}
      </button>
      <button onClick={() => setAlreadyCheckedIn(true)}
        style={{ width: '100%', padding: 14, borderRadius: 14, border: '1.5px solid var(--card-border)', background: 'var(--chip)', color: 'var(--muted)', fontWeight: 700, cursor: 'pointer' }}>
        {appLanguage === 'ta' ? 'பிறகு சேர்க்கிறேன்' : 'Add later'}
      </button>
    </div>
  );

  return null;
}
