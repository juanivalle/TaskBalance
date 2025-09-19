export type Currency = 'UYU' | 'USD' | 'EUR';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: Currency;
  originalAmount: number;
  originalCurrency: Currency;
  category?: string;
  description: string;
  date: string;
  userId?: string;
  userName?: string;
  householdId?: string;
  isShared?: boolean;
}

export interface CreateTransactionData {
  type: 'income' | 'expense';
  amount: number;
  currency: Currency;
  description: string;
  category?: string;
  date: string;
  isShared?: boolean;
  householdId?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  monthlySavings: number;
  annualSavings: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CurrencySettings {
  baseCurrency: Currency;
  exchangeRates: Record<Currency, number>;
  lastUpdated: string;
}

export interface HouseholdFinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  monthlySavings: number;
  annualSavings: number;
  memberContributions: MemberContribution[];
}

export interface MemberContribution {
  userId: string;
  userName: string;
  income: number;
  expenses: number;
  balance: number;
  percentage: number;
}