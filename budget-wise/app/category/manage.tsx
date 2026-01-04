import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  IconButton,
  TextInput,
  Button,
  ProgressBar,
  Portal,
  Modal,
  Divider,
  ActivityIndicator,
  Snackbar,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { useCategoryStore } from '../../stores/categoryStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Category } from '../../types/database';
import { AVAILABLE_ICONS } from '../../constants/categories';

// Colors available for custom categories
const AVAILABLE_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB',
  '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047',
  '#7CB342', '#C0CA33', '#FFB300', '#FB8C00', '#F4511E',
  '#6D4C41', '#757575', '#546E7A',
];

export default function CategoryManageScreen() {
  const theme = useTheme();
  const { categories, isLoading, fetchCategories, updateCategory, createCategory, deleteCategory } = useCategoryStore();
  const { transactions, fetchTransactions } = useTransactionStore();

  // Budget editing state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [budgetValue, setBudgetValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // Category creation/editing state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategoryData, setEditingCategoryData] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('tag');
  const [categoryColor, setCategoryColor] = useState(AVAILABLE_COLORS[0]);
  const [categoryBudget, setCategoryBudget] = useState('');
  const [modalStep, setModalStep] = useState<'details' | 'icon' | 'color'>('details');

  useEffect(() => {
    fetchCategories();
    fetchTransactions({
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
  }, []);

  // Calculate spending per category for current month
  const categorySpending = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const spending: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type === 'expense') {
        const transactionDate = parseISO(t.date);
        if (isWithinInterval(transactionDate, { start, end })) {
          spending[t.category_id] = (spending[t.category_id] || 0) + t.amount;
        }
      }
    });

    return spending;
  }, [transactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalBudget = categories.reduce((sum, cat) => sum + (cat.budget || 0), 0);
    const totalSpent = Object.values(categorySpending).reduce((sum, spent) => sum + spent, 0);
    return { totalBudget, totalSpent };
  }, [categories, categorySpending]);

  const handleEditBudget = (category: Category) => {
    setEditingCategory(category);
    setBudgetValue(category.budget?.toString() || '');
  };

  const handleSaveBudget = async () => {
    if (!editingCategory) return;

    setIsSaving(true);
    const budget = budgetValue ? parseFloat(budgetValue) : null;

    const { error } = await updateCategory(editingCategory.id, { budget });

    if (error) {
      setSnackbar({ visible: true, message: 'Errore nel salvare il budget' });
    } else {
      setSnackbar({ visible: true, message: 'Budget aggiornato' });
    }

    setIsSaving(false);
    setEditingCategory(null);
    setBudgetValue('');
  };

  const getProgressColor = (spent: number, budget: number | null) => {
    if (!budget) return theme.colors.primary;
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return theme.colors.error;
    if (percentage >= 85) return '#FF9800';
    if (percentage >= 70) return '#FFC107';
    return theme.colors.primary;
  };

  // Open modal to create new category
  const handleAddCategory = () => {
    setEditingCategoryData(null);
    setCategoryName('');
    setCategoryIcon('tag');
    setCategoryColor(AVAILABLE_COLORS[0]);
    setCategoryBudget('');
    setModalStep('details');
    setShowCategoryModal(true);
  };

  // Open modal to edit existing category
  const handleEditCategory = (category: Category) => {
    setEditingCategoryData(category);
    setCategoryName(category.name);
    setCategoryIcon(category.icon);
    setCategoryColor(category.color);
    setCategoryBudget(category.budget?.toString() || '');
    setModalStep('details');
    setShowCategoryModal(true);
  };

  // Save category (create or update)
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      setSnackbar({ visible: true, message: 'Inserisci un nome per la categoria' });
      return;
    }

    setIsSaving(true);

    const budget = categoryBudget ? parseFloat(categoryBudget) : null;

    if (editingCategoryData) {
      // Update existing category
      const { error } = await updateCategory(editingCategoryData.id, {
        name: categoryName.trim(),
        icon: categoryIcon,
        color: categoryColor,
        budget,
      });

      if (error) {
        setSnackbar({ visible: true, message: 'Errore nel salvare la categoria' });
      } else {
        setSnackbar({ visible: true, message: 'Categoria aggiornata' });
        setShowCategoryModal(false);
      }
    } else {
      // Create new category
      const { error } = await createCategory({
        name: categoryName.trim(),
        icon: categoryIcon,
        color: categoryColor,
        budget,
        is_preset: false,
        is_active: true,
        order_index: categories.length,
      });

      if (error) {
        setSnackbar({ visible: true, message: 'Errore nel creare la categoria' });
      } else {
        setSnackbar({ visible: true, message: 'Categoria creata' });
        setShowCategoryModal(false);
      }
    }

    setIsSaving(false);
  };

  // Delete category
  const handleDeleteCategory = (category: Category) => {
    if (category.is_preset) {
      setSnackbar({ visible: true, message: 'Non puoi eliminare le categorie predefinite' });
      return;
    }

    Alert.alert(
      'Elimina categoria',
      `Sei sicuro di voler eliminare "${category.name}"? Le transazioni associate non verranno eliminate.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteCategory(category.id);
            if (error) {
              setSnackbar({ visible: true, message: 'Errore nell\'eliminare la categoria' });
            } else {
              setSnackbar({ visible: true, message: 'Categoria eliminata' });
              setShowCategoryModal(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  if (isLoading && categories.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="tag-multiple" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Gestione Categorie
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {format(new Date(), 'MMMM yyyy', { locale: it })}
            </Text>
          </View>
        </View>

        {/* Summary inside gradient */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>
                Budget Totale
              </Text>
              <Text variant="headlineSmall" style={styles.summaryValue}>
                {formatCurrency(totals.totalBudget)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>
                Speso
              </Text>
              <Text variant="headlineSmall" style={styles.summaryValue}>
                {formatCurrency(totals.totalSpent)}
              </Text>
            </View>
          </View>
          {totals.totalBudget > 0 && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={Math.min(totals.totalSpent / totals.totalBudget, 1)}
                color="#FFFFFF"
                style={styles.progressBar}
              />
              <Text variant="bodySmall" style={styles.progressText}>
                {((totals.totalSpent / totals.totalBudget) * 100).toFixed(0)}% utilizzato
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Info Banner */}
        <Surface style={[styles.infoBanner, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={theme.colors.onSecondaryContainer}
          />
          <Text
            variant="bodySmall"
            style={[styles.infoText, { color: theme.colors.onSecondaryContainer }]}
          >
            Tocca una categoria per impostare il budget mensile
          </Text>
        </Surface>

        {/* Categories List */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Categorie ({categories.length})
        </Text>

        {categories
          .filter((cat) => cat.is_active)
          .sort((a, b) => {
            // Custom categories first, then by budget
            if (a.is_preset !== b.is_preset) return a.is_preset ? 1 : -1;
            return (b.budget || 0) - (a.budget || 0);
          })
          .map((category) => {
            const spent = categorySpending[category.id] || 0;
            const budget = category.budget || 0;
            const progress = budget > 0 ? Math.min(spent / budget, 1) : 0;

            return (
              <Pressable
                key={category.id}
                onPress={() => handleEditBudget(category)}
                onLongPress={() => handleEditCategory(category)}
              >
                <Surface style={styles.categoryCard} elevation={1}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={category.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={24}
                        color={category.color}
                      />
                    </View>
                    <View style={styles.categoryInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text variant="titleSmall">{category.name}</Text>
                        {!category.is_preset && (
                          <View style={[styles.customBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, fontSize: 9 }}>
                              Personalizzata
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Speso: {formatCurrency(spent)}
                      </Text>
                    </View>
                    <View style={styles.budgetActions}>
                      <View style={styles.budgetInfo}>
                        {budget > 0 ? (
                          <>
                            <Text variant="titleSmall" style={{ textAlign: 'right' }}>
                              {formatCurrency(budget)}
                            </Text>
                            <Text
                              variant="bodySmall"
                              style={{
                                color: spent > budget ? theme.colors.error : theme.colors.onSurfaceVariant,
                                textAlign: 'right',
                              }}
                            >
                              {spent > budget ? 'Sforato!' : `Rimangono ${formatCurrency(budget - spent)}`}
                            </Text>
                          </>
                        ) : (
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            Nessun budget
                          </Text>
                        )}
                      </View>
                      <IconButton
                        icon="pencil"
                        size={18}
                        onPress={() => handleEditCategory(category)}
                        style={{ margin: 0 }}
                      />
                    </View>
                  </View>

                  {budget > 0 && (
                    <ProgressBar
                      progress={progress}
                      color={getProgressColor(spent, budget)}
                      style={styles.categoryProgress}
                    />
                  )}
                </Surface>
              </Pressable>
            );
          })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Gradient FAB for adding new category */}
      <Pressable
        onPress={handleAddCategory}
        style={({ pressed }) => [
          styles.fabPressable,
          pressed && styles.fabPressed,
        ]}
      >
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
          <Text variant="labelLarge" style={styles.fabText}>Nuova categoria</Text>
        </LinearGradient>
      </Pressable>

      {/* Edit Budget Modal */}
      <Portal>
        <Modal
          visible={editingCategory !== null}
          onDismiss={() => setEditingCategory(null)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          {editingCategory && (
            <>
              <View style={styles.modalHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: editingCategory.color + '20' }]}>
                  <MaterialCommunityIcons
                    name={editingCategory.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={28}
                    color={editingCategory.color}
                  />
                </View>
                <Text variant="titleLarge" style={{ marginLeft: 12 }}>
                  {editingCategory.name}
                </Text>
              </View>

              <Divider style={{ marginVertical: 16 }} />

              <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                Budget mensile per questa categoria
              </Text>

              <TextInput
                mode="outlined"
                label="Budget (€)"
                value={budgetValue}
                onChangeText={(text) => setBudgetValue(text.replace(/[^0-9.,]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="Es: 200"
                left={<TextInput.Icon icon="currency-eur" />}
                style={{ marginBottom: 8 }}
              />

              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                Speso questo mese: {formatCurrency(categorySpending[editingCategory.id] || 0)}
              </Text>

              {/* Quick budget buttons */}
              <View style={styles.quickBudgets}>
                {[50, 100, 150, 200, 300, 500].map((amount) => (
                  <Pressable
                    key={amount}
                    style={[styles.quickButton, { borderColor: theme.colors.outline }]}
                    onPress={() => setBudgetValue(amount.toString())}
                  >
                    <Text variant="bodySmall">€{amount}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setBudgetValue('');
                    setEditingCategory(null);
                  }}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Annulla
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveBudget}
                  loading={isSaving}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                >
                  Salva
                </Button>
              </View>

              {editingCategory.budget && (
                <Button
                  mode="text"
                  onPress={() => setBudgetValue('')}
                  textColor={theme.colors.error}
                  style={{ marginTop: 8 }}
                >
                  Rimuovi budget
                </Button>
              )}
            </>
          )}
        </Modal>
      </Portal>

      {/* Create/Edit Category Modal */}
      <Portal>
        <Modal
          visible={showCategoryModal}
          onDismiss={() => setShowCategoryModal(false)}
          contentContainerStyle={[styles.categoryModal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge">
              {editingCategoryData ? 'Modifica categoria' : 'Nuova categoria'}
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowCategoryModal(false)}
            />
          </View>

          <Divider style={{ marginBottom: 16 }} />

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <Pressable
              style={[
                styles.stepDot,
                modalStep === 'details' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setModalStep('details')}
            />
            <Pressable
              style={[
                styles.stepDot,
                modalStep === 'icon' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setModalStep('icon')}
            />
            <Pressable
              style={[
                styles.stepDot,
                modalStep === 'color' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setModalStep('color')}
            />
          </View>

          {/* Step: Details */}
          {modalStep === 'details' && (
            <View>
              <View style={styles.categoryPreview}>
                <View style={[styles.previewIcon, { backgroundColor: categoryColor + '20' }]}>
                  <MaterialCommunityIcons
                    name={categoryIcon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={32}
                    color={categoryColor}
                  />
                </View>
                <Text variant="titleMedium" style={{ marginTop: 8 }}>
                  {categoryName || 'Nome categoria'}
                </Text>
              </View>

              <TextInput
                mode="outlined"
                label="Nome categoria"
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Es: Abbonamenti streaming"
                style={{ marginBottom: 12 }}
              />

              <TextInput
                mode="outlined"
                label="Budget mensile (opzionale)"
                value={categoryBudget}
                onChangeText={(text) => setCategoryBudget(text.replace(/[^0-9.,]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="Es: 50"
                left={<TextInput.Icon icon="currency-eur" />}
                style={{ marginBottom: 16 }}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowCategoryModal(false)}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Annulla
                </Button>
                <Button
                  mode="contained"
                  onPress={() => setModalStep('icon')}
                  style={{ flex: 1 }}
                >
                  Avanti
                </Button>
              </View>
            </View>
          )}

          {/* Step: Icon selection */}
          {modalStep === 'icon' && (
            <View>
              <Text variant="titleSmall" style={{ marginBottom: 12 }}>
                Scegli un'icona
              </Text>
              <ScrollView style={{ maxHeight: 280 }}>
                <View style={styles.iconGrid}>
                  {AVAILABLE_ICONS.map((icon) => (
                    <Pressable
                      key={icon}
                      style={[
                        styles.iconOption,
                        { borderColor: theme.colors.outline },
                        categoryIcon === icon && {
                          borderColor: categoryColor,
                          backgroundColor: categoryColor + '20',
                        },
                      ]}
                      onPress={() => setCategoryIcon(icon)}
                    >
                      <MaterialCommunityIcons
                        name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={24}
                        color={categoryIcon === icon ? categoryColor : theme.colors.onSurface}
                      />
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <View style={[styles.modalActions, { marginTop: 16 }]}>
                <Button
                  mode="outlined"
                  onPress={() => setModalStep('details')}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Indietro
                </Button>
                <Button
                  mode="contained"
                  onPress={() => setModalStep('color')}
                  style={{ flex: 1 }}
                >
                  Avanti
                </Button>
              </View>
            </View>
          )}

          {/* Step: Color selection */}
          {modalStep === 'color' && (
            <View>
              <Text variant="titleSmall" style={{ marginBottom: 12 }}>
                Scegli un colore
              </Text>

              <View style={styles.categoryPreview}>
                <View style={[styles.previewIcon, { backgroundColor: categoryColor + '20' }]}>
                  <MaterialCommunityIcons
                    name={categoryIcon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={32}
                    color={categoryColor}
                  />
                </View>
                <Text variant="titleMedium" style={{ marginTop: 8 }}>
                  {categoryName || 'Nome categoria'}
                </Text>
              </View>

              <View style={styles.colorGrid}>
                {AVAILABLE_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      categoryColor === color && styles.colorSelected,
                    ]}
                    onPress={() => setCategoryColor(color)}
                  >
                    {categoryColor === color && (
                      <MaterialCommunityIcons name="check" size={20} color="#fff" />
                    )}
                  </Pressable>
                ))}
              </View>

              <View style={[styles.modalActions, { marginTop: 16 }]}>
                <Button
                  mode="outlined"
                  onPress={() => setModalStep('icon')}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Indietro
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveCategory}
                  loading={isSaving}
                  disabled={isSaving || !categoryName.trim()}
                  style={{ flex: 1 }}
                >
                  {editingCategoryData ? 'Salva' : 'Crea'}
                </Button>
              </View>

              {/* Delete button for custom categories */}
              {editingCategoryData && !editingCategoryData.is_preset && (
                <Button
                  mode="text"
                  onPress={() => handleDeleteCategory(editingCategoryData)}
                  textColor={theme.colors.error}
                  style={{ marginTop: 12 }}
                  icon="delete"
                >
                  Elimina categoria
                </Button>
              )}
            </View>
          )}
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={2000}
      >
        {snackbar.message}
      </Snackbar>
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
  // Gradient Header
  headerGradient: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  budgetInfo: {
    alignItems: 'flex-end',
  },
  budgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryProgress: {
    height: 4,
    borderRadius: 2,
    marginTop: 12,
  },
  customBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickBudgets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
  },
  fabPressable: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: borderRadius.xl,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryModal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '85%',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
  },
  categoryPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 8,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
});
