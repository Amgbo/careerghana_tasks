import * as Notifications from "expo-notifications";

// Notification channel used by TaskFlow on Android.
const TASK_REMINDER_CHANNEL = "task-reminders";

/*
  Schedule a local notification for a task.

  The notification is stored on the phone.
  It does not require a server or internet connection.
*/
export const scheduleTaskReminder = async (
  taskTitle: string,
  dueDate: Date
): Promise<string | null> => {
  try {
    // Don't schedule a reminder for a time that has already passed.
    if (dueDate.getTime() <= Date.now()) {
      console.warn(
        "Reminder not scheduled: due date has already passed."
      );

      return null;
    }

    // Schedule the notification directly on the device.
    const notificationId =
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "TaskFlow Reminder",
          body: `Reminder: ${taskTitle}`,
          sound: "default",
        },

        // Fire the notification at the selected date and time.
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dueDate,
          channelId: TASK_REMINDER_CHANNEL,
        },
      });

    console.log(
      "Task reminder scheduled:",
      notificationId
    );

    return notificationId;
  } catch (error) {
    console.error(
      "Failed to schedule task reminder:",
      error
    );

    return null;
  }
};

/*
  Cancel a previously scheduled task reminder.
*/
export const cancelTaskReminder = async (
  notificationId: string | null
): Promise<void> => {
  try {
    // There is nothing to cancel if the task has no reminder.
    if (!notificationId) {
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(
      notificationId
    );

    console.log(
      "Task reminder cancelled:",
      notificationId
    );
  } catch (error) {
    console.error(
      "Failed to cancel task reminder:",
      error
    );
  }
};