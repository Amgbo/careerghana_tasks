/**
 * Core fitness activity data models and types
 */

export type Activity = {
  id: string;
  date: string;        // Date formatted as YYYY-MM-DD (e.g. "2026-10-04")
  steps: number | null; // Step count for step-based workouts
  calories: number | null; // Calories burned for non-step workouts
  workoutType: string; // Type of workout (e.g. Walking, Running, Gym)
  duration: number;    // Duration of workout in minutes
};

export const WORKOUT_TYPES = [
  'Walking',
  'Running',
  'Cycling',
  'Gym',
  'Swimming',
  'Other',
] as const;

export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export const STEP_WORKOUT_TYPES: readonly WorkoutType[] = [
  'Walking',
  'Running',
  'Cycling',
];

export const usesStepMetric = (workoutType: string): boolean =>
  STEP_WORKOUT_TYPES.includes(workoutType as WorkoutType);

export type DailyChartData = {
  day: string;        // Short day name (e.g. "Mon", "Tue")
  fullDate: string;   // ISO format YYYY-MM-DD
  steps: number;      // Total aggregated steps for that day
  isToday: boolean;   // Flag indicating if this day is today
};

export type TodaySummary = {
  totalSteps: number;
  totalCalories: number;
  workoutSummary: string; // Formatted summary e.g. "Running + Gym" or "No activity logged today."
  totalDuration: number;  // Total minutes
  hasActivity: boolean;
};
