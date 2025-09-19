import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo } from 'react';
import { Transaction, CreateTransactionData, FinancialSummary, MonthlyData, Currency, CurrencySettings, HouseholdFinancialSummary, MemberContribution } from '@/types/finance';
import { useAuth } from './auth-store';
import { useHome } from './home-store';
import { DEFAULT_EXCHANGE_RATES, convertCurrency, fetchExchangeRates, shouldUpdateRates } from '@/constants/currencies';

const TRANSACTIONS_STORAGE_KEY = 'taskbalance_transactions';
const HOUSEHOLD_TRANSACTIONS_STORAGE_KEY = 'taskbalance_household_transactions';
const CURRENCY_SETTINGS_STORAGE_KEY = 'taskbalance_currency_settings';

export const [FinanceProvider, useFinance] = createContextHook(() => {
  const { user } = useAuth();
  const { currentHousehold } = useHome();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [householdTransactions, setHouseholdTransactions] = useState<Transaction[]>([]);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>({
    baseCurrency: 'UYU',
    exchangeRates: DEFAULT_EXCHANGE_RATES,
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      const loadAllData = async () => {
        setIsLoading(true);
        try {
          await Promise.all([loadData(), loadCurrencySettings()]);
          // Force update exchange rates on app start to get fresh data
          await updateExchangeRatesIfNeeded(true);
        } catch (error) {
          console.error('Error loading finance data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadAllData();
    } else {
      setTransactions([]);
      setCurrencySettings({
        baseCurrency: 'UYU',
        exchangeRates: DEFAULT_EXCHANGE_RATES,
        lastUpdated: new Date().toISOString(),
      });
      setIsLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load personal transactions
      const stored = await AsyncStorage.getItem(`${TRANSACTIONS_STORAGE_KEY}_${user?.id}`);
      const loadedTransactions = stored ? JSON.parse(stored) : [];
      
      // Migrar transacciones antiguas que no tienen moneda
      const migratedTransactions = loadedTransactions.map((t: any) => ({
        ...t,
        currency: t.currency || 'UYU',
        originalAmount: t.originalAmount || t.amount,
        originalCurrency: t.originalCurrency || t.currency || 'UYU',
        userId: t.userId || user?.id,
        userName: t.userName || user?.name,
        isShared: t.isShared || false,
      }));
      
      setTransactions(migratedTransactions);
      
      // Load household transactions if user is in a household
      if (currentHousehold) {
        const householdStored = await AsyncStorage.getItem(`${HOUSEHOLD_TRANSACTIONS_STORAGE_KEY}_${currentHousehold.id}`);
        const loadedHouseholdTransactions = householdStored ? JSON.parse(householdStored) : [];
        
        const migratedHouseholdTransactions = loadedHouseholdTransactions.map((t: any) => ({
          ...t,
          currency: t.currency || 'UYU',
          originalAmount: t.originalAmount || t.amount,
          originalCurrency: t.originalCurrency || t.currency || 'UYU',
          isShared: true,
          householdId: currentHousehold.id,
        }));
        
        setHouseholdTransactions(migratedHouseholdTransactions);
      } else {
        setHouseholdTransactions([]);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Error al cargar las transacciones');
      throw err;
    }
  };

  const loadCurrencySettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${CURRENCY_SETTINGS_STORAGE_KEY}_${user?.id}`);
      if (stored) {
        setCurrencySettings(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading currency settings:', err);
      throw err;
    }
  };

  const saveTransactions = async (newTransactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem(`${TRANSACTIONS_STORAGE_KEY}_${user?.id}`, JSON.stringify(newTransactions));
      setTransactions(newTransactions);
    } catch (err) {
      console.error('Error saving transactions:', err);
      throw new Error('Error al guardar las transacciones');
    }
  };
  
  const saveHouseholdTransactions = async (newTransactions: Transaction[]) => {
    try {
      if (!currentHousehold) throw new Error('No hay hogar seleccionado');
      await AsyncStorage.setItem(`${HOUSEHOLD_TRANSACTIONS_STORAGE_KEY}_${currentHousehold.id}`, JSON.stringify(newTransactions));
      setHouseholdTransactions(newTransactions);
    } catch (err) {
      console.error('Error saving household transactions:', err);
      throw new Error('Error al guardar las transacciones del hogar');
    }
  };

  const createTransaction = async (data: CreateTransactionData) => {
    try {
      // Convertir el monto a la moneda base si es necesario
      const convertedAmount = convertCurrency(
        data.amount,
        data.currency,
        currencySettings.baseCurrency,
        currencySettings.exchangeRates
      );
      
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: data.type,
        amount: convertedAmount,
        currency: currencySettings.baseCurrency,
        originalAmount: data.amount,
        originalCurrency: data.currency,
        description: data.description,
        category: data.category,
        date: data.date,
        userId: user?.id,
        userName: user?.name,
        isShared: data.isShared || false,
        householdId: data.isShared ? data.householdId : undefined,
      };
      
      if (data.isShared && currentHousehold) {
        // Save to household transactions
        const updatedHousehold = [newTransaction, ...householdTransactions];
        await saveHouseholdTransactions(updatedHousehold);
      } else {
        // Save to personal transactions
        const updated = [newTransaction, ...transactions];
        await saveTransactions(updated);
      }
      
      setError(null);
    } catch (err) {
      setError('Error al crear la transacción');
      throw err;
    }
  };

  const updateCurrencySettings = async (newSettings: Partial<CurrencySettings>) => {
    try {
      const updated = { ...currencySettings, ...newSettings, lastUpdated: new Date().toISOString() };
      await AsyncStorage.setItem(`${CURRENCY_SETTINGS_STORAGE_KEY}_${user?.id}`, JSON.stringify(updated));
      setCurrencySettings(updated);
    } catch (err) {
      console.error('Error saving currency settings:', err);
      throw new Error('Error al guardar la configuración de moneda');
    }
  };

  const updateExchangeRatesIfNeeded = async (force = false) => {
    try {
      if (force || shouldUpdateRates(currencySettings.lastUpdated)) {
        console.log('Updating exchange rates...');
        const newRates = await fetchExchangeRates();
        await updateCurrencySettings({ exchangeRates: newRates });
        console.log('Exchange rates updated:', newRates);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating exchange rates:', err);
      // Don't throw error, just log it - app should continue working with old rates
      return false;
    }
  };

  const updateTransaction = async (id: string, data: Partial<CreateTransactionData>) => {
    try {
      const updated = transactions.map(t => {
        if (t.id === id) {
          const convertedAmount = data.currency && data.amount ? 
            convertCurrency(
              data.amount,
              data.currency,
              currencySettings.baseCurrency,
              currencySettings.exchangeRates
            ) : t.amount;
          
          return {
            ...t,
            ...data,
            amount: convertedAmount,
            currency: currencySettings.baseCurrency,
            originalAmount: data.amount || t.originalAmount,
            originalCurrency: data.currency || t.originalCurrency,
          };
        }
        return t;
      });
      await saveTransactions(updated);
      setError(null);
    } catch (err) {
      setError('Error al actualizar la transacción');
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const updated = transactions.filter(t => t.id !== id);
      await saveTransactions(updated);
      setError(null);
    } catch (err) {
      setError('Error al eliminar la transacción');
      throw err;
    }
  };

  // Computed values
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);
  
  const sortedHouseholdTransactions = useMemo(() => {
    return [...householdTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [householdTransactions]);
  
  const allTransactions = useMemo(() => {
    return [...transactions, ...householdTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, householdTransactions]);

  const monthlyIncome = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);
  
  const householdMonthlyIncome = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return householdTransactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [householdTransactions]);

  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);
  
  const householdMonthlyExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return householdTransactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [householdTransactions]);

  const monthlyBalance = useMemo(() => {
    return monthlyIncome - monthlyExpenses;
  }, [monthlyIncome, monthlyExpenses]);

  const yearlyIncome = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const yearlyExpenses = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const summary: FinancialSummary = useMemo(() => {
    return {
      totalIncome: monthlyIncome,
      totalExpenses: monthlyExpenses,
      monthlySavings: monthlyBalance,
      annualSavings: yearlyIncome - yearlyExpenses,
    };
  }, [monthlyIncome, monthlyExpenses, monthlyBalance, yearlyIncome, yearlyExpenses]);

  const monthlyData: MonthlyData[] = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month,
        income,
        expenses,
        savings: income - expenses,
      };
    });
  }, [transactions]);
  
  const householdMonthlyData: MonthlyData[] = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthTransactions = householdTransactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month,
        income,
        expenses,
        savings: income - expenses,
      };
    });
  }, [householdTransactions]);
  
  const householdSummary: HouseholdFinancialSummary = useMemo(() => {
    if (!currentHousehold) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        monthlySavings: 0,
        annualSavings: 0,
        memberContributions: [],
      };
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate member contributions
    const memberContributions: MemberContribution[] = currentHousehold.members.map(member => {
      const memberTransactions = householdTransactions.filter(t => t.userId === member.userId);
      
      const monthlyIncome = memberTransactions
        .filter(t => {
          const date = new Date(t.date);
          return t.type === 'income' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
        
      const monthlyExpenses = memberTransactions
        .filter(t => {
          const date = new Date(t.date);
          return t.type === 'expense' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
        
      return {
        userId: member.userId,
        userName: member.name,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        balance: monthlyIncome - monthlyExpenses,
        percentage: 0, // Will be calculated below
      };
    });
    
    const totalHouseholdIncome = memberContributions.reduce((sum, m) => sum + m.income, 0);
    
    // Calculate percentages
    memberContributions.forEach(member => {
      member.percentage = totalHouseholdIncome > 0 ? (member.income / totalHouseholdIncome) * 100 : 0;
    });
    
    return {
      totalIncome: householdMonthlyIncome,
      totalExpenses: householdMonthlyExpenses,
      monthlySavings: householdMonthlyIncome - householdMonthlyExpenses,
      annualSavings: 0, // TODO: Calculate annual savings
      memberContributions,
    };
  }, [currentHousehold, householdTransactions, householdMonthlyIncome, householdMonthlyExpenses]);

  const clearError = () => setError(null);

  return {
    transactions: sortedTransactions,
    householdTransactions: sortedHouseholdTransactions,
    allTransactions,
    monthlyIncome,
    monthlyExpenses,
    monthlyBalance,
    householdMonthlyIncome,
    householdMonthlyExpenses,
    yearlyIncome,
    yearlyExpenses,
    summary,
    householdSummary,
    monthlyData,
    householdMonthlyData,
    currencySettings,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateCurrencySettings,
    updateExchangeRatesIfNeeded,
    forceUpdateExchangeRates: () => updateExchangeRatesIfNeeded(true),
    isLoading,
    error,
    clearError,
  };
});