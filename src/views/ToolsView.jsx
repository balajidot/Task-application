import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TOOLS_KEY } from '../utils/constants';
import { readPersist, writePersist } from '../utils/helpers';

export default function ToolsView({ onOpenPomodoro, appLanguage, copy }) {
  const [quickNotes, setQuickNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const [brainDump, setBrainDump] = useState('');
  const [completedToday, setCompletedToday] = useState('');
  const [improveTomorrow, setImproveTomorrow] = useState('');
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('inhale');
  const [breathingCount, setBreathingCount] = useState(4);
  const [dumpRelaxing, setDumpRelaxing] = useState(false);
  const [dumpRelaxed, setDumpRelaxed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const saveTimerRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = await readPersist(TOOLS_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.quickNotes) setQuickNotes(data.quickNotes);
          if (Array.isArray(data.savedNotes)) setSavedNotes(data.savedNotes);
          if (data.brainDump) setBrainDump(data.brainDump);
          if (data.completedToday) setCompletedToday(data.completedToday);
          if (data.improveTomorrow) setImproveTomorrow(data.improveTomorrow);
        }
      } catch {}
      setLoaded(true);
    };
    loadData();
  }, []);

  const saveData = useCallback((data) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      writePersist(TOOLS_KEY, JSON.stringify(data));
    }, 350);
  }, []);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  const persistSnapshot = useCallback((overrides = {}) => {
    if (!loaded) return;
    saveData({
      quickNotes,
      savedNotes,
      brainDump,
      completedToday,
      improveTomorrow,
      ...overrides,
    });
  }, [brainDump, completedToday, improveTomorrow, loaded, quickNotes, saveData, savedNotes]);

  const updateField = (field, value) => {
    const setters = {
      quickNotes: setQuickNotes,
      brainDump: setBrainDump,
      completedToday: setCompletedToday,
      improveTomorrow: setImproveTomorrow,
    };
    setters[field]?.(value);
    persistSnapshot({ [field]: value });
  };

  const saveNotesState = useCallback((nextNotes) => {
    setSavedNotes(nextNotes);
    persistSnapshot({ savedNotes: nextNotes });
  }, [persistSnapshot]);

  const handleAddSavedNote = () => {
    if (!noteTitle.trim() && !noteBody.trim()) return;
    const nextNotes = [
      {
        id: Date.now(),
        title: noteTitle.trim() || 'Untitled note',
        body: noteBody.trim(),
        pinned: false,
        createdAt: new Date().toISOString(),
      },
      ...savedNotes,
    ].slice(0, 30);
    saveNotesState(nextNotes);
    setNoteTitle('');
    setNoteBody('');
  };

  const handleDeleteSavedNote = (id) => {
    saveNotesState(savedNotes.filter((note) => note.id !== id));
  };

  const handleTogglePin = (id) => {
    saveNotesState(savedNotes.map((note) => note.id === id ? { ...note, pinned: !note.pinned } : note));
  };

  const handleExportNotes = async () => {
    const exportText = savedNotes.map((note) => `${note.pinned ? '[PINNED] ' : ''}${note.title}\n${note.body}\n${new Date(note.createdAt).toLocaleString('en-IN')}\n`).join('\n---\n');
    try {
      const isMobileLike = typeof window !== 'undefined' && ('ontouchstart' in window || window.innerWidth < 900);
      if (isMobileLike && navigator.share) {
        const file = new File([exportText], 'task-planner-notes.txt', { type: 'text/plain' });
        await navigator.share({ title: 'Task Planner Notes', text: exportText, files: [file] });
        return;
      }

      if (isMobileLike && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
        window.alert('Notes copied to clipboard.');
        return;
      }

      const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'task-planner-notes.txt';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
        window.alert('Notes copied to clipboard.');
      } else {
        window.alert(exportText);
      }
    }
  };

  const filteredNotes = useMemo(() => {
    const term = noteSearch.trim().toLowerCase();
    return [...savedNotes]
      .filter((note) => !term || note.title.toLowerCase().includes(term) || note.body.toLowerCase().includes(term))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt) - new Date(a.createdAt));
  }, [noteSearch, savedNotes]);

  const handleDumpAndRelax = () => {
    if (!brainDump.trim() || dumpRelaxing) return;
    setDumpRelaxing(true);
    setDumpRelaxed(false);
    setTimeout(() => {
      updateField('brainDump', '');
      setDumpRelaxing(false);
      setDumpRelaxed(true);
      if (window.navigator?.vibrate) window.navigator.vibrate([20, 10, 20]);
      setTimeout(() => setDumpRelaxed(false), 4000);
    }, 1200);
  };

  useEffect(() => {
    let interval;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathingCount((prev) => {
          if (prev <= 1) {
            setBreathingPhase((phase) => {
              const phases = ['inhale', 'hold', 'exhale', 'hold'];
              return phases[(phases.indexOf(phase) + 1) % 4];
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
      setBreathingPhase('inhale');
      setBreathingCount(4);
    }
  };

  return (
    <div className="tools-view animate-fade-in" style={{ padding: '16px', maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>{copy.tools.title}</h2>
        <button className="hero-btn" style={{ padding: '10px 16px', fontSize: '0.9rem' }} onClick={onOpenPomodoro}>
          Pomodoro
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>{copy.tools.quickNotes}</span>
          <span style={{ fontSize: '.7rem', color: '#10b981', fontWeight: 700 }}>Auto-saved</span>
        </div>
        <textarea className="fi task-box" placeholder="Jot down quick thoughts, meeting notes, or daily snippets here..." value={quickNotes} onChange={(e) => updateField('quickNotes', e.target.value)} style={{ minHeight: '120px', fontSize: '0.9rem', lineHeight: 1.5 }} />
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10 }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>{copy.tools.notesLocker}</span>
          <button className="mini-btn" onClick={handleExportNotes}>{copy.tools.exportNotes}</button>
        </div>
        <input className="fi" placeholder={copy.tools.noteTitle} value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} style={{ marginBottom: 10 }} />
        <textarea className="fi task-box" placeholder={copy.tools.noteBody} value={noteBody} onChange={(e) => setNoteBody(e.target.value)} style={{ minHeight: '110px', fontSize: '0.92rem', lineHeight: 1.5 }} />
        <button className="new-btn" style={{ marginTop: 10, width: '100%' }} onClick={handleAddSavedNote}>{copy.tools.saveNote}</button>
        <input className="fi" placeholder={copy.tools.searchNotes} value={noteSearch} onChange={(e) => setNoteSearch(e.target.value)} style={{ marginTop: 12 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          {filteredNotes.length === 0 && <div style={{ padding: '14px', borderRadius: 12, background: 'var(--chip)', color: 'var(--muted)', fontWeight: 700, fontSize: '.88rem' }}>{copy.tools.noNotes}</div>}
          {filteredNotes.map((note) => (
            <div key={note.id} style={{ padding: '14px', borderRadius: 14, background: 'var(--chip)', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                    {note.title} {note.pinned ? <span style={{ fontSize: '.72rem', color: '#f59e0b' }}>• {copy.tools.pinned}</span> : null}
                  </div>
                  <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: 8 }}>
                    {new Date(note.createdAt).toLocaleString(appLanguage === 'ta' ? 'ta-IN' : 'en-IN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="mini-btn" onClick={() => handleTogglePin(note.id)}>{note.pinned ? 'Unpin' : 'Pin'}</button>
                  <button className="mini-btn warn" onClick={() => handleDeleteSavedNote(note.id)}>Delete</button>
                </div>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', fontSize: '.92rem', lineHeight: 1.5 }}>{note.body || 'No content'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b', marginBottom: 10 }}>{copy.tools.brainDump}</div>
        <textarea 
          className="fi task-box" 
          placeholder="Dump all distracting or random ideas here to free mental RAM..." 
          value={brainDump} 
          onChange={(e) => updateField('brainDump', e.target.value)} 
          style={{ 
            minHeight: '120px', 
            borderColor: 'rgba(245,158,11,0.3)', 
            fontSize: '0.9rem', 
            lineHeight: 1.5, 
            transition: dumpRelaxing ? 'all 1.2s cubic-bezier(0.19, 1, 0.22, 1)' : 'all 0.3s ease', 
            opacity: dumpRelaxing ? 0 : 1, 
            transform: dumpRelaxing ? 'translateY(-40px) scale(1.1) rotate(2deg)' : 'none',
            filter: dumpRelaxing ? 'blur(10px)' : 'none'
          }} 
        />
        <button onClick={handleDumpAndRelax} disabled={!brainDump.trim() || dumpRelaxing} style={{ 
          marginTop: 10, width: '100%', padding: '12px', borderRadius: 12, border: 'none', 
          cursor: brainDump.trim() && !dumpRelaxing ? 'pointer' : 'not-allowed', 
          background: brainDump.trim() && !dumpRelaxing ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'var(--card-border)', 
          color: brainDump.trim() ? '#fff' : 'var(--muted)', 
          fontWeight: 900, fontSize: '0.92rem', 
          opacity: !brainDump.trim() ? 0.45 : 1,
          transition: 'all 0.3s ease',
          boxShadow: dumpRelaxing ? '0 0 20px rgba(245,158,11,0.4)' : 'none'
        }}>
          {dumpRelaxing ? '✨ Poof! Logic Cleared...' : dumpRelaxed ? '🌿 Mind is Calm' : 'Dump & Relax'}
        </button>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981', marginBottom: 16 }}>{copy.tools.boxBreathing}</div>
        <div className={`breathing-circle${breathingActive ? ` breathing-active ${breathingPhase}` : ''}`} style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', transition: 'all 1s ease-in-out', margin: '0 auto 12px' }}>
          {breathingActive ? breathingCount : 'START'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 14, minHeight: 36 }}>
          {breathingActive ? <><strong style={{ display: 'block', color: 'var(--text)' }}>{breathingPhase.toUpperCase()}</strong>4-4-4-4 breathing pattern</> : 'Tap to start focused breathing exercise'}
        </div>
        <button className="new-btn" onClick={toggleBreathing} style={{ background: breathingActive ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)' }}>
          {breathingActive ? 'Stop Breathing' : 'Start Breathing'}
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#3b82f6' }}>{copy.tools.eveningReview}</span>
          <span style={{ fontSize: '.7rem', color: '#10b981', fontWeight: 700 }}>Auto-saved</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="fl">What did I complete today?</div>
            <textarea className="fi" placeholder="Reflect on your wins and progress made..." value={completedToday} onChange={(e) => updateField('completedToday', e.target.value)} style={{ minHeight: '90px', resize: 'vertical' }} />
          </div>
          <div>
            <div className="fl">What should improve tomorrow?</div>
            <textarea className="fi" placeholder="Identify friction points, distractions, and plan adjustments..." value={improveTomorrow} onChange={(e) => updateField('improveTomorrow', e.target.value)} style={{ minHeight: '90px', resize: 'vertical', borderColor: 'rgba(239,68,68,0.3)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
