import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useBankSyncStore } from '../../stores/bankSyncStore';
import { spacing, brandColors } from '../../constants/theme';

/**
 * This screen handles the callback from Salt Edge Connect widget.
 * After the user connects their bank, Salt Edge redirects to:
 * budgetwise://settings/bank-callback?connection_id=xxx&status=success
 */
export default function BankCallbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    connection_id?: string;
    status?: string;
    error?: string;
  }>();

  const { fetchConnectedAccounts, syncTransactions } = useBankSyncStore();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    // Give a moment for the UI to render
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (params.status === 'error' || params.error) {
      // Connection failed - go back to connected-banks with error
      router.replace({
        pathname: '/settings/connected-banks',
        params: { error: params.error || 'Connessione fallita' },
      });
      return;
    }

    // Connection successful - refresh accounts and sync
    try {
      await fetchConnectedAccounts();

      // If we have a connection_id, sync transactions
      if (params.connection_id) {
        await syncTransactions(params.connection_id);
      }

      // Navigate to connected-banks with success
      router.replace({
        pathname: '/settings/connected-banks',
        params: { success: 'true' },
      });
    } catch (error) {
      // Navigate anyway, errors will be shown in the connected-banks screen
      router.replace('/settings/connected-banks');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
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
    backgroundColor: '#E3F2FD',
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
  },
});
