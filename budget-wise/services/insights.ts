import { Transaction, Category, Goal, Insight } from '../types/database';
import { InsightType, InsightAction, BudgetProgress } from '../types';
import { BUDGET_THRESHOLDS, IDEAL_SAVINGS_RATE } from '../constants';
import { startOfMonth, endOfMonth, subMonths, differenceInDays, parseISO, isWeekend } from 'date-fns';

interface InsightData {
  type: InsightType;
  message: string;
  priority: 'high' | 'medium' | 'low';
  action?: InsightAction;
  categoryId?: string;
}

export class InsightService {
  private transactions: Transaction[];
  private categories: Category[];
  private goals: Goal[];
  private monthlyBudget: number;
  private currency: string;

  constructor(
    transactions: Transaction[],
    categories: Category[],
    goals: Goal[],
    monthlyBudget: number,
    currency: string = 'EUR'
  ) {
    this.transactions = transactions;
    this.categories = categories;
    this.goals = goals;
    this.monthlyBudget = monthlyBudget;
    this.currency = currency;
  }

  generateAllInsights(): InsightData[] {
    const insights: InsightData[] = [];

    // Budget alerts
    insights.push(...this.generateBudgetAlerts());

    // Spending pattern insights
    insights.push(...this.generatePatternInsights());

    // Goal insights
    insights.push(...this.generateGoalInsights());

    // Financial health insights
    insights.push(...this.generateHealthInsights());

    // Waste detection
    insights.push(...this.generateWasteInsights());

    // Motivational insights
    insights.push(...this.generateMotivationalInsights());

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  private generateBudgetAlerts(): InsightData[] {
    const insights: InsightData[] = [];
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Calculate monthly spending
    const monthlyExpenses = this.transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd
      )
      .reduce((sum, t) => sum + t.amount, 0);

    if (this.monthlyBudget > 0) {
      const percentage = (monthlyExpenses / this.monthlyBudget) * 100;

      if (percentage >= 100) {
        insights.push({
          type: 'budget_alert',
          message: `Hai superato il budget mensile! Speso: €${monthlyExpenses.toFixed(0)} su €${this.monthlyBudget.toFixed(0)}.`,
          priority: 'high',
          action: {
            type: 'navigate',
            label: 'Vedi dettagli',
            data: { screen: 'stats' },
          },
        });
      } else if (percentage >= BUDGET_THRESHOLDS.DANGER) {
        insights.push({
          type: 'budget_alert',
          message: `Attenzione! Hai usato il ${percentage.toFixed(0)}% del budget mensile. Rimangono €${(this.monthlyBudget - monthlyExpenses).toFixed(0)}.`,
          priority: 'high',
        });
      } else if (percentage >= BUDGET_THRESHOLDS.WARNING) {
        insights.push({
          type: 'budget_alert',
          message: `Sei al ${percentage.toFixed(0)}% del budget. Rallenta le spese per finire il mese in positivo.`,
          priority: 'medium',
        });
      }
    }

    // Per-category budget alerts
    this.categories
      .filter((c) => c.budget && c.budget > 0)
      .forEach((category) => {
        const categorySpending = this.transactions
          .filter(
            (t) =>
              t.type === 'expense' &&
              t.category_id === category.id &&
              new Date(t.date) >= monthStart &&
              new Date(t.date) <= monthEnd
          )
          .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (categorySpending / category.budget!) * 100;

        if (percentage >= 100) {
          insights.push({
            type: 'budget_alert',
            message: `Budget "${category.name}" superato! Considera di ridurre le spese in questa categoria.`,
            priority: 'high',
            categoryId: category.id,
          });
        } else if (percentage >= BUDGET_THRESHOLDS.DANGER) {
          insights.push({
            type: 'budget_alert',
            message: `Budget "${category.name}" quasi esaurito (${percentage.toFixed(0)}%).`,
            priority: 'medium',
            categoryId: category.id,
          });
        }
      });

    return insights;
  }

  private generatePatternInsights(): InsightData[] {
    const insights: InsightData[] = [];
    const now = new Date();
    const lastMonth = subMonths(now, 1);

    // Compare with last month
    const thisMonthExpenses = this.getMonthlyExpenses(now);
    const lastMonthExpenses = this.getMonthlyExpenses(lastMonth);

    if (lastMonthExpenses > 0) {
      const changePercent = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;

      if (changePercent > 20) {
        insights.push({
          type: 'pattern_temporal',
          message: `Le spese di questo mese sono ${changePercent.toFixed(0)}% piu alte del mese scorso. Verifica dove stai spendendo di piu.`,
          priority: 'medium',
        });
      } else if (changePercent < -20) {
        insights.push({
          type: 'pattern_temporal',
          message: `Ottimo! Stai spendendo ${Math.abs(changePercent).toFixed(0)}% in meno rispetto al mese scorso.`,
          priority: 'low',
        });
      }
    }

    // Weekend vs weekday spending
    const weekendExpenses = this.transactions
      .filter((t) => t.type === 'expense' && isWeekend(parseISO(t.date)))
      .reduce((sum, t) => sum + t.amount, 0);

    const weekdayExpenses = this.transactions
      .filter((t) => t.type === 'expense' && !isWeekend(parseISO(t.date)))
      .reduce((sum, t) => sum + t.amount, 0);

    const weekendTransactions = this.transactions.filter(
      (t) => t.type === 'expense' && isWeekend(parseISO(t.date))
    ).length;
    const weekdayTransactions = this.transactions.filter(
      (t) => t.type === 'expense' && !isWeekend(parseISO(t.date))
    ).length;

    if (weekendTransactions > 0 && weekdayTransactions > 0) {
      const avgWeekend = weekendExpenses / weekendTransactions;
      const avgWeekday = weekdayExpenses / weekdayTransactions;

      if (avgWeekend > avgWeekday * 1.5) {
        insights.push({
          type: 'pattern_temporal',
          message: `Nel weekend spendi in media il 50% in piu. Pianifica le uscite per risparmiare.`,
          priority: 'low',
        });
      }
    }

    return insights;
  }

