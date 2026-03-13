import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TOOLS_KEY } from '../utils/constants';
import { readPersist, writePersist } from '../utils/helpers';

export default function ToolsView({ onOpenPomodoro }) {
  const [quickNotes, setQuickNotes] = useState("");
  const [brainDump, setBrainDump] = useState("");
  const [completedToday, setCompletedToday] = useState("");
  const [improveTomorrow, setImproveTomorrow] = useState("");
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState("inhale");
  const [breathingCount, setBreathingCount] = useState(4);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);

  // Load saved data
  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = await readPersist(TOOLS_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.quickNotes) setQuickNotes(data.quickNotes);
          if (data.brainDump) setBrainDump(data.brainDump);
          if (data.completedToday) setCompletedToday(data.completedToday);
          if (data.improveTomorrow) setImproveTomorrow(data.improveTomorrow);
        }
      } catch {}
      setLoaded(true);
    };
    loadData();
  }, []);

  // Debounced save
  const saveData = useCallback((data) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      writePersist(TOOLS_KEY, JSON.stringify(data));
    }, 400);
  }, []);

  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  const updateField = (field, value) => {
    const setters = { quickNotes: setQuickNotes, brainDump: setBrainDump, completedToday: setCompletedToday, improveTomorrow: setImproveTomorrow };
    setters[field]?.(value);
    if (loaded) {
      const current = { quickNotes, brainDump, completedToday, improveTomorrow, [field]: value };
      saveData(current);
    }
  };

  useEffect(() => {
    let interval;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathingCount(prev => {
          if (prev <= 1) {
            setBreathingPhase(currentPhase => {
              const phases = ["inhale", "hold", "exhale", "hold"];
              const nextPhase = phases[(phases.indexOf(currentPhase) + 1) % 4];
              return nextPhase;
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathingActive]);

  const toggleBreathing = () => {
    setBreathingActive(!breathingActive);
    if (!breathingActive) {
      setBreathingPhase("inhale");
      setBreathingCount(4);
    }
  };

  return (
    <div className="tools-view animate-fade-in" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>🛠 Working Tools</h2>
        <button className="hero-btn" style={{ padding: '10px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={onOpenPomodoro}>
          🍅 Pomodoro
        </button>
      </div>

      {/* ── Quick Notes ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>✍️ Quick Notes</span>
          <span style={{ fontSize: '.7rem', color: '#10b981', fontWeight: 700 }}>Auto-saved ✓</span>
        </div>
        <textarea
          className="fi task-box"
          placeholder="Jot down quick thoughts, meeting notes, or daily snippets here..."
          value={quickNotes}
          onChange={(e) => updateField('quickNotes', e.target.value)}
          style={{ minHeight: '120px', fontSize: '0.9rem', lineHeight: 1.5 }}
        />
      </div>

      {/* ── Brain Dump ── */}
      <div className="card">
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b', marginBottom: 10 }}>🧠 Brain Dump</div>
        <textarea
          className="fi task-box"
          placeholder="Dump all your distracting or random ideas here to free up mental RAM..."
          value={brainDump}
          onChange={(e) => updateField('brainDump', e.target.value)}
          style={{ minHeight: '120px', borderColor: 'rgba(245,158,11,0.3)', fontSize: '0.9rem', lineHeight: 1.5 }}
        />
      </div>

      {/* ── Box Breathing ── */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981', marginBottom: 16 }}>🫁 Box Breathing</div>
        <div
          className={`breathing-circle${breathingActive ? ` breathing-active ${breathingPhase}` : ''}`}
          style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1.2rem', fontWeight: 'bold',
            transition: 'all 1s ease-in-out', margin: '0 auto 12px'
          }}
        >
          {breathingActive ? breathingCount : 'START'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 14, minHeight: 36 }}>
          {breathingActive
            ? <><strong style={{ display: 'block', color: 'var(--text)' }}>{breathingPhase.toUpperCase()}</strong>4-4-4-4 breathing pattern</>
            : 'Tap to start focused breathing exercise'}
        </div>
        <button
          className="new-btn"
          onClick={toggleBreathing}
          style={{ background: breathingActive ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)' }}
        >
          {breathingActive ? '⏹ Stop Breathing' : '▶ Start Breathing'}
        </button>
      </div>

      {/* ── Evening Daily Review ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#3b82f6' }}>📅 Evening Daily Review</span>
          <span style={{ fontSize: '.7rem', color: '#10b981', fontWeight: 700 }}>Auto-saved ✓</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="fl">WHAT DID I COMPLETE TODAY?</div>
            <textarea
              className="fi"
              placeholder="Reflect on your wins and progress made..."
              value={completedToday}
              onChange={(e) => updateField('completedToday', e.target.value)}
              style={{ minHeight: '90px', resize: 'vertical' }}
            />
          </div>
          <div>
            <div className="fl">WHAT SHOULD IMPROVE TOMORROW?</div>
            <textarea
              className="fi"
              placeholder="Identify friction points, distractions, and plan adjustments..."
              value={improveTomorrow}
              onChange={(e) => updateField('improveTomorrow', e.target.value)}
              style={{ minHeight: '90px', resize: 'vertical', borderColor: 'rgba(239,68,68,0.3)' }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
