import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  IconButton,
  Button,
  Divider,
  Avatar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useSharedStore } from '../../../stores/sharedStore';
import { useAuthStore } from '../../../stores/authStore';
import { CreditCard } from '../../../components/shared/CreditCard';
import { spacing, brandColors } from '../../../constants/theme';
import { formatCurrency } from '../../../constants/currencies';

export default function PersonDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const { profile } = useAuthStore();
  const {
    sharedExpenses,
    fetchSharedExpenses,
    markParticipantPaid,
    getCreditsGroupedByPerson,
    isLoading,
  } = useSharedStore();

  const [refreshing, setRefreshing] = useState(false);

  const currency = profile?.main_currency || 'EUR';
  const decodedName = decodeURIComponent(name || '');

  const loadData = useCallback(async () => {
    await fetchSharedExpenses();
  }, [fetchSharedExpenses]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Get credits for this specific person
  const creditsByPerson = getCreditsGroupedByPerson();
  const personData = creditsByPerson.find(
    (p) => p.name.toLowerCase() === decodedName.toLowerCase()
  );

  const pendingCredits = personData?.credits.filter((c) => !c.is_paid) || [];
  const paidCredits = personData?.credits.filter((c) => c.is_paid) || [];
  const totalPending = pendingCredits.reduce((sum, c) => sum + c.amount_owed, 0);
  const totalPaid = paidCredits.reduce((sum, c) => sum + c.amount_owed, 0);

  const handleMarkPaid = (participantId: string) => {
    Alert.alert(
      'Conferma ricezione',
      `Confermi di aver ricevuto il pagamento da ${decodedName}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Confermo',
          onPress: async () => {
            const { error } = await markParticipantPaid(participantId, true);
            if (error) {
              Alert.alert('Errore', error);
            }
          },
        },
      ]
    );
  };

  const handleMarkAllPaid = () => {
    if (pendingCredits.length === 0) return;

    Alert.alert(
      'Segna tutti come pagati',
      `Confermi di aver ricevuto ${formatCurrency(totalPending, currency)} da ${decodedName}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Confermo',
          onPress: async () => {
            for (const credit of pendingCredits) {
              await markParticipantPaid(credit.id, true);
            }
          },
        },
      ]
    );
  };

  // Get initials for avatar
  const initials = decodedName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getDescriptionForCredit = (participantId: string) => {
    const expense = sharedExpenses.find((se) =>
      se.participants.some((p) => p.id === participantId)
    );
    return expense?.transaction?.description;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
          {decodedName}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Person Summary Card */}
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <View style={styles.personHeader}>
              <Avatar.Text
                size={72}
                label={initials}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                labelStyle={{ color: theme.colors.primary, fontSize: 28 }}
              />
              <View style={styles.personInfo}>
                <Text variant="headlineSmall" style={styles.personName}>
                  {decodedName}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {pendingCredits.length + paidCredits.length} transazioni totali
                </Text>
              </View>
            </View>

            <Divider style={styles.summaryDivider} />

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: brandColors.primary }}>
                  {formatCurrency(totalPending, currency)}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Da ricevere
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: brandColors.success }}>
                  {formatCurrency(totalPaid, currency)}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Ricevuti
                </Text>
              </View>
            </View>

            {pendingCredits.length > 1 && (
              <Button
                mode="contained"
                onPress={handleMarkAllPaid}
                style={styles.markAllButton}
                icon="check-all"
              >
                Segna tutti come pagati
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Pending Credits */}
        {pendingCredits.length > 0 && (
          <Card style={styles.sectionCard} mode="elevated">
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={24}
                  color={brandColors.warning}
                />
                <Text variant="titleMedium">
                  Da ricevere ({pendingCredits.length})
                </Text>
              </View>
              {pendingCredits.map((credit, index) => (
                <View key={credit.id}>
                  {index > 0 && <View style={{ height: spacing.sm }} />}
                  <CreditCard
                    participant={credit}
                    currency={currency}
                    description={getDescriptionForCredit(credit.id)}
                    onMarkPaid={() => handleMarkPaid(credit.id)}
                  />
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Paid Credits */}
        {paidCredits.length > 0 && (
          <Card style={styles.sectionCard} mode="elevated">
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={brandColors.success}
                />
                <Text variant="titleMedium">
                  Ricevuti ({paidCredits.length})
                </Text>
              </View>
              {paidCredits.map((credit, index) => (
                <View key={credit.id}>
                  {index > 0 && <View style={{ height: spacing.sm }} />}
                  <CreditCard
                    participant={credit}
                    currency={currency}
                    description={getDescriptionForCredit(credit.id)}
                  />
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {pendingCredits.length === 0 && paidCredits.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-question"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="titleMedium" style={{ marginTop: spacing.md }}>
              Nessun credito trovato
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              Non ci sono crediti registrati per {decodedName}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontWeight: 'bold',
  },
  summaryDivider: {
    marginVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  markAllButton: {
    marginTop: spacing.lg,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
});
