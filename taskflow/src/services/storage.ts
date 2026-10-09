import AsyncStorage from "@react-native-async-storage/async-storage";

// This is the key used to store all TaskFlow tasks on the phone.
const TASKS_STORAGE_KEY = "@taskflow_tasks";

// Represents a task stored locally on the device.
export type LocalTask = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  notification_id: string | null;
};

// Get all tasks saved on the device.
export const getLocalTasks = async (): Promise<LocalTask[]> => {
  try {
    const storedTasks = await AsyncStorage.getItem(
      TASKS_STORAGE_KEY
    );

    // Nothing has been saved yet.
    if (!storedTasks) {
      return [];
    }

    return JSON.parse(storedTasks);
  } catch (error) {
    console.error("Failed to load local tasks:", error);
    return [];
  }
};

// Save the complete task list to the device.
export const saveLocalTasks = async (
  tasks: LocalTask[]
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify(tasks)
    );
  } catch (error) {
    console.error("Failed to save local tasks:", error);
    throw error;
  }
};

// Add a new task to local storage.
export const addLocalTask = async (
  task: LocalTask
): Promise<LocalTask> => {
  const tasks = await getLocalTasks();

  // Add the newest task to the beginning of the list.
  const updatedTasks = [task, ...tasks];

  await saveLocalTasks(updatedTasks);

  return task;
};

// Update an existing task locally.
export const updateLocalTask = async (
  id: string,
  updates: Partial<LocalTask>
): Promise<LocalTask | null> => {
  const tasks = await getLocalTasks();

  const taskIndex = tasks.findIndex(
    (task) => task.id === id
  );

  // The task doesn't exist on the device.
  if (taskIndex === -1) {
    return null;
  }

  const updatedTask = {
    ...tasks[taskIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  tasks[taskIndex] = updatedTask;

  await saveLocalTasks(tasks);

  return updatedTask;
};

// Delete a task from local storage.
export const deleteLocalTask = async (
  id: string
): Promise<boolean> => {
  const tasks = await getLocalTasks();

  const updatedTasks = tasks.filter(
    (task) => task.id !== id
  );

  // Check whether anything was actually deleted.
  const deleted = updatedTasks.length !== tasks.length;

  if (deleted) {
    await saveLocalTasks(updatedTasks);
  }

  return deleted;
};

// Remove all locally stored tasks.
// This is mainly useful during development/testing.
export const clearLocalTasks = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(
      TASKS_STORAGE_KEY
    );
  } catch (error) {
    console.error(
      "Failed to clear local tasks:",
      error
    );
    throw error;
  }
};