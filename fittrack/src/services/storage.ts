/**
 * Storage Service for Fitness Tracker
 * Manages local persistence of activity records using React Native AsyncStorage.
 * All user data is stored locally on device for full offline functionality.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, usesStepMetric } from '../types/activity';
import { formatDateToKey } from '../services/activityUtils';

const STORAGE_KEY = '@fitness_tracker_activities_v1';
const INITIALIZED_FLAG_KEY = '@fitness_tracker_initialized_v1';

/**
 * Generate a unique ID for a new activity entry.
 */
const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generates initial seed data for first launch demo purposes.
 */
const getInitialSeedActivities = (): Activity[] => {
  const today = new Date();

  const getDateStr = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return formatDateToKey(d);
  };

  return [
    {
      id: generateUniqueId(),
      date: getDateStr(0), // Today
      steps: 6500,
      calories: null,
      workoutType: 'Running',
      duration: 35,
    },
    {
      id: generateUniqueId(),
      date: getDateStr(1), // Yesterday
      steps: 8200,
      calories: null,
      workoutType: 'Walking',
      duration: 45,
    },
    {
      id: generateUniqueId(),
      date: getDateStr(2), // 2 days ago
      steps: null,
      calories: 400,
      workoutType: 'Gym',
      duration: 60,
    },
    {
      id: generateUniqueId(),
      date: getDateStr(3), // 3 days ago
      steps: 7400,
      calories: null,
      workoutType: 'Cycling',
      duration: 40,
    },
  ];
};

/**
 * Retrieves all stored activity records from AsyncStorage.
 * Seeds initial demo activities if this is the first application launch.
 * Returns array of activities sorted by date (newest first).
 */
export const getActivities = async (): Promise<Activity[]> => {
  try {
    const isInitialized = await AsyncStorage.getItem(INITIALIZED_FLAG_KEY);
    
    // First launch seed initialization
    if (!isInitialized) {
      const seedData = getInitialSeedActivities();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
      await AsyncStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
      return seedData;
    }

    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (!jsonValue) {
      return [];
    }

    const activities: Activity[] = JSON.parse(jsonValue);

    return Array.isArray(activities)
      ? activities
          .map((activity) => ({
            ...activity,
            steps: usesStepMetric(activity.workoutType) ? Number(activity.steps) || null : null,
            calories: usesStepMetric(activity.workoutType)
              ? null
              : Number(activity.calories) || null,
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];
  } catch (error) {
    console.error('Failed to load activities from AsyncStorage:', error);
    throw new Error('Unable to load your activities. Please try again.');
  }
};

/**
 * Saves a new activity or updates an existing activity in AsyncStorage.
 * Immediately persists the updated activities array.
 */
export const saveActivity = async (
  activityInput: Omit<Activity, 'id'> & { id?: string }
): Promise<Activity> => {
  try {
    const currentActivities = await getActivities();

    const newActivity: Activity = {
      ...activityInput,
      id: activityInput.id || generateUniqueId(),
      steps: activityInput.steps === null ? null : Number(activityInput.steps),
      calories: activityInput.calories === null ? null : Number(activityInput.calories),
      duration: Number(activityInput.duration),
    };

    // Append new entry to existing entries list
    const updatedActivities = [newActivity, ...currentActivities];

    // Persist JSON serialized string back to storage
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedActivities));
    await AsyncStorage.setItem(INITIALIZED_FLAG_KEY, 'true');

    return newActivity;
  } catch (error) {
    console.error('Failed to save activity to AsyncStorage:', error);
    throw new Error('Unable to save activity record. Please try again.');
  }
};

/**
 * Deletes an activity record by its unique ID.
 * Updates AsyncStorage with the filtered activities array.
 */
export const deleteActivity = async (id: string): Promise<void> => {
  try {
    const currentActivities = await getActivities();
    const filteredActivities = currentActivities.filter((activity) => activity.id !== id);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredActivities));
  } catch (error) {
    console.error(`Failed to delete activity with id ${id}:`, error);
    throw new Error('Unable to delete activity. Please try again.');
  }
};

/**
 * Clears all saved activity records from AsyncStorage.
 */
export const clearActivities = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Failed to clear activities from AsyncStorage:', error);
    throw new Error('Unable to reset history data. Please try again.');
  }
};
