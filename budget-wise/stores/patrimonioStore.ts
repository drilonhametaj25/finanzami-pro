import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

// Simple investment types
export type InvestmentType = 'etf' | 'stocks' | 'bonds' | 'crypto' | 'real_estate' | 'other';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  icon: string;
  color: string;
  totalInvested: number;
  currentValue: number;
  lastUpdatedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface InvestmentTransaction {
  id: string;
  investmentId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  date: string;
  notes: string | null;
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'cash';
  balance: number;
  icon: string;
  color: string;
  isPrimary: boolean;
}

interface PatrimonioState {
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  bankAccounts: BankAccount[];
  debts: Debt[];
  isLoading: boolean;

  // Investment actions
  addInvestment: (inv: Omit<Investment, 'id' | 'createdAt' | 'lastUpdatedAt'>) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  addToInvestment: (investmentId: string, amount: number, notes?: string) => void;
  withdrawFromInvestment: (investmentId: string, amount: number, notes?: string) => void;
  updateInvestmentValue: (id: string, newValue: number) => void;

  // Bank account actions
  addBankAccount: (account: Omit<BankAccount, 'id'>) => void;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;

  // Debt actions
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;

  // Calculations
  getTotalInvestments: () => number;
  getTotalInvested: () => number;
  getInvestmentPerformance: () => number;
  getTotalBankBalance: () => number;
  getTotalDebts: () => number;
  getNetWorth: () => number;
  getAssetAllocation: () => { type: string; value: number; percentage: number }[];
}

export interface Debt {
  id: string;
  name: string;
  type: 'mortgage' | 'loan' | 'credit_card' | 'other';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  icon: string;
  color: string;
}

const INVESTMENT_TYPE_CONFIG: Record<InvestmentType, { icon: string; color: string }> = {
  etf: { icon: 'chart-line', color: '#2196F3' },
  stocks: { icon: 'chart-areaspline', color: '#4CAF50' },
  bonds: { icon: 'file-document', color: '#FF9800' },
  crypto: { icon: 'bitcoin', color: '#F7931A' },
  real_estate: { icon: 'home-city', color: '#795548' },
  other: { icon: 'cash-multiple', color: '#9C27B0' },
};

