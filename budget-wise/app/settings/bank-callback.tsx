import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, useTheme, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useEnableBankingStore } from '../../stores/enableBankingStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { spacing, brandColors } from '../../constants/theme';

/**
 * This screen handles the callback from Enable Banking authorization.
 * After the user authorizes their bank, Enable Banking redirects to:
 * budgetwise://bank-callback?code=xxx&state=yyy
 *
 * Or on error:
 * budgetwise://bank-callback?error=xxx&error_description=yyy
 */
export default function BankCallbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }>();

  const { completeConnection, syncAllAccounts } = useEnableBankingStore();
  const { fetchTransactions } = useTransactionStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountsCount, setAccountsCount] = useState(0);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    // Give a moment for the UI to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check for error in callback
    if (params.error) {
      setStatus('error');
      setMessage(params.error_description || params.error || 'Autorizzazione fallita');
      return;
    }

    // Check for required parameters
    if (!params.code || !params.state) {
      setStatus('error');
      setMessage('Parametri di autorizzazione mancanti');
      return;
    }

    try {
      // Build callback URL for the store
      const callbackUrl = `budgetwise://bank-callback?code=${params.code}&state=${params.state}`;

      // Complete the connection
      const result = await completeConnection(callbackUrl);

      if (result.success) {
        setStatus('success');
        setBankName(result.bankName || 'la tua banca');
        setAccountsCount(result.accountsCount || 0);
        setMessage(`${result.accountsCount || 0} conti collegati con successo!`);

        // Auto-sync transactions after successful connection
        try {
          await syncAllAccounts();
          await fetchTransactions();
        } catch (syncError) {
          console.error('Error syncing after connection:', syncError);
          // Don't fail the whole flow if sync fails
        }
      } else {
        setStatus('error');
        setMessage(result.error || 'Errore durante il collegamento');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Errore durante il collegamento della banca'
      );
    }
  };

  const handleContinue = () => {
    if (status === 'success') {
      router.replace({
        pathname: '/settings/connected-banks',
        params: { success: 'true' },
      });
    } else {
      router.replace({
        pathname: '/settings/connected-banks',
        params: { error: message },
      });
    }
  };

  const handleRetry = () => {
    router.replace('/settings/connected-banks');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <View style={[styles.iconContainer, { backgroundColor: brandColors.primary + '15' }]}>
              <MaterialCommunityIcons
                name="bank-check"
                size={64}
                color={brandColors.primary}
              />
            </View>
            <ActivityIndicator size="large" style={styles.loader} />
            <Text variant="titleMedium" style={styles.title}>
              Collegamento in corso...
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            >
              Stiamo configurando il tuo conto bancario
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={[styles.iconContainer, { backgroundColor: brandColors.success + '15' }]}>
              <MaterialCommunityIcons
                name="check-circle"
                size={64}
                color={brandColors.success}
              />
            </View>
            <Text variant="headlineSmall" style={[styles.title, { fontWeight: 'bold' }]}>
              Collegamento riuscito!
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            >
              {bankName} collegata con successo.
              {accountsCount > 0 && `\n${accountsCount} ${accountsCount === 1 ? 'conto collegato' : 'conti collegati'}.`}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.subDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              Le tue transazioni verranno importate automaticamente e categorizzate.
            </Text>
            <Button
              mode="contained"
              onPress={handleContinue}
              style={styles.button}
            >
              Vai ai conti collegati
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={[styles.iconContainer, { backgroundColor: brandColors.danger + '15' }]}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={64}
                color={brandColors.danger}
              />
            </View>
            <Text variant="headlineSmall" style={[styles.title, { fontWeight: 'bold' }]}>
              Collegamento fallito
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            >
              {message}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.subDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              Puoi riprovare a collegare la tua banca dalle impostazioni.
            </Text>
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={handleRetry}
                style={styles.button}
              >
                Riprova
              </Button>
              <Button
                mode="contained"
                onPress={handleContinue}
                style={styles.button}
              >
                Continua
              </Button>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  loader: {
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subDescription: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    minWidth: 150,
    marginTop: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
