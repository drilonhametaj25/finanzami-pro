import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { spacing, borderRadius, shadows, brandColors } from '../../constants/theme';

export type GradientVariant = 'primary' | 'success' | 'warning' | 'info' | 'dark';

interface GradientCardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: string;
  variant?: GradientVariant;
  onPress?: () => void;
  style?: ViewStyle;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
}

const gradientColors: Record<GradientVariant, [string, string]> = {
  primary: [brandColors.gradientStart, brandColors.gradientEnd],
  success: ['#66BB6A', '#43A047'],
  warning: ['#FFB74D', '#FF9800'],
  info: ['#4FC3F7', '#29B6F6'],
  dark: ['#424242', '#212121'],
};

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  variant = 'primary',
  onPress,
  style,
  rightElement,
  fullWidth = true,
}) => {
  const theme = useTheme();
  const colors = gradientColors[variant];

  const CardContent = () => (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradient,
        fullWidth ? styles.fullWidth : styles.autoWidth,
        style,
      ]}
    >
      <View style={styles.content}>
        {(icon || title || subtitle) && (
          <View style={styles.header}>
            {icon && (
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={28}
                  color="#FFFFFF"
                />
              </View>
            )}
            <View style={styles.textContainer}>
              {title && (
                <Text variant="titleMedium" style={styles.title}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text variant="bodySmall" style={styles.subtitle}>
                  {subtitle}
                </Text>
              )}
            </View>
            {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
          </View>
        )}
        {children}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
      >
        <CardContent />
      </Pressable>
    );
  }

  return <CardContent />;
};

// Variante compatta per statistiche
interface GradientStatCardProps {
  label: string;
  value: string;
  icon?: string;
  variant?: GradientVariant;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
}

export const GradientStatCard: React.FC<GradientStatCardProps> = ({
  label,
  value,
  icon,
  variant = 'primary',
  trend,
  trendValue,
  onPress,
}) => {
  const colors = gradientColors[variant];

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'minus';
    }
  };

  const Content = () => (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statGradient}
    >
      <View style={styles.statContent}>
        {icon && (
          <View style={styles.statIconContainer}>
            <MaterialCommunityIcons
              name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={20}
              color="rgba(255, 255, 255, 0.9)"
            />
          </View>
        )}
        <Text variant="labelMedium" style={styles.statLabel}>
          {label}
        </Text>
        <Text variant="headlineSmall" style={styles.statValue}>
          {value}
        </Text>
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <MaterialCommunityIcons
              name={getTrendIcon()}
              size={14}
              color="rgba(255, 255, 255, 0.8)"
            />
            <Text variant="labelSmall" style={styles.trendValue}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.statPressable,
          pressed && styles.pressed,
        ]}
      >
        <Content />
      </Pressable>
    );
  }

  return <Content />;
};

// Card con bordo gradiente
interface GradientBorderCardProps {
  children: React.ReactNode;
  variant?: GradientVariant;
  style?: ViewStyle;
  onPress?: () => void;
}

export const GradientBorderCard: React.FC<GradientBorderCardProps> = ({
  children,
  variant = 'primary',
  style,
  onPress,
}) => {
  const theme = useTheme();
  const colors = gradientColors[variant];

  const Content = () => (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.borderGradient}
    >
      <View style={[styles.borderInner, { backgroundColor: theme.colors.surface }, style]}>
        {children}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Content />
      </Pressable>
    );
  }

  return <Content />;
};

const styles = StyleSheet.create({
  pressable: {
    borderRadius: borderRadius.lg,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  gradient: {
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  fullWidth: {
    width: '100%',
  },
  autoWidth: {
    alignSelf: 'flex-start',
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  rightElement: {
    marginLeft: spacing.md,
  },
  // Stat card styles
  statPressable: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  statGradient: {
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statContent: {
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  statValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  trendValue: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Border card styles
  borderGradient: {
    borderRadius: borderRadius.lg,
    padding: 2,
    ...shadows.sm,
  },
  borderInner: {
    borderRadius: borderRadius.lg - 2,
    padding: spacing.lg,
  },
});

export default GradientCard;
