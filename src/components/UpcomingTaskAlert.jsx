import React, { useState, useEffect } from 'react';
import { showAppNotification } from '../notifications.fixed';

const UpcomingTaskAlert = ({ upcomingTask, onAlert }) => {
  const [alertShown, setAlertShown] = useState(false);

  useEffect(() => {
    if (!upcomingTask) return;

    const checkAlert = () => {
      const now = new Date();
      const taskStart = new Date(`${upcomingTask.date}T${upcomingTask.startTime || '00:00'}`);
      const timeUntilStart = taskStart - now;
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (timeUntilStart <= fiveMinutes && timeUntilStart > 0 && !alertShown) {
        setAlertShown(true);
        onAlert?.(upcomingTask);
        
        // Show browser notification
        showAppNotification('Upcoming Task Alert', {
          body: `Next task '${upcomingTask.text}' starts in 5 minutes.`,
          tag: 'upcoming-task'
        });

        // Play alert sound
        const audio = new Audio('/sounds/reminder.mp3');
        audio.play().catch(() => {});
      }
    };

    const interval = setInterval(checkAlert, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [upcomingTask, alertShown, onAlert]);

  if (!alertShown || !upcomingTask) return null;

  return (
    <div className="upcoming-task-alert">
      <div className="alert-content">
        <div className="alert-icon">⏰</div>
        <div className="alert-text">
          <strong>Next task starting soon!</strong><br/>
          "{upcomingTask.text}" at {upcomingTask.startTime || 'scheduled time'}
        </div>
      </div>
      <button 
        className="alert-dismiss"
        onClick={() => setAlertShown(false)}
      >
        Dismiss
      </button>
    </div>
  );
};

export default UpcomingTaskAlert;
