import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Button,
  Chip,
  Divider,
  Dialog,
  Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';

export default function TransactionDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const { transactions, deleteTransaction, isLoading } = useTransactionStore();
  const { categories } = useCategoryStore();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const transaction = transactions.find((t) => t.id === id);
  const category = categories.find((c) => c.id === transaction?.category_id);

  const currency = profile?.main_currency || 'EUR';

  const handleDelete = async () => {
    if (!id) return;

    const { error } = await deleteTransaction(id);
    if (!error) {
      router.back();
    } else {
      Alert.alert('Errore', error);
    }
    setShowDeleteDialog(false);
  };

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text variant="titleLarge">Transazione non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? brandColors.error : brandColors.success;

  // Get gradient colors based on type
  const getGradientColors = (): [string, string] => {
    return isExpense
      ? [brandColors.error, '#EF5350']
      : [brandColors.success, '#66BB6A'];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Gradient Header with Amount */}
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Dettagli
          </Text>
          <Pressable onPress={() => setShowDeleteDialog(true)} style={styles.deleteButton}>
            <MaterialCommunityIcons name="delete-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <View style={styles.typeIcon}>
            <MaterialCommunityIcons
              name={isExpense ? 'arrow-up' : 'arrow-down'}
              size={32}
              color="#FFFFFF"
            />
          </View>
          <Text variant="displaySmall" style={styles.amount}>
            {isExpense ? '-' : '+'}
            {formatCurrency(transaction.amount, currency)}
          </Text>
          {transaction.original_currency && transaction.original_currency !== currency && (
            <Text variant="bodyMedium" style={styles.originalAmount}>
              Originale: {formatCurrency(transaction.original_amount || 0, transaction.original_currency)}
            </Text>
          )}
          <Text variant="bodyLarge" style={styles.dateText}>
            {format(parseISO(transaction.date), 'EEEE d MMMM yyyy', { locale: it })}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Details Card */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            {/* Category */}
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Categoria
              </Text>
              <View style={styles.categoryBadge}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: (category?.color || '#757575') + '20' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={(category?.icon || 'help-circle') as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={20}
                    color={category?.color || '#757575'}
                  />
                </View>
                <Text variant="bodyLarge">{category?.name || 'Senza categoria'}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Description */}
            {transaction.description && (
              <>
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Descrizione
                  </Text>
                  <Text variant="bodyLarge">{transaction.description}</Text>
                </View>
                <Divider style={styles.divider} />
              </>
            )}

            {/* Type */}
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Tipo
              </Text>
              <Chip
                compact
                style={{ backgroundColor: amountColor + '20' }}
                textStyle={{ color: amountColor }}
              >
                {isExpense ? 'Spesa' : 'Entrata'}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            {/* Tags */}
            {transaction.tags && transaction.tags.length > 0 && (
              <>
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Tag
                  </Text>
                  <View style={styles.tagsContainer}>
                    {transaction.tags.map((tag) => (
                      <Chip key={tag} compact style={styles.tagChip}>
                        {tag}
                      </Chip>
                    ))}
                  </View>
                </View>
                <Divider style={styles.divider} />
              </>
            )}

            {/* Recurring */}
            {transaction.is_recurring && (
              <>
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Ricorrente
                  </Text>
                  <Chip compact icon="repeat">
                    Si
                  </Chip>
                </View>
                <Divider style={styles.divider} />
              </>
            )}

            {/* Shared */}
            {transaction.is_shared && (
              <>
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Condivisa
                  </Text>
                  <Chip compact icon="account-group">
                    Si
                  </Chip>
                </View>
                <Divider style={styles.divider} />
              </>
            )}

            {/* Created at */}
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Creata il
              </Text>
              <Text variant="bodyMedium">
                {format(parseISO(transaction.created_at), 'd MMM yyyy, HH:mm', { locale: it })}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Edit Button */}
        <Button
          mode="outlined"
          icon="pencil"
          onPress={() => {
            // TODO: Edit transaction
            Alert.alert('Info', 'Funzionalita in arrivo!');
          }}
          style={styles.editButton}
        >
          Modifica transazione
        </Button>
      </ScrollView>

      {/* Delete Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Elimina transazione</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Sei sicuro di voler eliminare questa transazione? L'azione non puo essere annullata.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Annulla</Button>
            <Button
              onPress={handleDelete}
              loading={isLoading}
              textColor={brandColors.error}
            >
              Elimina
            </Button>
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
  // Gradient Header
  headerGradient: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  amountSection: {
    alignItems: 'center',
  },
  typeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amount: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  originalAmount: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'capitalize',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
    maxWidth: '60%',
  },
  tagChip: {
    height: 28,
  },
  editButton: {
    marginTop: spacing.md,
  },
});
