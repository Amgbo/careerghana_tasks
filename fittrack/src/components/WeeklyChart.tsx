/**
 * WeeklyChart Component
 * Visualizes current week's daily step counts (Mon-Sun) using a responsive bar layout.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyChartData } from '../types/activity';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface WeeklyChartProps {
  data: DailyChartData[];
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
  // Determine highest steps count for scaling bars (minimum baseline 5,000 steps)
  const maxStepsInWeek = Math.max(...data.map((d) => d.steps), 5000);
  const totalWeeklySteps = data.reduce((sum, d) => sum + d.steps, 0);
  const avgDailySteps = Math.round(totalWeeklySteps / 7);

  // Format step count for bar header display (e.g. 8.5k or 650)
  const formatBarValue = (steps: number): string => {
    if (steps === 0) return '0';
    if (steps >= 1000) return `${(steps / 1000).toFixed(1)}k`;
    return steps.toString();
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="bar-chart" size={20} color={COLORS.primary} />
          <Text style={styles.title}>Weekly Progress</Text>
        </View>
        <Text style={styles.totalBadge}>
          Total: <Text style={styles.totalBadgeValue}>{totalWeeklySteps.toLocaleString()}</Text> steps
        </Text>
      </View>

      <Text style={styles.subtitle}>
        Avg {avgDailySteps.toLocaleString()} steps / day this week
      </Text>

      {/* Chart container */}
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          // Calculate bar height percentage (minimum 6% for visual clarity if zero)
          const fillRatio = item.steps / maxStepsInWeek;
          const barHeightPercent = (item.steps > 0 ? Math.max(fillRatio * 100, 10) : 6) + '%';

          const isToday = item.isToday;

          return (
            <View key={`${item.day}-${index}`} style={styles.column}>
              {/* Value label above bar */}
              <Text style={[styles.barValueText, isToday && styles.todayBarValueText]}>
                {formatBarValue(item.steps)}
              </Text>

              {/* Bar track container */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: barHeightPercent as any },
                    isToday ? styles.todayBarFill : item.steps > 0 ? styles.activeBarFill : styles.emptyBarFill,
                  ]}
                />
              </View>

              {/* Day label underneath bar */}
              <View style={[styles.dayLabelContainer, isToday && styles.todayDayContainer]}>
                <Text style={[styles.dayText, isToday && styles.todayDayText]}>
                  {item.day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primaryMuted }]} />
          <Text style={styles.legendText}>Past Days</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.sm,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  totalBadge: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  totalBadgeValue: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  todayBarValueText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  barTrack: {
    width: 18,
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.full,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: RADIUS.full,
  },
  activeBarFill: {
    backgroundColor: COLORS.primaryMuted,
  },
  todayBarFill: {
    backgroundColor: COLORS.primary,
  },
  emptyBarFill: {
    backgroundColor: COLORS.border,
  },
  dayLabelContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  todayDayContainer: {
    backgroundColor: COLORS.primaryLight,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  todayDayText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSecondary,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
