import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMonths, addYears, format, differenceInDays, parseISO } from 'date-fns';

// Subscription categories
export interface SubscriptionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget: number | null;
}

export const SUBSCRIPTION_CATEGORIES: SubscriptionCategory[] = [
  { id: 'streaming', name: 'Streaming', icon: 'play-circle', color: '#E50914', budget: null },
  { id: 'music', name: 'Musica', icon: 'music', color: '#1DB954', budget: null },
  { id: 'gaming', name: 'Gaming', icon: 'gamepad-variant', color: '#107C10', budget: null },
  { id: 'software', name: 'Software', icon: 'laptop', color: '#00A4EF', budget: null },
  { id: 'cloud', name: 'Cloud Storage', icon: 'cloud', color: '#4285F4', budget: null },
  { id: 'fitness', name: 'Fitness', icon: 'dumbbell', color: '#FF5722', budget: null },
  { id: 'news', name: 'News & Media', icon: 'newspaper', color: '#424242', budget: null },
  { id: 'productivity', name: 'Produttività', icon: 'briefcase', color: '#9C27B0', budget: null },
  { id: 'insurance', name: 'Assicurazioni', icon: 'shield-check', color: '#607D8B', budget: null },
  { id: 'other', name: 'Altro', icon: 'dots-horizontal', color: '#9E9E9E', budget: null },
];

export interface Subscription {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate: string;
  categoryId: string | null;
  reminderDaysBefore: number;
  isActive: boolean;
  lastUsedAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface CategoryBudget {
  categoryId: string;
  budget: number;
}

interface SubscriptionState {
  subscriptions: Subscription[];
  categoryBudgets: CategoryBudget[];
  isLoading: boolean;

