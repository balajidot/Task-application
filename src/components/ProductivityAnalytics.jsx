import React from 'react';

const ProductivityAnalytics = ({ goals, weeklyStats }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = goals.filter(g => g.date === today);
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
  const focusTimeWeek = calculateFocusTime(goals.filter(g => g.done));

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="analytics-dashboard g-lg">
      <div className="analytics-grid g-lg mb-lg">
        <div className="analytics-card base-card p-lg">
          <div className="analytics-icon">📊</div>
          <div className="analytics-content">
            <div className="analytics-title">Today's Progress</div>
            <div className="analytics-value">
              {completedToday}/{totalToday} tasks
            </div>
            <div className="analytics-subtitle">{completionRate}% complete</div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="analytics-card base-card p-lg">
          <div className="analytics-icon">📈</div>
          <div className="analytics-content">
            <div className="analytics-title">Weekly Completion</div>
            <div className="analytics-value">
              {weeklyStats?.weekPct || 0}%
            </div>
            <div className="analytics-subtitle">
              {weeklyStats?.weekDone || 0}/{weeklyStats?.weekTotal || 0} tasks
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill weekly" 
                style={{ width: `${weeklyStats?.weekPct || 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="analytics-card base-card p-lg">
          <div className="analytics-icon">⏱️</div>
          <div className="analytics-content">
            <div className="analytics-title">Focus Time Today</div>
            <div className="analytics-value">
              {formatMinutes(focusTimeToday)}
            </div>
            <div className="analytics-subtitle">
              This week: {formatMinutes(focusTimeWeek)}
            </div>
          </div>
        </div>

        <div className="analytics-card base-card p-lg">
          <div className="analytics-icon">🔥</div>
          <div className="analytics-content">
            <div className="analytics-title">Productivity Streak</div>
            <div className="analytics-value">
              {calculateStreak(goals)} days
            </div>
            <div className="analytics-subtitle">
              Keep it going!
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-chart base-card p-lg">
        <h3>Task Distribution by Priority</h3>
        <div className="priority-chart flex-stack-lg">
          {['High', 'Medium', 'Low'].map(priority => {
            const count = todayTasks.filter(g => g.priority === priority).length;
            const completed = todayTasks.filter(g => g.priority === priority && g.done).length;
            const percentage = count > 0 ? Math.round((completed / count) * 100) : 0;
            
            return (
              <div key={priority} className="priority-bar">
                <div className="priority-label">
                  {priority} ({count})
                </div>
                <div className="priority-progress">
                  <div 
                    className={`priority-fill p-${priority.toLowerCase()}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="priority-percentage">
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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

export default ProductivityAnalytics;
