import { useState, useMemo, useCallback } from 'react';
import { goalVisibleOn, isDoneOn, todayKey } from '../utils/timeUtils';

export const useTasks = (goals) => {
  const [activeDate, setActiveDate] = useState(todayKey());
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All Times");
  const [selectedGoalIds, setSelectedGoalIds] = useState([]);

  const todayGoals = useMemo(() => 
    goals.filter(g => goalVisibleOn(g, todayKey())), 
    [goals]
  );

  const pendingGoals = useMemo(() => 
    todayGoals.filter(g => !isDoneOn(g, todayKey())), 
    [todayGoals]
  );

  const completedGoals = useMemo(() => 
    todayGoals.filter(g => isDoneOn(g, todayKey())), 
    [todayGoals]
  );

  const selectedSet = useMemo(() => 
    new Set(selectedGoalIds), 
    [selectedGoalIds]
  );

  const visibleGoals = useMemo(() => {
    let filtered = todayGoals;
    if (priorityFilter !== "All") {
      filtered = filtered.filter(g => g.priority === priorityFilter);
    }
    if (timeFilter !== "All Times") {
      filtered = filtered.filter(g => g.session === timeFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(g => g.text.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return filtered;
  }, [todayGoals, priorityFilter, timeFilter, searchTerm]);

  const toggleSelectGoal = useCallback((id) => {
    setSelectedGoalIds(prev => 
      prev.includes(id) 
        ? prev.filter(gid => gid !== id)
        : [...prev, id]
    );
  }, []);

  const selectAllVisibleGoals = () => 
    setSelectedGoalIds(visibleGoals.map(g => g.id));

  const clearSelectedGoals = () => 
    setSelectedGoalIds([]);

  return {
    // State
    activeDate,
    setActiveDate,
    searchTerm,
    setSearchTerm,
    priorityFilter,
    setPriorityFilter,
    timeFilter,
    setTimeFilter,
    selectedGoalIds,
    selectedSet,
    
    // Computed
    todayGoals,
    pendingGoals,
    completedGoals,
    visibleGoals,
    
    // Actions
    toggleSelectGoal,
    selectAllVisibleGoals,
    clearSelectedGoals
  };
};
