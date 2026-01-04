import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Coral
  '#AA96DA', // Purple
  '#FCBAD3', // Pink
  '#A8D8EA', // Light Blue
  '#FF9F43', // Orange
  '#2E7D32', // Green (brand)
];

interface ConfettiPieceProps {
  color: string;
  size: number;
  startX: number;
  delay: number;
  duration: number;
  index: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({
  color,
  size,
  startX,
  delay,
  duration,
  index,
}) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const horizontalMovement = (Math.random() - 0.5) * 150;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        // Scale in
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        // Fade in
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Fall down
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 100,
          duration: duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        // Horizontal sway
        Animated.timing(translateX, {
          toValue: startX + horizontalMovement,
          duration: duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        // Rotate
        Animated.timing(rotate, {
          toValue: Math.random() * 4 - 2, // -2 to 2 full rotations
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Fade out near the end
    Animated.sequence([
      Animated.delay(delay + duration - 500),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-2, 2],
    outputRange: ['-720deg', '720deg'],
  });

  // Different shapes based on index
  const isCircle = index % 3 === 0;
  const isRect = index % 3 === 1;
  const isDiamond = index % 3 === 2;

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: size,
          height: isRect ? size * 2 : size,
          backgroundColor: color,
          borderRadius: isCircle ? size / 2 : 2,
          transform: [
            { translateX },
            { translateY },
            { rotate: rotateInterpolate },
            { scale },
            ...(isDiamond ? [{ rotate: '45deg' }] : []),
          ],
          opacity,
        },
      ]}
    />
  );
};

interface ConfettiProps {
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({
  count = 50,
  duration = 3000,
  onComplete,
}) => {
  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, index) => ({
      index,
      delay: Math.random() * 500,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 6, // 6-14px
      startX: Math.random() * SCREEN_WIDTH,
      duration: duration + Math.random() * 1000,
    }));
  }, [count, duration]);

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration + 1500);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.index} {...piece} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
});

export default Confetti;
