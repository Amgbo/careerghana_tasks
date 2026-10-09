/**
 * History Screen (Route: /history)
 * Displays chronological list of all saved fitness activity records with delete capabilities.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Activity } from '../types/activity';
import { getActivities, deleteActivity, clearActivities } from '../services/storage';
import { ActivityCard } from '../components/ActivityCard';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function HistoryScreen() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load activities from storage
  const fetchHistory = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const records = await getActivities();
      setActivities(records);
    } catch (err) {
      console.error('Error fetching history:', err);
      Alert.alert('Error', 'Unable to load activity history. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  // Delete single activity handler
  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteActivity(id);
      // Immediately refresh list
      setActivities((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete entry:', err);
      Alert.alert('Error', 'Unable to delete activity entry.');
    }
  };

  // Clear all history handler
  const handleClearAllHistory = () => {
    if (activities.length === 0) return;

    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all activity logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearActivities();
              setActivities([]);
            } catch (err) {
              console.error('Failed to clear history:', err);
              Alert.alert('Error', 'Unable to clear history records.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={TYPOGRAPHY.headerTitle}>Activity History</Text>
          <Text style={TYPOGRAPHY.headerSubtitle}>
            {activities.length > 0
              ? `${activities.length} activity record${activities.length === 1 ? '' : 's'} logged`
              : 'Past workout records and step logs'}
          </Text>
        </View>

        {activities.length > 0 ? (
          <TouchableOpacity
            style={styles.clearHeaderButton}
            onPress={handleClearAllHistory}
            accessibilityLabel="Clear all history"
            accessibilityRole="button"
          >
            <Ionicons name="trash-bin-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ActivityCard activity={item} onDelete={handleDeleteActivity} />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={isRefreshing}
          onRefresh={() => fetchHistory(true)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="fitness-outline" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No activities yet.</Text>
              <Text style={styles.emptySubtitle}>
                Start tracking your fitness by{'\n'}logging your first activity.
              </Text>
              <TouchableOpacity
                style={styles.logButton}
                onPress={() => router.push('/log')}
                activeOpacity={0.8}
                accessibilityLabel="Log Activity"
                accessibilityRole="button"
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.surface} />
                <Text style={styles.logButtonText}>Log Activity</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  clearHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  logButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    ...SHADOWS.medium,
  },
  logButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
});
