import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme, IconButton, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { usePremiumStore } from '../../stores/premiumStore';
import { spacing, brandColors } from '../../constants/theme';

export default function ConnectedBanksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isPremium } = usePremiumStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Banche Collegate
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        {/* Coming Soon Card */}
        <View style={styles.comingSoonContainer}>
          <View style={[styles.iconContainer, { backgroundColor: brandColors.primary + '15' }]}>
            <MaterialCommunityIcons
              name="bank-transfer"
              size={64}
              color={brandColors.primary}
            />
          </View>

          <View style={styles.badgeContainer}>
            <View style={[styles.comingSoonBadge, { backgroundColor: brandColors.warning }]}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="white" />
              <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
            </View>
          </View>

          <Text variant="headlineSmall" style={styles.title}>
            Sincronizzazione Bancaria
          </Text>

          <Text
            variant="bodyLarge"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            Presto potrai collegare i tuoi conti bancari per importare automaticamente
            le transazioni e tenere traccia delle tue spese senza inserimenti manuali.
          </Text>

          {/* Features Preview */}
          <Card style={[styles.featuresCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.featuresTitle}>
                Cosa potrai fare:
              </Text>

              <View style={styles.featureRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color={brandColors.success} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Importare transazioni automaticamente
                </Text>
              </View>

              <View style={styles.featureRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color={brandColors.success} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Sincronizzare più conti bancari
                </Text>
              </View>

              <View style={styles.featureRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color={brandColors.success} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Categorizzazione intelligente automatica
                </Text>
              </View>

              <View style={styles.featureRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color={brandColors.success} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Aggiornamenti in tempo reale
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Premium Note */}
          {!isPremium && (
            <Card style={[styles.premiumNote, { borderColor: '#FFD700' }]} mode="outlined">
              <Card.Content style={styles.premiumNoteContent}>
                <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
                <View style={styles.premiumNoteText}>
                  <Text variant="titleSmall">Funzionalità Premium</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Questa funzione sarà disponibile per gli utenti Premium
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Notify Button */}
          <Button
            mode="contained-tonal"
            icon="bell-outline"
            onPress={() => {
              // TODO: Implement notification signup
              router.back();
            }}
            style={styles.notifyButton}
          >
            Ti avviseremo quando sarà disponibile
          </Button>
        </View>

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
            I tuoi dati bancari saranno protetti con crittografia di livello bancario
            e connessioni certificate PSD2.
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeContainer: {
    marginBottom: spacing.md,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
  },
  comingSoonBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  featuresCard: {
    width: '100%',
    marginBottom: spacing.lg,
    borderRadius: 12,
  },
  featuresTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  featureText: {
    flex: 1,
  },
  premiumNote: {
    width: '100%',
    marginBottom: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFD70010',
  },
  premiumNoteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  premiumNoteText: {
    flex: 1,
  },
  notifyButton: {
    marginBottom: spacing.lg,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: 'auto',
  },
});
