import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ScenarioType = 'save_more' | 'reduce_expense' | 'new_income' | 'goal_acceleration';

export interface SavedScenario {
  id: string;
  name: string;
  type: ScenarioType;
  amount: number;
  months: number;
  goalId?: string;
  goalName?: string;
  createdAt: string;
  // Results snapshot
  results: {
    title: string;
    metrics: {
      label: string;
      current: number;
      new: number;
      positive: boolean;
    }[];
    insight: string;
  };
}

interface ScenarioState {
  savedScenarios: SavedScenario[];
  comparisonScenarios: string[]; // IDs of scenarios being compared

  // Actions
  saveScenario: (scenario: Omit<SavedScenario, 'id' | 'createdAt'>) => void;
  deleteScenario: (id: string) => void;
  updateScenarioName: (id: string, name: string) => void;
  addToComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
  getComparisonScenarios: () => SavedScenario[];
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      savedScenarios: [],
      comparisonScenarios: [],

      saveScenario: (scenario) => {
        const newScenario: SavedScenario = {
          ...scenario,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          savedScenarios: [newScenario, ...state.savedScenarios],
        }));
      },

      deleteScenario: (id) => {
        set((state) => ({
          savedScenarios: state.savedScenarios.filter((s) => s.id !== id),
          comparisonScenarios: state.comparisonScenarios.filter((sId) => sId !== id),
        }));
      },

      updateScenarioName: (id, name) => {
        set((state) => ({
          savedScenarios: state.savedScenarios.map((s) =>
            s.id === id ? { ...s, name } : s
          ),
        }));
      },

      addToComparison: (id) => {
        set((state) => {
          if (state.comparisonScenarios.includes(id)) return state;
          if (state.comparisonScenarios.length >= 3) {
            // Max 3 scenarios for comparison
            return {
              comparisonScenarios: [...state.comparisonScenarios.slice(1), id],
            };
          }
          return {
            comparisonScenarios: [...state.comparisonScenarios, id],
          };
        });
      },

      removeFromComparison: (id) => {
        set((state) => ({
          comparisonScenarios: state.comparisonScenarios.filter((sId) => sId !== id),
        }));
      },

      clearComparison: () => {
        set({ comparisonScenarios: [] });
      },

      getComparisonScenarios: () => {
        const { savedScenarios, comparisonScenarios } = get();
        return comparisonScenarios
          .map((id) => savedScenarios.find((s) => s.id === id))
          .filter(Boolean) as SavedScenario[];
      },
    }),
    {
      name: 'scenario-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
