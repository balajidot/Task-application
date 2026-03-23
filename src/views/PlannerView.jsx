import React from 'react';
import { useApp } from '../context/AppContext';
import WeeklyMonthlyPlanner from '../components/WeeklyMonthlyPlanner';

export default function PlannerView() {
  const {
    plannerView, setPlannerView, goals,
    setActiveDate, setActiveView, appLanguage, copy
  } = useApp();

  return (
    <div className="animate-fade-in planner-view">

      {/* ── Header ── */}
      <div className="hero planner-hero">
        <div className="topbar">
          <div>
            <div className="title">📅 {copy?.tabs?.planner || 'Planner'}</div>
            <div className="tip">
              {appLanguage === 'ta'
                ? 'வாரம் அல்லது மாதம் வாரியாக திட்டமிடுங்கள்'
                : 'Plan your week or month at a glance'}
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="planner-view-toggle">
          <button
            className={`planner-toggle-btn${plannerView === 'weekly' ? ' active' : ''}`}
            onClick={() => setPlannerView('weekly')}
          >
            📋 {appLanguage === 'ta' ? 'வாரம்' : 'Weekly'}
          </button>
          <button
            className={`planner-toggle-btn${plannerView === 'monthly' ? ' active' : ''}`}
            onClick={() => setPlannerView('monthly')}
          >
            📅 {appLanguage === 'ta' ? 'மாதம்' : 'Monthly'}
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="planner-stats-row">
        <div className="planner-stat-chip">
          <span className="planner-stat-num">
            {goals.filter(g => g.date === new Date().toISOString().split('T')[0]).length}
          </span>
          <span className="planner-stat-label">
            {appLanguage === 'ta' ? 'இன்று' : "Today's Tasks"}
          </span>
        </div>
        <div className="planner-stat-chip">
          <span className="planner-stat-num">{goals.length}</span>
          <span className="planner-stat-label">
            {appLanguage === 'ta' ? 'மொத்தம்' : 'Total'}
          </span>
        </div>
        <div className="planner-stat-chip">
          <span className="planner-stat-num">
            {goals.filter(g => g.done || Object.values(g.doneOn || {}).some(Boolean)).length}
          </span>
          <span className="planner-stat-label">
            {appLanguage === 'ta' ? 'முடிந்தது' : 'Done'}
          </span>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="card planner-calendar-card">
        <WeeklyMonthlyPlanner
          view={plannerView}
          goals={goals}
          onTaskClick={(dateStr) => {
            setActiveDate(dateStr);
            setActiveView('tasks');
          }}
          onDateChange={() => {}}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="card planner-actions-card">
        <div className="section-title-sm" style={{ marginBottom: 12 }}>
          {appLanguage === 'ta' ? '⚡ விரைவு செயல்கள்' : '⚡ Quick Actions'}
        </div>
        <div className="planner-quick-grid">
          <button
            className="planner-quick-btn"
            onClick={() => setActiveView('tasks')}
          >
            <span className="planner-quick-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>✅</span>
            <div>
              <div className="planner-quick-label">
                {appLanguage === 'ta' ? 'பணிகள்' : 'Tasks'}
              </div>
              <div className="planner-quick-sub">
                {appLanguage === 'ta' ? 'பட்டியல் பாரு' : 'View list'}
              </div>
            </div>
          </button>

          <button
            className="planner-quick-btn"
            onClick={() => setActiveView('analytics')}
          >
            <span className="planner-quick-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>📊</span>
            <div>
              <div className="planner-quick-label">
                {appLanguage === 'ta' ? 'பகுப்பாய்வு' : 'Analytics'}
              </div>
              <div className="planner-quick-sub">
                {appLanguage === 'ta' ? 'முன்னேற்றம்' : 'Your progress'}
              </div>
            </div>
          </button>

          <button
            className="planner-quick-btn"
            onClick={() => setActiveView('habits')}
          >
            <span className="planner-quick-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>🔁</span>
            <div>
              <div className="planner-quick-label">
                {appLanguage === 'ta' ? 'பழக்கங்கள்' : 'Habits'}
              </div>
              <div className="planner-quick-sub">
                {appLanguage === 'ta' ? 'தினசரி' : 'Daily streak'}
              </div>
            </div>
          </button>

          <button
            className="planner-quick-btn"
            onClick={() => setActiveView('chat')}
          >
            <span className="planner-quick-icon" style={{ background: 'rgba(168,85,247,0.15)' }}>🤖</span>
            <div>
              <div className="planner-quick-label">
                {appLanguage === 'ta' ? 'AI Coach' : 'AI Coach'}
              </div>
              <div className="planner-quick-sub">
                {appLanguage === 'ta' ? 'திட்டம் பெறு' : 'Get a plan'}
              </div>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}