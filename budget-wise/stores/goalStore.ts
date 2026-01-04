import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Goal, InsertTables, UpdateTables } from '../types/database';
import { usePremiumStore, FREE_LIMITS } from './premiumStore';

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGoals: () => Promise<void>;
  createGoal: (goal: Omit<InsertTables<'goals'>, 'user_id'>) => Promise<{ error: string | null; data?: Goal }>;
  updateGoal: (id: string, updates: UpdateTables<'goals'>) => Promise<{ error: string | null }>;
  deleteGoal: (id: string) => Promise<{ error: string | null }>;
  addToGoal: (id: string, amount: number) => Promise<{ error: string | null }>;
  getGoalById: (id: string) => Goal | undefined;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, error: 'Not authenticated' });
        return;
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('is_completed', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ goals: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching goals:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch goals',
      });
    }
  },

  createGoal: async (goal) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return { error: 'Not authenticated' };
      }

      // Check limite obiettivi per utenti FREE
      const { canUseFeature } = usePremiumStore.getState();
      const currentGoals = get().goals.filter(g => !g.is_completed);

      if (!canUseFeature('unlimited_goals') && currentGoals.length >= FREE_LIMITS.maxGoals) {
        set({ isLoading: false });
        return {
          error: `Hai raggiunto il limite di ${FREE_LIMITS.maxGoals} obiettivo. Passa a Premium per crearne altri!`,
          requiresPremium: true
        } as any;
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goal,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        goals: [data, ...state.goals],
        isLoading: false,
      }));

      return { error: null, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create goal';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  updateGoal: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? data : g)),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update goal';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  deleteGoal: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete goal';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  addToGoal: async (id, amount) => {
    try {
      set({ isLoading: true, error: null });

      const goal = get().goals.find((g) => g.id === id);
      if (!goal) {
        set({ isLoading: false });
        return { error: 'Goal not found' };
      }

      const newAmount = goal.current_amount + amount;
      const isCompleted = newAmount >= goal.target_amount;

      const { data, error } = await supabase
        .from('goals')
        .update({
          current_amount: newAmount,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? data : g)),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add to goal';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  getGoalById: (id: string) => {
    return get().goals.find((g) => g.id === id);
  },
}));
