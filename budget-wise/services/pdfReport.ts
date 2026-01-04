import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { supabase } from './supabase';
import { brandColors } from '../constants/theme';
import { Transaction, Category, Goal, Profile } from '../types/database';

// Tipo per transazione con categoria
interface TransactionWithCategory extends Transaction {
  categories: Category | null;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface CategoryBreakdown {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface ReportData {
  year: number;
  userName: string;
  generatedAt: string;

  // Summary
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;

  // Monthly breakdown
  monthlyData: MonthlyData[];

  // Category breakdown
  categoryBreakdown: CategoryBreakdown[];
  topCategories: CategoryBreakdown[];

  // Goals
  goalsAchieved: number;
  goalsInProgress: number;

  // Gamification
  level: number;
  levelName: string;
  totalXP: number;
  badgesUnlocked: number;
  longestStreak: number;
}

/**
 * Genera i dati per il report annuale
 */
export const generateReportData = async (
  userId: string,
  year: number
): Promise<ReportData | null> => {
  try {
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 0, 1));

    // Fetch transazioni dell'anno
    const { data: transactionsData, error: txError } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: true });

    if (txError) throw txError;

    const transactions = (transactionsData || []) as TransactionWithCategory[];

    // Fetch profilo utente
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const profile = profileData as Profile | null;

    // Fetch goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    const goals = (goalsData || []) as Goal[];

    // Calcola totali
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals: Record<string, { amount: number; color: string; name: string }> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        const catName = tx.categories?.name || 'Altro';
        const catColor = tx.categories?.color || '#757575';
        if (!categoryTotals[catName]) {
          categoryTotals[catName] = { amount: 0, color: catColor, name: catName };
        }
        categoryTotals[catName].amount += tx.amount;
      }
    });

    const totalSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

    // Monthly breakdown
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const monthlyData: MonthlyData[] = months.map((month) => {
      const monthStr = format(month, 'yyyy-MM');
      const monthTransactions = transactions.filter(
        (tx) => tx.date.startsWith(monthStr)
      );

      const monthIncome = monthTransactions
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const monthExpenses = monthTransactions
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      return {
        month: format(month, 'MMM', { locale: it }),
        income: monthIncome,
        expenses: monthExpenses,
        savings: monthIncome - monthExpenses,
      };
    });

    // Category breakdown
    const categoryBreakdown: CategoryBreakdown[] = Object.values(categoryTotals)
      .map((cat) => ({
        name: cat.name,
        amount: cat.amount,
        percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
        color: cat.color,
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategories = categoryBreakdown.slice(0, 5);

    // Goals
    const goalsAchieved = goals.filter((g) => g.is_completed).length;
    const goalsInProgress = goals.filter((g) => !g.is_completed).length;

    return {
      year,
      userName: profile?.full_name || 'Utente',
      generatedAt: format(new Date(), 'dd MMMM yyyy', { locale: it }),
      totalIncome,
      totalExpenses,
      totalSavings,
      savingsRate,
      monthlyData,
      categoryBreakdown,
      topCategories,
      goalsAchieved,
      goalsInProgress,
      level: 1, // Da gamificationStore se disponibile
      levelName: 'Risparmiatore',
      totalXP: 0,
      badgesUnlocked: 0,
      longestStreak: 0,
    };
  } catch (error) {
    console.error('Error generating report data:', error);
    return null;
  }
};

/**
 * Genera l'HTML per il report PDF
 */
const generateReportHTML = (data: ReportData): string => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);

  // Generate bar chart SVG for monthly data
  const maxMonthlyValue = Math.max(
    ...data.monthlyData.map((m) => Math.max(m.income, m.expenses))
  );
  const barWidth = 20;
  const barGap = 10;
  const chartHeight = 150;
  const chartWidth = data.monthlyData.length * (barWidth * 2 + barGap * 2);

  const monthlyChartBars = data.monthlyData
    .map((m, i) => {
      const incomeHeight = maxMonthlyValue > 0 ? (m.income / maxMonthlyValue) * chartHeight : 0;
      const expenseHeight = maxMonthlyValue > 0 ? (m.expenses / maxMonthlyValue) * chartHeight : 0;
      const x = i * (barWidth * 2 + barGap * 2);

      return `
      <g>
        <rect x="${x}" y="${chartHeight - incomeHeight}" width="${barWidth}" height="${incomeHeight}" fill="${brandColors.success}" rx="2"/>
        <rect x="${x + barWidth + barGap / 2}" y="${chartHeight - expenseHeight}" width="${barWidth}" height="${expenseHeight}" fill="${brandColors.error}" rx="2"/>
        <text x="${x + barWidth}" y="${chartHeight + 15}" text-anchor="middle" font-size="10" fill="#666">${m.month}</text>
      </g>
    `;
    })
    .join('');

  // Generate pie chart SVG for categories
  let currentAngle = 0;
  const pieRadius = 80;
  const pieCenter = { x: 100, y: 100 };

  const pieSectors = data.topCategories
    .map((cat) => {
      const angle = (cat.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = pieCenter.x + pieRadius * Math.cos(startRad);
      const y1 = pieCenter.y + pieRadius * Math.sin(startRad);
      const x2 = pieCenter.x + pieRadius * Math.cos(endRad);
      const y2 = pieCenter.y + pieRadius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      return `<path d="M ${pieCenter.x} ${pieCenter.y} L ${x1} ${y1} A ${pieRadius} ${pieRadius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${cat.color}"/>`;
    })
    .join('');

  const categoryLegend = data.topCategories
    .map(
      (cat) => `
    <div style="display: flex; align-items: center; margin-bottom: 8px;">
      <div style="width: 12px; height: 12px; background: ${cat.color}; border-radius: 2px; margin-right: 8px;"></div>
      <span style="flex: 1;">${cat.name}</span>
      <span style="font-weight: 500;">${cat.percentage.toFixed(1)}%</span>
    </div>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #212121;
          line-height: 1.5;
          padding: 40px;
          background: #fff;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid ${brandColors.primary};
        }
        .header h1 {
          color: ${brandColors.primary};
          font-size: 28px;
          margin-bottom: 8px;
        }
        .header .subtitle {
          color: #666;
          font-size: 14px;
        }
        .section {
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: ${brandColors.primary};
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e0e0e0;
        }
        .summary-cards {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }
        .summary-card {
          flex: 1;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }
        .summary-card.income {
          background: ${brandColors.success}15;
          border: 1px solid ${brandColors.success}40;
        }
        .summary-card.expense {
          background: ${brandColors.error}15;
          border: 1px solid ${brandColors.error}40;
        }
        .summary-card.savings {
          background: ${brandColors.primary}15;
          border: 1px solid ${brandColors.primary}40;
        }
        .summary-card .label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: 700;
          margin-top: 4px;
        }
        .summary-card.income .value { color: ${brandColors.success}; }
        .summary-card.expense .value { color: ${brandColors.error}; }
        .summary-card.savings .value { color: ${brandColors.primary}; }
        .chart-container {
          display: flex;
          justify-content: center;
          margin: 24px 0;
        }
        .categories-container {
          display: flex;
          gap: 32px;
          align-items: center;
        }
        .pie-chart {
          flex-shrink: 0;
        }
        .category-legend {
          flex: 1;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .stat-item {
          text-align: center;
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .stat-item .value {
          font-size: 28px;
          font-weight: 700;
          color: ${brandColors.primary};
        }
        .stat-item .label {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 16px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Report Finanziario ${data.year}</h1>
        <div class="subtitle">
          ${data.userName} | Generato il ${data.generatedAt}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Riepilogo Annuale</div>
        <div class="summary-cards">
          <div class="summary-card income">
            <div class="label">Entrate Totali</div>
            <div class="value">${formatCurrency(data.totalIncome)}</div>
          </div>
          <div class="summary-card expense">
            <div class="label">Uscite Totali</div>
            <div class="value">${formatCurrency(data.totalExpenses)}</div>
          </div>
          <div class="summary-card savings">
            <div class="label">Risparmiato</div>
            <div class="value">${formatCurrency(data.totalSavings)}</div>
          </div>
        </div>
        <div style="text-align: center; color: #666;">
          Tasso di risparmio: <strong>${data.savingsRate.toFixed(1)}%</strong>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Andamento Mensile</div>
        <div class="chart-container">
          <svg width="${chartWidth}" height="${chartHeight + 30}" viewBox="0 0 ${chartWidth} ${chartHeight + 30}">
            ${monthlyChartBars}
          </svg>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-dot" style="background: ${brandColors.success}"></div>
            <span>Entrate</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: ${brandColors.error}"></div>
            <span>Uscite</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Spese per Categoria</div>
        <div class="categories-container">
          <div class="pie-chart">
            <svg width="200" height="200" viewBox="0 0 200 200">
              ${pieSectors}
              <circle cx="100" cy="100" r="40" fill="white"/>
            </svg>
          </div>
          <div class="category-legend">
            ${categoryLegend}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">I Tuoi Progressi</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="value">${data.goalsAchieved}</div>
            <div class="label">Obiettivi raggiunti</div>
          </div>
          <div class="stat-item">
            <div class="value">${data.goalsInProgress}</div>
            <div class="label">Obiettivi in corso</div>
          </div>
          <div class="stat-item">
            <div class="value">${data.savingsRate.toFixed(0)}%</div>
            <div class="label">Tasso di risparmio</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Report generato da FinanzaMi.pro</p>
        <p>La tua finanza personale, gamificata</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera e salva il report PDF
 */
export const generatePDF = async (
  userId: string,
  year: number
): Promise<{ uri: string | null; error: string | null }> => {
  try {
    // Genera i dati
    const data = await generateReportData(userId, year);

    if (!data) {
      return { uri: null, error: 'Impossibile generare i dati del report' };
    }

    // Genera HTML
    const html = generateReportHTML(data);

    // Genera PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Restituisci direttamente l'URI generato
    // (expo-print genera già un file con nome univoco)
    return { uri, error: null };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      uri: null,
      error: error instanceof Error ? error.message : 'Errore durante la generazione del PDF',
    };
  }
};

/**
 * Genera e condivide il report PDF
 */
export const generateAndSharePDF = async (
  userId: string,
  year: number
): Promise<{ error: string | null }> => {
  const { uri, error } = await generatePDF(userId, year);

  if (error || !uri) {
    return { error: error || 'Errore durante la generazione del PDF' };
  }

  try {
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      return { error: 'La condivisione non e disponibile su questo dispositivo' };
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Report FinanzaMi.pro ${year}`,
      UTI: 'com.adobe.pdf',
    });

    return { error: null };
  } catch (error) {
    console.error('Error sharing PDF:', error);
    return {
      error: error instanceof Error ? error.message : 'Errore durante la condivisione',
    };
  }
};

/**
 * Stampa direttamente il report
 */
export const printReport = async (
  userId: string,
  year: number
): Promise<{ error: string | null }> => {
  try {
    const data = await generateReportData(userId, year);

    if (!data) {
      return { error: 'Impossibile generare i dati del report' };
    }

    const html = generateReportHTML(data);

    await Print.printAsync({ html });

    return { error: null };
  } catch (error) {
    console.error('Error printing report:', error);
    return {
      error: error instanceof Error ? error.message : 'Errore durante la stampa',
    };
  }
};
