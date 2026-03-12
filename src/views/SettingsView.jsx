import React from 'react';

import { THEME_OPTIONS, FONT_OPTIONS } from '../utils/constants';



export default function SettingsView({

  setActiveView, themeMode, setThemeMode, 

  taskFontFamily, setTaskFontFamily, 

  taskFontSize, setTaskFontSize, 

  uiScale, setUiScale,

  overdueEnabled, setOverdueEnabled,

  fontWeight, setFontWeight,

  soundTheme, setSoundTheme,

  autoStartEnabled, setAutoStartEnabled

}) {



  const SOUND_OPTIONS = [

    { label: '🔔 Default', value: 'default' },

    { label: '🎵 Gentle', value: 'gentle' },

    { label: '🎶 Chime', value: 'chime' },

    { label: '🔇 Silent', value: 'silent' },

  ];



  const handleAutoStart = (enabled) => {

    setAutoStartEnabled(enabled);

    try {

      const ipc = window.require?.('electron')?.ipcRenderer;

      if (ipc) ipc.send('set-auto-start', enabled);

    } catch {}

  };

  return (

    <div className="animate-fade-in">

      <div className="hero">

        <div className="topbar">

          <div>

            <div className="title">

              ⚙️ Settings

            </div>

            <div className="tip">

              Customize your Task Planner experience

            </div>

          </div>

          <div className="head-actions">

            <button className="hero-btn" onClick={() => setActiveView("tasks")}>

              📋 Back to Tasks

            </button>

          </div>

        </div>

      </div>



      <div className="card">

        <div className="section-head">

          <div className="focus-title">Appearance</div>

        </div>



        <div className="fg">

          <div className="fl">Theme</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>

            {THEME_OPTIONS.map(theme => (

              <button

                key={theme.value}

                className={`filter-btn ${themeMode === theme.value ? 'active' : ''}`}

                onClick={() => setThemeMode(theme.value)}

                style={{ margin: '0', width: '100%' }}

              >

                {theme.label}

              </button>

            ))}

          </div>

        </div>



        <div className="fg" style={{ marginTop: '20px' }}>

          <div className="fl">Font Style</div>

          <select

            className="fi"

            value={taskFontFamily}

            onChange={(e) => setTaskFontFamily(e.target.value)}

            style={{ fontSize: '14px' }}

          >

            {FONT_OPTIONS.map(font => (

              <option key={font.value} value={font.value}>{font.label}</option>

            ))}

          </select>

        </div>



        <div className="fg" style={{ marginTop: '20px' }}>

          <div className="fl">Task Font Size</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

            <input

              type="range"

              min="12"

              max="32"

              value={taskFontSize}

              onChange={(e) => setTaskFontSize(Number(e.target.value))}

              style={{ flex: 1 }}

            />

            <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: '600' }}>

              {taskFontSize}px

            </span>

          </div>

        </div>



        <div className="fg" style={{ marginTop: '20px' }}>

          <div className="fl">UI Scale</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

            <input

              type="range"

              min="80"

              max="130"

              step="4"

              value={uiScale}

              onChange={(e) => setUiScale(Number(e.target.value))}

              style={{ flex: 1 }}

            />

            <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: '600' }}>

              {Math.round(uiScale)}%

            </span>

          </div>

        </div>



        <div className="fg" style={{ marginTop: '20px' }}>

          <div className="fl">Font Weight</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

            <input

              type="range"

              min="400"

              max="900"

              step="100"

              value={fontWeight}

              onChange={(e) => setFontWeight(Number(e.target.value))}

              style={{ flex: 1 }}

            />

            <span style={{ minWidth: '70px', textAlign: 'center', fontWeight: '600' }}>

              {fontWeight} {fontWeight <= 400 ? '(Light)' : fontWeight <= 500 ? '(Normal)' : fontWeight <= 600 ? '(Semi)' : fontWeight <= 700 ? '(Bold)' : fontWeight <= 800 ? '(Heavy)' : '(Black)'}

            </span>

          </div>

        </div>

      </div>



      {/* 🔥 BEHAVIOR SETTINGS 🔥 */}

      <div className="card">

        <div className="section-head">

          <div className="focus-title">Behavior</div>

        </div>



        <div className="fg">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--chip)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>

            <div>

              <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text)' }}>⚠️ Overdue Alerts</div>

              <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '4px', fontWeight: 600 }}>Show warning badges on tasks past their end time</div>

            </div>

            <button

              onClick={() => setOverdueEnabled(!overdueEnabled)}

              style={{

                width: '52px', height: '28px', borderRadius: '999px', border: 'none', cursor: 'pointer',

                background: overdueEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--card-border)',

                position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

                boxShadow: overdueEnabled ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',

                flexShrink: 0,

              }}

            >

              <div style={{

                width: '22px', height: '22px', borderRadius: '50%', background: '#fff',

                position: 'absolute', top: '3px',

                left: overdueEnabled ? '27px' : '3px',

                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',

              }} />

            </button>

          </div>

        </div>



        {/* 🔊 SOUND THEME */}

        <div className="fg" style={{ marginTop: '16px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--chip)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>

            <div>

              <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text)' }}>🔊 Sound Theme</div>

              <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '4px', fontWeight: 600 }}>Choose notification sound style</div>

            </div>

            <select

              value={soundTheme}

              onChange={e => setSoundTheme(e.target.value)}

              style={{

                padding: '8px 14px', borderRadius: '10px',

                background: 'var(--card)', color: 'var(--text)',

                border: '1px solid var(--card-border)',

                fontWeight: 800, fontSize: '.85rem', cursor: 'pointer',

              }}

            >

              {SOUND_OPTIONS.map(o => (

                <option key={o.value} value={o.value}>{o.label}</option>

              ))}

            </select>

          </div>

        </div>



        {/* 🚀 AUTO-START */}

        <div className="fg" style={{ marginTop: '16px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--chip)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>

            <div>

              <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text)' }}>🚀 Auto-Start with Windows</div>

              <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '4px', fontWeight: 600 }}>Launch on system startup</div>

            </div>

            <button

              onClick={() => handleAutoStart(!autoStartEnabled)}

              style={{

                width: '52px', height: '28px', borderRadius: '999px', border: 'none', cursor: 'pointer',

                background: autoStartEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--card-border)',

                position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

                boxShadow: autoStartEnabled ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',

                flexShrink: 0,

              }}

            >

              <div style={{

                width: '22px', height: '22px', borderRadius: '50%', background: '#fff',

                position: 'absolute', top: '3px',

                left: autoStartEnabled ? '27px' : '3px',

                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',

              }} />

            </button>

          </div>

        </div>

      </div>



      <div className="card">

        <div className="section-head">

          <div className="focus-title">Preview</div>

        </div>

        

        <div style={{ padding: '20px', background: 'var(--chip)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>

          <h4 style={{ marginBottom: '15px', color: 'var(--text)' }}>Sample Task</h4>

          <div className="goal-item" style={{ margin: '0' }}>

            <div className="goal-row">

              <button className="chk"></button>

              <div className="goal-text" style={{ fontSize: `${taskFontSize}px`, fontFamily: taskFontFamily }}>

                This is how your tasks will appear with the selected font and size settings

              </div>

              <span className="p-badge p-medium">Medium</span>

            </div>

          </div>

        </div>

      </div>



      <div className="card">

        <div className="section-head">

          <div className="focus-title">Actions</div>

        </div>

        

        <div className="quick-tools">

          <button className="tool-btn" onClick={() => {

            setThemeMode("dark");

            setTaskFontSize(18);

            setTaskFontFamily(FONT_OPTIONS[0].value);

            setUiScale(96);

            setFontWeight(500);

            setSoundTheme('default');

            setAutoStartEnabled(false);

          }}>

            🔄 Reset to Defaults

          </button>

          <button className="tool-btn" onClick={() => setActiveView("tasks")}>

            ✅ Apply & Return

          </button>

        </div>

      </div>

    </div>

  );

}