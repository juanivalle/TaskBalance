import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { TrendingUp, TrendingDown, Calendar } from 'lucide-react-native';
import { useFinance } from '@/hooks/finance-store';
import { formatCurrency } from '@/constants/currencies';
import { useTheme } from '@/hooks/theme-store';

export default function SavingsScreen() {
  const { theme } = useTheme();
  const { monthlyData, summary, currencySettings } = useFinance();

  const formatAmount = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return formatCurrency(0, currencySettings.baseCurrency);
    return formatCurrency(Math.abs(value), currencySettings.baseCurrency);
  };

  const currentMonth = new Date().getMonth();
  const monthsWithData = monthlyData.filter(month => 
    month.income > 0 || month.expenses > 0
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Ahorros</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Seguimiento anual</Text>
        </View>

        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, summary.annualSavings >= 0 ? styles.positive : styles.negative]}>
            <View style={styles.summaryHeader}>
              <Calendar size={24} color="white" />
              <Text style={styles.summaryTitle}>Ahorro Anual</Text>
            </View>
            <Text style={styles.summaryAmount}>
              {summary.annualSavings >= 0 ? '+' : '-'}{formatAmount(summary.annualSavings)}
            </Text>
          </View>
        </View>

        <View style={styles.monthlyContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ahorros por Mes</Text>
          
          {monthsWithData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No hay datos de ahorros aún</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Agrega transacciones para ver tu progreso</Text>
            </View>
          ) : (
            monthlyData.map((month, index) => {
              if (month.income === 0 && month.expenses === 0) return null;
              
              const isCurrentMonth = index === currentMonth;
              
              return (
                <View key={month.month} style={[styles.monthCard, { backgroundColor: theme.colors.surface }, isCurrentMonth && styles.currentMonthCard]}>
                  <View style={styles.monthHeader}>
                    <Text style={[styles.monthName, { color: theme.colors.text }, isCurrentMonth && styles.currentMonthText]}>
                      {month.month}
                      {isCurrentMonth && ' (Actual)'}
                    </Text>
                    <View style={styles.monthSavings}>
                      {month.savings >= 0 ? (
                        <TrendingUp size={16} color="#10B981" />
                      ) : (
                        <TrendingDown size={16} color="#EF4444" />
                      )}
                      <Text style={[
                        styles.monthSavingsAmount,
                        month.savings >= 0 ? styles.positiveAmount : styles.negativeAmount
                      ]}>
                        {month.savings >= 0 ? '+' : ''}{formatAmount(month.savings)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.monthDetails}>
                    <View style={styles.monthDetailItem}>
                      <Text style={[styles.monthDetailLabel, { color: theme.colors.textSecondary }]}>Ingresos:</Text>
                      <Text style={styles.incomeAmount}>+{formatAmount(month.income)}</Text>
                    </View>
                    <View style={styles.monthDetailItem}>
                      <Text style={[styles.monthDetailLabel, { color: theme.colors.textSecondary }]}>Gastos:</Text>
                      <Text style={styles.expenseAmount}>-{formatAmount(month.expenses)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.tipsContainer}>
          <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>Consejos de Ahorro</Text>
          <View style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.tipText, { color: theme.colors.text }]}>
              💡 Intenta ahorrar al menos el 20% de tus ingresos mensuales
            </Text>
          </View>
          <View style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.tipText, { color: theme.colors.text }]}>
              📊 Revisa tus gastos regularmente para identificar áreas de mejora
            </Text>
          </View>
          <View style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.tipText, { color: theme.colors.text }]}>
              🎯 Establece metas de ahorro específicas para mantenerte motivado
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  positive: {
    backgroundColor: '#10B981',
  },
  negative: {
    backgroundColor: '#EF4444',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  monthlyContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  monthCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentMonthCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentMonthText: {
    color: '#3B82F6',
  },
  monthSavings: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthSavingsAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  monthDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthDetailItem: {
    flex: 1,
  },
  monthDetailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  tipsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tipCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});