import React from 'react';

const Planner = ({ plannerView, setPlannerView, WeeklyMonthlyPlanner }) => {
  return (
    <div>
      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title">
              📅 Planner
            </div>
            <div className="tip">
              View and organize your tasks by week or month
            </div>
          </div>
          <div className="head-actions">
            <button 
              className={`filter-btn ${plannerView === 'weekly' ? 'active' : ''}`}
              onClick={() => setPlannerView('weekly')}
            >
              Weekly View
            </button>
            <button 
              className={`filter-btn ${plannerView === 'monthly' ? 'active' : ''}`}
              onClick={() => setPlannerView('monthly')}
            >
              Monthly View
            </button>
          </div>
        </div>
      </div>

      <WeeklyMonthlyPlanner 
        view={plannerView}
        onViewChange={setPlannerView}
      />
    </div>
  );
};

export default Planner;
