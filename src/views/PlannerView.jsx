import { useApp } from '../context/AppContext';
import WeeklyMonthlyPlanner from '../components/WeeklyMonthlyPlanner';

export default function PlannerView() {
  const { plannerView, setPlannerView, goals, setActiveDate, setActiveView } = useApp();
  return (
    <div className="animate-fade-in">
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

      <div className="card">
        <WeeklyMonthlyPlanner 
          view={plannerView}
          goals={goals}
          onTaskClick={(dateStr) => {
            setActiveDate(dateStr);
            setActiveView('tasks');
          }}
          onDateChange={(date) => {}}
        />
      </div>
    </div>
  );
}