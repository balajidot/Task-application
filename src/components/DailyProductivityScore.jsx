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
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak(goals);

  return (
    <div className="daily-productivity-score">
      <div className="score-header">
        <div className="score-title">
          📊 Today's Productivity
        </div>
        <div className="score-date">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <div className="score-metrics">
        <div className="metric-card primary">
          <div className="metric-value">
            {completedToday}/{totalToday}
          </div>
          <div className="metric-label">
            Tasks Completed
          </div>
          <div className="metric-progress">
            <div 
              className="metric-progress-fill" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="metric-percentage">
            {completionRate}%
          </div>
        </div>

        <div className="metric-card secondary">
          <div className="metric-value">
            {focusTimeHours}h {focusTimeMinutes}m
          </div>
          <div className="metric-label">
            Focus Time
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-value">
            {currentStreak}
          </div>
          <div className="metric-label">
            Day Streak 🔥
          </div>
        </div>
      </div>

      <div className="score-insights">
        {completionRate >= 80 && (
          <div className="insight-text">
            🎉 Excellent productivity today! Keep up the great work!
          </div>
        )}
        {completionRate >= 60 && completionRate < 80 && (
          <div className="insight-text">
            👍 Good progress! You're over halfway to your daily goals.
          </div>
        )}
        {completionRate < 60 && totalToday > 0 && (
          <div className="insight-text">
            💪 Keep going! Every task completed is progress toward your goals.
          </div>
        )}
        {totalToday === 0 && (
          <div className="insight-text">
            📝 No tasks yet. Start by adding your first task for today!
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyProductivityScore;
