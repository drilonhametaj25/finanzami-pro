import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Chip, IconButton, Avatar, ProgressBar, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

import { SharedExpenseParticipant } from '../../types/database';
import { formatCurrency } from '../../constants/currencies';
import { spacing, brandColors } from '../../constants/theme';

interface CreditCardProps {
  participant: SharedExpenseParticipant;
  currency: string;
  description?: string;
  onPress?: () => void;
  onMarkPaid?: () => void;
  onSendReminder?: () => void;
}

export function CreditCard({
  participant,
  currency,
  description,
  onPress,
  onMarkPaid,
  onSendReminder,
}: CreditCardProps) {
  const theme = useTheme();

  const createdDate = parseISO(participant.created_at);
  const daysSinceCreated = differenceInDays(new Date(), createdDate);
  const isPaid = participant.is_paid;

  const getUrgencyLevel = () => {
    if (isPaid) return 'paid';
    if (daysSinceCreated > 30) return 'critical';
    if (daysSinceCreated > 14) return 'warning';
    return 'normal';
  };

  const getUrgencyColor = () => {
    const level = getUrgencyLevel();
    switch (level) {
      case 'paid': return brandColors.success;
      case 'critical': return brandColors.error;
      case 'warning': return brandColors.warning;
      default: return theme.colors.primary;
    }
  };

  const getAgeText = () => {
    if (isPaid) {
      return participant.paid_at
        ? `Pagato il ${format(parseISO(participant.paid_at), 'd MMM', { locale: it })}`
        : 'Pagato';
    }
    if (daysSinceCreated === 0) return 'Oggi';
    if (daysSinceCreated === 1) return 'Ieri';
    if (daysSinceCreated < 7) return `${daysSinceCreated} giorni fa`;
    if (daysSinceCreated < 30) return `${Math.floor(daysSinceCreated / 7)} settimane fa`;
    return `${Math.floor(daysSinceCreated / 30)} mesi fa`;
  };

  // Get initials for avatar
  const initials = participant.participant_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const urgencyColor = getUrgencyColor();
  const urgencyLevel = getUrgencyLevel();

  return (
    <Surface
      style={[
        styles.container,
        { borderLeftColor: urgencyColor },
        isPaid && styles.paidContainer,
      ]}
      elevation={isPaid ? 0 : 1}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.innerContainer,
          pressed && styles.pressed,
        ]}
      >
        {/* Left Section: Avatar + Details */}
        <View style={styles.leftSection}>
          <Avatar.Text
            size={52}
            label={initials}
            style={{
              backgroundColor: isPaid
                ? brandColors.success + '20'
                : urgencyColor + '20',
            }}
            labelStyle={{
              color: isPaid ? brandColors.success : urgencyColor,
              fontWeight: 'bold',
            }}
          />

          <View style={styles.details}>
            <Text
              variant="titleSmall"
              numberOfLines={1}
              style={[styles.name, isPaid && styles.paidText]}
            >
              {participant.participant_name}
            </Text>
            {description && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
                numberOfLines={1}
              >
                {description}
              </Text>
            )}
            <View style={styles.ageRow}>
              <MaterialCommunityIcons
                name={isPaid ? 'check-circle' : 'clock-outline'}
                size={14}
                color={urgencyColor}
              />
              <Text variant="labelSmall" style={{ color: urgencyColor, marginLeft: 4 }}>
                {getAgeText()}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Section: Amount + Actions */}
        <View style={styles.rightSection}>
          <Text
            variant="titleLarge"
            style={[
              styles.amount,
              { color: isPaid ? brandColors.success : urgencyColor },
              isPaid && styles.paidText,
            ]}
          >
            {formatCurrency(participant.amount_owed, currency)}
          </Text>

          {!isPaid && (
            <View style={styles.actions}>
              {urgencyLevel === 'critical' && onSendReminder && (
                <IconButton
                  icon="message-text-outline"
                  size={20}
                  iconColor={brandColors.warning}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onSendReminder();
                  }}
                  style={styles.actionButton}
                />
              )}
              {onMarkPaid && (
                <IconButton
                  icon="check-circle-outline"
                  size={24}
                  iconColor={brandColors.success}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onMarkPaid();
                  }}
                  style={styles.actionButton}
                />
              )}
            </View>
          )}

          {isPaid && (
            <View style={styles.paidBadge}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={brandColors.success}
              />
              <Text variant="labelSmall" style={{ color: brandColors.success, marginLeft: 4 }}>
                Saldato
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Surface>
  );
}

interface PersonCreditCardProps {
  name: string;
  totalOwed: number;
  creditCount: number;
  oldestDays?: number;
  currency: string;
  onPress?: () => void;
}

export function PersonCreditCard({
  name,
  totalOwed,
  creditCount,
  oldestDays = 0,
  currency,
  onPress,
}: PersonCreditCardProps) {
  const theme = useTheme();

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasPendingCredits = totalOwed > 0;

  const getUrgencyColor = () => {
    if (!hasPendingCredits) return brandColors.success;
    if (oldestDays > 30) return brandColors.error;
    if (oldestDays > 14) return brandColors.warning;
    return theme.colors.primary;
  };

  const urgencyColor = getUrgencyColor();

  return (
    <Surface
      style={[
        styles.personContainer,
        { borderLeftColor: hasPendingCredits ? urgencyColor : brandColors.success },
      ]}
      elevation={1}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.personInnerContainer,
          pressed && styles.pressed,
        ]}
      >
        {/* Avatar */}
        <Avatar.Text
          size={56}
          label={initials}
          style={{ backgroundColor: urgencyColor + '20' }}
          labelStyle={{ color: urgencyColor, fontWeight: 'bold' }}
        />

        {/* Details */}
        <View style={styles.personDetails}>
          <Text variant="titleMedium" numberOfLines={1} style={{ fontWeight: '600' }}>
            {name}
          </Text>
          <View style={styles.personStats}>
            <View style={styles.personStat}>
              <MaterialCommunityIcons
                name="receipt"
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                {creditCount} {creditCount === 1 ? 'credito' : 'crediti'}
              </Text>
            </View>
            {hasPendingCredits && oldestDays > 0 && (
              <View style={styles.personStat}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color={urgencyColor}
                />
                <Text variant="labelSmall" style={{ color: urgencyColor, marginLeft: 4 }}>
                  {oldestDays}g
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.personAmountSection}>
          {hasPendingCredits ? (
            <View style={styles.personAmountBadge}>
              <Text variant="titleLarge" style={{ color: urgencyColor, fontWeight: 'bold' }}>
                {formatCurrency(totalOwed, currency)}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                da ricevere
              </Text>
            </View>
          ) : (
            <View style={[styles.paidBadge, { backgroundColor: brandColors.success + '15' }]}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={brandColors.success}
              />
              <Text variant="labelMedium" style={{ color: brandColors.success, marginLeft: 4 }}>
                Saldato
              </Text>
            </View>
          )}
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      </Pressable>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  paidContainer: {
    opacity: 0.7,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
  },
  paidText: {
    textDecorationLine: 'line-through',
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  amount: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // PersonCreditCard styles
  personContainer: {
    borderRadius: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  personInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  personDetails: {
    flex: 1,
    marginLeft: spacing.md,
    gap: 4,
  },
  personStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAmountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  personAmountBadge: {
    alignItems: 'flex-end',
  },
});
