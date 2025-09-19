import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Target, Plus, Edit3, Trash2 } from 'lucide-react-native';
import { useGoals } from '@/hooks/goals-store';
import { formatCurrency } from '@/constants/currencies';
import type { Goal } from '@/types/goals';

interface GoalCardProps {
  goal: Goal;
  onContribute: () => void;
  onEdit: () => void;
}

export function GoalCard({ goal, onContribute, onEdit }: GoalCardProps) {
  const { deleteGoal } = useGoals();
  const [isDeleting, setIsDeleting] = useState(false);



  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const getPriorityColor = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPriorityLabel = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Sin prioridad';
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Meta',
      `¿Estás seguro de que quieres eliminar "${goal.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteGoal(goal.id);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la meta');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, goal.isCompleted && styles.completedContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Target size={20} color={goal.isCompleted ? '#10B981' : '#3B82F6'} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.title, goal.isCompleted && styles.completedTitle]}>
              {goal.title}
            </Text>
            <View style={styles.priorityContainer}>
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: getPriorityColor(goal.priority) },
                ]}
              />
              <Text style={styles.priorityText}>
                {getPriorityLabel(goal.priority)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
          >
            <Edit3 size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Description */}
      {goal.description && (
        <Text style={styles.description}>{goal.description}</Text>
      )}

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {formatCurrency(goal.currentAmount, goal.currency)} / {formatCurrency(goal.targetAmount, goal.currency)}
          </Text>
          <Text style={[styles.progressPercentage, goal.isCompleted && styles.completedText]}>
            {Math.round(progress)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: goal.isCompleted ? '#10B981' : '#3B82F6',
              },
            ]}
          />
        </View>
        {!goal.isCompleted && remaining > 0 && (
          <Text style={styles.remainingText}>
            Faltan {formatCurrency(remaining, goal.currency)}
          </Text>
        )}
        {goal.isCompleted && (
          <Text style={styles.completedBadge}>¡Meta Completada! 🎉</Text>
        )}
      </View>

      {/* Actions */}
      {!goal.isCompleted && (
        <TouchableOpacity style={styles.contributeButton} onPress={onContribute}>
          <Plus size={16} color="white" />
          <Text style={styles.contributeButtonText}>Contribuir</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  completedContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  completedTitle: {
    color: '#059669',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  completedText: {
    color: '#10B981',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  completedBadge: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  contributeButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  contributeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});