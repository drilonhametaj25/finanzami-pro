import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  Text,
  Card,
  useTheme,
  IconButton,
  Button,
  ActivityIndicator,
  Chip,
  Divider,
  Searchbar,
  Portal,
  Modal,
  List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useEnableBankingStore } from '../../stores/enableBankingStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { spacing, brandColors } from '../../constants/theme';

// Feature flag - Enable Banking requires contract before launch
const ENABLE_BANKING_AVAILABLE = false;

const COUNTRIES = [
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'DE', name: 'Germania', flag: '🇩🇪' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'ES', name: 'Spagna', flag: '🇪🇸' },
  { code: 'NL', name: 'Paesi Bassi', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgio', flag: '🇧🇪' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'PT', name: 'Portogallo', flag: '🇵🇹' },
  { code: 'FI', name: 'Finlandia', flag: '🇫🇮' },
  { code: 'IE', name: 'Irlanda', flag: '🇮🇪' },
];

export default function ConnectedBanksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    success?: string;
    error?: string;
  }>();

  const { isPremium } = usePremiumStore();
  const { fetchTransactions } = useTransactionStore();
  const {
    connectedAccounts,
    sessions,
    availableBanks,
    syncStatus,
    lastSyncAt,
    lastSyncStats,
    error,
    isLoading,
    selectedCountry,
    fetchAvailableBanks,
    fetchConnectedAccounts,
    startConnection,
    syncAllAccounts,
    syncAccount,
    disconnectBank,
    setSelectedCountry,
    clearError,
    hasConnectedBanks,
    getActiveAccounts,
    getTotalBalance,
  } = useEnableBankingStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (params.success === 'true') {
      // Show success message - could use a snackbar
      fetchTransactions(); // Refresh transactions
    }
    if (params.error) {
      Alert.alert('Errore', params.error);
    }
  }, [params.success, params.error]);

  const loadData = async () => {
    await Promise.all([
      fetchConnectedAccounts(),
      fetchAvailableBanks(selectedCountry),
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConnectedAccounts(true); // Refresh balances
    setRefreshing(false);
  }, []);

  const handleCountrySelect = async (countryCode: string) => {
    setShowCountrySelector(false);
    setSelectedCountry(countryCode);
    await fetchAvailableBanks(countryCode);
    setShowBankSelector(true);
  };

  const handleBankSelect = async (bankName: string) => {
    setShowBankSelector(false);

    try {
      // Create the app's deep link URL for the callback
      // This URL will be passed to the Edge Function to use for the final redirect
      const appRedirectUrl = Linking.createURL('bank-callback');
      console.log('[BankConnection] App redirect URL:', appRedirectUrl);

      // Start connection with the app's redirect URL
      const url = await startConnection(bankName, selectedCountry, appRedirectUrl);

      // Use openAuthSessionAsync to handle OAuth flow with automatic return
      console.log('[BankConnection] Opening auth session:', url);

      const result = await WebBrowser.openAuthSessionAsync(url, appRedirectUrl);
      console.log('[BankConnection] Auth result:', result);

      if (result.type === 'success' && result.url) {
        // Parse the callback URL and navigate to handler
        const parsedUrl = new URL(result.url);
        const code = parsedUrl.searchParams.get('code');
        const state = parsedUrl.searchParams.get('state');
        const error = parsedUrl.searchParams.get('error');
        const errorDescription = parsedUrl.searchParams.get('error_description');

        if (error) {
          Alert.alert('Errore', errorDescription || error);
          return;
        }

        if (code && state) {
          // Navigate to bank-callback handler with params
          router.push({
            pathname: '/settings/bank-callback',
            params: { code, state },
          });
        }
      } else if (result.type === 'cancel') {
        console.log('[BankConnection] User cancelled auth flow');
      }
    } catch (err) {
      console.error('[BankConnection] Error:', err);
      Alert.alert(
        'Errore',
        err instanceof Error ? err.message : 'Impossibile avviare la connessione'
      );
    }
  };

  const handleSyncAll = async () => {
    try {
      await syncAllAccounts();
      await fetchTransactions(); // Refresh transactions in the store
      Alert.alert(
        'Sincronizzazione completata',
        lastSyncStats
          ? `Importate ${lastSyncStats.imported} nuove transazioni, aggiornate ${lastSyncStats.updated}`
          : 'Sincronizzazione completata'
      );
    } catch (err) {
      Alert.alert(
        'Errore',
        err instanceof Error ? err.message : 'Errore durante la sincronizzazione'
      );
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    setSyncingAccountId(accountId);
    try {
      const stats = await syncAccount(accountId);
      await fetchTransactions();
      Alert.alert(
        'Sincronizzazione completata',
        `Importate ${stats.imported} nuove transazioni, aggiornate ${stats.updated}`
      );
    } catch (err) {
      Alert.alert(
        'Errore',
        err instanceof Error ? err.message : 'Errore durante la sincronizzazione'
      );
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleDisconnect = (sessionId: string, bankName: string) => {
    Alert.alert(
      'Disconnetti banca',
      `Vuoi disconnettere ${bankName}? Puoi scegliere se mantenere o eliminare le transazioni sincronizzate.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Mantieni transazioni',
          onPress: () => disconnectBank(sessionId, false),
        },
        {
          text: 'Elimina transazioni',
          style: 'destructive',
          onPress: () => disconnectBank(sessionId, true),
        },
      ]
    );
  };

  const formatCurrency = (amount: number | null, currency = 'EUR') => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'authorized':
        return brandColors.success;
      case 'expired':
      case 'revoked':
        return brandColors.danger;
      case 'pending':
        return brandColors.warning;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'authorized':
        return 'Attivo';
      case 'expired':
        return 'Scaduto';
      case 'revoked':
        return 'Revocato';
      case 'pending':
        return 'In attesa';
      default:
        return status || 'Sconosciuto';
    }
  };

  const filteredBanks = availableBanks.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  const activeAccounts = getActiveAccounts();
  const totalBalance = getTotalBalance();
  const selectedCountryData = COUNTRIES.find((c) => c.code === selectedCountry);

  // Feature not yet available - requires Enable Banking contract
  if (!ENABLE_BANKING_AVAILABLE) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Banche Collegate
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.premiumRequired}>
          <View style={[styles.iconContainer, { backgroundColor: brandColors.primary + '20' }]}>
            <MaterialCommunityIcons name="bank-transfer" size={64} color={brandColors.primary} />
          </View>
          <Text variant="headlineSmall" style={styles.premiumTitle}>
            Prossimamente
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.premiumDescription, { color: theme.colors.onSurfaceVariant }]}
          >
            La sincronizzazione bancaria automatica sarà disponibile a breve.
            Potrai collegare i tuoi conti e importare le transazioni automaticamente!
          </Text>
          <Chip icon="clock-outline" style={{ marginTop: spacing.md }}>
            In arrivo
          </Chip>
        </View>
      </SafeAreaView>
    );
  }

  // Premium check
  if (!isPremium) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Banche Collegate
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.premiumRequired}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFD70020' }]}>
            <MaterialCommunityIcons name="crown" size={64} color="#FFD700" />
          </View>
          <Text variant="headlineSmall" style={styles.premiumTitle}>
            Funzionalità Premium
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.premiumDescription, { color: theme.colors.onSurfaceVariant }]}
          >
            La sincronizzazione bancaria automatica è disponibile solo per gli utenti Premium.
            Collega i tuoi conti per importare le transazioni automaticamente!
          </Text>
          <Button
            mode="contained"
            icon="crown"
            onPress={() => router.push('/premium')}
            style={styles.premiumButton}
          >
            Passa a Premium
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Banche Collegate
        </Text>
        <IconButton
          icon="plus"
          onPress={() => setShowCountrySelector(true)}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Card */}
        {hasConnectedBanks() && (
          <Card style={styles.summaryCard}>
            <Card.Content>
              <View style={styles.summaryRow}>
                <View>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Saldo totale conti collegati
                  </Text>
                  <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalBalance)}
                  </Text>
                </View>
                <View style={styles.summaryStats}>
                  <Chip
                    icon="bank"
                    compact
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                  >
                    {activeAccounts.length} {activeAccounts.length === 1 ? 'conto' : 'conti'}
                  </Chip>
                </View>
              </View>

              {lastSyncAt && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.sm }}>
                  Ultimo aggiornamento: {formatDate(lastSyncAt.toISOString())}
                </Text>
              )}

              <Button
                mode="contained"
                icon="sync"
                onPress={handleSyncAll}
                loading={syncStatus === 'syncing'}
                disabled={syncStatus === 'syncing' || activeAccounts.length === 0}
                style={styles.syncAllButton}
              >
                Sincronizza tutti
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card style={[styles.errorCard, { backgroundColor: brandColors.danger + '20' }]}>
            <Card.Content style={styles.errorContent}>
              <MaterialCommunityIcons name="alert-circle" size={24} color={brandColors.danger} />
              <Text variant="bodyMedium" style={{ flex: 1 }}>{error}</Text>
              <IconButton icon="close" size={20} onPress={clearError} />
            </Card.Content>
          </Card>
        )}

        {/* Connected Accounts */}
        {isLoading && connectedAccounts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text variant="bodyMedium" style={{ marginTop: spacing.md }}>
              Caricamento conti...
            </Text>
          </View>
        ) : connectedAccounts.length > 0 ? (
          <View style={styles.accountsSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Conti collegati
            </Text>

            {connectedAccounts.map((account) => (
              <Card key={account.id} style={styles.accountCard}>
                <Card.Content>
                  <View style={styles.accountHeader}>
                    <View style={styles.accountInfo}>
                      <View style={[styles.bankIcon, { backgroundColor: brandColors.primary + '20' }]}>
                        <MaterialCommunityIcons name="bank" size={24} color={brandColors.primary} />
                      </View>
                      <View style={styles.accountDetails}>
                        <Text variant="titleSmall" numberOfLines={1}>
                          {account.name || account.bank_name || 'Conto bancario'}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {account.iban || account.bban || 'IBAN non disponibile'}
                        </Text>
                      </View>
                    </View>
                    <Chip
                      compact
                      style={{ backgroundColor: getStatusColor(account.session_status) + '20' }}
                      textStyle={{ color: getStatusColor(account.session_status) }}
                    >
                      {getStatusLabel(account.session_status)}
                    </Chip>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.balanceRow}>
                    <View>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Saldo disponibile
                      </Text>
                      <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                        {formatCurrency(account.balance, account.currency)}
                      </Text>
                    </View>
                    <View>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Ultima sync
                      </Text>
                      <Text variant="bodyMedium">
                        {formatDate(account.last_sync_at)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.accountActions}>
                    <Button
                      mode="outlined"
                      icon="sync"
                      onPress={() => handleSyncAccount(account.id)}
                      loading={syncingAccountId === account.id}
                      disabled={syncingAccountId !== null || account.session_status !== 'authorized'}
                      compact
                    >
                      Sincronizza
                    </Button>
                    <Button
                      mode="text"
                      textColor={brandColors.danger}
                      onPress={() => {
                        const session = sessions.find(
                          (s) => s.valid_until === account.session_valid_until
                        );
                        if (session) {
                          handleDisconnect(session.id, account.bank_name || 'questa banca');
                        }
                      }}
                      compact
                    >
                      Disconnetti
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={[styles.iconContainer, { backgroundColor: brandColors.primary + '15' }]}>
              <MaterialCommunityIcons
                name="bank-transfer"
                size={64}
                color={brandColors.primary}
              />
            </View>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              Nessun conto collegato
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              Collega il tuo conto bancario per importare automaticamente
              le transazioni e tenere traccia delle tue spese.
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => setShowCountrySelector(true)}
              style={styles.addButton}
            >
              Collega una banca
            </Button>
          </View>
        )}

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <MaterialCommunityIcons
            name="shield-check"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
          >
            I tuoi dati sono protetti con crittografia di livello bancario.
            Utilizziamo connessioni certificate PSD2 tramite Enable Banking.
          </Text>
        </View>
      </ScrollView>

      {/* Country Selector Modal */}
      <Portal>
        <Modal
          visible={showCountrySelector}
          onDismiss={() => setShowCountrySelector(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Seleziona il paese della tua banca
          </Text>
          <ScrollView style={styles.countryList}>
            {COUNTRIES.map((country) => (
              <List.Item
                key={country.code}
                title={country.name}
                left={() => <Text style={styles.flag}>{country.flag}</Text>}
                onPress={() => handleCountrySelect(country.code)}
                style={styles.countryItem}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Bank Selector Modal */}
      <Portal>
        <Modal
          visible={showBankSelector}
          onDismiss={() => setShowBankSelector(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Seleziona la tua banca
            </Text>
            <Chip icon="map-marker" compact>
              {selectedCountryData?.flag} {selectedCountryData?.name}
            </Chip>
          </View>

          <Searchbar
            placeholder="Cerca banca..."
            value={bankSearchQuery}
            onChangeText={setBankSearchQuery}
            style={styles.searchbar}
          />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text variant="bodyMedium" style={{ marginTop: spacing.md }}>
                Caricamento banche...
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.bankList}>
              {filteredBanks.map((bank) => (
                <List.Item
                  key={bank.name}
                  title={bank.name}
                  description={bank.bic || undefined}
                  left={() => (
                    <View style={[styles.bankListIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                      <MaterialCommunityIcons
                        name="bank"
                        size={24}
                        color={theme.colors.primary}
                      />
                    </View>
                  )}
                  onPress={() => handleBankSelect(bank.name)}
                  style={styles.bankItem}
                />
              ))}
              {filteredBanks.length === 0 && (
                <Text
                  variant="bodyMedium"
                  style={{ textAlign: 'center', padding: spacing.lg, color: theme.colors.onSurfaceVariant }}
                >
                  Nessuna banca trovata
                </Text>
              )}
            </ScrollView>
          )}

          <Button
            mode="text"
            onPress={() => {
              setShowBankSelector(false);
              setShowCountrySelector(true);
            }}
            style={styles.changeCountryButton}
          >
            Cambia paese
          </Button>
        </Modal>
      </Portal>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    marginBottom: spacing.lg,
    borderRadius: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryStats: {
    alignItems: 'flex-end',
  },
  syncAllButton: {
    marginTop: spacing.md,
  },
  errorCard: {
    marginBottom: spacing.lg,
    borderRadius: 12,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  accountsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  accountCard: {
    marginBottom: spacing.md,
    borderRadius: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  accountDetails: {
    flex: 1,
  },
  divider: {
    marginVertical: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  accountActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  addButton: {
    marginTop: spacing.md,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  premiumRequired: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  premiumTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  premiumDescription: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  premiumButton: {
    marginTop: spacing.md,
  },
  modalContent: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  searchbar: {
    marginBottom: spacing.md,
  },
  countryList: {
    maxHeight: 400,
  },
  countryItem: {
    paddingVertical: spacing.sm,
  },
  flag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  bankList: {
    maxHeight: 400,
  },
  bankItem: {
    paddingVertical: spacing.xs,
  },
  bankListIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeCountryButton: {
    marginTop: spacing.md,
  },
});
