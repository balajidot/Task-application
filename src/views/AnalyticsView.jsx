import React, { Suspense } from 'react';
import ProductivityAnalytics from '../components/ProductivityAnalytics';

export default function AnalyticsView({ setShowPomodoro, setShowImportExport, setActiveView, goals, weekly, aiWeeklyAnalysis, onCreateNextWeekPlan, copy, appLanguage = 'en', userName = 'User' }) {
  const [deepAnalysis, setDeepAnalysis] = React.useState('');
  const [analysisLoading, setAnalysisLoading] = React.useState(false);

  const fetchDeepAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const { getApiUrl } = await import('../utils/apiConfig');
      const res  = await fetch(getApiUrl('/api/analyze'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          language: appLanguage,
          weeklyData: (weekly?.days || []).map(d => ({
            day:   d.name,
            done:  d.done  || 0,
            total: d.total || 0,
            pct:   d.pct   || 0,
          })),
        }),
      });
      const data = await res.json();
      if (data.analysis) setDeepAnalysis(data.analysis);
    } catch(e) {
      setDeepAnalysis('Unable to load analysis. Please try again.');
    } finally {
      setAnalysisLoading(false);
    }
  };
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

      <div className="card story-card" style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--bg-app))', border: '1px solid var(--accent)', position: 'relative', overflow: 'hidden' }}>
        <div className="section-head">
          <div className="focus-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✨</span> {copy.analytics.aiWeeklyStory || "Weekly AI Story"}
          </div>
        </div>
        <div className="ai-story-content" style={{ fontSize: '1.1rem', lineHeight: '1.6', fontStyle: 'italic', color: 'var(--text)', padding: '12px 0' }}>
          "{aiWeeklyAnalysis.weeklyStory}"
        </div>
        <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.05, transform: 'rotate(-15deg)' }}>📖</div>
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
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${aiWeeklyAnalysis.chartPoints.length}, 1fr)`, gap: 6, alignItems: 'end', marginTop: 24, height: 140, padding: '0 4px' }}>
          {aiWeeklyAnalysis.chartPoints.map((point, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 10 }}>
              <div style={{ 
                width: '100%', 
                maxWidth: 36, 
                height: `${Math.max(8, point)}%`, 
                borderRadius: '12px 12px 4px 4px', 
                background: 'linear-gradient(180deg, #10b981, #3b82f6)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}></div>
              <div style={{ fontSize: '.7rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {weekly.days[index]?.name?.substring(0, 3) || `D${index + 1}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div className="focus-title">{copy.analytics.nextWeek}</div>
          <button className="new-btn" style={{ width: 'auto', padding: '10px 16px', fontSize: '0.9rem' }} onClick={onCreateNextWeekPlan}>
            {copy.analytics.createNextWeekPlan}
          </button>
        </div>
        <div className="ai-briefing-grid" style={{ gridTemplateColumns: '1fr' }}>
          {aiWeeklyAnalysis.nextWeekPlan.map((item, index) => (
            <div key={index} className="ai-briefing-card" style={{ background: 'var(--chip)', border: '1px solid var(--card-border)' }}>
              <div className="ai-briefing-label" style={{ color: 'var(--accent)' }}>{item.title}</div>
              <div className="ai-briefing-text">{item.detail}</div>
            </div>
          ))}
        </div>
        <div className="ai-briefing-grid" style={{ marginTop: 16 }}>
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
            <div className="ai-briefing-text">{aiWeeklyAnalysis.overdueCount} {copy.analytics.cleanup || "Pending"}</div>
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
