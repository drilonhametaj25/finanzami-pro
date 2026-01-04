import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Animated, Easing } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Confetti } from './Confetti';
import { spacing, brandColors } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type CelebrationType = 'achievement' | 'goal' | 'levelup';

export interface CelebrationData {
  type: CelebrationType;
  title: string;
  subtitle: string;
  description?: string;
  icon: string;
  iconColor: string;
  xpReward?: number;
  newLevel?: number;
}

interface CelebrationModalProps {
  visible: boolean;
  data: CelebrationData | null;
  onDismiss: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  data,
  onDismiss,
}) => {
  const theme = useTheme();

  // Animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(-30)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && data) {
      // Reset values
      backdropOpacity.setValue(0);
      cardScale.setValue(0);
      cardOpacity.setValue(0);
      iconScale.setValue(0);
      iconRotation.setValue(-30);
      textOpacity.setValue(0);
      buttonOpacity.setValue(0);

      // Animate backdrop
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Animate card
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(cardScale, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Animate icon
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.spring(iconScale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(iconRotation, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Animate text
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate button
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, data]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const rotateInterpolate = iconRotation.interpolate({
    inputRange: [-30, 0],
    outputRange: ['-30deg', '0deg'],
  });

  if (!visible || !data) return null;

  const getTypeLabel = () => {
    switch (data.type) {
      case 'achievement':
        return 'Nuovo Traguardo!';
      case 'goal':
        return 'Obiettivo Raggiunto!';
      case 'levelup':
        return 'Livello Aumentato!';
      default:
        return 'Congratulazioni!';
    }
  };

  const getTypeIcon = () => {
    switch (data.type) {
      case 'achievement':
        return 'trophy';
      case 'goal':
        return 'flag-checkered';
      case 'levelup':
        return 'arrow-up-circle';
      default:
        return 'star';
    }
  };

  return (
    <View style={styles.container}>
      {/* Confetti */}
      <Confetti count={60} duration={3500} />

      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleDismiss}
        />
      </Animated.View>

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface },
          {
            transform: [{ scale: cardScale }],
            opacity: cardOpacity,
          },
        ]}
      >
        {/* Glow effect */}
        <View style={[styles.glow, { backgroundColor: data.iconColor + '30' }]} />

        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: data.iconColor + '20' }]}>
          <MaterialCommunityIcons
            name={getTypeIcon() as keyof typeof MaterialCommunityIcons.glyphMap}
            size={16}
            color={data.iconColor}
          />
          <Text style={[styles.typeLabel, { color: data.iconColor }]}>
            {getTypeLabel()}
          </Text>
        </View>

        {/* Main Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: iconScale },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: data.iconColor + '20' }]}>
            <View style={[styles.iconInnerCircle, { backgroundColor: data.iconColor + '30' }]}>
              <MaterialCommunityIcons
                name={data.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={56}
                color={data.iconColor}
              />
            </View>
          </View>
        </Animated.View>

        {/* Text Content */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text variant="headlineSmall" style={styles.title}>
            {data.title}
          </Text>
          <Text
            variant="titleMedium"
            style={[styles.subtitle, { color: data.iconColor }]}
          >
            {data.subtitle}
          </Text>
          {data.description && (
            <Text
              variant="bodyMedium"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            >
              {data.description}
            </Text>
          )}

          {/* XP Reward */}
          {data.xpReward && (
            <View style={[styles.xpBadge, { backgroundColor: brandColors.warning + '20' }]}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={20}
                color={brandColors.warning}
              />
              <Text style={[styles.xpText, { color: brandColors.warning }]}>
                +{data.xpReward} XP
              </Text>
            </View>
          )}

          {/* Level Up Badge */}
          {data.newLevel && (
            <View style={[styles.levelBadge, { backgroundColor: brandColors.primary + '20' }]}>
              <MaterialCommunityIcons
                name="shield-star"
                size={24}
                color={brandColors.primary}
              />
              <Text style={[styles.levelText, { color: brandColors.primary }]}>
                Livello {data.newLevel}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Button */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
          <Button
            mode="contained"
            onPress={handleDismiss}
            style={[styles.button, { backgroundColor: data.iconColor }]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Fantastico!
          </Button>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  card: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 360,
    borderRadius: 24,
    padding: spacing.lg,
    alignItems: 'center',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInnerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CelebrationModal;
