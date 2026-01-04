import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Category, InsertTables, UpdateTables } from '../types/database';
import { PRESET_CATEGORIES } from '../constants/categories';
import { usePremiumStore, FREE_LIMITS } from './premiumStore';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  createCategory: (category: Omit<InsertTables<'categories'>, 'user_id'>) => Promise<{ error: string | null }>;
  updateCategory: (id: string, updates: UpdateTables<'categories'>) => Promise<{ error: string | null }>;
  deleteCategory: (id: string) => Promise<{ error: string | null }>;
  initializePresetCategories: (userId: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, error: 'Not authenticated' });
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // If no categories exist, initialize preset categories
      if (!data || data.length === 0) {
        await get().initializePresetCategories(user.id);
        return;
      }

      set({ categories: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
      });
    }
  },

  createCategory: async (category) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return { error: 'Not authenticated' };
      }

      // Check limite categorie custom per utenti FREE
      const { canUseFeature } = usePremiumStore.getState();
      const customCategories = get().categories.filter(c => !c.is_preset);

      if (!canUseFeature('unlimited_categories') && customCategories.length >= FREE_LIMITS.maxCategories) {
        set({ isLoading: false });
        return {
          error: `Hai raggiunto il limite di ${FREE_LIMITS.maxCategories} categorie custom. Passa a Premium per crearne altre!`,
          requiresPremium: true
        } as any;
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        categories: [...state.categories, data],
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  updateCategory: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        categories: state.categories.map((cat) => (cat.id === id ? data : cat)),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update category';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  deleteCategory: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  initializePresetCategories: async (userId: string) => {
    try {
      const categoriesToInsert = PRESET_CATEGORIES.map((cat) => ({
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_preset: true,
        is_active: true,
        order_index: cat.order_index,
      }));

      const { data, error } = await supabase
        .from('categories')
        .insert(categoriesToInsert)
        .select();

      if (error) throw error;

      set({ categories: data || [], isLoading: false });
    } catch (error) {
      console.error('Error initializing preset categories:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize categories',
      });
    }
  },

  getCategoryById: (id: string) => {
    return get().categories.find((cat) => cat.id === id);
  },
}));
