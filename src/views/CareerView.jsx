import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { CAREER_KEY } from '../utils/constants';
import { readPersist, writePersist } from '../utils/helpers';

export default function CareerView() {
  const [goal, setGoal] = useState("Become HDFC Bank Relationship Manager");
  const [skills, setSkills] = useState([
    { id: 1, name: 'Banking Products & CASA', progress: 40 },
    { id: 2, name: 'English Communication', progress: 55 },
    { id: 3, name: 'Quantitative Aptitude', progress: 35 },
    { id: 4, name: 'Banking Awareness & RBI', progress: 45 },
    { id: 5, name: 'Customer Relationship Skills', progress: 60 },
  ]);
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Study CASA, NPA, CRR, SLR concepts daily', done: false },
    { id: 2, text: 'Practice 20 Quant questions every morning', done: false },
    { id: 3, text: 'Read 1 banking current affairs article daily', done: false },
    { id: 4, text: 'Practice English mock interview answers', done: false },
    { id: 5, text: 'Complete HDFC Bank product knowledge notes', done: false },
  ]);
  const [newTask, setNewTask] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);

  // Load saved data
  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = await readPersist(CAREER_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.goal) setGoal(data.goal);
          if (data.skills?.length) setSkills(data.skills);
          if (data.tasks?.length) setTasks(data.tasks);
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
      writePersist(CAREER_KEY, JSON.stringify(data));
    }, 400);
  }, []);

  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveData({ goal, skills, tasks });
    }
  }, [goal, skills, tasks, loaded, saveData]);

  const addTask = () => {
    if(!newTask.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: newTask, done: false }]);
    setNewTask("");
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateSkill = (id, newProgress) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, progress: Math.min(100, Math.max(0, newProgress)) } : s));
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setSkills(prev => [...prev, { id: Date.now(), name: newSkill, progress: 0 }]);
    setNewSkill("");
  };

  const deleteSkill = (id) => {
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  const completedCount = tasks.filter(t => t.done).length;
  const avgSkill = skills.length ? Math.round(skills.reduce((acc, s) => acc + s.progress, 0) / skills.length) : 0;

  return (
    <div className="career-view animate-fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '20px', borderLeft: '3px solid #8b5cf6' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🚀 Career Master Goal</span>
          <span style={{ fontSize: '.7rem', color: '#10b981', fontWeight: 700 }}>Auto-saved ✓</span>
        </div>
        <input 
          type="text" 
          className="fi" 
          value={goal} 
          onChange={(e) => setGoal(e.target.value)} 
          style={{ 
            fontSize: '1.5rem', fontWeight: 'var(--global-font-weight, 900)', 
            background: 'transparent', border: 'none', color: 'var(--text)', 
            padding: 0, boxShadow: 'none', outline: 'none', 
            fontFamily: 'var(--task-font-family)', width: '100%' 
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card">
          <div className="m-title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>📊 Skill Progress Tracker</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {skills.map(s => (
              <div key={s.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text)' }}>{s.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 900, color: '#10b981' }}>{s.progress}%</span>
                    <button className="mini-btn warn" onClick={() => deleteSkill(s.id)} style={{ padding: '2px 6px', fontSize: '.65rem' }}>✕</button>
                  </div>
                </div>
                <div style={{ height: '8px', background: 'var(--chip)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${s.progress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                </div>
                <input 
                   type="range" 
                   min="0" max="100" 
                   value={s.progress} 
                   onChange={(e) => updateSkill(s.id, parseInt(e.target.value))}
                   style={{ width: '100%', marginTop: '8px', cursor: 'pointer' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className="fi"
                placeholder="Add new skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                style={{ flex: 1, padding: '10px 14px', fontSize: '.88rem' }}
              />
              <button className="new-btn" onClick={addSkill} style={{ minWidth: '44px', height: '44px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>+</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="m-title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>📈 Career Analytics</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div className="metric-card secondary" style={{ padding: '16px' }}>
                <div className="metric-value" style={{ fontSize: '1.5rem' }}>{skills.length}</div>
                <div className="metric-label">Skills Being Tracked</div>
             </div>
             <div className="metric-card accent" style={{ padding: '16px' }}>
                <div className="metric-value" style={{ fontSize: '1.5rem' }}>{completedCount}/{tasks.length}</div>
                <div className="metric-label">Projects & Milestones Completed</div>
             </div>
             <div className="metric-card primary" style={{ padding: '16px' }}>
                <div className="metric-value" style={{ fontSize: '1.5rem' }}>{avgSkill}%</div>
                <div className="metric-label">Overall Skill Readiness</div>
             </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="m-title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>📚 Learning Planner</div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
          <input 
             type="text" 
             className="fi" 
             placeholder="Add a new learning or project milestone..."
             value={newTask}
             onChange={(e) => setNewTask(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && addTask()}
             style={{ flex: 1 }}
          />
          <button className="new-btn" onClick={addTask} style={{ height: '48px', padding: '0 20px', whiteSpace: 'nowrap' }}>➕ Add</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map(t => (
            <div key={t.id} className={`goal-item ${t.done ? 'done' : ''}`} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className={`chk ${t.done ? 'checked' : ''}`} onClick={() => toggleTask(t.id)}>
                {t.done && <span className="checkmark">✓</span>}
              </button>
              <span className={`goal-text ${t.done ? 'done' : ''}`} style={{ fontSize: 'var(--task-font-size, 1rem)', fontWeight: 'var(--global-font-weight, 800)', fontFamily: 'var(--task-font-family)', flex: 1, margin: 0 }}>{t.text}</span>
              <button className="mini-btn warn" onClick={() => deleteTask(t.id)} style={{ padding: '4px 8px' }}>Delete</button>
            </div>
          ))}
          {tasks.length === 0 && <div className="empty" style={{ padding: '20px' }}>No learning goals yet. Plan your growth!</div>}
        </div>
      </div>
    </div>
  );
}
