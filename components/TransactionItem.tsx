import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { TrendingUp, TrendingDown, Trash2, Edit3, Users } from 'lucide-react-native';
import { useFinance } from '@/hooks/finance-store';
import { formatCurrency } from '@/constants/currencies';
import type { Transaction } from '@/types/finance';
import { useTheme } from '@/hooks/theme-store';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: () => void;
}

export function TransactionItem({ transaction, onEdit }: TransactionItemProps) {
  const { theme } = useTheme();
  const { deleteTransaction } = useFinance();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Movimiento',
      `¿Estás seguro de que quieres eliminar este ${transaction.type === 'income' ? 'ingreso' : 'egreso'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el movimiento');
            }
          },
        },
      ]
    );
  };

  const isIncome = transaction.type === 'income';

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.border }]}>
          {isIncome ? (
            <TrendingUp size={20} color="#10B981" />
          ) : (
            <TrendingDown size={20} color="#EF4444" />
          )}
        </View>

        <View style={styles.details}>
          <Text style={[styles.description, { color: theme.colors.text }]}>{transaction.description}</Text>
          <View style={styles.metadata}>
            <Text style={[styles.date, { color: theme.colors.textSecondary }]}>{formatDate(transaction.date)}</Text>
            {transaction.category && (
              <>
                <Text style={[styles.separator, { color: theme.colors.textSecondary }]}>•</Text>
                <Text style={[styles.category, { color: theme.colors.textSecondary }]}>{transaction.category}</Text>
              </>
            )}
            {transaction.isShared && (
              <>
                <Text style={[styles.separator, { color: theme.colors.textSecondary }]}>•</Text>
                <View style={styles.sharedIndicator}>
                  <Users size={12} color={theme.colors.primary} />
                  <Text style={[styles.sharedText, { color: theme.colors.primary }]}>Hogar</Text>
                </View>
              </>
            )}
            {transaction.userName && transaction.isShared && (
              <>
                <Text style={[styles.separator, { color: theme.colors.textSecondary }]}>•</Text>
                <Text style={[styles.userName, { color: theme.colors.textSecondary }]}>{transaction.userName}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: isIncome ? '#10B981' : '#EF4444' }]}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
          </Text>
          {transaction.originalCurrency !== transaction.currency && (
            <Text style={[styles.originalAmount, { color: theme.colors.textSecondary }]}>
              {formatCurrency(transaction.originalAmount, transaction.originalCurrency)}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Edit3 size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Trash2 size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
  },
  separator: {
    fontSize: 12,
    marginHorizontal: 6,
  },
  category: {
    fontSize: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  originalAmount: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  sharedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sharedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});