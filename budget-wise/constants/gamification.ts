// Level definitions
export const LEVELS = [
  { level: 1, name: 'Principiante', minXP: 0, maxXP: 100 },
  { level: 2, name: 'Apprendista', minXP: 100, maxXP: 250 },
  { level: 3, name: 'Risparmiatore', minXP: 250, maxXP: 500 },
  { level: 4, name: 'Pianificatore', minXP: 500, maxXP: 1000 },
  { level: 5, name: 'Esperto', minXP: 1000, maxXP: 2000 },
  { level: 6, name: 'Maestro', minXP: 2000, maxXP: 4000 },
  { level: 7, name: 'Guru Finanziario', minXP: 4000, maxXP: 8000 },
  { level: 8, name: 'Leggenda', minXP: 8000, maxXP: Infinity },
];

// XP rewards for actions
export const XP_REWARDS = {
  addTransaction: 5,
  addIncome: 10,
  stayUnderBudget: 50, // Monthly
  reachGoal: 100,
  addToGoal: 10,
  dailyLogin: 5,
  weeklyStreak: 25,
  monthlyStreak: 100,
  setMonthlyBudget: 20,
  setCategoryBudget: 10,
  firstTransaction: 50,
  firstGoal: 50,
};

// Achievement definitions
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'savings' | 'goals' | 'streaks' | 'transactions' | 'special';
  xpReward: number;
  condition: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  currentStreak: number;
  longestStreak: number;
  goalsCompleted: number;
  goalsTotal: number;
  monthsUnderBudget: number;
  categoriesWithBudget: number;
  totalSaved: number;
  investmentTotal: number;
  subscriptionsManaged: number;
  daysActive: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Savings achievements
  {
    id: 'first-save',
    name: 'Primo Risparmio',
    description: 'Hai risparmiato per la prima volta!',
    icon: 'piggy-bank',
    color: '#4CAF50',
    category: 'savings',
    xpReward: 50,
    condition: (s) => s.totalSaved > 0,
  },
  {
    id: 'saver-100',
    name: 'Risparmiatore €100',
    description: 'Hai risparmiato €100 in totale',
    icon: 'cash-100',
    color: '#4CAF50',
    category: 'savings',
    xpReward: 100,
    condition: (s) => s.totalSaved >= 100,
  },
  {
    id: 'saver-1000',
    name: 'Risparmiatore €1.000',
    description: 'Hai risparmiato €1.000 in totale',
    icon: 'treasure-chest',
    color: '#FFD700',
    category: 'savings',
    xpReward: 250,
    condition: (s) => s.totalSaved >= 1000,
  },
  {
    id: 'saver-10000',
    name: 'Risparmiatore €10.000',
    description: 'Hai risparmiato €10.000 in totale!',
    icon: 'crown',
    color: '#FFD700',
    category: 'savings',
    xpReward: 500,
    condition: (s) => s.totalSaved >= 10000,
  },
  {
    id: 'savings-rate-20',
    name: 'Obiettivo 20%',
    description: 'Tasso di risparmio del 20% per un mese',
    icon: 'percent',
    color: '#2196F3',
    category: 'savings',
    xpReward: 75,
    condition: (s) => s.savingsRate >= 20,
  },
  {
    id: 'savings-rate-50',
    name: 'Super Risparmiatore',
    description: 'Tasso di risparmio del 50% per un mese',
    icon: 'rocket',
    color: '#9C27B0',
    category: 'savings',
    xpReward: 150,
    condition: (s) => s.savingsRate >= 50,
  },

  // Goals achievements
  {
    id: 'first-goal',
    name: 'Primo Obiettivo',
    description: 'Hai creato il tuo primo obiettivo',
    icon: 'target',
    color: '#FF9800',
    category: 'goals',
    xpReward: 50,
    condition: (s) => s.goalsTotal >= 1,
  },
  {
    id: 'goal-achieved',
    name: 'Obiettivo Raggiunto!',
    description: 'Hai completato il tuo primo obiettivo',
    icon: 'trophy',
    color: '#FFD700',
    category: 'goals',
    xpReward: 100,
    condition: (s) => s.goalsCompleted >= 1,
  },
  {
    id: 'goal-master',
    name: 'Maestro degli Obiettivi',
    description: 'Hai completato 5 obiettivi',
    icon: 'medal',
    color: '#FFD700',
    category: 'goals',
    xpReward: 250,
    condition: (s) => s.goalsCompleted >= 5,
  },

  // Streak achievements
  {
    id: 'streak-7',
    name: 'Una Settimana!',
    description: '7 giorni consecutivi di tracking',
    icon: 'fire',
    color: '#FF5722',
    category: 'streaks',
    xpReward: 50,
    condition: (s) => s.currentStreak >= 7,
  },
  {
    id: 'streak-30',
    name: 'Un Mese Intero!',
    description: '30 giorni consecutivi di tracking',
    icon: 'fire',
    color: '#FF5722',
    category: 'streaks',
    xpReward: 150,
    condition: (s) => s.currentStreak >= 30,
  },
  {
    id: 'streak-100',
    name: 'Inarrestabile!',
    description: '100 giorni consecutivi di tracking',
    icon: 'lightning-bolt',
    color: '#FF5722',
    category: 'streaks',
    xpReward: 500,
    condition: (s) => s.currentStreak >= 100,
  },
  {
    id: 'streak-365',
    name: 'Un Anno di Dedizione',
    description: '365 giorni consecutivi!',
    icon: 'star-circle',
    color: '#FFD700',
    category: 'streaks',
    xpReward: 1000,
    condition: (s) => s.currentStreak >= 365,
  },

  // Transaction achievements
  {
    id: 'first-transaction',
    name: 'Prima Transazione',
    description: 'Hai registrato la tua prima transazione',
    icon: 'receipt',
    color: '#607D8B',
    category: 'transactions',
    xpReward: 25,
    condition: (s) => s.totalTransactions >= 1,
  },
  {
    id: 'transactions-100',
    name: 'Tracker Esperto',
    description: '100 transazioni registrate',
    icon: 'counter',
    color: '#607D8B',
    category: 'transactions',
    xpReward: 100,
    condition: (s) => s.totalTransactions >= 100,
  },
  {
    id: 'transactions-1000',
    name: 'Tracker Leggendario',
    description: '1000 transazioni registrate',
    icon: 'infinity',
    color: '#9C27B0',
    category: 'transactions',
    xpReward: 500,
    condition: (s) => s.totalTransactions >= 1000,
  },
  {
    id: 'budget-master',
    name: 'Maestro del Budget',
    description: 'Budget impostato su 5+ categorie',
    icon: 'chart-pie',
    color: '#3F51B5',
    category: 'transactions',
    xpReward: 75,
    condition: (s) => s.categoriesWithBudget >= 5,
  },

  // Special achievements
  {
    id: 'under-budget-3',
    name: 'Sotto Budget x3',
    description: '3 mesi consecutivi sotto budget',
    icon: 'shield-check',
    color: '#4CAF50',
    category: 'special',
    xpReward: 200,
    condition: (s) => s.monthsUnderBudget >= 3,
  },
  {
    id: 'investor',
    name: 'Investitore',
    description: 'Hai iniziato a investire',
    icon: 'trending-up',
    color: '#00BCD4',
    category: 'special',
    xpReward: 100,
    condition: (s) => s.investmentTotal > 0,
  },
  {
    id: 'subscription-tracker',
    name: 'Cacciatore di Abbonamenti',
    description: 'Hai tracciato 5+ abbonamenti',
    icon: 'calendar-sync',
    color: '#E91E63',
    category: 'special',
    xpReward: 75,
    condition: (s) => s.subscriptionsManaged >= 5,
  },
];

// Health score calculation weights
export const HEALTH_SCORE_WEIGHTS = {
  savingsRate: 30, // 0-30 points based on savings rate (20%+ = full points)
  budgetAdherence: 25, // 0-25 points based on staying under budget
  goalProgress: 20, // 0-20 points based on goal progress
  consistency: 15, // 0-15 points based on streak
  diversification: 10, // 0-10 points based on income/investment diversification
};

export const getLevel = (xp: number) => {
  return LEVELS.find((l) => xp >= l.minXP && xp < l.maxXP) || LEVELS[LEVELS.length - 1];
};

export const getNextLevel = (currentLevel: number) => {
  return LEVELS.find((l) => l.level === currentLevel + 1);
};

export const getXPProgress = (xp: number) => {
  const level = getLevel(xp);
  const progress = (xp - level.minXP) / (level.maxXP - level.minXP);
  return Math.min(progress, 1);
};