  private generateGoalInsights(): InsightData[] {
    const insights: InsightData[] = [];

    this.goals
      .filter((g) => !g.is_completed)
      .forEach((goal) => {
        const remaining = goal.target_amount - goal.current_amount;
        const percentage = (goal.current_amount / goal.target_amount) * 100;

        // Goal at risk
        if (goal.target_date) {
          const daysRemaining = differenceInDays(new Date(goal.target_date), new Date());
          if (daysRemaining > 0 && daysRemaining < 30 && percentage < 80) {
            insights.push({
              type: 'goal_progress',
              message: `L'obiettivo "${goal.name}" potrebbe non essere raggiunto in tempo. Mancano €${remaining.toFixed(0)} e ${daysRemaining} giorni.`,
              priority: 'high',
            });
          }
        }

        // Goal almost complete
        if (percentage >= 90 && percentage < 100) {
          insights.push({
            type: 'goal_progress',
            message: `Quasi fatto! Mancano solo €${remaining.toFixed(0)} per completare "${goal.name}".`,
            priority: 'low',
          });
        }
      });

    return insights;
  }

  private generateHealthInsights(): InsightData[] {
    const insights: InsightData[] = [];
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlyIncome = this.transactions
      .filter(
        (t) =>
          t.type === 'income' &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = this.transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd
      )
      .reduce((sum, t) => sum + t.amount, 0);

    if (monthlyIncome > 0) {
      const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;

      if (savingsRate < 0) {
        insights.push({
          type: 'financial_health',
          message: `Stai spendendo piu di quanto guadagni questo mese. Rivedi le spese non essenziali.`,
          priority: 'high',
        });
      } else if (savingsRate < 10) {
        insights.push({
          type: 'financial_health',
          message: `Il tuo tasso di risparmio e solo del ${savingsRate.toFixed(0)}%. Prova a raggiungere almeno il 20%.`,
          priority: 'medium',
        });
      } else if (savingsRate >= IDEAL_SAVINGS_RATE) {
        insights.push({
          type: 'financial_health',
          message: `Ottimo tasso di risparmio: ${savingsRate.toFixed(0)}%! Stai gestendo bene le tue finanze.`,
          priority: 'low',
        });
      }
    }

    return insights;
  }

  private generateWasteInsights(): InsightData[] {
    const insights: InsightData[] = [];

    // Find frequent small expenses (potential waste)
    const smallExpenses = this.transactions.filter(
      (t) => t.type === 'expense' && t.amount < 10
    );

    if (smallExpenses.length > 20) {
      const totalSmall = smallExpenses.reduce((sum, t) => sum + t.amount, 0);
      insights.push({
        type: 'waste_detection',
        message: `Hai fatto ${smallExpenses.length} micro-spese sotto €10, per un totale di €${totalSmall.toFixed(0)}. Queste piccole spese si accumulano!`,
        priority: 'medium',
      });
    }

    // Find top spending category with potential savings
    const categoryTotals = this.categories.map((cat) => ({
      ...cat,
      total: this.transactions
        .filter((t) => t.type === 'expense' && t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0),
    }));

    const topCategory = categoryTotals.sort((a, b) => b.total - a.total)[0];
    if (topCategory && topCategory.total > 0) {
      insights.push({
        type: 'waste_detection',
        message: `"${topCategory.name}" e la tua categoria con piu spese (€${topCategory.total.toFixed(0)}). Valuta se puoi ottimizzare.`,
        priority: 'low',
        categoryId: topCategory.id,
      });
    }

    return insights;
  }

  private generateMotivationalInsights(): InsightData[] {
    const insights: InsightData[] = [];

    // Completed goals celebration
    const recentlyCompleted = this.goals.filter(
      (g) =>
        g.is_completed &&
        g.completed_at &&
        differenceInDays(new Date(), new Date(g.completed_at)) <= 7
    );

    recentlyCompleted.forEach((goal) => {
      insights.push({
        type: 'motivational',
        message: `Complimenti! Hai raggiunto l'obiettivo "${goal.name}"! Continua cosi!`,
        priority: 'low',
      });
    });

    return insights;
  }

  private getMonthlyExpenses(date: Date): number {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    return this.transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }
}

export const generateInsights = (
  transactions: Transaction[],
  categories: Category[],
  goals: Goal[],
  monthlyBudget: number,
  currency?: string
): InsightData[] => {
  const service = new InsightService(
    transactions,
    categories,
    goals,
    monthlyBudget,
    currency
  );
  return service.generateAllInsights();
};
