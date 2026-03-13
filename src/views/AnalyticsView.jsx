import React, { Suspense } from 'react';
import ProductivityAnalytics from '../components/ProductivityAnalytics';

export default function AnalyticsView({ setShowPomodoro, setShowImportExport, setActiveView, goals, weekly, aiWeeklyAnalysis, onCreateNextWeekPlan, copy }) {
  const burnoutLabel = aiWeeklyAnalysis.burnoutRisk === 'high'
    ? (copy.analytics.burnoutHigh || 'High')
    : aiWeeklyAnalysis.burnoutRisk === 'medium'
      ? (copy.analytics.burnoutMedium || 'Medium')
      : (copy.analytics.burnoutLow || 'Low');

  return (
    <div className="animate-fade-in">
      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title">{copy.analytics.title}</div>
            <div className="tip">{copy.analytics.subtitle}</div>
          </div>
          <div className="head-actions">
            <button className="hero-btn" onClick={() => setShowPomodoro(true)}>{copy.analytics.startPomodoro}</button>
            <button className="hero-btn" onClick={() => setShowImportExport(true)}>{copy.analytics.exportTasks}</button>
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
            <div className="ai-briefing-label">{copy.analytics.summary}</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.summary}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">{copy.analytics.momentum}</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.momentum}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">{copy.analytics.pattern}</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.pattern}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">{copy.analytics.advice}</div>
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
            <div className="ai-briefing-label">{copy.analytics.trend}</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.trend}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">{copy.analytics.predictedNextWeek}</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.predictedPct}% {copy.analytics.predictedNote || "completion chance if current pattern continues."}</div>
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
          <button className="new-btn" style={{ width: 'auto' }} onClick={onCreateNextWeekPlan}>{copy.analytics.createNextWeekPlan}</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {aiWeeklyAnalysis.nextWeekPlan.map((item, index) => (
            <div key={index} className="ai-briefing-card">
              <div className="ai-briefing-label">{item.title}</div>
              <div className="ai-briefing-text">{item.detail}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 16 }}>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">{copy.analytics.planReady}</div>
            <div className="ai-briefing-text">{aiWeeklyAnalysis.nextWeekTaskDrafts.length} {copy.analytics.readyTasks || "tasks ready for one-tap creation."}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">{copy.analytics.burnoutRisk}</div>
            <div className="ai-briefing-text">{burnoutLabel}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">{copy.analytics.cleanup}</div>
            <div className="ai-briefing-text">{copy.analytics.cleanup}: {aiWeeklyAnalysis.overdueCount}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div className="focus-title">{copy.analytics.quickTools}</div>
        </div>
        <div className="quick-tools">
          <button className="tool-btn" onClick={() => setShowPomodoro(true)}>{copy.analytics.startPomodoro}</button>
          <button className="tool-btn" onClick={() => setShowImportExport(true)}>{copy.analytics.exportTasks}</button>
          <button className="tool-btn" onClick={() => setActiveView('tasks')}>{copy.analytics.viewTasks}</button>
          <button className="tool-btn" onClick={() => setActiveView('planner')}>{copy.analytics.openPlanner}</button>
        </div>
      </div>
    </div>
  );
}
