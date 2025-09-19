import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Target, TrendingUp, CheckCircle } from 'lucide-react-native';
import { useGoals } from '@/hooks/goals-store';
import { formatCurrency } from '@/constants/currencies';
import { GoalCard } from '@/components/GoalCard';
import { CreateGoalModal } from '@/components/CreateGoalModal';
import { ContributeModal } from '@/components/ContributeModal';
import type { Goal } from '@/types/goals';
import { useTheme } from '@/hooks/theme-store';

export default function GoalsScreen() {
  const { theme } = useTheme();
  const {
    goals,
    isLoading,
    error,
    completedGoalsCount,
    totalTargetAmount,
    totalCurrentAmount,
    clearError,
  } = useGoals();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleRefresh = () => {
    if (error) {
      clearError();
    }
  };

  const handleContribute = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowContributeModal(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowCreateModal(true);
  };

  // Use mixed currencies for total display (simplified)
  const formatMixedCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'UYU', // Default currency for totals
    }).format(amount);
  };

  const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Target size={24} color="#3B82F6" />
            </View>
            <Text style={styles.summaryValue}>{goals.length}</Text>
            <Text style={styles.summaryLabel}>Metas Activas</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <CheckCircle size={24} color="#10B981" />
            </View>
            <Text style={styles.summaryValue}>{completedGoalsCount}</Text>
            <Text style={styles.summaryLabel}>Completadas</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={24} color="#F59E0B" />
            </View>
            <Text style={styles.summaryValue}>{Math.round(totalProgress)}%</Text>
            <Text style={styles.summaryLabel}>Progreso Total</Text>
          </View>
        </View>

        {/* Total Progress */}
        {totalTargetAmount > 0 && (
          <View style={styles.totalProgressContainer}>
            <View style={styles.totalProgressHeader}>
              <Text style={styles.totalProgressTitle}>Progreso General</Text>
              <Text style={styles.totalProgressAmount}>
                {formatMixedCurrency(totalCurrentAmount)} / {formatMixedCurrency(totalTargetAmount)}
              </Text>
            </View>
            <View style={styles.totalProgressBar}>
              <View
                style={[
                  styles.totalProgressFill,
                  { width: `${Math.min(totalProgress, 100)}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Goals List */}
        <View style={styles.goalsContainer}>
          <View style={styles.goalsHeader}>
            <Text style={[styles.goalsTitle, { color: theme.colors.text }]}>Mis Metas</Text>
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

          {goals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Target size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Aún no tienes metas</Text>
              <Text style={styles.emptySubtitle}>
                Crea tu primera meta para comenzar a ahorrar
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyButtonText}>Crear Primera Meta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.goalsList}>
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onContribute={() => handleContribute(goal)}
                  onEdit={() => handleEdit(goal)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <CreateGoalModal
        visible={showCreateModal}
        goal={editingGoal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingGoal(null);
        }}
      />

      <ContributeModal
        visible={showContributeModal}
        goal={selectedGoal}
        onClose={() => {
          setShowContributeModal(false);
          setSelectedGoal(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  totalProgressContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  totalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalProgressAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  totalProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  goalsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
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
  goalsList: {
    gap: 12,
  },
});