import React from 'react';

const DailyProductivityScore = ({ goals, todayKey }) => {
  const todayTasks = goals.filter(g => g.date === todayKey);
  const completedToday = todayTasks.filter(g => g.done).length;
  const totalToday = todayTasks.length;
  const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Calculate focus time (estimated based on task duration)
  const calculateFocusTime = (tasks) => {
    return tasks.reduce((total, task) => {
      if (task.startTime && task.endTime) {
        const [startHour, startMin] = task.startTime.split(':').map(Number);
        const [endHour, endMin] = task.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return total + (endMinutes - startMinutes);
      }
      return total;
    }, 0);
  };

  const focusTimeToday = calculateFocusTime(todayTasks.filter(g => g.done));
  const focusTimeHours = Math.floor(focusTimeToday / 60);
  const focusTimeMinutes = focusTimeToday % 60;

  // Calculate Total Planned Time for Efficiency Metric
  const totalPlannedTime = calculateFocusTime(todayTasks);
  const efficiencyRate = totalPlannedTime > 0 ? Math.round((focusTimeToday / totalPlannedTime) * 100) : 0;

  // Calculate streak
  const calculateStreak = (goals) => {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];
      
      const dayTasks = goals.filter(g => g.date === dateKey);
      const hasCompleted = dayTasks.length > 0 && dayTasks.every(g => g.done);
      
      if (hasCompleted) {
        streak++;
      } else if (i > 0 && dayTasks.length > 0) {
        // Break only if there were tasks and they weren't all completed
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak(goals);

  return (
    <div className="daily-productivity-score" style={{ 
      background: 'var(--card)', 
      borderRadius: '16px', 
      padding: '20px', 
      marginBottom: '20px',
      border: '1px solid var(--card-border)',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    }}>
      <div className="score-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="score-title" style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>📊</span> Today's Productivity
        </div>
        <div className="score-date" style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: '600' }}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* 🔥 PERFECT 2x2 GRID FIX WITH 4 CARDS 🔥 */}
      <div className="score-metrics" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px', 
        marginBottom: '20px' 
      }}>
        
        {/* Card 1: Tasks Completed */}
        <div className="metric-card primary" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px'
        }}>
          <div className="metric-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', lineHeight: '1' }}>
            {completedToday}/{totalToday}
          </div>
          <div className="metric-label" style={{ fontSize: '0.82rem', color: 'var(--text)', opacity: 0.8, marginTop: '8px', textAlign: 'center', fontWeight: 700 }}>
            Tasks Completed
          </div>
          <div className="metric-progress" style={{ width: '100%', height: '4px', background: 'var(--glass-border)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
            <div className="metric-progress-fill" style={{ width: `${completionRate}%`, height: '100%', background: '#10b981', borderRadius: '2px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Card 2: Focus Time */}
        <div className="metric-card secondary" style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px'
        }}>
          <div className="metric-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6', lineHeight: '1' }}>
            {focusTimeHours}h {focusTimeMinutes}m
          </div>
          <div className="metric-label" style={{ fontSize: '0.82rem', color: 'var(--text)', opacity: 0.8, marginTop: '8px', textAlign: 'center', fontWeight: 700 }}>
            Focus Time
          </div>
        </div>

        {/* Card 3: Day Streak */}
        <div className="metric-card accent" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px'
        }}>
          <div className="metric-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b', lineHeight: '1' }}>
            {currentStreak}
          </div>
          <div className="metric-label" style={{ fontSize: '0.82rem', color: 'var(--text)', opacity: 0.8, marginTop: '8px', textAlign: 'center', fontWeight: 700 }}>
            Day Streak 🔥
          </div>
        </div>

        {/* 🔥 NEW CARD 4: Time Efficiency 🔥 */}
        <div className="metric-card new-feature" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(109, 40, 217, 0.25) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px'
        }}>
          <div className="metric-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#8b5cf6', lineHeight: '1' }}>
            {efficiencyRate}%
          </div>
          <div className="metric-label" style={{ fontSize: '0.82rem', color: 'var(--text)', opacity: 0.8, marginTop: '8px', textAlign: 'center', fontWeight: 700 }}>
            Time Efficiency ⚡
          </div>
        </div>
      </div>

      <div className="score-insights" style={{ 
        background: 'var(--chip)', 
        borderRadius: '8px', 
        padding: '12px',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: 'var(--text)',
        border: '1px solid var(--card-border)'
      }}>
        {completionRate >= 80 && "🎉 Excellent productivity today! Keep up the great work!"}
        {completionRate >= 60 && completionRate < 80 && "👍 Good progress! You're over halfway to your daily goals."}
        {completionRate > 0 && completionRate < 60 && totalToday > 0 && "💪 Keep going! Every task completed is progress toward your goals."}
        {completionRate === 0 && totalToday > 0 && "🚀 Ready to start? Pick a task and let's go!"}
        {totalToday === 0 && "📝 No tasks yet. Start by adding your first task for today!"}
      </div>
    </div>
  );
};

export default DailyProductivityScore;