  // Actions
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  markAsUsed: (id: string) => void;
  setCategoryBudget: (categoryId: string, budget: number) => void;
  removeCategoryBudget: (categoryId: string) => void;
  getMonthlyTotal: () => number;
  getYearlyTotal: () => number;
  getMonthlyTotalByCategory: (categoryId: string) => number;
  getCategorySpending: () => { categoryId: string; spent: number; budget: number | null }[];
  getUpcomingRenewals: (days: number) => Subscription[];
  getUnusedSubscriptions: (daysSinceUsed: number) => Subscription[];
}

// Popular subscription presets with categories
export const SUBSCRIPTION_PRESETS = [
  { name: 'Netflix', icon: 'netflix', color: '#E50914', amount: 15.99, categoryId: 'streaming' },
  { name: 'Spotify', icon: 'spotify', color: '#1DB954', amount: 10.99, categoryId: 'music' },
  { name: 'Amazon Prime', icon: 'amazon', color: '#FF9900', amount: 4.99, categoryId: 'streaming' },
  { name: 'Disney+', icon: 'disney-plus', color: '#113CCF', amount: 8.99, categoryId: 'streaming' },
  { name: 'YouTube Premium', icon: 'youtube', color: '#FF0000', amount: 11.99, categoryId: 'streaming' },
  { name: 'Apple Music', icon: 'apple', color: '#FC3C44', amount: 10.99, categoryId: 'music' },
  { name: 'iCloud', icon: 'apple-icloud', color: '#3693F3', amount: 2.99, categoryId: 'cloud' },
  { name: 'Google One', icon: 'google-drive', color: '#4285F4', amount: 1.99, categoryId: 'cloud' },
  { name: 'Microsoft 365', icon: 'microsoft', color: '#00A4EF', amount: 7, categoryId: 'software' },
  { name: 'PlayStation Plus', icon: 'sony-playstation', color: '#003791', amount: 8.99, categoryId: 'gaming' },
  { name: 'Xbox Game Pass', icon: 'microsoft-xbox', color: '#107C10', amount: 12.99, categoryId: 'gaming' },
  { name: 'Gym', icon: 'dumbbell', color: '#FF5722', amount: 30, categoryId: 'fitness' },
  { name: 'Assicurazione Auto', icon: 'car', color: '#607D8B', amount: 50, categoryId: 'insurance' },
];

const getMonthlyEquivalent = (amount: number, frequency: Subscription['frequency']) => {
  switch (frequency) {
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
  }
};

const getNextBillingDate = (currentDate: string, frequency: Subscription['frequency']) => {
  const date = parseISO(currentDate);
  switch (frequency) {
    case 'monthly':
      return format(addMonths(date, 1), 'yyyy-MM-dd');
    case 'quarterly':
      return format(addMonths(date, 3), 'yyyy-MM-dd');
    case 'yearly':
      return format(addYears(date, 1), 'yyyy-MM-dd');
  }
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      categoryBudgets: [],
      isLoading: false,

      addSubscription: (sub) => {
        const newSub: Subscription = {
          ...sub,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          subscriptions: [...state.subscriptions, newSub],
        }));
      },

      updateSubscription: (id, updates) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        }));
      },

      markAsUsed: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, lastUsedAt: new Date().toISOString() } : s
          ),
        }));
      },

      getMonthlyTotal: () => {
        const { subscriptions } = get();
        return subscriptions
          .filter((s) => s.isActive)
          .reduce((total, s) => total + getMonthlyEquivalent(s.amount, s.frequency), 0);
      },

      getYearlyTotal: () => {
        return get().getMonthlyTotal() * 12;
      },

      getUpcomingRenewals: (days) => {
        const today = new Date();
        return get()
          .subscriptions.filter((s) => {
            if (!s.isActive) return false;
            const billingDate = parseISO(s.nextBillingDate);
            const daysUntil = differenceInDays(billingDate, today);
            return daysUntil >= 0 && daysUntil <= days;
          })
          .sort((a, b) =>
            parseISO(a.nextBillingDate).getTime() - parseISO(b.nextBillingDate).getTime()
          );
      },

      getUnusedSubscriptions: (daysSinceUsed) => {
        const today = new Date();
        return get().subscriptions.filter((s) => {
          if (!s.isActive || !s.lastUsedAt) return !s.lastUsedAt && s.isActive;
          const lastUsed = parseISO(s.lastUsedAt);
          return differenceInDays(today, lastUsed) > daysSinceUsed;
        });
      },

      setCategoryBudget: (categoryId, budget) => {
        set((state) => {
          const existing = state.categoryBudgets.find((b) => b.categoryId === categoryId);
          if (existing) {
            return {
              categoryBudgets: state.categoryBudgets.map((b) =>
                b.categoryId === categoryId ? { ...b, budget } : b
              ),
            };
          }
          return {
            categoryBudgets: [...state.categoryBudgets, { categoryId, budget }],
          };
        });
      },

      removeCategoryBudget: (categoryId) => {
        set((state) => ({
          categoryBudgets: state.categoryBudgets.filter((b) => b.categoryId !== categoryId),
        }));
      },

      getMonthlyTotalByCategory: (categoryId) => {
        const { subscriptions } = get();
        return subscriptions
          .filter((s) => s.isActive && s.categoryId === categoryId)
          .reduce((total, s) => total + getMonthlyEquivalent(s.amount, s.frequency), 0);
      },

      getCategorySpending: () => {
        const { subscriptions, categoryBudgets } = get();
        const spending: Record<string, number> = {};

        // Calculate spending per category
        subscriptions
          .filter((s) => s.isActive && s.categoryId)
          .forEach((s) => {
            const catId = s.categoryId!;
            spending[catId] = (spending[catId] || 0) + getMonthlyEquivalent(s.amount, s.frequency);
          });

        // Build result with budgets
        return SUBSCRIPTION_CATEGORIES.map((cat) => {
          const budgetEntry = categoryBudgets.find((b) => b.categoryId === cat.id);
          return {
            categoryId: cat.id,
            spent: spending[cat.id] || 0,
            budget: budgetEntry?.budget || null,
          };
        }).filter((c) => c.spent > 0 || c.budget !== null);
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
