import React from 'react';
import ProductivityAnalytics from '../components/ProductivityAnalytics';

export default function AnalyticsView({ setShowPomodoro, setShowImportExport, setActiveView, goals, weekly }) {
  return (
    <div className="animate-fade-in">
      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title">
              📊 Productivity Analytics
            </div>
            <div className="tip">
              Track your productivity patterns and insights
            </div>
          </div>
          <div className="head-actions">
            <button className="hero-btn" onClick={() => setShowPomodoro(true)}>
              🍅 Pomodoro Timer
            </button>
            <button className="hero-btn" onClick={() => setShowImportExport(true)}>
              📥 Import/Export
            </button>
          </div>
        </div>
      </div>

      <ProductivityAnalytics goals={goals} weeklyStats={weekly} />

      <div className="card">
        <div className="section-head">
          <div className="focus-title">Quick Tools</div>
        </div>
        <div className="quick-tools">
          <button className="tool-btn" onClick={() => setShowPomodoro(true)}>
            🍅 Start Pomodoro
          </button>
          <button className="tool-btn" onClick={() => setShowImportExport(true)}>
            📤 Export Tasks
          </button>
          <button className="tool-btn" onClick={() => setActiveView('tasks')}>
            📋 View Tasks
          </button>
        </div>
      </div>
    </div>
  );
}