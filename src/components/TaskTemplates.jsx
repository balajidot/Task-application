import React, { useState, useEffect, useRef, useCallback } from 'react';
import { readPersist, writePersist, todayKey } from '../utils/helpers';

const TEMPLATES_KEY = 'taskflow-templates-v1';

export default function TaskTemplates({ onApplyTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', tasks: '' });
  const [loaded, setLoaded] = useState(false);
  const saveRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await readPersist(TEMPLATES_KEY);
        if (raw) setTemplates(JSON.parse(raw));
      } catch {}
      setLoaded(true);
    };
    load();
  }, []);

  const save = useCallback((data) => {
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => writePersist(TEMPLATES_KEY, JSON.stringify(data)), 300);
  }, []);

  const addTemplate = () => {
    const name = form.name.trim();
    const tasks = form.tasks.split('\n').filter(t => t.trim()).map(t => t.trim());
    if (!name || tasks.length === 0) return;
    const updated = [...templates, { id: Date.now(), name, tasks, createdOn: todayKey() }];
    setTemplates(updated);
    save(updated);
    setForm({ name: '', tasks: '' });
    setShowForm(false);
  };

  const removeTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    save(updated);
  };

  const applyTemplate = (template) => {
    if (onApplyTemplate) {
      onApplyTemplate(template.tasks);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)' }}>📋 Task Templates</div>
        <button className="new-btn" onClick={() => setShowForm(!showForm)} style={{ padding: '8px 18px', fontSize: '.85rem' }}>
          {showForm ? '✕ Cancel' : '+ New Template'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '14px', border: '1.5px solid rgba(99,102,241,0.3)', background: 'linear-gradient(135deg, var(--card) 0%, rgba(99,102,241,0.05) 100%)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.85rem', color: 'var(--text)', marginBottom: '6px' }}>Template Name</div>
              <input
                className="fi"
                placeholder="e.g. Morning Routine, Gym Day, Work Sprint"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ fontSize: '.95rem' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.85rem', color: 'var(--text)', marginBottom: '6px' }}>Tasks (one per line)</div>
              <textarea
                className="fi task-box"
                placeholder={"🏋️ Gym workout\n🥗 Prepare healthy lunch\n📖 Read 30 minutes\n🧘 Evening meditation"}
                value={form.tasks}
                onChange={e => setForm({ ...form, tasks: e.target.value })}
                style={{ minHeight: '120px', fontSize: '.95rem', lineHeight: 1.6 }}
              />
            </div>
            <button className="new-btn" onClick={addTemplate} style={{ padding: '10px 20px', fontSize: '.9rem', alignSelf: 'flex-end' }}>
              💾 Save Template
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 && loaded && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
          <div style={{ fontWeight: 800, fontSize: '.95rem' }}>No templates yet</div>
          <div style={{ fontSize: '.8rem', marginTop: '4px' }}>Create a template to reuse tasks sets quickly!</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
        {templates.map(t => (
          <div key={t.id} className="card" style={{ position: 'relative' }}>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)', marginBottom: '10px' }}>
              {t.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
              {t.tasks.slice(0, 5).map((task, i) => (
                <div key={i} style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--muted)', padding: '4px 8px', background: 'var(--chip)', borderRadius: '6px' }}>
                  {task}
                </div>
              ))}
              {t.tasks.length > 5 && (
                <div style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--muted)', textAlign: 'center' }}>
                  +{t.tasks.length - 5} more
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => applyTemplate(t)} className="new-btn" style={{ flex: 1, padding: '8px', fontSize: '.82rem' }}>
                ▶ Apply Today
              </button>
              <button onClick={() => removeTemplate(t.id)} style={{
                background: 'var(--chip)', border: 'none', borderRadius: '8px', padding: '8px 12px',
                cursor: 'pointer', color: 'var(--muted)', fontWeight: 800, fontSize: '.82rem',
              }}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
