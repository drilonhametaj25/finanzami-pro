import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMonths, addYears, format, differenceInDays, parseISO } from 'date-fns';

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

interface SubscriptionState {
  subscriptions: Subscription[];
  isLoading: boolean;

  // Actions
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  markAsUsed: (id: string) => void;
  getMonthlyTotal: () => number;
  getYearlyTotal: () => number;
  getUpcomingRenewals: (days: number) => Subscription[];
  getUnusedSubscriptions: (daysSinceUsed: number) => Subscription[];
}

// Popular subscription presets
export const SUBSCRIPTION_PRESETS = [
  { name: 'Netflix', icon: 'netflix', color: '#E50914', amount: 15.99 },
  { name: 'Spotify', icon: 'spotify', color: '#1DB954', amount: 10.99 },
  { name: 'Amazon Prime', icon: 'amazon', color: '#FF9900', amount: 4.99 },
  { name: 'Disney+', icon: 'disney-plus', color: '#113CCF', amount: 8.99 },
  { name: 'YouTube Premium', icon: 'youtube', color: '#FF0000', amount: 11.99 },
  { name: 'Apple Music', icon: 'apple', color: '#FC3C44', amount: 10.99 },
  { name: 'iCloud', icon: 'apple-icloud', color: '#3693F3', amount: 2.99 },
  { name: 'Google One', icon: 'google-drive', color: '#4285F4', amount: 1.99 },
  { name: 'Microsoft 365', icon: 'microsoft', color: '#00A4EF', amount: 7 },
  { name: 'PlayStation Plus', icon: 'sony-playstation', color: '#003791', amount: 8.99 },
  { name: 'Xbox Game Pass', icon: 'microsoft-xbox', color: '#107C10', amount: 12.99 },
  { name: 'Gym', icon: 'dumbbell', color: '#FF5722', amount: 30 },
  { name: 'Assicurazione Auto', icon: 'car', color: '#607D8B', amount: 50 },
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
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
