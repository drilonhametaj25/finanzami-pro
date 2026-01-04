import React from 'react';
import { StyleSheet, Pressable, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { spacing, borderRadius, shadows, brandColors } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'success' | 'warning' | 'danger' | 'dark';
export type ButtonSize = 'small' | 'medium' | 'large';

interface GradientButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const gradientColors: Record<ButtonVariant, [string, string]> = {
  primary: [brandColors.gradientStart, brandColors.gradientEnd],
  success: ['#66BB6A', '#43A047'],
  warning: ['#FFB74D', '#FF9800'],
  danger: ['#EF5350', '#E53935'],
  dark: ['#616161', '#424242'],
};

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number; iconSize: number }> = {
  small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14, iconSize: 18 },
  medium: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16, iconSize: 20 },
  large: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18, iconSize: 24 },
};

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const colors = gradientColors[variant];
  const sizeStyle = sizeStyles[size];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.pressable,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <LinearGradient
        colors={isDisabled ? ['#9E9E9E', '#757575'] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          {
            paddingVertical: sizeStyle.paddingVertical,
            paddingHorizontal: sizeStyle.paddingHorizontal,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <MaterialCommunityIcons
                name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={sizeStyle.iconSize}
                color="#FFFFFF"
                style={styles.iconLeft}
              />
            )}
            <Text
              style={[
                styles.text,
                { fontSize: sizeStyle.fontSize },
                textStyle,
              ]}
            >
              {children}
            </Text>
            {icon && iconPosition === 'right' && (
              <MaterialCommunityIcons
                name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={sizeStyle.iconSize}
                color="#FFFFFF"
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
};

// Versione outline con bordo gradiente
interface GradientOutlineButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const GradientOutlineButton: React.FC<GradientOutlineButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) => {
  const colors = gradientColors[variant];
  const sizeStyle = sizeStyles[size];
  const textColor = colors[0];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.pressable,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <LinearGradient
        colors={isDisabled ? ['#9E9E9E', '#757575'] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.outlineGradient, style]}
      >
        <Pressable
          style={[
            styles.outlineInner,
            {
              paddingVertical: sizeStyle.paddingVertical - 2,
              paddingHorizontal: sizeStyle.paddingHorizontal - 2,
            },
          ]}
          onPress={onPress}
          disabled={isDisabled}
        >
          {loading ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <MaterialCommunityIcons
                  name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={sizeStyle.iconSize}
                  color={isDisabled ? '#9E9E9E' : textColor}
                  style={styles.iconLeft}
                />
              )}
              <Text
                style={[
                  styles.outlineText,
                  { fontSize: sizeStyle.fontSize, color: isDisabled ? '#9E9E9E' : textColor },
                ]}
              >
                {children}
              </Text>
              {icon && iconPosition === 'right' && (
                <MaterialCommunityIcons
                  name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={sizeStyle.iconSize}
                  color={isDisabled ? '#9E9E9E' : textColor}
                  style={styles.iconRight}
                />
              )}
            </>
          )}
        </Pressable>
      </LinearGradient>
    </Pressable>
  );
};

// FAB con gradiente
interface GradientFABProps {
  icon: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

const fabSizes = {
  small: { size: 40, iconSize: 20 },
  medium: { size: 56, iconSize: 24 },
  large: { size: 72, iconSize: 32 },
};

export const GradientFAB: React.FC<GradientFABProps> = ({
  icon,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
}) => {
  const colors = gradientColors[variant];
  const fabSize = fabSizes[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <LinearGradient
        colors={disabled ? ['#9E9E9E', '#757575'] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.fab,
          {
            width: fabSize.size,
            height: fabSize.size,
            borderRadius: fabSize.size / 2,
          },
          shadows.lg,
          style,
        ]}
      >
        <MaterialCommunityIcons
          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={fabSize.iconSize}
          color="#FFFFFF"
        />
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    borderRadius: borderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  // Outline styles
  outlineGradient: {
    borderRadius: borderRadius.lg,
    padding: 2,
  },
  outlineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg - 2,
  },
  outlineText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  // FAB styles
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GradientButton;
