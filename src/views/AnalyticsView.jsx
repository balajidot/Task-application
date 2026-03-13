import React, { Suspense } from 'react';
import ProductivityAnalytics from '../components/ProductivityAnalytics';

export default function AnalyticsView({ setShowPomodoro, setShowImportExport, setActiveView, goals, weekly, aiWeeklyAnalysis, copy }) {
  return (
    <div className="animate-fade-in">
      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title">{copy.analytics.title}</div>
            <div className="tip">{copy.analytics.subtitle}</div>
          </div>
          <div className="head-actions">
            <button className="hero-btn" onClick={() => setShowPomodoro(true)}>Pomodoro</button>
            <button className="hero-btn" onClick={() => setShowImportExport(true)}>Import/Export</button>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="skeleton-card"><div className="skeleton-title"></div><div className="skeleton-text"></div><div className="skeleton-text"></div><div className="skeleton-text"></div></div>}>
        <ProductivityAnalytics goals={goals} weeklyStats={weekly} />
      </Suspense>

      <div className="card">
        <div className="section-head">
          <div className="focus-title">{copy.analytics.aiWeekly}</div>
        </div>
        <div className="ai-briefing-grid">
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Summary</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.summary}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Momentum</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.momentum}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Pattern</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.pattern}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Advice</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.advice}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div className="focus-title">{copy.analytics.forecast}</div>
        </div>
        <div className="ai-briefing-grid">
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Trend</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.trend}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Predicted Next Week</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.predictedPct}% completion chance if current pattern continues.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${aiWeeklyAnalysis.chartPoints.length}, 1fr)`, gap: 8, alignItems: 'end', marginTop: 16, height: 120 }}>
          {aiWeeklyAnalysis.chartPoints.map((point, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: '100%', maxWidth: 34, height: `${Math.max(8, point)}%`, borderRadius: '10px 10px 4px 4px', background: 'linear-gradient(180deg, #10b981, #3b82f6)' }}></div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: 700 }}>{weekly.days[index]?.name || `D${index + 1}`}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div className="focus-title">{copy.analytics.nextWeek}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {aiWeeklyAnalysis.nextWeekPlan.map((item, index) => (
            <div key={index} className="ai-briefing-card">
              <div className="ai-briefing-label">{item.title}</div>
              <div className="ai-briefing-text">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div className="focus-title">{copy.analytics.quickTools}</div>
        </div>
        <div className="quick-tools">
          <button className="tool-btn" onClick={() => setShowPomodoro(true)}>Start Pomodoro</button>
          <button className="tool-btn" onClick={() => setShowImportExport(true)}>Export Tasks</button>
          <button className="tool-btn" onClick={() => setActiveView('tasks')}>View Tasks</button>
        </div>
      </div>
    </div>
  );
}
