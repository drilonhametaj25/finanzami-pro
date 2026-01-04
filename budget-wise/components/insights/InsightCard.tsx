import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { InsightData } from '../../stores/insightStore';
import { InsightType } from '../../types';
import { spacing, brandColors } from '../../constants/theme';

interface InsightCardProps {
  insight: InsightData;
  onDismiss?: () => void;
  onMarkRead?: () => void;
  compact?: boolean;
}

const insightConfig: Record<
  InsightType,
  { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; label: string }
> = {
  budget_alert: {
    icon: 'alert-circle',
    color: brandColors.error,
    label: 'Budget',
  },
  budget_forecast: {
    icon: 'chart-timeline-variant',
    color: brandColors.warning,
    label: 'Previsione',
  },
  pattern_temporal: {
    icon: 'chart-areaspline',
    color: brandColors.primary,
    label: 'Pattern',
  },
  goal_progress: {
    icon: 'flag-checkered',
    color: brandColors.success,
    label: 'Obiettivo',
  },
  recurring_optimization: {
    icon: 'refresh',
    color: '#9C27B0',
    label: 'Ricorrenti',
  },
  credit_reminder: {
    icon: 'account-cash',
    color: '#FF9800',
    label: 'Crediti',
  },
  financial_health: {
    icon: 'heart-pulse',
    color: '#E91E63',
    label: 'Salute',
  },
  waste_detection: {
    icon: 'trash-can-outline',
    color: '#795548',
    label: 'Sprechi',
  },
  motivational: {
    icon: 'star',
    color: '#FFC107',
    label: 'Complimenti',
  },
  contextual: {
    icon: 'lightbulb-outline',
    color: '#00BCD4',
    label: 'Suggerimento',
  },
};

const priorityColors = {
  high: brandColors.error,
  medium: brandColors.warning,
  low: brandColors.success,
};

export function InsightCard({
  insight,
  onDismiss,
  onMarkRead,
  compact = false,
}: InsightCardProps) {
  const theme = useTheme();
  const router = useRouter();

  const config = insightConfig[insight.type];
  const priorityColor = priorityColors[insight.priority];

  const handleAction = () => {
    if (insight.action?.type === 'navigate' && insight.action.data?.screen) {
      const screen = insight.action.data.screen as string;
      switch (screen) {
        case 'stats':
          router.push('/(tabs)/stats');
          break;
        case 'shared':
          router.push('/shared');
          break;
        case 'recurring':
          router.push('/recurring');
          break;
        case 'goals':
          router.push('/(tabs)/goals');
          break;
        default:
          break;
      }
    }
    onMarkRead?.();
  };

  if (compact) {
    return (
      <Pressable
        onPress={handleAction}
        style={({ pressed }) => [
          styles.compactContainer,
          { backgroundColor: theme.colors.surface },
          pressed && styles.pressed,
          !insight.isRead && styles.unread,
        ]}
      >
        <View
          style={[
            styles.priorityIndicator,
            { backgroundColor: priorityColor },
          ]}
        />
        <View
          style={[
            styles.compactIconContainer,
            { backgroundColor: config.color + '20' },
          ]}
        >
          <MaterialCommunityIcons
            name={config.icon}
            size={20}
            color={config.color}
          />
        </View>
        <Text
          variant="bodyMedium"
          numberOfLines={2}
          style={styles.compactMessage}
        >
          {insight.message}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
        !insight.isRead && styles.unread,
      ]}
    >
      {/* Priority indicator */}
      <View
        style={[
          styles.priorityBar,
          { backgroundColor: priorityColor },
        ]}
      />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: config.color + '20' },
              ]}
            >
              <MaterialCommunityIcons
                name={config.icon}
                size={24}
                color={config.color}
              />
            </View>
            <View>
              <Text
                variant="labelSmall"
                style={{ color: config.color, fontWeight: 'bold' }}
              >
                {config.label.toUpperCase()}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {insight.priority === 'high'
                  ? 'Priorita alta'
                  : insight.priority === 'medium'
                  ? 'Priorita media'
                  : 'Informativo'}
              </Text>
            </View>
          </View>
          {onDismiss && (
            <IconButton
              icon="close"
              size={18}
              onPress={onDismiss}
              style={styles.dismissButton}
            />
          )}
        </View>

        {/* Message */}
        <Text variant="bodyLarge" style={styles.message}>
          {insight.message}
        </Text>

        {/* Action button */}
        {insight.action && (
          <View style={styles.actionContainer}>
            <Button
              mode="contained-tonal"
              onPress={handleAction}
              compact
              style={{ backgroundColor: config.color + '20' }}
              labelStyle={{ color: config.color }}
            >
              {insight.action.label}
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}

export function InsightBadge({ type }: { type: InsightType }) {
  const config = insightConfig[type];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.color + '20' },
      ]}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={14}
        color={config.color}
      />
      <Text
        variant="labelSmall"
        style={{ color: config.color, marginLeft: 4 }}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  unread: {
    borderWidth: 1,
    borderColor: brandColors.primary + '40',
  },
  priorityBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    margin: -8,
  },
  message: {
    lineHeight: 24,
  },
  actionContainer: {
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  compactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactMessage: {
    flex: 1,
  },
  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
});
