/**
 * ActivityCard Component
 * Displays a logged fitness activity entry in the History screen with a delete action.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../types/activity';
import { formatDisplayDate } from '../services/activityUtils';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface ActivityCardProps {
  activity: Activity;
  onDelete: (id: string) => void;
}

/**
 * Returns an appropriate icon name based on workout type.
 */
const getWorkoutIcon = (workoutType: string): keyof typeof Ionicons.glyphMap => {
  const normalized = workoutType.toLowerCase();
  if (normalized.includes('walk')) return 'walk';
  if (normalized.includes('run')) return 'fitness';
  if (normalized.includes('cycl') || normalized.includes('bike')) return 'bicycle';
  if (normalized.includes('gym') || normalized.includes('weight')) return 'barbell';
  if (normalized.includes('swim')) return 'water';
  return 'body';
};

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onDelete }) => {
  const handleDeletePress = () => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete this ${activity.workoutType} activity record?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(activity.id),
        },
      ],
      { cancelable: true }
    );
  };

  const iconName = getWorkoutIcon(activity.workoutType);
  const formattedDate = formatDisplayDate(activity.date);

  return (
    <View style={styles.card}>
      <View style={styles.leftColumn}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={22} color={COLORS.primary} />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricBadge}>
              <Ionicons
                name={activity.steps !== null ? 'footsteps' : 'flame'}
                size={14}
                color={COLORS.accentSteps}
              />
              <Text style={styles.metricText}>
                {activity.steps !== null ? (
                  <>
                    <Text style={styles.metricBold}>{activity.steps.toLocaleString()}</Text> steps
                  </>
                ) : activity.calories !== null ? (
                  <>
                    <Text style={styles.metricBold}>{activity.calories.toLocaleString()}</Text>{' '}
                    calories
                  </>
                ) : (
                  'Calories not recorded'
                )}
              </Text>
            </View>

            <View style={styles.metricBadge}>
              <Ionicons name="fitness" size={14} color={COLORS.accentWorkout} />
              <Text style={styles.metricText}>{activity.workoutType}</Text>
            </View>

            <View style={styles.metricBadge}>
              <Ionicons name="time" size={14} color={COLORS.accentDuration} />
              <Text style={styles.metricText}>
                <Text style={styles.metricBold}>{activity.duration}</Text> min
              </Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeletePress}
        activeOpacity={0.7}
        accessibilityLabel={`Delete ${activity.workoutType} activity from ${formattedDate}`}
        accessibilityRole="button"
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  detailsContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  metricText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metricBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
});
