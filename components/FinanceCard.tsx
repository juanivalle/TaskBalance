import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFinance } from '@/hooks/finance-store';
import { formatCurrency } from '@/constants/currencies';
import { useTheme } from '@/hooks/theme-store';

interface FinanceCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
}

export function FinanceCard({ title, amount, icon, color, backgroundColor }: FinanceCardProps) {
  const { theme } = useTheme();
  const { currencySettings } = useFinance();
  
  const formatAmount = (value: number) => {
    return formatCurrency(value, currencySettings.baseCurrency);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.iconContainer, { backgroundColor }]}>
        {icon}
      </View>
      <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.amount, { color }]}>
        {formatAmount(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});