export const usePatrimonioStore = create<PatrimonioState>()(
  persist(
    (set, get) => ({
      investments: [],
      investmentTransactions: [],
      bankAccounts: [],
      debts: [],
      isLoading: false,

      // Investment actions
      addInvestment: (inv) => {
        const config = INVESTMENT_TYPE_CONFIG[inv.type];
        const newInv: Investment = {
          ...inv,
          id: Date.now().toString(),
          icon: inv.icon || config.icon,
          color: inv.color || config.color,
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        };
        set((state) => ({
          investments: [...state.investments, newInv],
        }));
      },

      updateInvestment: (id, updates) => {
        set((state) => ({
          investments: state.investments.map((i) =>
            i.id === id
              ? { ...i, ...updates, lastUpdatedAt: new Date().toISOString() }
              : i
          ),
        }));
      },

      deleteInvestment: (id) => {
        set((state) => ({
          investments: state.investments.filter((i) => i.id !== id),
          investmentTransactions: state.investmentTransactions.filter(
            (t) => t.investmentId !== id
          ),
        }));
      },

      addToInvestment: (investmentId, amount, notes) => {
        const transaction: InvestmentTransaction = {
          id: Date.now().toString(),
          investmentId,
          amount,
          type: 'deposit',
          date: format(new Date(), 'yyyy-MM-dd'),
          notes: notes || null,
        };

        set((state) => ({
          investmentTransactions: [...state.investmentTransactions, transaction],
          investments: state.investments.map((i) =>
            i.id === investmentId
              ? {
                  ...i,
                  totalInvested: i.totalInvested + amount,
                  currentValue: i.currentValue + amount,
                  lastUpdatedAt: new Date().toISOString(),
                }
              : i
          ),
        }));
      },

      withdrawFromInvestment: (investmentId, amount, notes) => {
        const transaction: InvestmentTransaction = {
          id: Date.now().toString(),
          investmentId,
          amount,
          type: 'withdrawal',
          date: format(new Date(), 'yyyy-MM-dd'),
          notes: notes || null,
        };

        set((state) => ({
          investmentTransactions: [...state.investmentTransactions, transaction],
          investments: state.investments.map((i) =>
            i.id === investmentId
              ? {
                  ...i,
                  totalInvested: Math.max(0, i.totalInvested - amount),
                  currentValue: Math.max(0, i.currentValue - amount),
                  lastUpdatedAt: new Date().toISOString(),
                }
              : i
          ),
        }));
      },

      updateInvestmentValue: (id, newValue) => {
        set((state) => ({
          investments: state.investments.map((i) =>
            i.id === id
              ? { ...i, currentValue: newValue, lastUpdatedAt: new Date().toISOString() }
              : i
          ),
        }));
      },

      // Bank account actions
      addBankAccount: (account) => {
        const newAccount: BankAccount = {
          ...account,
          id: Date.now().toString(),
        };
        set((state) => ({
          bankAccounts: [...state.bankAccounts, newAccount],
        }));
      },

      updateBankAccount: (id, updates) => {
        set((state) => ({
          bankAccounts: state.bankAccounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      deleteBankAccount: (id) => {
        set((state) => ({
          bankAccounts: state.bankAccounts.filter((a) => a.id !== id),
        }));
      },

      // Debt actions
      addDebt: (debt) => {
        set((state) => ({
          debts: [...state.debts, { ...debt, id: Date.now().toString() }],
        }));
      },

      updateDebt: (id, updates) => {
        set((state) => ({
          debts: state.debts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        }));
      },

      deleteDebt: (id) => {
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
        }));
      },

      // Calculations
      getTotalInvestments: () => {
        return get().investments.reduce((sum, i) => sum + i.currentValue, 0);
      },

      getTotalInvested: () => {
        return get().investments.reduce((sum, i) => sum + i.totalInvested, 0);
      },

      getInvestmentPerformance: () => {
        const { getTotalInvestments, getTotalInvested } = get();
        const current = getTotalInvestments();
        const invested = getTotalInvested();
        if (invested === 0) return 0;
        return ((current - invested) / invested) * 100;
      },

      getTotalBankBalance: () => {
        return get().bankAccounts.reduce((sum, a) => sum + a.balance, 0);
      },

      getTotalDebts: () => {
        return get().debts.reduce((sum, d) => sum + d.remainingAmount, 0);
      },

      getNetWorth: () => {
        const { getTotalInvestments, getTotalBankBalance, getTotalDebts } = get();
        return getTotalBankBalance() + getTotalInvestments() - getTotalDebts();
      },

      getAssetAllocation: () => {
        const { investments, bankAccounts } = get();
        const total =
          investments.reduce((sum, i) => sum + i.currentValue, 0) +
          bankAccounts.reduce((sum, a) => sum + a.balance, 0);

        if (total === 0) return [];

        const allocation: { type: string; value: number; percentage: number }[] = [];

        // Bank accounts as "Liquidità"
        const cashTotal = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
        if (cashTotal > 0) {
          allocation.push({
            type: 'Liquidità',
            value: cashTotal,
            percentage: (cashTotal / total) * 100,
          });
        }

        // Group investments by type
        const investmentByType: Record<string, number> = {};
        investments.forEach((i) => {
          const typeLabel = getInvestmentTypeLabel(i.type);
          investmentByType[typeLabel] = (investmentByType[typeLabel] || 0) + i.currentValue;
        });

        Object.entries(investmentByType).forEach(([type, value]) => {
          allocation.push({
            type,
            value,
            percentage: (value / total) * 100,
          });
        });

        return allocation.sort((a, b) => b.value - a.value);
      },
    }),
    {
      name: 'patrimonio-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const getInvestmentTypeLabel = (type: InvestmentType): string => {
  const labels: Record<InvestmentType, string> = {
    etf: 'ETF',
    stocks: 'Azioni',
    bonds: 'Obbligazioni',
    crypto: 'Crypto',
    real_estate: 'Immobili',
    other: 'Altro',
  };
  return labels[type];
};

export const getInvestmentTypeConfig = (type: InvestmentType) => {
  return INVESTMENT_TYPE_CONFIG[type];
};
