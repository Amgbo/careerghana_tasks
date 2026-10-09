import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";

// Configure how notifications should behave when TaskFlow is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Android requires a notification channel.
        // This controls how TaskFlow reminders are displayed.
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync(
            "task-reminders",
            {
              name: "Task Reminders",
              importance:
                Notifications.AndroidImportance.HIGH,
              sound: "default",
            }
          );
        }

        // Check whether notification permission has already been granted.
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();

        let finalStatus = existingStatus;

        // Ask the user for permission if it hasn't been granted yet.
        if (existingStatus !== "granted") {
          const { status } =
            await Notifications.requestPermissionsAsync();

          finalStatus = status;
        }

        // Log the final permission status.
        // This makes debugging much easier.
        console.log(
          "TaskFlow notification permission:",
          finalStatus
        );

        // Tell us clearly if permission was denied.
        if (finalStatus !== "granted") {
          console.warn(
            "TaskFlow does not have permission to send notifications."
          );
        }
      } catch (error) {
        // Catch notification setup errors so they don't crash the app.
        console.error(
          "Notification setup error:",
          error
        );
      }
    };

    setupNotifications();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "600", fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#F9FAFB" },
      }}
    >
      {/* Home screen */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      {/* Create task screen */}
      <Stack.Screen
        name="tasks/create"
        options={{
          title: "New Task",
          headerBackTitle: "Back",
        }}
      />

      {/* Task details/edit screen */}
      <Stack.Screen
        name="tasks/[id]"
        options={{
          title: "Edit Task",
          headerBackTitle: "Back",
        }}
      />

      {/* Settings screen */}
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}