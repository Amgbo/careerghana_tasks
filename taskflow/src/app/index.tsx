import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getLocalTasks,
  updateLocalTask,
  deleteLocalTask,
  LocalTask,
} from "../services/storage";
import {
  cancelTaskReminder,
  scheduleTaskReminder,
} from "../services/notifications";

/* ---------- Color System ---------- */
const COLORS = {
  background: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  textFaint: "#9CA3AF",
  border: "#E5E7EB",
  primary: "#4F46E5",
  primaryHover: "#4338CA",
  primarySoft: "#EEF2FF",
  success: "#10B981",
  danger: "#EF4444",
};

/* ---------- Helpers ---------- */
const formatDueDate = (dueDate: string): string => {
  const date = new Date(dueDate);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeString = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (date.getTime() < now.getTime()) {
    return `Overdue · ${timeString}`;
  }

  if (taskDay.getTime() === today.getTime()) {
    return `Today · ${timeString}`;
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (taskDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow · ${timeString}`;
  }

  return `${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })} · ${timeString}`;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = async () => {
    try {
      const localTasks = await getLocalTasks();
      setTasks(localTasks);
    } catch (error) {
      console.error("Failed to load local tasks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleToggle = async (id: string) => {
    try {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const willBeCompleted = !task.completed;
      let notificationId: string | null = null;

      if (willBeCompleted) {
        await cancelTaskReminder(task.notification_id);
      } else if (task.due_date && new Date(task.due_date).getTime() > Date.now()) {
        notificationId = await scheduleTaskReminder(
          task.title,
          new Date(task.due_date)
        );
      }

      const updatedTask = await updateLocalTask(id, {
        completed: willBeCompleted,
        notification_id: notificationId,
      });

      if (!updatedTask) return;

      setTasks((current) =>
        current.map((t) => (t.id === id ? updatedTask : t))
      );
    } catch (error) {
      console.error("Failed to update task:", error);
      Alert.alert("Error", "Could not update task.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete task?",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(id),
        },
      ]
    );
  };

  const confirmDelete = async (id: string) => {
    try {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        await cancelTaskReminder(task.notification_id);
      }

      const deleted = await deleteLocalTask(id);
      if (deleted) {
        setTasks((current) => current.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      Alert.alert("Error", "Could not delete task.");
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 90 },
        ]}
      >
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.appTitle}>TaskFlow</Text>
              <Text style={styles.subtitle}>Stay organized. Get things done.</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push("/settings")}
              hitSlop={8}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={COLORS.textMuted}
              />
            </Pressable>
          </View>

          {/* Simple Today Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Today</Text>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryBold}>{pendingTasks.length}</Text> Pending
              {"  ·  "}
              <Text style={styles.summaryBold}>{completedTasks.length}</Text> Completed
            </Text>
          </View>

          {/* Pending Tasks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending</Text>

            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={({ pressed }) => [
                    styles.taskCard,
                    pressed && styles.taskCardPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/tasks/[id]",
                      params: { id: task.id },
                    })
                  }
                >
                  {/* Checkbox */}
                  <Pressable
                    style={styles.checkbox}
                    onPress={() => handleToggle(task.id)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="ellipse-outline"
                      size={20}
                      color={COLORS.textFaint}
                    />
                  </Pressable>

                  {/* Task details */}
                  <View style={styles.taskBody}>
                    <Text style={styles.taskTitle}>{task.title}</Text>

                    {!!task.description && (
                      <Text style={styles.taskDescription} numberOfLines={1}>
                        {task.description}
                      </Text>
                    )}

                    {!!task.due_date && (
                      <View style={styles.reminderRow}>
                        <Ionicons
                          name="notifications-outline"
                          size={13}
                          color={
                            new Date(task.due_date).getTime() < Date.now()
                              ? COLORS.danger
                              : COLORS.textMuted
                          }
                        />
                        <Text
                          style={[
                            styles.reminderText,
                            new Date(task.due_date).getTime() < Date.now() &&
                              styles.overdueText,
                          ]}
                        >
                          {formatDueDate(task.due_date)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Delete action */}
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleDelete(task.id)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={COLORS.textFaint}
                    />
                  </Pressable>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No pending tasks</Text>
                <Text style={styles.emptySubtitle}>
                  You're all caught up for today!
                </Text>
              </View>
            )}
          </View>

          {/* Completed Tasks (Only shown if completed tasks exist) */}
          {completedTasks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completed</Text>

              {completedTasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={({ pressed }) => [
                    styles.taskCard,
                    styles.completedCard,
                    pressed && styles.taskCardPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/tasks/[id]",
                      params: { id: task.id },
                    })
                  }
                >
                  {/* Checked Box */}
                  <Pressable
                    style={styles.checkbox}
                    onPress={() => handleToggle(task.id)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={COLORS.success}
                    />
                  </Pressable>

                  {/* Task details */}
                  <View style={styles.taskBody}>
                    <Text style={[styles.taskTitle, styles.completedTitle]}>
                      {task.title}
                    </Text>
                    <Text style={styles.completedSubtext}>Completed</Text>
                  </View>

                  {/* Delete action */}
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleDelete(task.id)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={COLORS.textFaint}
                    />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}

          {/* Empty state when zero total tasks exist */}
          {tasks.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No tasks yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Add your first task to get started.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Task Button */}
      <View
        style={[
          styles.fabContainer,
          { bottom: Math.max(insets.bottom + 16, 20) },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={() => router.push("/tasks/create")}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Task</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 16,
  },
  inner: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  /* Header */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  /* Today Summary */
  summaryContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  summaryBold: {
    fontWeight: "700",
    color: COLORS.text,
  },
  /* Sections */
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  /* Task Cards */
  taskCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  taskCardPressed: {
    backgroundColor: "#F3F4F6",
  },
  checkbox: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  taskDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  reminderText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  overdueText: {
    color: COLORS.danger,
    fontWeight: "600",
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
  },
  /* Completed Task */
  completedCard: {
    opacity: 0.6,
  },
  completedTitle: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted,
  },
  completedSubtext: {
    fontSize: 12,
    color: COLORS.textFaint,
    marginTop: 2,
  },
  /* Empty States */
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  /* Floating Add Button */
  fabContainer: {
    position: "absolute",
    right: 20,
    alignSelf: "flex-end",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fabPressed: {
    backgroundColor: COLORS.primaryHover,
    opacity: 0.9,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});