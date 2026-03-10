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
    <div className="tools-view animate-fade-in" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>🛠 Working Tools</h2>
        <button className="new-btn" style={{ padding: '12px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={onOpenPomodoro}>
          <span>🍅</span> Start Pomodoro Timer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="m-title" style={{ fontSize: '1.2rem', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✍️ Quick Notes</span>
            <span style={{ fontSize: '.7rem', color: '#10b981', fontWeight: 700 }}>Auto-saved ✓</span>
          </div>
          <textarea 
             className="fi task-box" 
             placeholder="Jot down quick thoughts, meeting notes, or daily snippets here..." 
             value={quickNotes} 
             onChange={(e) => updateField('quickNotes', e.target.value)}
             style={{ minHeight: '250px', flex: 1, fontSize: '0.95rem', lineHeight: 1.5 }}
          />
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="m-title" style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#f59e0b', borderBottomColor: 'rgba(245, 158, 11, 0.2)' }}>
            <span>🧠 Brain Dump</span>
          </div>
          <textarea 
             className="fi task-box" 
             placeholder="Dump all your distracting or random ideas here to free up mental RAM and stay focused on the task at hand..." 
             value={brainDump} 
             onChange={(e) => updateField('brainDump', e.target.value)}
             style={{ minHeight: '250px', flex: 1, borderColor: 'rgba(245, 158, 11, 0.3)', fontSize: '0.95rem', lineHeight: 1.5 }}
          />
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="m-title" style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#10b981', borderBottomColor: 'rgba(16, 185, 129, 0.2)' }}>
            <span>🫁 Box Breathing</span>
          </div>
          <div className="breathing-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', flex: 1, justifyContent: 'center' }}>
            <div className={`breathing-circle${breathingActive ? ` breathing-active ${breathingPhase}` : ''}`} style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              transition: 'all 1s ease-in-out'
            }}>
              {breathingActive ? `${breathingCount}` : 'START'}
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
              {breathingActive ? (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{breathingPhase.toUpperCase()}</div>
                  <div style={{ fontSize: '0.8rem' }}>4-4-4-4 breathing pattern</div>
                </div>
              ) : (
                <div>Click to start focused breathing exercise</div>
              )}
            </div>
            <button 
              className="new-btn" 
              onClick={toggleBreathing}
              style={{ 
                background: breathingActive ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
                marginTop: '10px'
              }}
            >
              {breathingActive ? 'Stop' : 'Start'} Breathing
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '10px' }}>
        <div className="m-title" style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#3b82f6', borderBottomColor: 'rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📅 Evening Daily Review</span>
          <span style={{ fontSize: '.7rem', color: '#10b981', fontWeight: 700 }}>Auto-saved ✓</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="fg" style={{ margin: 0 }}>
            <div className="fl" style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '10px' }}>What did I complete today?</div>
            <textarea 
               className="fi" 
               placeholder="Reflect on your wins and progress made..." 
               value={completedToday}
               onChange={(e) => updateField('completedToday', e.target.value)}
               style={{ minHeight: '100px', resize: 'vertical' }}
            />
          </div>
          
          <div className="fg" style={{ margin: 0 }}>
            <div className="fl" style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '10px' }}>What should improve tomorrow?</div>
            <textarea 
               className="fi" 
               placeholder="Identify friction points, distractions, and plan adjustments..." 
               value={improveTomorrow}
               onChange={(e) => updateField('improveTomorrow', e.target.value)}
               style={{ minHeight: '100px', resize: 'vertical', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
