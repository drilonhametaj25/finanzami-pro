import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { spacing, brandColors } from '../constants/theme';

/**
 * Root-level bank callback handler
 * This handles the deep link: budgetwise://bank-callback?code=xxx&state=yyy
 * and redirects to the appropriate settings screen
 */
export default function BankCallbackRootScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }>();

  useEffect(() => {
    // Redirect to the settings bank callback screen with all params
    const queryParams = new URLSearchParams();

    if (params.code) queryParams.append('code', params.code);
    if (params.state) queryParams.append('state', params.state);
    if (params.error) queryParams.append('error', params.error);
    if (params.error_description) queryParams.append('error_description', params.error_description);

    const query = queryParams.toString();

    // Short delay to ensure the app is ready
    setTimeout(() => {
      router.replace(`/settings/bank-callback${query ? `?${query}` : ''}`);
    }, 100);
  }, [params, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: brandColors.primary + '15' }]}>
          <MaterialCommunityIcons
            name="bank-transfer"
            size={64}
            color={brandColors.primary}
          />
        </View>
        <ActivityIndicator size="large" style={styles.loader} />
        <Text variant="titleMedium" style={styles.title}>
          Reindirizzamento...
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  loader: {
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
  },
});
