/**
 * Dashboard Screen (Route: /)
 * Displays application header, today's aggregated activity summary, weekly progress chart,
 * and quick action navigation.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Activity, DailyChartData, TodaySummary } from '../types/activity';
import { getActivities } from '../services/storage';
import { calculateTodaySummary, getWeeklyStepData } from '../services/activityUtils';
import { StatCard } from '../components/StatCard';
import { WeeklyChart } from '../components/WeeklyChart';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load activities from AsyncStorage
  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      const data = await getActivities();
      setActivities(data);
    } catch (err) {
      setErrorMsg('Unable to load your activities. Please try again.');
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Reload activity data whenever the dashboard comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const todaySummary: TodaySummary = calculateTodaySummary(activities);
  const weeklyChartData: DailyChartData[] = getWeeklyStepData(activities);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Application Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={TYPOGRAPHY.headerTitle}>Fitness Tracker</Text>
            <Text style={TYPOGRAPHY.headerSubtitle}>
              Track your activity. Build better habits.
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="flame" size={24} color={COLORS.primary} />
          </View>
        </View>

        {/* Loading Indicator State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your fitness data...</Text>
          </View>
        ) : (
          <>
            {/* Error banner if storage error occurred */}
            {errorMsg ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Today's Activity Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Activity</Text>
                <Text style={styles.dateSubtitle}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              {todaySummary.hasActivity ? (
                <View style={styles.statsRow}>
                  {todaySummary.totalSteps > 0 ? (
                    <StatCard
                      title="Steps"
                      value={todaySummary.totalSteps.toLocaleString()}
                      iconName="footsteps"
                      accentColor={COLORS.accentSteps}
                    />
                  ) : null}
                  {todaySummary.totalCalories > 0 ? (
                    <StatCard
                      title="Calories"
                      value={todaySummary.totalCalories.toLocaleString()}
                      iconName="flame"
                      accentColor={COLORS.accentWorkout}
                    />
                  ) : null}
                  <StatCard
                    title="Workout"
                    value={todaySummary.workoutSummary}
                    iconName="fitness"
                    accentColor={COLORS.accentWorkout}
                  />
                  <StatCard
                    title="Duration"
                    value={`${todaySummary.totalDuration}`}
                    unit="min"
                    iconName="time"
                    accentColor={COLORS.accentDuration}
                  />
                </View>
              ) : (
                <View style={styles.emptyTodayCard}>
                  <Ionicons name="calendar-outline" size={32} color={COLORS.textMuted} />
                  <Text style={styles.emptyTodayTitle}>No activity logged today.</Text>
                  <Text style={styles.emptyTodaySubtitle}>
                    Log your steps and workouts to track your daily progress.
                  </Text>
                </View>
              )}
            </View>

            {/* Weekly Progress Chart */}
            <WeeklyChart data={weeklyChartData} />

            {/* Quick Action Navigation */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/log')}
                activeOpacity={0.8}
                accessibilityLabel="Log Activity"
                accessibilityRole="button"
              >
                <Ionicons name="add-circle-outline" size={22} color={COLORS.surface} />
                <Text style={styles.primaryButtonText}>Log Activity</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/history')}
                activeOpacity={0.8}
                accessibilityLabel="View History"
                accessibilityRole="button"
              >
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>View Activity History</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  emptyTodayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  emptyTodayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptyTodaySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  actionContainer: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    ...SHADOWS.medium,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
