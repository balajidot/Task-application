import React, { createContext, useContext, useState, useCallback } from 'react';
import { useApp } from './AppContext';
import { todayKey, normalizeGoal } from '../utils/helpers';
import { triggerHaptic } from '../hooks/useMobileFeatures';

const TaskFormContext = createContext();

export const useTaskForm = () => {
  const context = useContext(TaskFormContext);
  if (!context) throw new Error('useTaskForm must be used within a TaskFormProvider');
  return context;
};

export const TaskFormProvider = ({ children }) => {
  const { 
    goals, save, activeDate, handleAiAutoSchedule, 
    appLanguage, getApiUrl, setAiLoading, setSmartNotice,
    scheduleTaskNotifications
  } = useApp();
  
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState({
    text: "", date: todayKey(), reminder: "",
    startTime: "", endTime: "", repeat: "None",
    session: "Morning", priority: "Medium"
  });

  const submitForm = useCallback(() => {
    if (!form.text.trim()) return;
    const g = normalizeGoal({ ...form });
    if (editingGoal) {
      save(goals.map(x => x.id === editingGoal ? { ...x, ...form } : x));
    } else {
      save([...goals, { ...g, id: Date.now() }]);
    }
    setShowForm(false);
    setEditingGoal(null);
    setForm({
      text: "", date: activeDate || todayKey(), reminder: "",
      startTime: "", endTime: "", repeat: "None",
      session: "Morning", priority: "Medium"
    });
    triggerHaptic('medium');
    // Refresh notifications after saving
    setTimeout(() => scheduleTaskNotifications([...goals, g]), 500);
  }, [form, editingGoal, goals, activeDate, save, scheduleTaskNotifications]);

  const onAddTask = useCallback(() => {
    setForm({ 
      text: "", date: activeDate || todayKey(), reminder: "", 
      startTime: "", endTime: "", repeat: "None", 
      session: "Morning", priority: "Medium" 
    });
    setEditingGoal(null);
    setShowForm(true);
  }, [activeDate]);

  const onAutoSchedule = useCallback(() => {
    setShowForm(true);
    handleAiAutoSchedule();
  }, [handleAiAutoSchedule]);

  // We keep handleSmartTaskParse here to avoid cyclic context dependencies
  const handleSmartTaskParse = useCallback(async (rawText) => {
    if (!rawText.trim()) return;
    setAiLoading(true);
    triggerHaptic('light');
    try {
      const response = await fetch(getApiUrl('/api/parse-task'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, language: appLanguage })
      });
      if (!response.ok) throw new Error(`Server status: ${response.status}`);
      const data = await response.json();
      if (data.parsedTask) {
        const { text, startTime, endTime, priority, date } = data.parsedTask;
        setForm(p => ({
          ...p,
          text:      text      || rawText,
          startTime: startTime || p.startTime,
          endTime:   endTime   || p.endTime,
          priority:  priority  || p.priority,
          date:      date      || p.date,
        }));
      }
    } catch (err) {
      console.error('handleSmartTaskParse failed:', err);
      setForm(p => ({ ...p, text: rawText }));
      setSmartNotice?.({
        id: 'parse-fail',
        text: appLanguage === 'ta' ? "❌ AI இணைப்பு தோல்வி" : "❌ AI Connection Failed",
        icon: '⚠️', type: 'error'
      });
    }
    finally { setAiLoading(false); }
  }, [appLanguage, getApiUrl, setAiLoading, setSmartNotice]);

  return (
    <TaskFormContext.Provider value={{
      form, setForm,
      showForm, setShowForm,
      editingGoal, setEditingGoal,
      submitForm,
      onAddTask, onAutoSchedule,
      handleSmartTaskParse
    }}>
      {children}
    </TaskFormContext.Provider>
  );
};
