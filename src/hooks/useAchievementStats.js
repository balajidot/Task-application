import { useMemo } from "react";
import { timeToMinutes } from "../utils/helpers";

export default function useAchievementStats({
  goals,
  weekly,
  journalEntries,
  habitsData,
  goalsData,
  streakDays,
}) {
  return useMemo(() => {
    const totalDone = goals.reduce((count, goal) => {
      if (goal.repeat === "None") return count + (goal.done ? 1 : 0);
      return count + Object.values(goal.doneOn || {}).filter(Boolean).length;
    }, 0);

    const hadPerfectDay = weekly.days.some((day) => day.total > 0 && day.done === day.total);
    const earlyBird = goals.some((goal) => {
      const startMinutes = timeToMinutes(goal.startTime);
      return startMinutes < 7 * 60 && (goal.done || Object.values(goal.doneOn || {}).some(Boolean));
    });

    const journalCount = Object.values(journalEntries || {}).filter((entry) =>
      entry?.mood || entry?.wellText || entry?.improveText || entry?.gratitudeText
    ).length;

    const habitCount = Array.isArray(habitsData) ? habitsData.length : 0;
    const goalCount = Array.isArray(goalsData) ? goalsData.length : 0;
    const goalCompleted = Array.isArray(goalsData) && goalsData.some((goal) =>
      goal?.completed || Number(goal?.progress) >= 100
    );

    return {
      totalDone,
      streak: streakDays,
      hadPerfectDay,
      earlyBird,
      journalCount,
      habitCount,
      goalCount,
      goalCompleted,
    };
  }, [goals, weekly.days, journalEntries, habitsData, goalsData, streakDays]);
}
