/**
 * StatCard Component
 * Displays a fitness metric card with icon, title, value, and custom accent color.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  iconName,
  accentColor = COLORS.primary,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>
          <Ionicons name={iconName} size={20} color={accentColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text
          style={[styles.valueText, { color: COLORS.textPrimary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
        {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
    ...SHADOWS.small,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: SPACING.xs,
  },
  valueText: {
    fontSize: 20,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },
});
