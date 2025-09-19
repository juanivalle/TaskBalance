import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, PiggyBank, Users } from 'lucide-react-native';
import type { HouseholdFinancialSummary } from '@/types/finance';
import { useFinance } from '@/hooks/finance-store';
import { useHome } from '@/hooks/home-store';
import { CURRENCIES } from '@/constants/currencies';
import { useTheme } from '@/hooks/theme-store';

interface HouseholdFinanceCardProps {
  summary: HouseholdFinancialSummary;
}

export function HouseholdFinanceCard({ summary }: HouseholdFinanceCardProps) {
  const { currencySettings } = useFinance();
  const { currentHousehold } = useHome();
  const { theme } = useTheme();
  const currency = CURRENCIES[currencySettings.baseCurrency];

  if (!currentHousehold) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <Users size={24} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Finanzas del Hogar - {currentHousehold.name}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <TrendingUp size={20} color="#10B981" />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Ingresos del Mes</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {currency.symbol} {summary.totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <TrendingDown size={20} color="#EF4444" />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Gastos del Mes</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>
              {currency.symbol} {summary.totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <PiggyBank size={20} color={summary.monthlySavings >= 0 ? '#10B981' : '#EF4444'} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Balance Mensual</Text>
            <Text style={[styles.statValue, { color: summary.monthlySavings >= 0 ? '#10B981' : '#EF4444' }]}>
              {currency.symbol} {summary.monthlySavings.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Household Member Contributions */}
      {summary.memberContributions.length > 0 && (
        <View style={styles.contributionsSection}>
          <Text style={[styles.contributionsTitle, { color: theme.colors.text }]}>
            Contribuciones por Miembro
          </Text>
          {summary.memberContributions.map((member) => (
            <View key={member.userId} style={[styles.memberContribution, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.colors.text }]}>{member.userName}</Text>
                <Text style={[styles.memberPercentage, { color: theme.colors.primary }]}>
                  {member.percentage.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.memberStats}>
                <View style={styles.memberStatItem}>
                  <Text style={styles.memberStatLabel}>Ingresos</Text>
                  <Text style={[styles.memberStat, { color: '#10B981' }]}>
                    +{currency.symbol} {member.income.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.memberStatItem}>
                  <Text style={styles.memberStatLabel}>Gastos</Text>
                  <Text style={[styles.memberStat, { color: '#EF4444' }]}>
                    -{currency.symbol} {member.expenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.memberStatItem}>
                  <Text style={styles.memberStatLabel}>Balance</Text>
                  <Text style={[styles.memberStat, { color: member.balance >= 0 ? '#10B981' : '#EF4444' }]}>
                    {currency.symbol} {member.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statsContainer: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  contributionsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  contributionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  memberContribution: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
  },
  memberPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memberStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  memberStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  memberStat: {
    fontSize: 13,
    fontWeight: '500',
  },
});