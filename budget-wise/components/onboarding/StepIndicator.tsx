import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { spacing, brandColors } from '../../constants/theme';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  totalSteps,
  currentStep,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const isActive = index < currentStep;
        const isCurrent = index === currentStep - 1;

        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: isActive
                  ? brandColors.primary
                  : theme.colors.outlineVariant,
                width: isCurrent ? 24 : 8,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

export default StepIndicator;
