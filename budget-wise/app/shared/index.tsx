import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Button,
  SegmentedButtons,
  Divider,
  ProgressBar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useSharedStore } from '../../stores/sharedStore';
import { useAuthStore } from '../../stores/authStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { PremiumGate } from '../../components/premium/PremiumGate';
import { CreditCard, PersonCreditCard } from '../../components/shared/CreditCard';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';
import { differenceInDays, parseISO } from 'date-fns';

type ViewMode = 'all' | 'byPerson' | 'history';

export default function SharedCreditsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { canUseFeature } = usePremiumStore();

  // Check if user can access shared expenses feature
  if (!canUseFeature('shared_expenses')) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
              </Pressable>
              <View style={styles.headerIconContainer}>
                <MaterialCommunityIcons name="account-cash" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text variant="titleLarge" style={styles.headerTitle}>
                  Crediti
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <PremiumGate feature="shared_expenses" showTeaser={false}>
          <View />
        </PremiumGate>
      </SafeAreaView>
    );
  }
  const {
    sharedExpenses,
    fetchSharedExpenses,
    markParticipantPaid,
    getCreditSummary,
    getPendingCredits,
    getCreditsGroupedByPerson,
    isLoading,
  } = useSharedStore();

  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  const currency = profile?.main_currency || 'EUR';

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

  const handleMarkPaid = (participantId: string, name: string) => {
    Alert.alert(
      'Conferma ricezione',
      `Confermi di aver ricevuto il pagamento da ${name}?`,
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

  const summary = getCreditSummary();
  const pendingCredits = getPendingCredits();
  const creditsByPerson = getCreditsGroupedByPerson();
  const paidCredits = sharedExpenses
    .flatMap((se) => se.participants)
    .filter((p) => p.is_paid);

  const renderAllCredits = () => (
    <>
      {pendingCredits.length > 0 ? (
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
            {pendingCredits.map((participant, index) => {
              const sharedExpense = sharedExpenses.find((se) =>
                se.participants.some((p) => p.id === participant.id)
              );
              return (
                <View key={participant.id}>
                  {index > 0 && <View style={{ height: spacing.sm }} />}
                  <CreditCard
                    participant={participant}
                    currency={currency}
                    description={sharedExpense?.transaction?.description || undefined}
                    onMarkPaid={() => handleMarkPaid(participant.id, participant.participant_name)}
                  />
                </View>
              );
            })}
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.sectionCard} mode="elevated">
          <Card.Content style={styles.emptySection}>
            <MaterialCommunityIcons
              name="check-circle"
              size={48}
              color={brandColors.success}
            />
            <Text variant="titleMedium" style={{ marginTop: spacing.md }}>
              Tutto saldato!
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              Non hai crediti in sospeso
            </Text>
          </Card.Content>
        </Card>
      )}
    </>
  );

  const renderByPerson = () => (
    <>
      {creditsByPerson.length > 0 ? (
        <Card style={styles.sectionCard} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account-group"
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="titleMedium">
                Per persona ({creditsByPerson.length})
              </Text>
            </View>
            {creditsByPerson.map((person, index) => {
              const pendingCredits = person.credits.filter((c) => !c.is_paid);
              const oldestDays = pendingCredits.length > 0
                ? Math.max(...pendingCredits.map((c) => differenceInDays(new Date(), parseISO(c.created_at))))
                : 0;
              return (
                <View key={person.name}>
                  {index > 0 && <View style={{ height: spacing.sm }} />}
                  <PersonCreditCard
                    name={person.name}
                    totalOwed={person.total}
                    creditCount={pendingCredits.length}
                    oldestDays={oldestDays}
                    currency={currency}
                    onPress={() =>
                      router.push(`/shared/person/${encodeURIComponent(person.name)}`)
                    }
                  />
                </View>
              );
            })}
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.sectionCard} mode="elevated">
          <Card.Content style={styles.emptySection}>
            <MaterialCommunityIcons
              name="account-off"
              size={48}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="titleMedium" style={{ marginTop: spacing.md }}>
              Nessun contatto
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              Aggiungi una spesa condivisa per iniziare
            </Text>
          </Card.Content>
        </Card>
      )}
    </>
  );

  const renderHistory = () => (
    <>
      {paidCredits.length > 0 ? (
        <Card style={styles.sectionCard} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="history"
                size={24}
                color={brandColors.success}
              />
              <Text variant="titleMedium">
                Ricevuti ({paidCredits.length})
              </Text>
            </View>
            {paidCredits.map((participant, index) => {
              const sharedExpense = sharedExpenses.find((se) =>
                se.participants.some((p) => p.id === participant.id)
              );
              return (
                <View key={participant.id}>
                  {index > 0 && <View style={{ height: spacing.sm }} />}
                  <CreditCard
                    participant={participant}
                    currency={currency}
                    description={sharedExpense?.transaction?.description || undefined}
                  />
                </View>
              );
            })}
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.sectionCard} mode="elevated">
          <Card.Content style={styles.emptySection}>
            <MaterialCommunityIcons
              name="history"
              size={48}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="titleMedium" style={{ marginTop: spacing.md }}>
              Nessuno storico
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              I crediti saldati appariranno qui
            </Text>
          </Card.Content>
        </Card>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="account-cash" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="titleLarge" style={styles.headerTitle}>
                Crediti
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                {formatCurrency(summary.totalPending, currency)} da ricevere
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <View style={styles.summaryMain}>
              <View style={styles.summaryHeader}>
                <MaterialCommunityIcons
                  name="wallet"
                  size={28}
                  color={brandColors.primary}
                />
                <Text variant="titleMedium" style={{ marginLeft: spacing.sm }}>
                  Riepilogo Crediti
                </Text>
              </View>
              <Text variant="displaySmall" style={[styles.summaryAmount, { color: brandColors.primary }]}>
                {formatCurrency(summary.totalPending, currency)}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                da ricevere
              </Text>
            </View>

            {/* Progress Bar */}
            {(summary.totalPaid + summary.totalPending) > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text variant="labelSmall" style={{ color: brandColors.success }}>
                    Ricevuti: {formatCurrency(summary.totalPaid, currency)}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {summary.totalPaid > 0
                      ? `${Math.round((summary.totalPaid / (summary.totalPaid + summary.totalPending)) * 100)}%`
                      : '0%'}
                  </Text>
                </View>
                <ProgressBar
                  progress={summary.totalPaid / (summary.totalPaid + summary.totalPending)}
                  color={brandColors.success}
                  style={styles.progressBar}
                />
              </View>
            )}

            <Divider style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {summary.participantCount}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Persone
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconBadge, { backgroundColor: brandColors.success + '20' }]}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={brandColors.success}
                  />
                </View>
                <Text variant="titleLarge" style={{ color: brandColors.success, fontWeight: 'bold' }}>
                  {paidCredits.length}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Saldati
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={[
                  styles.summaryIconBadge,
                  { backgroundColor: summary.oldestCreditDays > 30 ? brandColors.error + '20' : brandColors.warning + '20' },
                ]}>
                  <MaterialCommunityIcons
                    name="clock-alert-outline"
                    size={20}
                    color={summary.oldestCreditDays > 30 ? brandColors.error : brandColors.warning}
                  />
                </View>
                <Text
                  variant="titleLarge"
                  style={{
                    color: summary.oldestCreditDays > 30 ? brandColors.error : theme.colors.onSurface,
                    fontWeight: 'bold',
                  }}
                >
                  {summary.oldestCreditDays}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Giorni max
                </Text>
              </View>
            </View>

            {summary.oldestCreditDays > 30 && summary.totalPending > 0 && (
              <View style={[styles.alertBanner, { backgroundColor: brandColors.error + '10' }]}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color={brandColors.error}
                />
                <Text variant="bodySmall" style={{ flex: 1, color: brandColors.error }}>
                  Hai crediti in sospeso da piu di 30 giorni. Considera di inviare un promemoria.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* View Mode Selector */}
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            { value: 'all', label: 'Tutti' },
            { value: 'byPerson', label: 'Per persona' },
            { value: 'history', label: 'Storico' },
          ]}
          style={styles.viewSelector}
        />

        {/* Content based on view mode */}
        {viewMode === 'all' && renderAllCredits()}
        {viewMode === 'byPerson' && renderByPerson()}
        {viewMode === 'history' && renderHistory()}

        {/* Empty State for new users */}
        {sharedExpenses.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="account-cash"
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nessuna spesa condivisa
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
            >
              Quando dividi una spesa con amici, i crediti appariranno qui per tenerne traccia
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/shared/add')}
              style={styles.emptyButton}
            >
              Aggiungi spesa condivisa
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Gradient FAB */}
      <Pressable
        onPress={() => router.push('/shared/add')}
        style={({ pressed }) => [
          styles.fabPressable,
          pressed && styles.fabPressed,
        ]}
      >
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryMain: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryAmount: {
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  progressSection: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  summaryDivider: {
    marginVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  viewSelector: {
    marginBottom: spacing.md,
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
  emptySection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
  fabPressable: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
