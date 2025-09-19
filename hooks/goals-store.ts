import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo } from 'react';
import type { Goal, GoalContribution, CreateGoalData, UpdateGoalData } from '@/types/goals';
import { useAuth } from './auth-store';

const GOALS_STORAGE_KEY = 'taskbalance_goals';
const CONTRIBUTIONS_STORAGE_KEY = 'taskbalance_contributions';

export const [GoalsProvider, useGoals] = createContextHook(() => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      const loadAllData = async () => {
        setIsLoading(true);
        try {
          await loadData();
        } catch (error) {
          console.error('Error loading goals data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadAllData();
    } else {
      setGoals([]);
      setContributions([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [goalsData, contributionsData] = await Promise.all([
        AsyncStorage.getItem(`${GOALS_STORAGE_KEY}_${user?.id}`),
        AsyncStorage.getItem(`${CONTRIBUTIONS_STORAGE_KEY}_${user?.id}`),
      ]);

      const loadedGoals = goalsData ? JSON.parse(goalsData) : [];
      // Migrar metas antiguas que no tienen moneda
      const migratedGoals = loadedGoals.map((goal: any) => ({
        ...goal,
        currency: goal.currency || 'UYU', // Default to UYU for old goals
      }));
      
      setGoals(migratedGoals);
      setContributions(contributionsData ? JSON.parse(contributionsData) : []);
    } catch (err) {
      console.error('Error loading goals data:', err);
      setError('Error al cargar las metas');
      throw err;
    }
  };

  const saveGoals = async (newGoals: Goal[]) => {
    try {
      await AsyncStorage.setItem(`${GOALS_STORAGE_KEY}_${user?.id}`, JSON.stringify(newGoals));
      setGoals(newGoals);
    } catch (err) {
      console.error('Error saving goals:', err);
      throw new Error('Error al guardar las metas');
    }
  };

  const saveContributions = async (newContributions: GoalContribution[]) => {
    try {
      await AsyncStorage.setItem(`${CONTRIBUTIONS_STORAGE_KEY}_${user?.id}`, JSON.stringify(newContributions));
      setContributions(newContributions);
    } catch (err) {
      console.error('Error saving contributions:', err);
      throw new Error('Error al guardar las contribuciones');
    }
  };

  const createGoal = async (data: CreateGoalData) => {
    try {
      const newGoal: Goal = {
        id: Date.now().toString(),
        ...data,
        currentAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCompleted: false,
      };

      const updatedGoals = [...goals, newGoal];
      await saveGoals(updatedGoals);
      setError(null);
    } catch (err) {
      setError('Error al crear la meta');
      throw err;
    }
  };

  const updateGoal = async (id: string, data: UpdateGoalData) => {
    try {
      const updatedGoals = goals.map(goal =>
        goal.id === id
          ? { ...goal, ...data, updatedAt: new Date().toISOString() }
          : goal
      );
      await saveGoals(updatedGoals);
      setError(null);
    } catch (err) {
      setError('Error al actualizar la meta');
      throw err;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const updatedGoals = goals.filter(goal => goal.id !== id);
      const updatedContributions = contributions.filter(contrib => contrib.goalId !== id);
      
      await Promise.all([
        saveGoals(updatedGoals),
        saveContributions(updatedContributions),
      ]);
      setError(null);
    } catch (err) {
      setError('Error al eliminar la meta');
      throw err;
    }
  };

  const contributeToGoal = async (goalId: string, amount: number, note?: string) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Meta no encontrada');

      const newContribution: GoalContribution = {
        id: Date.now().toString(),
        goalId,
        amount,
        date: new Date().toISOString(),
        note,
      };

      const newCurrentAmount = goal.currentAmount + amount;
      const isCompleted = newCurrentAmount >= goal.targetAmount;

      const updatedGoals = goals.map(g =>
        g.id === goalId
          ? {
              ...g,
              currentAmount: newCurrentAmount,
              isCompleted,
              updatedAt: new Date().toISOString(),
            }
          : g
      );

      const updatedContributions = [...contributions, newContribution];

      await Promise.all([
        saveGoals(updatedGoals),
        saveContributions(updatedContributions),
      ]);
      setError(null);
    } catch (err) {
      setError('Error al contribuir a la meta');
      throw err;
    }
  };

  // Computed values
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      // Completed goals go to bottom
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      
      // Sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [goals]);

  const completedGoalsCount = useMemo(() => {
    return goals.filter(goal => goal.isCompleted).length;
  }, [goals]);

  const totalTargetAmount = useMemo(() => {
    return goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  }, [goals]);

  const totalCurrentAmount = useMemo(() => {
    return goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  }, [goals]);

  const clearError = () => setError(null);

  return {
    goals: sortedGoals,
    contributions,
    isLoading,
    error,
    completedGoalsCount,
    totalTargetAmount,
    totalCurrentAmount,
    createGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
    clearError,
  };
});

export const useGoalContributions = (goalId: string) => {
  const { contributions } = useGoals();
  return useMemo(() => {
    return contributions
      .filter(contrib => contrib.goalId === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [contributions, goalId]);
};