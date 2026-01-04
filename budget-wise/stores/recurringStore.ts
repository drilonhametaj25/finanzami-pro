import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { RecurringTransaction, InsertTables, UpdateTables } from '../types/database';
import { addMonths, addDays, addYears, format, parseISO, isPast, isToday } from 'date-fns';

interface RecurringState {
  recurringTransactions: RecurringTransaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRecurring: () => Promise<void>;
  createRecurring: (recurring: Omit<InsertTables<'recurring_transactions'>, 'user_id'>) => Promise<{ error: string | null; data?: RecurringTransaction }>;
  updateRecurring: (id: string, updates: UpdateTables<'recurring_transactions'>) => Promise<{ error: string | null }>;
  deleteRecurring: (id: string) => Promise<{ error: string | null }>;
  markAsPaid: (id: string) => Promise<{ error: string | null }>;
  getUpcoming: (days?: number) => RecurringTransaction[];
  getOverdue: () => RecurringTransaction[];
}

const getNextDate = (currentDate: string, frequency: 'monthly' | 'quarterly' | 'yearly'): string => {
  const date = parseISO(currentDate);
  let nextDate: Date;

  switch (frequency) {
    case 'monthly':
      nextDate = addMonths(date, 1);
      break;
    case 'quarterly':
      nextDate = addMonths(date, 3);
      break;
    case 'yearly':
      nextDate = addYears(date, 1);
      break;
    default:
      nextDate = addMonths(date, 1);
  }

  return format(nextDate, 'yyyy-MM-dd');
};

export const useRecurringStore = create<RecurringState>((set, get) => ({
  recurringTransactions: [],
  isLoading: false,
  error: null,

  fetchRecurring: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, error: 'Not authenticated' });
        return;
      }

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('next_date', { ascending: true });

      if (error) throw error;

      set({ recurringTransactions: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recurring transactions',
      });
    }
  },

  createRecurring: async (recurring) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return { error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          ...recurring,
          user_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        recurringTransactions: [...state.recurringTransactions, data].sort(
          (a, b) => a.next_date.localeCompare(b.next_date)
        ),
        isLoading: false,
      }));

      return { error: null, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create recurring transaction';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  updateRecurring: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        recurringTransactions: state.recurringTransactions
          .map((r) => (r.id === id ? data : r))
          .sort((a, b) => a.next_date.localeCompare(b.next_date)),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update recurring transaction';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  deleteRecurring: async (id) => {
    try {
      set({ isLoading: true, error: null });

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        recurringTransactions: state.recurringTransactions.filter((r) => r.id !== id),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete recurring transaction';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  markAsPaid: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const recurring = get().recurringTransactions.find((r) => r.id === id);
      if (!recurring) {
        set({ isLoading: false });
        return { error: 'Recurring transaction not found' };
      }

      // Calculate next date
      const nextDate = getNextDate(recurring.next_date, recurring.frequency);

      // Update the recurring transaction with new next_date
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({ next_date: nextDate })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Also create a transaction record
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          category_id: recurring.category_id,
          amount: recurring.amount,
          type: 'expense',
          description: recurring.description,
          date: recurring.next_date,
          is_recurring: true,
          recurring_id: recurring.id,
        });
      }

      set((state) => ({
        recurringTransactions: state.recurringTransactions
          .map((r) => (r.id === id ? data : r))
          .sort((a, b) => a.next_date.localeCompare(b.next_date)),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark as paid';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  getUpcoming: (days = 7) => {
    const { recurringTransactions } = get();
    const today = new Date();
    const futureDate = addDays(today, days);

    return recurringTransactions.filter((r) => {
      const nextDate = parseISO(r.next_date);
      return nextDate >= today && nextDate <= futureDate;
    });
  },

  getOverdue: () => {
    const { recurringTransactions } = get();
    const today = new Date();

    return recurringTransactions.filter((r) => {
      const nextDate = parseISO(r.next_date);
      return isPast(nextDate) && !isToday(nextDate);
    });
  },
}));
