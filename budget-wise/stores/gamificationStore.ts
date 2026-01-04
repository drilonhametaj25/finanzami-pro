import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, differenceInDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
  ACHIEVEMENTS,
  Achievement,
  AchievementStats,
  LEVELS,
  getLevel,
  XP_REWARDS,
  HEALTH_SCORE_WEIGHTS,
} from '../constants/gamification';

interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

interface GamificationState {
  // State
  level: number;
  experiencePoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  healthScore: number;
  unlockedAchievements: UnlockedAchievement[];
  monthlyChallenge: MonthlyChallenge | null;

  // Actions
  addXP: (amount: number, reason: string) => void;
  updateStreak: () => void;
  checkAchievements: (stats: AchievementStats) => Achievement[];
  calculateHealthScore: (stats: HealthScoreInput) => number;
  setMonthlyChallenge: (challenge: MonthlyChallenge) => void;
  updateChallengeProgress: (progress: number) => void;
  getStats: () => GamificationStats;
}

interface MonthlyChallenge {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  type: 'save' | 'reduce_category' | 'no_impulse' | 'track_daily';
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  xpReward: number;
}

interface HealthScoreInput {
  savingsRate: number; // 0-100
  budgetUsed: number; // 0-100+
  goalProgress: number; // 0-100
  currentStreak: number;
  hasInvestments: boolean;
  hasMultipleIncomes: boolean;
}

interface GamificationStats {
  level: number;
  levelName: string;
  xp: number;
  xpToNextLevel: number;
  xpProgress: number;
  streak: number;
  longestStreak: number;
  healthScore: number;
  totalBadges: number;
  unlockedBadges: number;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      level: 1,
      experiencePoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      healthScore: 50,
      unlockedAchievements: [],
      monthlyChallenge: null,

      addXP: (amount, reason) => {
        set((state) => {
          const newXP = state.experiencePoints + amount;
          const newLevel = getLevel(newXP);

          return {
            experiencePoints: newXP,
            level: newLevel.level,
          };
        });
      },

      updateStreak: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { lastActivityDate, currentStreak, longestStreak } = get();

        if (lastActivityDate === today) {
          // Already logged today
          return;
        }

        if (!lastActivityDate) {
          // First activity
          set({
            currentStreak: 1,
            longestStreak: Math.max(1, longestStreak),
            lastActivityDate: today,
          });
          return;
        }

        const daysSinceLastActivity = differenceInDays(
          new Date(today),
          parseISO(lastActivityDate)
        );

        if (daysSinceLastActivity === 1) {
          // Consecutive day
          const newStreak = currentStreak + 1;
          set({
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, longestStreak),
            lastActivityDate: today,
          });

