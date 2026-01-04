import { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable, Linking } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  List,
  Switch,
  Divider,
  Button,
  Dialog,
  Portal,
  RadioButton,
  ActivityIndicator,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { generateAndSharePDF } from '../../services/pdfReport';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { formatCurrency, CURRENCIES, getCurrencyByCode } from '../../constants/currencies';
import { ThemeMode } from '../../types';

// Developer mode state (only in __DEV__)
const useDevMode = () => {
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [devPremium, setDevPremium] = useState(false);
  const [devSupporter, setDevSupporter] = useState(false);
  const tapCount = useRef(0);
  const lastTapTime = useRef(0);

  const handleVersionTap = () => {
    if (!__DEV__) return;

    const now = Date.now();
    if (now - lastTapTime.current > 1000) {
      tapCount.current = 0;
    }
    lastTapTime.current = now;
    tapCount.current += 1;

    if (tapCount.current === 7) {
      setDevModeEnabled(true);
      tapCount.current = 0;
      Alert.alert('Modalità Sviluppatore', 'Attivata! Scorri in basso per vedere le opzioni.');
    } else if (tapCount.current >= 4) {
      Alert.alert('Modalità Sviluppatore', `${7 - tapCount.current} tap rimasti...`);
    }
  };

  return {
    devModeEnabled,
    devPremium,
    setDevPremium,
    devSupporter,
    setDevSupporter,
    handleVersionTap,
  };
};

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, profile, signOut, updateProfile, isLoading } = useAuthStore();
  const { themeMode, setThemeMode } = useThemeStore();
  const { isPremium: storePremium, subscriptionType, isSupporter: storeSupporter, canUseFeature: storeCanUseFeature } = usePremiumStore();

  // Developer mode
  const { devModeEnabled, devPremium, setDevPremium, devSupporter, setDevSupporter, handleVersionTap } = useDevMode();

  // Override premium/supporter with dev values when in dev mode
  const isPremium = devModeEnabled ? devPremium : storePremium;
  const isSupporter = devModeEnabled ? devSupporter : storeSupporter;
  const canUseFeature = (feature: Parameters<typeof storeCanUseFeature>[0]) => {
    if (devModeEnabled && devPremium) return true;
    return storeCanUseFeature(feature);
  };

  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [budgetInput, setBudgetInput] = useState(
    profile?.monthly_budget?.toString() || ''
  );
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const currentCurrency = getCurrencyByCode(profile?.main_currency || 'EUR');

  const handleGenerateReport = async () => {
    if (!canUseFeature('annual_report')) {
      router.push('/premium');
      return;
    }

    if (!user?.id) {
      Alert.alert('Errore', 'Utente non trovato');
      return;
    }

    setIsGeneratingReport(true);
    const currentYear = new Date().getFullYear();
    const { error } = await generateAndSharePDF(user.id, currentYear);
    setIsGeneratingReport(false);

    if (error) {
      Alert.alert('Errore', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Conferma',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleUpdateBudget = async () => {
    const budget = parseFloat(budgetInput.replace(',', '.'));
    if (isNaN(budget) || budget < 0) {
      Alert.alert('Errore', 'Inserisci un importo valido');
      return;
    }

    await updateProfile({ monthly_budget: budget });
    setShowBudgetDialog(false);
  };

  const handleUpdateCurrency = async (currencyCode: string) => {
    await updateProfile({ main_currency: currencyCode });
    setShowCurrencyDialog(false);
  };

  const openBudgetDialog = () => {
    setBudgetInput(profile?.monthly_budget?.toString() || '');
    setShowBudgetDialog(true);
  };

  const getThemeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'Chiaro';
      case 'dark':
        return 'Scuro';
      case 'system':
        return 'Sistema';
    }
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Profilo
          </Text>
        </View>

        {/* Profile Card with Gradient */}
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCardGradient}
        >
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text variant="titleLarge" style={styles.profileName}>
                  {profile?.full_name || 'Utente'}
                </Text>
                {isPremium && (
                  <View style={styles.premiumBadgeWhite}>
                    <MaterialCommunityIcons name="crown" size={12} color="#FFD700" />
                    <Text style={styles.premiumBadgeTextWhite}>PRO</Text>
                  </View>
                )}
                {isSupporter && (
                  <View style={styles.supporterBadgeWhite}>
                    <MaterialCommunityIcons name="heart" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text variant="bodyMedium" style={styles.profileEmail}>
                {user?.email}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Premium Section with Gradient Border */}
        <Pressable onPress={() => router.push('/premium')}>
          <LinearGradient
            colors={isPremium ? [brandColors.gradientStart, brandColors.gradientEnd] : ['#FFD700', '#FFA000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.premiumCardBorder}
          >
            <View style={[styles.premiumCardInner, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.premiumCardLeft}>
                <View style={[styles.premiumIconContainer, { backgroundColor: isPremium ? brandColors.primary + '15' : '#FFD700' + '20' }]}>
                  <MaterialCommunityIcons
                    name="crown"
                    size={28}
                    color={isPremium ? brandColors.primary : '#FFD700'}
                  />
                </View>
                <View style={styles.premiumCardText}>
                  <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                    {isPremium ? 'FinanzaMi.pro Premium' : 'Passa a Premium'}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {isPremium
                      ? `Piano ${subscriptionType === 'yearly' ? 'Annuale' : 'Mensile'} attivo`
                      : 'Sblocca tutte le funzionalita'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Subscription Management - Only for Premium users */}
        {isPremium && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Abbonamento
              </Text>
              <List.Item
                title="Piano attivo"
                description={`Premium ${subscriptionType === 'yearly' ? 'Annuale' : 'Mensile'}`}
                left={(props) => (
                  <View style={[styles.listIconContainer, { backgroundColor: '#FFD700' + '20' }]}>
                    <MaterialCommunityIcons name="crown" size={20} color="#FFD700" />
                  </View>
                )}
                style={styles.listItem}
              />
              <Divider />
              <List.Item
                title="Gestisci abbonamento"
                description="Modifica o disdici il tuo piano"
                left={(props) => (
                  <View style={[styles.listIconContainer, { backgroundColor: brandColors.primary + '15' }]}>
                    <MaterialCommunityIcons name="cog" size={20} color={brandColors.primary} />
                  </View>
                )}
                right={(props) => <List.Icon {...props} icon="open-in-new" />}
                onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
                style={styles.listItem}
              />
            </Card.Content>
          </Card>
        )}

        {/* Budget Section */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Budget
            </Text>
            <List.Item
              title="Budget mensile"
              description={
                profile?.monthly_budget
                  ? formatCurrency(profile.monthly_budget, profile.main_currency || 'EUR')
                  : 'Non impostato'
              }
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: brandColors.primary + '15' }]}>
                  <MaterialCommunityIcons name="wallet" size={20} color={brandColors.primary} />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={openBudgetDialog}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Valuta principale"
              description={currentCurrency ? `${currentCurrency.name} (${currentCurrency.symbol})` : 'EUR'}
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: '#2196F3' + '15' }]}>
                  <MaterialCommunityIcons name="currency-eur" size={20} color="#2196F3" />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowCurrencyDialog(true)}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Appearance Section */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Aspetto
            </Text>
            <List.Item
              title="Tema"
              description={getThemeLabel(themeMode)}
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: '#9C27B0' + '15' }]}>
                  <MaterialCommunityIcons name="theme-light-dark" size={20} color="#9C27B0" />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowThemeDialog(true)}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Notifiche"
              description="Promemoria e alert"
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: '#FF9800' + '15' }]}>
                  <MaterialCommunityIcons name="bell-outline" size={20} color="#FF9800" />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/settings/notifications')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Data Section */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Dati
            </Text>
            <List.Item
              title="Banche collegate"
              description="Importa transazioni automaticamente"
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: brandColors.primary + '15' }]}>
                  <MaterialCommunityIcons name="bank" size={20} color={brandColors.primary} />
                </View>
              )}
              right={() => (
                <View style={styles.comingSoonBadge}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color="white" />
                  <Text style={styles.comingSoonBadgeText}>SOON</Text>
                </View>
              )}
              onPress={() => router.push('/settings/connected-banks')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Categorie"
              description="Gestisci le categorie di spesa"
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: '#00BCD4' + '15' }]}>
                  <MaterialCommunityIcons name="tag-multiple" size={20} color="#00BCD4" />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/category/manage')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Spese ricorrenti"
              description="Gestisci le spese fisse"
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: '#673AB7' + '15' }]}>
                  <MaterialCommunityIcons name="repeat" size={20} color="#673AB7" />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/recurring')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Crediti"
              description="Gestisci crediti e debiti"
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: '#4CAF50' + '15' }]}>
                  <MaterialCommunityIcons name="account-cash" size={20} color="#4CAF50" />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/shared')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Report PDF Annuale"
              description={canUseFeature('annual_report') ? 'Genera il report delle tue finanze' : 'Funzionalita Premium'}
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: '#E53935' + '15' }]}>
                  <MaterialCommunityIcons name="file-pdf-box" size={20} color="#E53935" />
                </View>
              )}
              right={(props) =>
                isGeneratingReport ? (
                  <ActivityIndicator size="small" />
                ) : canUseFeature('annual_report') ? (
                  <List.Icon {...props} icon="chevron-right" />
                ) : (
                  <View style={styles.premiumBadge}>
                    <MaterialCommunityIcons name="crown" size={14} color="#FFD700" />
                    <Text style={styles.premiumBadgeText}>PRO</Text>
                  </View>
                )
              }
              onPress={handleGenerateReport}
              disabled={isGeneratingReport}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Esporta dati"
              description="Scarica i tuoi dati in CSV"
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: '#607D8B' + '15' }]}>
                  <MaterialCommunityIcons name="download" size={20} color="#607D8B" />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Info', 'Funzionalita in arrivo!');
              }}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Guide Section */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Risorse
            </Text>
            <List.Item
              title="Guide finanziarie"
              description="Impara a gestire meglio i tuoi soldi"
              left={(props) => (
                <View style={[styles.listIconContainer, { backgroundColor: '#FF5722' + '15' }]}>
                  <MaterialCommunityIcons name="book-open-variant" size={20} color="#FF5722" />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/guides')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Developer Options (only in __DEV__ and when enabled) */}
        {__DEV__ && devModeEnabled && (
          <Card style={[styles.card, { borderColor: '#9C27B0', borderWidth: 2 }]} mode="elevated">
            <Card.Content>
              <View style={styles.devHeader}>
                <MaterialCommunityIcons name="bug" size={24} color="#9C27B0" />
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: '#9C27B0', marginBottom: 0, marginLeft: 8 }]}>
                  Opzioni Sviluppatore
                </Text>
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.md }}>
                Queste opzioni sono visibili solo in modalità sviluppo
              </Text>
              <List.Item
                title="Simula Premium"
                description={devPremium ? 'Premium attivo (simulato)' : 'Attiva per testare funzionalità premium'}
                left={(props) => <List.Icon {...props} icon="crown" color="#FFD700" />}
                right={() => (
                  <Switch
                    value={devPremium}
                    onValueChange={setDevPremium}
                    color="#9C27B0"
                  />
                )}
              />
              <Divider />
              <List.Item
                title="Simula Supporter"
                description={devSupporter ? 'Badge supporter attivo' : 'Attiva per mostrare badge supporter'}
                left={(props) => <List.Icon {...props} icon="heart" color="#E91E63" />}
                right={() => (
                  <Switch
                    value={devSupporter}
                    onValueChange={setDevSupporter}
                    color="#9C27B0"
                  />
                )}
              />
              <Divider />
              <List.Item
                title="Test Celebration"
                description="Mostra popup celebrazione"
                left={(props) => <List.Icon {...props} icon="party-popper" color="#FF9800" />}
                onPress={() => {
                  Alert.alert('Test', 'Vai alla tab Home e completa un obiettivo per vedere la celebrazione');
                }}
              />
            </Card.Content>
          </Card>
        )}

        {/* Sign Out Button */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutButton,
            { borderColor: brandColors.error },
            pressed && styles.signOutButtonPressed,
          ]}
        >
          <MaterialCommunityIcons name="logout" size={20} color={brandColors.error} />
          <Text variant="titleSmall" style={{ color: brandColors.error, fontWeight: '600' }}>
            Esci
          </Text>
        </Pressable>

        {/* App Version - Tap 7 times to enable dev mode */}
        <Pressable onPress={handleVersionTap}>
          <Text
            variant="bodySmall"
            style={[styles.version, { color: theme.colors.onSurfaceVariant }]}
          >
            FinanzaMi.pro v1.0.0 {devModeEnabled && '(DEV)'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Theme Dialog */}
      <Portal>
        <Dialog visible={showThemeDialog} onDismiss={() => setShowThemeDialog(false)}>
          <Dialog.Title>Scegli tema</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={themeMode}
              onValueChange={(value) => setThemeMode(value as ThemeMode)}
            >
              <RadioButton.Item label="Chiaro" value="light" />
              <RadioButton.Item label="Scuro" value="dark" />
              <RadioButton.Item label="Sistema" value="system" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowThemeDialog(false)}>Chiudi</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Budget Dialog */}
      <Portal>
        <Dialog visible={showBudgetDialog} onDismiss={() => setShowBudgetDialog(false)}>
          <Dialog.Title>Budget mensile</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: spacing.md }}>
              Imposta il tuo budget mensile totale
            </Text>
            <TextInput
              label="Importo"
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="numeric"
              mode="outlined"
              left={<TextInput.Icon icon="currency-eur" />}
              placeholder="es. 2000"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowBudgetDialog(false)}>Annulla</Button>
            <Button onPress={handleUpdateBudget} loading={isLoading}>
              Salva
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Currency Dialog */}
      <Portal>
        <Dialog
          visible={showCurrencyDialog}
          onDismiss={() => setShowCurrencyDialog(false)}
          style={{ maxHeight: '70%' }}
        >
          <Dialog.Title>Valuta principale</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView>
              <RadioButton.Group
                value={profile?.main_currency || 'EUR'}
                onValueChange={handleUpdateCurrency}
              >
                {CURRENCIES.map((currency) => (
                  <RadioButton.Item
                    key={currency.code}
                    label={`${currency.symbol} ${currency.name}`}
                    value={currency.code}
                  />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowCurrencyDialog(false)}>Chiudi</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
  },
  // Profile Card with Gradient
  profileCardGradient: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  premiumBadgeWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  premiumBadgeTextWhite: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  supporterBadgeWhite: {
    backgroundColor: 'rgba(233, 30, 99, 0.4)',
    padding: 4,
    borderRadius: 10,
  },
  // Premium Card
  premiumCardBorder: {
    borderRadius: borderRadius.lg,
    padding: 2,
    marginBottom: spacing.md,
  },
  premiumCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg - 2,
  },
  premiumCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  premiumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumCardText: {
    gap: 2,
  },
  // Cards
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  // List items
  listItem: {
    paddingLeft: 0,
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  // Badges
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700' + '25',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B8860B',
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  // Sign out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  signOutButtonPressed: {
    opacity: 0.7,
  },
  // Version
  version: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  // Dev mode
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
});
