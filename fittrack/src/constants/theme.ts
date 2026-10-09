/**
 * Fitness Tracker Theme System
 * Defines colors, typography, spacing, shadows, and radii for consistent design.
 */

export const COLORS = {
  // Primary brand palette
  primary: '#2563EB',        // Electric Blue accent
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryMuted: '#DBEAFE',

  // Secondary accent colors for activity metrics
  accentSteps: '#2563EB',    // Steps accent (Blue)
  accentWorkout: '#10B981',  // Workout type accent (Emerald Green)
  accentDuration: '#F59E0B', // Duration accent (Amber)
  accentPurple: '#8B5CF6',

  // Surface and background colors
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',

  // Text hierarchy
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // UI state colors
  border: '#E2E8F0',
  borderDark: '#CBD5E1',
  success: '#10B981',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',

  // Tab bar styles
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#2563EB',
  tabBarInactive: '#94A3B8',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.textMuted,
  },
};
