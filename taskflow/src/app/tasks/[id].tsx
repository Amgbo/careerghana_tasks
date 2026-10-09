import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  deleteLocalTask,
  getLocalTasks,
  updateLocalTask,
  LocalTask,
} from "../../services/storage";
import {
  cancelTaskReminder,
  scheduleTaskReminder,
} from "../../services/notifications";

/* ---------- Colors ---------- */
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
  danger: "#EF4444",
  dangerSoft: "#FEF2F2",
  success: "#10B981",
};

const formatDateOnly = (date: Date | null) => {
  if (!date) return "Select date";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTimeOnly = (date: Date | null) => {
  if (!date) return "Select time";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const nextHour = () => {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
};

const daysFromNow = (days: number, base: Date | null) => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  if (base) {
    date.setHours(base.getHours(), base.getMinutes(), 0, 0);
  } else {
    date.setHours(17, 0, 0, 0);
  }

  return date;
};

export default function TaskDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [task, setTask] = useState<LocalTask | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const [showIosPicker, setShowIosPicker] = useState(false);
  const [iosPickerMode, setIosPickerMode] = useState<"date" | "time">("date");
  const [draftDate, setDraftDate] = useState<Date>(nextHour());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      if (!id) {
        Alert.alert("Error", "Task ID is missing.");
        router.back();
        return;
      }

      setLoading(true);
      const tasks = await getLocalTasks();
      const data = tasks.find((t: LocalTask) => t.id === id);

      if (!data) {
        Alert.alert("Task not found", "This task could not be found.");
        router.back();
        return;
      }

      setTask(data);
      setTitle(data.title);
      setDescription(data.description ?? "");
      setDueDate(data.due_date ? new Date(data.due_date) : null);
    } catch (error) {
      console.error("Failed to load local task:", error);
      Alert.alert("Error", "Could not load task.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Date & Time Picker Handlers ---------- */
  const openPicker = (mode: "date" | "time") => {
    Keyboard.dismiss();
    const base = dueDate ?? nextHour();
    setDraftDate(base);

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: base,
        mode: mode,
        is24Hour: false,
        onChange: (event, selectedDate) => {
          if (event.type !== "set" || !selectedDate) return;

          const updated = new Date(dueDate ?? nextHour());
          if (mode === "date") {
            updated.setFullYear(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate()
            );
          } else {
            updated.setHours(
              selectedDate.getHours(),
              selectedDate.getMinutes(),
              0,
              0
            );
          }
          setDueDate(updated);
        },
      });
    } else {
      setIosPickerMode(mode);
      setShowIosPicker(true);
    }
  };

  const confirmIosPicker = () => {
    const updated = new Date(dueDate ?? nextHour());
    if (iosPickerMode === "date") {
      updated.setFullYear(
        draftDate.getFullYear(),
        draftDate.getMonth(),
        draftDate.getDate()
      );
    } else {
      updated.setHours(
        draftDate.getHours(),
        draftDate.getMinutes(),
        0,
        0
      );
    }
    setDueDate(updated);
    setShowIosPicker(false);
  };

  /* ---------- Actions ---------- */
  const handleSave = async () => {
    if (!task) return;

    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a task title.");
      return;
    }

    try {
      setSaving(true);

      await cancelTaskReminder(task.notification_id);
      let notificationId: string | null = null;

      if (dueDate && dueDate.getTime() > Date.now() && !task.completed) {
        notificationId = await scheduleTaskReminder(title.trim(), dueDate);
      }

      const updatedTask = await updateLocalTask(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate ? dueDate.toISOString() : null,
        notification_id: notificationId,
      });

      if (!updatedTask) {
        Alert.alert("Error", "Could not update task.");
        return;
      }

      setTask(updatedTask);
      router.back();
    } catch (error) {
      console.error("Update task error:", error);
      Alert.alert("Error", "Could not save task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    try {
      if (!task) return;

      const willBeCompleted = !task.completed;
      let notificationId: string | null = null;

      if (willBeCompleted) {
        await cancelTaskReminder(task.notification_id);
      } else if (dueDate && dueDate.getTime() > Date.now()) {
        notificationId = await scheduleTaskReminder(task.title, dueDate);
      }

      const updatedTask = await updateLocalTask(task.id, {
        completed: willBeCompleted,
        notification_id: notificationId,
      });

      if (updatedTask) {
        setTask(updatedTask);
      }
    } catch (error) {
      console.error("Toggle task error:", error);
      Alert.alert("Error", "Could not update task status.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete task?",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteTask,
        },
      ]
    );
  };

  const deleteTask = async () => {
    try {
      if (!task) return;

      setDeleting(true);
      await cancelTaskReminder(task.notification_id);
      await deleteLocalTask(task.id);
      router.back();
    } catch (error) {
      console.error("Delete task error:", error);
      Alert.alert("Error", "Could not delete task.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (!task) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 30 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {/* Status Bar */}
          <Pressable
            style={({ pressed }) => [
              styles.statusCard,
              task.completed && styles.statusCardCompleted,
              pressed && styles.pressed,
            ]}
            onPress={handleToggleComplete}
          >
            <Ionicons
              name={task.completed ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={task.completed ? COLORS.success : COLORS.textMuted}
            />
            <Text
              style={[
                styles.statusText,
                task.completed && styles.statusTextCompleted,
              ]}
            >
              {task.completed ? "Task Completed" : "Mark as completed"}
            </Text>
          </Pressable>

          {/* Task Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Task title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task title"
              placeholderTextColor={COLORS.textFaint}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.optionalText}>Optional</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional description"
              placeholderTextColor={COLORS.textFaint}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Reminder / Date & Time */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Reminder</Text>
              {dueDate && (
                <Pressable onPress={() => setDueDate(null)} hitSlop={8}>
                  <Text style={styles.clearText}>Remove</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.pickerRow}>
              {/* Date Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.pickerButton,
                  dueDate && styles.pickerButtonActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => openPicker("date")}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={dueDate ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.pickerButtonText,
                    dueDate && styles.pickerButtonTextActive,
                  ]}
                >
                  {formatDateOnly(dueDate)}
                </Text>
              </Pressable>

              {/* Time Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.pickerButton,
                  dueDate && styles.pickerButtonActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => openPicker("time")}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={dueDate ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.pickerButtonText,
                    dueDate && styles.pickerButtonTextActive,
                  ]}
                >
                  {formatTimeOnly(dueDate)}
                </Text>
              </Pressable>
            </View>

            {/* Quick Date Chips */}
            <View style={styles.chipRow}>
              <Pressable
                style={styles.chip}
                onPress={() => setDueDate(daysFromNow(0, dueDate))}
              >
                <Text style={styles.chipText}>Today</Text>
              </Pressable>
              <Pressable
                style={styles.chip}
                onPress={() => setDueDate(daysFromNow(1, dueDate))}
              >
                <Text style={styles.chipText}>Tomorrow</Text>
              </Pressable>
              <Pressable
                style={styles.chip}
                onPress={() => setDueDate(daysFromNow(7, dueDate))}
              >
                <Text style={styles.chipText}>Next week</Text>
              </Pressable>
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              saving && styles.disabledButton,
              pressed && styles.saveButtonPressed,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>

          {/* Delete Button */}
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              deleting && styles.disabledButton,
              pressed && styles.pressed,
            ]}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.deleteButtonText}>
              {deleting ? "Deleting..." : "Delete Task"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* iOS Modal Picker */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showIosPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowIosPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.backdrop}
              onPress={() => setShowIosPicker(false)}
            />
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setShowIosPicker(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </Pressable>
                <Text style={styles.modalTitle}>
                  {iosPickerMode === "date" ? "Select Date" : "Select Time"}
                </Text>
                <Pressable onPress={confirmIosPicker}>
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={draftDate}
                mode={iosPickerMode}
                display="spinner"
                themeVariant="light"
                textColor="#000000"
                onChange={(_event, selected) => {
                  if (selected) setDraftDate(selected);
                }}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
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
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  statusCardCompleted: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  statusTextCompleted: {
    color: COLORS.success,
    fontWeight: "600",
  },
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  optionalText: {
    fontSize: 12,
    color: COLORS.textFaint,
  },
  clearText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: "500",
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 80,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 10,
  },
  pickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  pickerButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  pickerButtonText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  pickerButtonTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  saveButtonPressed: {
    backgroundColor: COLORS.primaryHover,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  /* iOS Modal */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  modalCancel: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  modalDone: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  iosPicker: {
    height: 200,
    backgroundColor: "#FFFFFF",
  },
});