          // XP bonus for streaks
          if (newStreak % 7 === 0) {
            get().addXP(XP_REWARDS.weeklyStreak, 'Weekly streak');
          }
          if (newStreak % 30 === 0) {
            get().addXP(XP_REWARDS.monthlyStreak, 'Monthly streak');
          }
        } else if (daysSinceLastActivity > 1) {
          // Streak broken
          set({
            currentStreak: 1,
            lastActivityDate: today,
          });
        }
      },

      checkAchievements: (stats) => {
        const { unlockedAchievements, addXP } = get();
        const newlyUnlocked: Achievement[] = [];

        ACHIEVEMENTS.forEach((achievement) => {
          const alreadyUnlocked = unlockedAchievements.some(
            (a) => a.id === achievement.id
          );

          if (!alreadyUnlocked && achievement.condition(stats)) {
            newlyUnlocked.push(achievement);
          }
        });

        if (newlyUnlocked.length > 0) {
          const newUnlocked = newlyUnlocked.map((a) => ({
            id: a.id,
            unlockedAt: new Date().toISOString(),
          }));

          set((state) => ({
            unlockedAchievements: [...state.unlockedAchievements, ...newUnlocked],
          }));

          // Add XP for each achievement
          newlyUnlocked.forEach((a) => {
            addXP(a.xpReward, `Achievement: ${a.name}`);
          });
        }

        return newlyUnlocked;
      },

      calculateHealthScore: (input) => {
        let score = 0;

        // Savings rate (0-30 points)
        // 20%+ savings = full points, linear scale below
        const savingsPoints = Math.min(
          HEALTH_SCORE_WEIGHTS.savingsRate,
          (input.savingsRate / 20) * HEALTH_SCORE_WEIGHTS.savingsRate
        );
        score += savingsPoints;

        // Budget adherence (0-25 points)
        // Under 100% = full points, decreasing above
        if (input.budgetUsed <= 100) {
          score += HEALTH_SCORE_WEIGHTS.budgetAdherence;
        } else if (input.budgetUsed <= 120) {
          score += HEALTH_SCORE_WEIGHTS.budgetAdherence * 0.5;
        } else {
          score += 0;
        }

        // Goal progress (0-20 points)
        const goalPoints = (input.goalProgress / 100) * HEALTH_SCORE_WEIGHTS.goalProgress;
        score += goalPoints;

        // Consistency/streak (0-15 points)
        // 30 days = full points
        const streakPoints = Math.min(
          HEALTH_SCORE_WEIGHTS.consistency,
          (input.currentStreak / 30) * HEALTH_SCORE_WEIGHTS.consistency
        );
        score += streakPoints;

        // Diversification (0-10 points)
        let diversificationPoints = 0;
        if (input.hasInvestments) diversificationPoints += 5;
        if (input.hasMultipleIncomes) diversificationPoints += 5;
        score += diversificationPoints;

        const finalScore = Math.round(score);

        set({ healthScore: finalScore });

        return finalScore;
      },

      setMonthlyChallenge: (challenge) => {
        set({ monthlyChallenge: challenge });
      },

      updateChallengeProgress: (progress) => {
        set((state) => {
          if (!state.monthlyChallenge) return state;

          const isCompleted = progress >= state.monthlyChallenge.targetAmount;

          if (isCompleted && !state.monthlyChallenge.isCompleted) {
            // Award XP for completing challenge
            get().addXP(state.monthlyChallenge.xpReward, 'Monthly challenge completed');
          }

          return {
            monthlyChallenge: {
              ...state.monthlyChallenge,
              currentAmount: progress,
              isCompleted,
            },
          };
        });
      },

      getStats: () => {
        const state = get();
        const currentLevel = LEVELS.find((l) => l.level === state.level) || LEVELS[0];
        const nextLevel = LEVELS.find((l) => l.level === state.level + 1);

        const xpInCurrentLevel = state.experiencePoints - currentLevel.minXP;
        const xpNeededForLevel = nextLevel
          ? nextLevel.minXP - currentLevel.minXP
          : currentLevel.maxXP - currentLevel.minXP;

        return {
          level: state.level,
          levelName: currentLevel.name,
          xp: state.experiencePoints,
          xpToNextLevel: nextLevel ? nextLevel.minXP - state.experiencePoints : 0,
          xpProgress: xpNeededForLevel > 0 ? xpInCurrentLevel / xpNeededForLevel : 1,
          streak: state.currentStreak,
          longestStreak: state.longestStreak,
          healthScore: state.healthScore,
          totalBadges: ACHIEVEMENTS.length,
          unlockedBadges: state.unlockedAchievements.length,
        };
      },
    }),
    {
      name: 'gamification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Monthly challenge templates
export const MONTHLY_CHALLENGES = [
  {
    id: 'save-200',
    title: 'Risparmia €200',
    description: 'Metti da parte €200 questo mese',
    targetAmount: 200,
    type: 'save' as const,
    xpReward: 100,
  },
  {
    id: 'reduce-dining',
    title: 'Riduci i Ristoranti',
    description: 'Spendi il 30% in meno in ristoranti',
    targetAmount: 30,
    type: 'reduce_category' as const,
    xpReward: 75,
  },
  {
    id: 'track-daily',
    title: 'Tracker Quotidiano',
    description: 'Registra almeno una transazione ogni giorno',
    targetAmount: 30,
    type: 'track_daily' as const,
    xpReward: 150,
  },
  {
    id: 'no-impulse',
    title: 'Zero Acquisti Impulsivi',
    description: 'Nessun acquisto sopra €50 non pianificato',
    targetAmount: 0,
    type: 'no_impulse' as const,
    xpReward: 100,
  },
];
