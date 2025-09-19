import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Users, User } from 'lucide-react-native';
import { useFinance } from '@/hooks/finance-store';
import { useHome } from '@/hooks/home-store';
import { formatCurrency } from '@/constants/currencies';
import { FinanceCard } from '@/components/FinanceCard';
import { HouseholdFinanceCard } from '@/components/HouseholdFinanceCard';
import { TransactionItem } from '@/components/TransactionItem';
import { CreateTransactionModal } from '@/components/CreateTransactionModal';
import { useTheme } from '@/hooks/theme-store';


export default function FinanceScreen() {
  const { theme } = useTheme();
  const {
    transactions,
    householdTransactions,
    allTransactions,
    monthlyIncome,
    monthlyExpenses,
    monthlyBalance,
    householdMonthlyIncome,
    householdMonthlyExpenses,
    yearlyIncome,
    yearlyExpenses,
    householdSummary,
    currencySettings,
    isLoading,
    error,
  } = useFinance();
  const { currentHousehold } = useHome();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'personal' | 'household'>('personal');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currencySettings.baseCurrency);
  };

  const currentMonth = new Date().toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const displayTransactions = viewMode === 'household' ? householdTransactions : transactions;
  const displayIncome = viewMode === 'household' ? householdMonthlyIncome : monthlyIncome;
  const displayExpenses = viewMode === 'household' ? householdMonthlyExpenses : monthlyExpenses;
  const displayBalance = displayIncome - displayExpenses;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* View Mode Toggle */}
        {currentHousehold && (
          <View style={styles.section}>
            <View style={styles.viewModeContainer}>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'personal' && styles.viewModeButtonActive,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
                ]}
                onPress={() => setViewMode('personal')}
              >
                <User size={20} color={viewMode === 'personal' ? theme.colors.primary : theme.colors.textSecondary} />
                <Text style={[
                  styles.viewModeText,
                  { color: viewMode === 'personal' ? theme.colors.primary : theme.colors.textSecondary }
                ]}>Personal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'household' && styles.viewModeButtonActive,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
                ]}
                onPress={() => setViewMode('household')}
              >
                <Users size={20} color={viewMode === 'household' ? theme.colors.primary : theme.colors.textSecondary} />
                <Text style={[
                  styles.viewModeText,
                  { color: viewMode === 'household' ? theme.colors.primary : theme.colors.textSecondary }
                ]}>Hogar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Household Finance Summary */}
        {viewMode === 'household' && currentHousehold && (
          <View style={styles.section}>
            <HouseholdFinanceCard summary={householdSummary} />
            
            {/* Household Finance Sharing Info */}
            <View style={[styles.sharingInfoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.sharingHeader}>
                <Users size={20} color={theme.colors.primary} />
                <Text style={[styles.sharingTitle, { color: theme.colors.text }]}>Finanzas Compartidas</Text>
              </View>
              <Text style={[styles.sharingDescription, { color: theme.colors.textSecondary }]}>
                Las finanzas del hogar combinan los movimientos individuales de todos los miembros marcados como &quot;compartidos&quot;. 
                Esto permite tener una vista unificada de los ingresos y gastos familiares.
              </Text>
              <View style={styles.sharingStats}>
                <View style={styles.sharingStat}>
                  <Text style={[styles.sharingStatLabel, { color: theme.colors.textSecondary }]}>Miembros activos</Text>
                  <Text style={[styles.sharingStatValue, { color: theme.colors.text }]}>
                    {currentHousehold.members.length}
                  </Text>
                </View>
                <View style={styles.sharingStat}>
                  <Text style={[styles.sharingStatLabel, { color: theme.colors.textSecondary }]}>Movimientos compartidos</Text>
                  <Text style={[styles.sharingStatValue, { color: theme.colors.text }]}>
                    {householdTransactions.length}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        {/* Monthly Summary */}
        {viewMode === 'personal' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Resumen de {currentMonth}</Text>
            </View>
            
            <View style={styles.summaryCards}>
              <FinanceCard
                title="Ingresos"
                amount={displayIncome}
                icon={<TrendingUp size={24} color="#10B981" />}
                color="#10B981"
                backgroundColor="#ECFDF5"
              />
              <FinanceCard
                title="Egresos"
                amount={displayExpenses}
                icon={<TrendingDown size={24} color="#EF4444" />}
                color="#EF4444"
                backgroundColor="#FEF2F2"
              />
              <FinanceCard
                title="Balance"
                amount={displayBalance}
                icon={<DollarSign size={24} color={displayBalance >= 0 ? "#3B82F6" : "#EF4444"} />}
                color={displayBalance >= 0 ? "#3B82F6" : "#EF4444"}
                backgroundColor={displayBalance >= 0 ? "#EBF4FF" : "#FEF2F2"}
              />
            </View>
          </View>
        )}

        {/* Yearly Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Resumen Anual {selectedYear}</Text>
            <TouchableOpacity style={styles.yearButton}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.yearButtonText}>{selectedYear}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.yearlyCards}>
            <View style={styles.yearlyCard}>
              <Text style={styles.yearlyCardTitle}>Ingresos Anuales</Text>
              <Text style={[styles.yearlyCardAmount, { color: '#10B981' }]}>
                {formatAmount(yearlyIncome)}
              </Text>
            </View>
            <View style={styles.yearlyCard}>
              <Text style={styles.yearlyCardTitle}>Egresos Anuales</Text>
              <Text style={[styles.yearlyCardAmount, { color: '#EF4444' }]}>
                {formatAmount(yearlyExpenses)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {viewMode === 'household' ? 'Movimientos del Hogar' : 'Movimientos Recientes'}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {displayTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <DollarSign size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Sin movimientos</Text>
              <Text style={styles.emptySubtitle}>
                {viewMode === 'household' 
                  ? 'Registra el primer movimiento compartido del hogar'
                  : 'Registra tu primer ingreso o gasto'
                }
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyButtonText}>Agregar Movimiento</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {displayTransactions.slice(0, 10).map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={() => console.log('Edit transaction:', transaction.id)}
                />
              ))}
              {displayTransactions.length > 10 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllButtonText}>
                    Ver todos los movimientos ({displayTransactions.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <CreateTransactionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
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
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 6,
  },
  yearButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  yearlyCards: {
    flexDirection: 'row',
    gap: 12,
  },
  yearlyCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  yearlyCardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  yearlyCardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  viewAllButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  viewModeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  viewModeButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sharingInfoCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sharingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sharingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sharingDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  sharingStats: {
    flexDirection: 'row',
    gap: 16,
  },
  sharingStat: {
    flex: 1,
    alignItems: 'center',
  },
  sharingStatLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  sharingStatValue: {
    fontSize: 18,
    fontWeight: '600',
  },
});