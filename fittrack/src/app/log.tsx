/**
 * Log Activity Screen (Route: /log)
 * Form interface allowing users to input step counts, workout type, duration in minutes, and date.
 * Performs strict validation before persisting to AsyncStorage and returning to Dashboard.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { usesStepMetric, WORKOUT_TYPES, WorkoutType } from '../types/activity';
import { saveActivity } from '../services/storage';
import { formatDateToKey, formatDisplayDate } from '../services/activityUtils';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function LogActivityScreen() {
  const router = useRouter();

  // Form state fields
  const [steps, setSteps] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [workoutType, setWorkoutType] = useState<WorkoutType | ''>('');
  const [duration, setDuration] = useState<string>('');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(formatDateToKey(new Date()));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Quick date selector presets
  const todayKey = formatDateToKey(new Date());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = formatDateToKey(yesterdayDate);

  const getWorkoutIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'Walking':
        return 'walk';
      case 'Running':
        return 'fitness';
      case 'Cycling':
        return 'bicycle';
      case 'Gym':
        return 'barbell';
      case 'Swimming':
        return 'water';
      default:
        return 'body';
    }
  };

  /**
   * Input validation handler
   */
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!workoutType) {
      newErrors.workoutType = 'Please select a workout type.';
    } else if (usesStepMetric(workoutType)) {
      const parsedSteps = parseInt(steps, 10);
      if (!steps || isNaN(parsedSteps) || parsedSteps <= 0) {
        newErrors.steps = 'Please enter a valid step count greater than 0.';
      }
    } else {
      const parsedCalories = parseInt(calories, 10);
      if (!calories || isNaN(parsedCalories) || parsedCalories <= 0) {
        newErrors.calories = 'Please enter valid calories greater than 0.';
      }
    }

    // Validate Duration
    const parsedDuration = parseFloat(duration);
    if (!duration || isNaN(parsedDuration) || parsedDuration <= 0) {
      newErrors.duration = 'Please enter a valid duration in minutes greater than 0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Save Activity Submission handler
   */
  const handleSaveActivity = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await saveActivity({
        steps: usesStepMetric(workoutType as WorkoutType) ? parseInt(steps, 10) : null,
        calories: usesStepMetric(workoutType as WorkoutType) ? null : parseInt(calories, 10),
        workoutType: workoutType as string,
        duration: parseFloat(duration),
        date: selectedDateKey,
      });

      Alert.alert('Success', 'Activity saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form and navigate to Dashboard
            setSteps('');
            setCalories('');
            setWorkoutType('');
            setDuration('');
            router.push('/');
          },
        },
      ]);
    } catch (err) {
      console.error('Failed to save activity:', err);
      Alert.alert('Error', 'Unable to save activity record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Go Back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={TYPOGRAPHY.headerTitle}>Log Activity</Text>
              <Text style={TYPOGRAPHY.headerSubtitle}>Record your workout and its relevant metric</Text>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formCard}>
            {/* 1. Activity Metric Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {workoutType && !usesStepMetric(workoutType) ? 'Calories Burned' : 'Steps'}{' '}
                <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  (errors.steps || errors.calories) && styles.inputErrorBorder,
                ]}
              >
                <Ionicons
                  name={workoutType && !usesStepMetric(workoutType) ? 'flame-outline' : 'footsteps-outline'}
                  size={20}
                  color={COLORS.accentSteps}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    workoutType && !usesStepMetric(workoutType)
                      ? 'Enter calories burned'
                      : 'Select a workout type, then enter steps'
                  }
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={workoutType && !usesStepMetric(workoutType) ? calories : steps}
                  onChangeText={(val) => {
                    if (workoutType && !usesStepMetric(workoutType)) {
                      setCalories(val);
                      if (errors.calories) setErrors((prev) => ({ ...prev, calories: '' }));
                    } else {
                      setSteps(val);
                      if (errors.steps) setErrors((prev) => ({ ...prev, steps: '' }));
                    }
                  }}
                  maxLength={6}
                />
              </View>
              {errors.steps ? <Text style={styles.errorText}>{errors.steps}</Text> : null}
              {errors.calories ? <Text style={styles.errorText}>{errors.calories}</Text> : null}
            </View>

            {/* 2. Workout Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Workout Type <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.workoutGrid}>
                {WORKOUT_TYPES.map((type) => {
                  const isSelected = workoutType === type;
                  const icon = getWorkoutIcon(type);

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.workoutChip, isSelected && styles.workoutChipSelected]}
                      onPress={() => {
                        setWorkoutType(type);
                        setSteps('');
                        setCalories('');
                        setErrors((prev) => ({ ...prev, steps: '', calories: '' }));
                        if (errors.workoutType) setErrors((prev) => ({ ...prev, workoutType: '' }));
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={icon}
                        size={18}
                        color={isSelected ? COLORS.surface : COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.workoutChipText,
                          isSelected && styles.workoutChipTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.workoutType ? (
                <Text style={styles.errorText}>{errors.workoutType}</Text>
              ) : null}
            </View>

            {/* 3. Duration Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Duration (minutes) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, errors.duration && styles.inputErrorBorder]}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={COLORS.accentDuration}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Duration in minutes"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={(val) => {
                    setDuration(val);
                    if (errors.duration) setErrors((prev) => ({ ...prev, duration: '' }));
                  }}
                  maxLength={4}
                />
              </View>
              {errors.duration ? <Text style={styles.errorText}>{errors.duration}</Text> : null}
            </View>

            {/* 4. Date Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Activity Date</Text>
              <View style={styles.datePresetRow}>
                <TouchableOpacity
                  style={[
                    styles.datePresetButton,
                    selectedDateKey === todayKey && styles.datePresetActive,
                  ]}
                  onPress={() => setSelectedDateKey(todayKey)}
                >
                  <Text
                    style={[
                      styles.datePresetText,
                      selectedDateKey === todayKey && styles.datePresetActiveText,
                    ]}
                  >
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.datePresetButton,
                    selectedDateKey === yesterdayKey && styles.datePresetActive,
                  ]}
                  onPress={() => setSelectedDateKey(yesterdayKey)}
                >
                  <Text
                    style={[
                      styles.datePresetText,
                      selectedDateKey === yesterdayKey && styles.datePresetActiveText,
                    ]}
                  >
                    Yesterday
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.selectedDateBadge}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <Text style={styles.selectedDateText}>
                  Selected Date: {formatDisplayDate(selectedDateKey)}
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={handleSaveActivity}
              disabled={isSubmitting}
              activeOpacity={0.8}
              accessibilityLabel="Save Activity"
              accessibilityRole="button"
            >
              <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.surface} />
              <Text style={styles.saveButtonText}>
                {isSubmitting ? 'Saving Activity...' : 'Save Activity'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  requiredStar: {
    color: COLORS.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  inputErrorBorder: {
    borderColor: COLORS.danger,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  workoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
  workoutChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  workoutChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  workoutChipTextSelected: {
    color: COLORS.surface,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  datePresetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  datePresetButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePresetActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  datePresetText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  datePresetActiveText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  selectedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
  },
  selectedDateText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    ...SHADOWS.medium,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
