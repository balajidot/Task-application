import React from 'react';
import { isBefore, differenceInSeconds, parseISO } from 'date-fns';

export function LiveStrip({ tasks = [], currentTime }) {
  // Find current active task
  const activeTask = tasks.find(t => {
    const start = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
    const end = typeof t.endTime === 'string' ? parseISO(t.endTime) : t.endTime;
    return !t.done && !isBefore(currentTime, start) && isBefore(currentTime, end);
  });

  if (!activeTask) {
    return (
      <div className="p-5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 text-center text-slate-500 shadow-sm transition-all">
        <p className="text-sm font-medium">No active task at the moment. Take a breather.</p>
      </div>
    );
  }

  const start = typeof activeTask.startTime === 'string' ? parseISO(activeTask.startTime) : activeTask.startTime;
  const end = typeof activeTask.endTime === 'string' ? parseISO(activeTask.endTime) : activeTask.endTime;

  const totalDuration = differenceInSeconds(end, start);
  const elapsed = differenceInSeconds(currentTime, start);
  let progress = (elapsed / totalDuration) * 100;
  progress = Math.max(0, Math.min(100, progress));

  const remainingMins = Math.ceil(differenceInSeconds(end, currentTime) / 60);

  return (
    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/50 mb-6 animate-[pulse_3s_ease-in-out_infinite] shadow-md relative overflow-hidden transition-all">
      {/* Progress Bar Background */}
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 dark:bg-blue-900/30" />
      {/* Active Fill */}
      <div 
        className="absolute top-0 left-0 h-1 bg-blue-500 dark:bg-blue-400 transition-all duration-1000 ease-linear"
        style={{ width: `${progress}%` }}
      />
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-widest mb-1.5 opacity-80">
            Current Focus
          </h2>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
            {activeTask.title}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight flex items-baseline justify-end gap-1">
            {remainingMins} <span className="text-sm font-semibold text-blue-800/60 dark:text-blue-300/60 tracking-normal">min</span>
          </p>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 tracking-wider uppercase">
            {progress.toFixed(1)}% Completed
          </p>
        </div>
      </div>
    </div>
  );
}
