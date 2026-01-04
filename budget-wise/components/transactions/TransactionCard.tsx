import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Transaction, Category } from '../../types/database';
import { formatCurrency } from '../../constants/currencies';
import { spacing, brandColors } from '../../constants/theme';

interface TransactionCardProps {
  transaction: Transaction;
  category?: Category;
  currency: string;
  onPress?: () => void;
}

export function TransactionCard({
  transaction,
  category,
  currency,
  onPress,
}: TransactionCardProps) {
  const theme = useTheme();

  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? brandColors.error : brandColors.success;
  const amountPrefix = isExpense ? '-' : '+';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.colors.surface },
        pressed && styles.pressed,
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
          name={(category?.icon || 'help-circle') as keyof typeof MaterialCommunityIcons.glyphMap}
          size={24}
          color={category?.color || '#757575'}
        />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text variant="bodyLarge" numberOfLines={1}>
          {transaction.description || category?.name || 'Transazione'}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
          numberOfLines={1}
        >
          {category?.name || 'Senza categoria'}
          {transaction.tags && transaction.tags.length > 0 && (
            <Text> · {transaction.tags.join(', ')}</Text>
          )}
        </Text>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text variant="titleMedium" style={{ color: amountColor }}>
          {amountPrefix}{formatCurrency(transaction.amount, currency)}
        </Text>
        {transaction.original_currency && transaction.original_currency !== currency && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {formatCurrency(transaction.original_amount || 0, transaction.original_currency)}
          </Text>
        )}
      </View>

      {/* Indicators */}
      {(transaction.is_recurring || transaction.is_shared) && (
        <View style={styles.indicators}>
          {transaction.is_recurring && (
            <MaterialCommunityIcons
              name="repeat"
              size={14}
              color={theme.colors.onSurfaceVariant}
            />
          )}
          {transaction.is_shared && (
            <MaterialCommunityIcons
              name="account-group"
              size={14}
              color={theme.colors.onSurfaceVariant}
            />
          )}
        </View>
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
  },
  pressed: {
    opacity: 0.7,
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
    gap: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  indicators: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: 4,
  },
});
