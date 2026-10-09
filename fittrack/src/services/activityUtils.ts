/**
 * Activity Aggregation and Date Utility Services
 * Handles daily aggregation, weekly step calculations, and formatting.
 */

import { Activity, DailyChartData, TodaySummary } from '../types/activity';

/**
 * Format a Date object or YYYY-MM-DD string into YYYY-MM-DD ISO format (local timezone safe).
 */
export const formatDateToKey = (dateInput: Date | string): string => {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a YYYY-MM-DD date into a readable string like "September 30, 2026"
 */
export const formatDisplayDate = (dateString: string): string => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;

    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Calculates aggregated statistics for Today's Activity summary card.
 * Handles multiple workouts on the same day by adding steps & durations and combining workout types.
 */
export const calculateTodaySummary = (
  activities: Activity[],
  targetDateStr: string = formatDateToKey(new Date())
): TodaySummary => {
  // Filter activities matching today's date key
  const todayActivities = activities.filter(
    (act) => formatDateToKey(act.date) === targetDateStr
  );

  if (todayActivities.length === 0) {
    return {
      totalSteps: 0,
      totalCalories: 0,
      workoutSummary: 'No activity logged today.',
      totalDuration: 0,
      hasActivity: false,
    };
  }

  const totalSteps = todayActivities.reduce((sum, act) => sum + (act.steps ?? 0), 0);
  const totalCalories = todayActivities.reduce((sum, act) => sum + (act.calories ?? 0), 0);
  const totalDuration = todayActivities.reduce((sum, act) => sum + Number(act.duration), 0);

  // Extract unique workout types logged today
  const uniqueTypes = Array.from(new Set(todayActivities.map((act) => act.workoutType)));
  const workoutSummary = uniqueTypes.join(' + ');

  return {
    totalSteps,
    totalCalories,
    workoutSummary,
    totalDuration,
    hasActivity: true,
  };
};

/**
 * Calculates current week's (Monday to Sunday) daily step count aggregation.
 * Generates exact 7 entries for Mon-Sun, matching saved user activities to each day.
 */
export const getWeeklyStepData = (
  activities: Activity[],
  referenceDate: Date = new Date()
): DailyChartData[] => {
  const current = new Date(referenceDate);

  // Find Monday of the current week (1 = Monday, ..., 0 = Sunday)
  const currentDayOfWeek = current.getDay();
  // Distance to Monday: if Sunday (0), distance is -6 days. Otherwise 1 - dayOfWeek.
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);

  const todayKey = formatDateToKey(referenceDate);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const weeklyData: DailyChartData[] = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);

    const dayKey = formatDateToKey(dayDate);

    // Sum steps for all activities recorded on this day
    const daySteps = activities
      .filter((act) => formatDateToKey(act.date) === dayKey)
      .reduce((sum, act) => sum + (act.steps ?? 0), 0);

    weeklyData.push({
      day: dayNames[i],
      fullDate: dayKey,
      steps: daySteps,
      isToday: dayKey === todayKey,
    });
  }

  return weeklyData;
};
