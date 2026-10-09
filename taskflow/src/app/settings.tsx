import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getLocalTasks, saveLocalTasks } from "../services/storage";
import { cancelTaskReminder } from "../services/notifications";

/* ---------- Colors ---------- */
const COLORS = {
  background: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  textFaint: "#9CA3AF",
  border: "#E5E7EB",
  primary: "#4F46E5",
  danger: "#EF4444",
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [clearing, setClearing] = useState(false);

  const handleClearTasks = () => {
    Alert.alert(
      "Clear all tasks",
      "Are you sure you want to delete all your tasks? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: clearAllTasks,
        },
      ]
    );
  };

  const clearAllTasks = async () => {
    try {
      setClearing(true);
      const tasks = await getLocalTasks();

      for (const task of tasks) {
        await cancelTaskReminder(task.notification_id);
      }

      await saveLocalTasks([]);
      Alert.alert("Tasks cleared", "All tasks have been deleted.");
      router.back();
    } catch (error) {
      console.error("Failed to clear all tasks:", error);
      Alert.alert("Error", "Could not clear all tasks.");
    } finally {
      setClearing(false);
    }
  };

  const handleNotificationStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        Alert.alert(
          "Notifications enabled",
          "TaskFlow can send task reminders."
        );
      } else {
        Alert.alert(
          "Notifications disabled",
          "TaskFlow does not currently have permission to send reminders."
        );
      }
    } catch (error) {
      console.error("Failed to check notification permission:", error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 30 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {/* Notifications section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Pressable
            style={({ pressed }) => [
              styles.cardRow,
              pressed && styles.pressed,
            ]}
            onPress={handleNotificationStatus}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={COLORS.primary}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Notification Status</Text>
              <Text style={styles.rowSubtitle}>
                Check if task reminders are permitted
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textFaint}
            />
          </Pressable>
        </View>

        {/* Data section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <Pressable
            style={({ pressed }) => [
              styles.cardRow,
              pressed && styles.pressed,
              clearing && styles.disabled,
            ]}
            onPress={handleClearTasks}
            disabled={clearing}
          >
            {clearing ? (
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            )}
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: COLORS.danger }]}>
                {clearing ? "Clearing..." : "Clear All Tasks"}
              </Text>
              <Text style={styles.rowSubtitle}>
                Delete all tasks saved on this device
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textFaint}
            />
          </Pressable>
        </View>

        {/* About section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.cardRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.textMuted}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>TaskFlow</Text>
              <Text style={styles.rowSubtitle}>
                Minimalist To-Do App with Reminders
              </Text>
            </View>
            <Text style={styles.versionBadge}>v1.0.0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  inner: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  rowSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  versionBadge: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});