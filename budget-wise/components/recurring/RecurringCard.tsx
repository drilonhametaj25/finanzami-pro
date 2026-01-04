import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO, isPast, isToday, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

import { RecurringTransaction, Category } from '../../types/database';
import { formatCurrency } from '../../constants/currencies';
import { spacing, brandColors } from '../../constants/theme';

interface RecurringCardProps {
  recurring: RecurringTransaction;
  category?: Category;
  currency: string;
  onPress?: () => void;
  onMarkAsPaid?: () => void;
}

const frequencyLabels: Record<string, string> = {
  monthly: 'Mensile',
  quarterly: 'Trimestrale',
  yearly: 'Annuale',
};

export function RecurringCard({
  recurring,
  category,
  currency,
  onPress,
  onMarkAsPaid,
}: RecurringCardProps) {
  const theme = useTheme();

  const nextDate = parseISO(recurring.next_date);
  const isOverdue = isPast(nextDate) && !isToday(nextDate);
  const isDueToday = isToday(nextDate);
  const daysUntil = differenceInDays(nextDate, new Date());

  const getStatusColor = () => {
    if (isOverdue) return brandColors.error;
    if (isDueToday) return brandColors.warning;
    if (daysUntil <= 3) return brandColors.warning;
    return theme.colors.onSurfaceVariant;
  };

  const getStatusText = () => {
    if (isOverdue) return `Scaduta da ${Math.abs(daysUntil)} giorni`;
    if (isDueToday) return 'Scade oggi';
    if (daysUntil === 1) return 'Scade domani';
    if (daysUntil <= 7) return `Tra ${daysUntil} giorni`;
    return format(nextDate, 'd MMM yyyy', { locale: it });
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.colors.surface },
        pressed && styles.pressed,
        isOverdue && styles.overdue,
      ]}
    >
      {/* Category Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: (category?.color || '#757575') + '20' },
        ]}
      >
        <MaterialCommunityIcons
          name={(category?.icon || 'repeat') as keyof typeof MaterialCommunityIcons.glyphMap}
          size={24}
          color={category?.color || '#757575'}
        />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text variant="bodyLarge" numberOfLines={1} style={styles.description}>
          {recurring.description || category?.name || 'Spesa ricorrente'}
        </Text>
        <View style={styles.metaRow}>
          <Chip compact style={styles.frequencyChip}>
            {frequencyLabels[recurring.frequency] || recurring.frequency}
          </Chip>
          <Text
            variant="bodySmall"
            style={{ color: getStatusColor() }}
          >
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Amount and Actions */}
      <View style={styles.rightSection}>
        <Text variant="titleMedium" style={{ color: brandColors.error }}>
          -{formatCurrency(recurring.amount, currency)}
        </Text>

        {(isOverdue || isDueToday) && onMarkAsPaid && (
          <IconButton
            icon="check-circle"
            size={24}
            iconColor={brandColors.success}
            onPress={(e) => {
              e.stopPropagation?.();
              onMarkAsPaid();
            }}
            style={styles.payButton}
          />
        )}
      </View>

      {/* Overdue indicator */}
      {isOverdue && (
        <View style={[styles.overdueIndicator, { backgroundColor: brandColors.error }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.7,
  },
  overdue: {
    borderWidth: 1,
    borderColor: brandColors.error + '40',
  },
  overdueIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  description: {
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  frequencyChip: {
    height: 24,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  payButton: {
    margin: 0,
  },
});
