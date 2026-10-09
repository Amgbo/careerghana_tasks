import { useState } from "react";
import {
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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  addLocalTask,
  updateLocalTask,
  LocalTask,
} from "../../services/storage";
import { scheduleTaskReminder } from "../../services/notifications";

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

export default function CreateTaskScreen() {
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const [showIosPicker, setShowIosPicker] = useState(false);
  const [iosPickerMode, setIosPickerMode] = useState<"date" | "time">("date");
  const [draftDate, setDraftDate] = useState<Date>(nextHour());

  const [saving, setSaving] = useState(false);

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

  /* ---------- Submit Handler ---------- */
  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a task title.");
      return;
    }

    try {
      setSaving(true);

      const formattedDueDate = dueDate ? dueDate.toISOString() : null;
      const localId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      const newTask: LocalTask = {
        id: localId,
        title: title.trim(),
        description: description.trim() || null,
        completed: false,
        due_date: formattedDueDate,
        notification_id: null,
        created_at: now,
        updated_at: now,
      };

      await addLocalTask(newTask);

      if (dueDate && dueDate.getTime() > Date.now()) {
        const notificationId = await scheduleTaskReminder(
          newTask.title,
          dueDate
        );

        if (notificationId) {
          await updateLocalTask(newTask.id, {
            notification_id: notificationId,
          });
        }
      }

      router.back();
    } catch (error) {
      console.error("Create task error:", error);
      Alert.alert("Error", "Could not create task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
          {/* Task Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Task title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task title"
              placeholderTextColor={COLORS.textFaint}
              value={title}
              onChangeText={setTitle}
              autoFocus
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

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              saving && styles.disabledButton,
              pressed && styles.saveButtonPressed,
            ]}
            onPress={handleCreateTask}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save Task"}
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
  },
  saveButtonPressed: {
    backgroundColor: COLORS.primaryHover,
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