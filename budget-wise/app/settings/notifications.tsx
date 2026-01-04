import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  List,
  Switch,
  IconButton,
  Divider,
  Button,
  Dialog,
  Portal,
  RadioButton,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { useNotifications } from '../../hooks/useNotifications';
import { spacing, brandColors } from '../../constants/theme';

const REMINDER_TIMES = [
  { label: '08:00', value: '08:00' },
  { label: '12:00', value: '12:00' },
  { label: '18:00', value: '18:00' },
  { label: '20:00', value: '20:00' },
  { label: '21:00', value: '21:00' },
  { label: '22:00', value: '22:00' },
];

const CREDIT_REMINDER_DAYS = [
  { label: '3 giorni', value: 3 },
  { label: '7 giorni', value: 7 },
  { label: '14 giorni', value: 14 },
  { label: '30 giorni', value: 30 },
];

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    preferences,
    updatePreferences,
    isInitialized,
    checkPermissions,
    requestPermissions,
    getScheduledNotifications,
  } = useNotifications();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [showCreditDaysDialog, setShowCreditDaysDialog] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    checkNotificationStatus();
    loadScheduledCount();
  }, [isInitialized]);

  const checkNotificationStatus = async () => {
    const granted = await checkPermissions();
    setHasPermission(granted);
  };

  const loadScheduledCount = async () => {
    const scheduled = await getScheduledNotifications();
    setScheduledCount(scheduled.length);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermissions();
    setHasPermission(granted);

    if (!granted) {
      Alert.alert(
        'Permessi richiesti',
        'Per ricevere le notifiche, abilita i permessi nelle impostazioni del dispositivo.',
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Apri impostazioni',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    }
  };

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    await updatePreferences({ [key]: value });
    loadScheduledCount();
  };

  const handleTimeChange = async (time: string) => {
    await updatePreferences({ dailyReminderTime: time });
    setShowTimeDialog(false);
    loadScheduledCount();
  };

  const handleCreditDaysChange = async (days: number) => {
    await updatePreferences({ creditReminderDays: days });
    setShowCreditDaysDialog(false);
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text>Caricamento...</Text>
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
          Notifiche
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Permission Status */}
        {hasPermission === false && (
          <Card style={styles.permissionCard} mode="elevated">
            <Card.Content>
              <View style={styles.permissionContent}>
                <MaterialCommunityIcons
                  name="bell-off"
                  size={32}
                  color={brandColors.warning}
                />
                <View style={styles.permissionText}>
                  <Text variant="titleMedium">Notifiche disabilitate</Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Abilita le notifiche per ricevere promemoria e alert
                  </Text>
                </View>
              </View>
              <Button
                mode="contained"
                onPress={handleRequestPermission}
                style={styles.permissionButton}
              >
                Abilita notifiche
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Status Card */}
        {hasPermission && (
          <Card style={styles.statusCard} mode="outlined">
            <Card.Content>
              <View style={styles.statusRow}>
                <MaterialCommunityIcons
                  name="bell-check"
                  size={24}
                  color={brandColors.success}
                />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  Notifiche attive
                </Text>
                <Chip compact>{scheduledCount} programmate</Chip>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Daily Reminder */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Promemoria giornaliero
            </Text>
            <List.Item
              title="Ricordami di registrare le spese"
              description="Ricevi un promemoria ogni giorno"
              left={(props) => <List.Icon {...props} icon="bell-ring" />}
              right={() => (
                <Switch
                  value={preferences.dailyReminder}
                  onValueChange={(v) => handleToggle('dailyReminder', v)}
                  disabled={!hasPermission}
                />
              )}
            />
            {preferences.dailyReminder && (
              <>
                <Divider />
                <List.Item
                  title="Orario promemoria"
                  description={preferences.dailyReminderTime}
                  left={(props) => <List.Icon {...props} icon="clock-outline" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => setShowTimeDialog(true)}
                  disabled={!hasPermission}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Budget Alerts */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Alert Budget
            </Text>
            <List.Item
              title="Avvisi superamento budget"
              description="Ricevi alert quando superi il 70%, 85%, 95% del budget"
              left={(props) => <List.Icon {...props} icon="alert-circle" />}
              right={() => (
                <Switch
                  value={preferences.budgetAlerts}
                  onValueChange={(v) => handleToggle('budgetAlerts', v)}
                  disabled={!hasPermission}
                />
              )}
            />
            <View style={styles.thresholdInfo}>
              <View style={styles.thresholdItem}>
                <View style={[styles.thresholdDot, { backgroundColor: brandColors.warning }]} />
                <Text variant="bodySmall">70% - Attenzione</Text>
              </View>
              <View style={styles.thresholdItem}>
                <View style={[styles.thresholdDot, { backgroundColor: '#FF9800' }]} />
                <Text variant="bodySmall">85% - Critico</Text>
              </View>
              <View style={styles.thresholdItem}>
                <View style={[styles.thresholdDot, { backgroundColor: brandColors.error }]} />
                <Text variant="bodySmall">95%+ - Superato</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Recurring Expenses */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Spese Ricorrenti
            </Text>
            <List.Item
              title="Promemoria scadenze"
              description="Ricevi avvisi per bollette e abbonamenti in scadenza"
              left={(props) => <List.Icon {...props} icon="repeat" />}
              right={() => (
                <Switch
                  value={preferences.recurringReminders}
                  onValueChange={(v) => handleToggle('recurringReminders', v)}
                  disabled={!hasPermission}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Credits */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Crediti
            </Text>
            <List.Item
              title="Promemoria crediti"
              description="Ricorda di riscuotere i crediti in sospeso"
              left={(props) => <List.Icon {...props} icon="account-cash" />}
              right={() => (
                <Switch
                  value={preferences.creditReminders}
                  onValueChange={(v) => handleToggle('creditReminders', v)}
                  disabled={!hasPermission}
                />
              )}
            />
            {preferences.creditReminders && (
              <>
                <Divider />
                <List.Item
                  title="Ricorda dopo"
                  description={`${preferences.creditReminderDays} giorni dalla creazione`}
                  left={(props) => <List.Icon {...props} icon="calendar-clock" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => setShowCreditDaysDialog(true)}
                  disabled={!hasPermission}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Reports */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Report
            </Text>
            <List.Item
              title="Report settimanale"
              description="Ricevi un riepilogo ogni domenica"
              left={(props) => <List.Icon {...props} icon="calendar-week" />}
              right={() => (
                <Switch
                  value={preferences.weeklyReport}
                  onValueChange={(v) => handleToggle('weeklyReport', v)}
                  disabled={!hasPermission}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Report mensile"
              description="Ricevi un riepilogo il primo del mese"
              left={(props) => <List.Icon {...props} icon="calendar-month" />}
              right={() => (
                <Switch
                  value={preferences.monthlyReport}
                  onValueChange={(v) => handleToggle('monthlyReport', v)}
                  disabled={!hasPermission}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Info */}
        <View style={styles.infoSection}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
          >
            Le notifiche vengono inviate localmente e non richiedono connessione internet.
            Puoi modificare queste impostazioni in qualsiasi momento.
          </Text>
        </View>
      </ScrollView>

      {/* Time Picker Dialog */}
      <Portal>
        <Dialog visible={showTimeDialog} onDismiss={() => setShowTimeDialog(false)}>
          <Dialog.Title>Orario promemoria</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={preferences.dailyReminderTime}
              onValueChange={(value) => handleTimeChange(value)}
            >
              {REMINDER_TIMES.map((time) => (
                <RadioButton.Item
                  key={time.value}
                  label={time.label}
                  value={time.value}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTimeDialog(false)}>Annulla</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Credit Days Dialog */}
      <Portal>
        <Dialog
          visible={showCreditDaysDialog}
          onDismiss={() => setShowCreditDaysDialog(false)}
        >
          <Dialog.Title>Ricorda crediti dopo</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={preferences.creditReminderDays.toString()}
              onValueChange={(value) => handleCreditDaysChange(parseInt(value))}
            >
              {CREDIT_REMINDER_DAYS.map((option) => (
                <RadioButton.Item
                  key={option.value}
                  label={option.label}
                  value={option.value.toString()}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreditDaysDialog(false)}>Annulla</Button>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  permissionCard: {
    marginBottom: spacing.md,
    backgroundColor: '#FFF8E1',
  },
  permissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  permissionText: {
    flex: 1,
  },
  permissionButton: {
    marginTop: spacing.sm,
  },
  statusCard: {
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  thresholdInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginLeft: spacing.xl + spacing.md,
  },
  thresholdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  thresholdDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
});
