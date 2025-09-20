import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo } from 'react';
import type {
  Household,
  HouseholdMember,
  Invitation,
  WeeklyTask,
  TaskOccurrence,
  CreateTaskData,
  WeekRange,
  Reward,
  RewardRedemption,
  CreateRewardData,
} from '@/types/home';
import { useAuth } from './auth-store';
import { standaloneClient } from '@/lib/trpc';

const HOUSEHOLDS_STORAGE_KEY = 'taskbalance_households';
const INVITATIONS_STORAGE_KEY = 'taskbalance_invitations';
const TASKS_STORAGE_KEY = 'taskbalance_tasks';
const OCCURRENCES_STORAGE_KEY = 'taskbalance_occurrences';
const REWARDS_STORAGE_KEY = 'taskbalance_rewards';
const REDEMPTIONS_STORAGE_KEY = 'taskbalance_redemptions';

// Mock data
const mockHouseholds: Household[] = [
  {
    id: '1',
    name: 'Casa Familia Demo',
    description: 'Hogar principal de la familia',
    createdAt: '2024-01-01T00:00:00Z',
    members: [
      {
        id: '1',
        userId: '1',
        householdId: '1',
        name: 'Usuario Demo',
        email: 'demo@taskbalance.com',
        points: 150,
        role: 'owner',
        joinedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        userId: '2',
        householdId: '1',
        name: 'Usuario Test',
        email: 'test@test.com',
        points: 120,
        role: 'member',
        joinedAt: '2024-01-02T00:00:00Z',
      },
    ],
  },
];

const mockInvitations: Invitation[] = [
  {
    id: '1',
    householdId: '2',
    householdName: 'Casa de los Pérez',
    inviterName: 'María Pérez',
    inviterEmail: 'maria@perez.com',
    inviteeEmail: 'demo@taskbalance.com',
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-01-22T10:00:00Z',
  },
];

export const [HomeProvider, useHome] = createContextHook(() => {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [occurrences, setOccurrences] = useState<TaskOccurrence[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekRange>(getCurrentWeek());
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
          console.error('Error loading home data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadAllData();
    } else {
      setHouseholds([]);
      setInvitations([]);
      setTasks([]);
      setOccurrences([]);
      setRewards([]);
      setRedemptions([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // For demo purposes, use mock data
      setHouseholds(mockHouseholds.filter(h => 
        h.members.some(m => m.userId === user?.id)
      ));
      setInvitations(mockInvitations.filter(i => i.inviteeEmail === user?.email));
      
      // Load stored tasks, occurrences, rewards, and redemptions
      const [tasksData, occurrencesData, rewardsData, redemptionsData] = await Promise.all([
        AsyncStorage.getItem(`${TASKS_STORAGE_KEY}_${user?.id}`),
        AsyncStorage.getItem(`${OCCURRENCES_STORAGE_KEY}_${user?.id}`),
        AsyncStorage.getItem(`${REWARDS_STORAGE_KEY}_${user?.id}`),
        AsyncStorage.getItem(`${REDEMPTIONS_STORAGE_KEY}_${user?.id}`),
      ]);

      setTasks(tasksData ? JSON.parse(tasksData) : []);
      setOccurrences(occurrencesData ? JSON.parse(occurrencesData) : []);
      setRewards(rewardsData ? JSON.parse(rewardsData) : []);
      setRedemptions(redemptionsData ? JSON.parse(redemptionsData) : []);
    } catch (err) {
      console.error('Error loading home data:', err);
      setError('Error al cargar los datos del hogar');
    } finally {
      setIsLoading(false);
    }
  };

  const saveTasks = async (newTasks: WeeklyTask[]) => {
    try {
      await AsyncStorage.setItem(`${TASKS_STORAGE_KEY}_${user?.id}`, JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (err) {
      console.error('Error saving tasks:', err);
      throw new Error('Error al guardar las tareas');
    }
  };

  const saveOccurrences = async (newOccurrences: TaskOccurrence[]) => {
    try {
      await AsyncStorage.setItem(`${OCCURRENCES_STORAGE_KEY}_${user?.id}`, JSON.stringify(newOccurrences));
      setOccurrences(newOccurrences);
    } catch (err) {
      console.error('Error saving occurrences:', err);
      throw new Error('Error al guardar las ocurrencias');
    }
  };

  const saveRewards = async (newRewards: Reward[]) => {
    try {
      await AsyncStorage.setItem(`${REWARDS_STORAGE_KEY}_${user?.id}`, JSON.stringify(newRewards));
      setRewards(newRewards);
    } catch (err) {
      console.error('Error saving rewards:', err);
      throw new Error('Error al guardar las recompensas');
    }
  };

  const saveRedemptions = async (newRedemptions: RewardRedemption[]) => {
    try {
      await AsyncStorage.setItem(`${REDEMPTIONS_STORAGE_KEY}_${user?.id}`, JSON.stringify(newRedemptions));
      setRedemptions(newRedemptions);
    } catch (err) {
      console.error('Error saving redemptions:', err);
      throw new Error('Error al guardar los canjes');
    }
  };

  const createTask = async (householdId: string, data: CreateTaskData) => {
    try {
      const newTask: WeeklyTask = {
        id: Date.now().toString(),
        householdId,
        ...data,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      // Add assigned member name
      if (data.assignedTo) {
        const household = households.find(h => h.id === householdId);
        const member = household?.members.find(m => m.userId === data.assignedTo);
        if (member) {
          newTask.assignedToName = member.name;
        }
      }

      const updatedTasks = [...tasks, newTask];
      await saveTasks(updatedTasks);
      setError(null);
    } catch (err) {
      setError('Error al crear la tarea');
      throw err;
    }
  };

  const generateWeekOccurrences = async (weekRange: WeekRange) => {
    try {
      const weekStart = new Date(weekRange.start);
      const weekEnd = new Date(weekRange.end);
      
      // Remove existing occurrences for this week
      const filteredOccurrences = occurrences.filter(occ => 
        occ.weekStart !== weekRange.start || occ.weekEnd !== weekRange.end
      );

      const newOccurrences: TaskOccurrence[] = [];
      const householdMembers = currentHousehold?.members || [];

      tasks.forEach(task => {
        if (!task.isActive) return;

        task.daysOfWeek.forEach(dayOfWeek => {
          const taskDate = new Date(weekStart);
          const daysToAdd = (dayOfWeek - weekStart.getDay() + 7) % 7;
          taskDate.setDate(weekStart.getDate() + daysToAdd);

          if (taskDate >= weekStart && taskDate <= weekEnd) {
            let assignedTo = task.assignedTo;
            let assignedToName = task.assignedToName;
            
            // Handle random assignment
            if (task.assignedTo === 'random' && householdMembers.length > 0) {
              const randomMember = householdMembers[Math.floor(Math.random() * householdMembers.length)];
              assignedTo = randomMember.userId;
              assignedToName = randomMember.name;
            }
            
            newOccurrences.push({
              id: `${task.id}_${taskDate.toISOString().split('T')[0]}`,
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description,
              assignedTo,
              assignedToName,
              points: task.points,
              scheduledDate: taskDate.toISOString().split('T')[0],
              weekStart: weekRange.start,
              weekEnd: weekRange.end,
            });
          }
        });
      });

      const updatedOccurrences = [...filteredOccurrences, ...newOccurrences];
      await saveOccurrences(updatedOccurrences);
      setError(null);
    } catch (err) {
      setError('Error al generar las ocurrencias de la semana');
      throw err;
    }
  };

  const completeOccurrence = async (occurrenceId: string) => {
    try {
      const occurrence = occurrences.find(occ => occ.id === occurrenceId);
      if (!occurrence || occurrence.completedAt) return;

      const updatedOccurrences = occurrences.map(occ =>
        occ.id === occurrenceId
          ? {
              ...occ,
              completedAt: new Date().toISOString(),
              completedBy: user?.id,
              completedByName: user?.name,
            }
          : occ
      );

      // Update member points (mock implementation)
      const updatedHouseholds = households.map(household => ({
        ...household,
        members: household.members.map(member =>
          member.userId === user?.id
            ? { ...member, points: member.points + occurrence.points }
            : member
        ),
      }));

      await saveOccurrences(updatedOccurrences);
      setHouseholds(updatedHouseholds);
      setError(null);
    } catch (err) {
      setError('Error al completar la tarea');
      throw err;
    }
  };

  const createHousehold = async (data: { name: string; description?: string }) => {
    console.log('=== CLIENT: Creating household ===');
    console.log('Input data:', data);
    console.log('User:', user);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Backend URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    
    if (!user) {
      console.error('User not authenticated');
      const errorMessage = 'Usuario no autenticado';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    
    // Validate input
    if (!data.name || !data.name.trim()) {
      const errorMessage = 'El nombre del hogar es requerido';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    
    // Check if we have a valid token
    const token = await AsyncStorage.getItem('taskbalance_token');
    console.log('Auth token available:', !!token);
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      console.error('No authentication token found');
      const errorMessage = 'No se encontró el token de autenticación. Por favor inicia sesión nuevamente.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    
    try {
      console.log('Making API call to create household...');
      
      // Use the standalone client for mutations
      const newHousehold = await standaloneClient.household.create.mutate({
        name: data.name.trim(),
        description: data.description?.trim(),
        currency: 'UYU',
      });
      
      console.log('=== CLIENT: Household created via API ===');
      console.log('API Response:', newHousehold);
      
      // Convert API response to our format
      const householdForState: Household = {
        id: newHousehold.id,
        name: newHousehold.name,
        description: newHousehold.description || undefined,
        createdAt: newHousehold.createdAt,
        members: newHousehold.members.map(member => ({
          id: member.id,
          userId: member.userId,
          householdId: member.householdId,
          name: member.name,
          email: member.email,
          points: member.points,
          role: member.role as 'owner' | 'member',
          joinedAt: member.joinedAt,
        })),
      };
      
      const updatedHouseholds = [...households, householdForState];
      setHouseholds(updatedHouseholds);
      setError(null);
      console.log('=== CLIENT: Household added to state ===');
      console.log('State data:', householdForState);
      
    } catch (apiError) {
      console.error('=== API ERROR ===');
      console.error('API Error:', apiError);
      console.error('API Error message:', apiError instanceof Error ? apiError.message : String(apiError));
      
      // Extract meaningful error message
      let errorMessage = 'Error al crear el hogar';
      
      if (apiError instanceof Error) {
        // Handle authentication errors
        if (apiError.message.includes('UNAUTHORIZED') || apiError.message.includes('Token de autenticación')) {
          console.log('Authentication error detected');
          errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
        }
        // Handle validation errors
        else if (apiError.message.includes('BAD_REQUEST') || apiError.message.includes('El nombre del hogar es requerido')) {
          errorMessage = 'Datos inválidos. Verifica la información ingresada.';
        }
        // Handle server errors
        else if (apiError.message.includes('INTERNAL_SERVER_ERROR')) {
          errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
        }
        // Handle conflict errors
        else if (apiError.message.includes('CONFLICT') || apiError.message.includes('Ya existe')) {
          errorMessage = 'Ya existe un hogar con ese nombre';
        }
        // Handle network errors - create fallback household
        else if (
          apiError.message.includes('fetch') || 
          apiError.message.includes('network') || 
          apiError.message.includes('Failed to fetch') ||
          apiError.message.includes('Network request failed') ||
          apiError.message.includes('No se pudo conectar')
        ) {
          console.log('Network error detected, creating fallback household');
          
          const householdId = 'household_fallback_' + Date.now();
          const fallbackHousehold: Household = {
            id: householdId,
            name: data.name.trim(),
            description: data.description?.trim(),
            createdAt: new Date().toISOString(),
            members: [
              {
                id: 'member_fallback_' + Date.now(),
                userId: user.id,
                householdId: householdId,
                name: user.name,
                email: user.email,
                points: 0,
                role: 'owner',
                joinedAt: new Date().toISOString(),
              },
            ],
          };
          
          const updatedHouseholds = [...households, fallbackHousehold];
          setHouseholds(updatedHouseholds);
          setError(null);
          console.log('=== CLIENT: Fallback household created successfully ===');
          return; // Success with fallback
        }
        // Use the actual error message if available
        else {
          errorMessage = apiError.message;
        }
      }
      
      console.error('Final error message:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      // Mock implementation - in real app, this would call an API
      const updatedInvitations = invitations.map(inv =>
        inv.id === invitationId
          ? { ...inv, status: 'accepted' as const }
          : inv
      );
      setInvitations(updatedInvitations);
      setError(null);
    } catch (err) {
      setError('Error al aceptar la invitación');
      throw err;
    }
  };

  const rejectInvitation = async (invitationId: string) => {
    try {
      // Mock implementation - in real app, this would call an API
      const updatedInvitations = invitations.map(inv =>
        inv.id === invitationId
          ? { ...inv, status: 'rejected' as const }
          : inv
      );
      setInvitations(updatedInvitations);
      setError(null);
    } catch (err) {
      setError('Error al rechazar la invitación');
      throw err;
    }
  };

  const leaveHousehold = async (householdId: string) => {
    try {
      // Mock implementation - in real app, this would call an API
      const updatedHouseholds = households.filter(h => h.id !== householdId);
      setHouseholds(updatedHouseholds);
      setError(null);
    } catch (err) {
      setError('Error al salir del hogar');
      throw err;
    }
  };

  const inviteToHousehold = async (householdId: string, email: string) => {
    try {
      // Mock implementation - in real app, this would call an API
      const newInvitation: Invitation = {
        id: Date.now().toString(),
        householdId,
        householdName: currentHousehold?.name || 'Hogar',
        inviterName: user?.name || 'Usuario',
        inviterEmail: user?.email || 'usuario@ejemplo.com',
        inviteeEmail: email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
      
      // In a real app, this would be sent to the server
      console.log('Invitation sent:', newInvitation);
      setError(null);
    } catch (err) {
      setError('Error al enviar la invitación');
      throw err;
    }
  };

  const createReward = async (householdId: string, data: CreateRewardData) => {
    try {
      const newReward: Reward = {
        id: Date.now().toString(),
        householdId,
        ...data,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: user?.id || '1',
        createdByName: user?.name || 'Usuario',
      };

      const updatedRewards = [...rewards, newReward];
      await saveRewards(updatedRewards);
      setError(null);
    } catch (err) {
      setError('Error al crear la recompensa');
      throw err;
    }
  };

  const redeemReward = async (rewardId: string) => {
    try {
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) throw new Error('Recompensa no encontrada');

      const currentMember = currentHousehold?.members.find(m => m.userId === user?.id);
      if (!currentMember) throw new Error('Miembro no encontrado');

      if (currentMember.points < reward.pointsCost) {
        throw new Error('No tienes suficientes puntos para canjear esta recompensa');
      }

      const newRedemption: RewardRedemption = {
        id: Date.now().toString(),
        rewardId: reward.id,
        rewardTitle: reward.title,
        pointsCost: reward.pointsCost,
        redeemedBy: user?.id || '1',
        redeemedByName: user?.name || 'Usuario',
        redeemedAt: new Date().toISOString(),
        status: 'pending',
      };

      // Deduct points from member
      const updatedHouseholds = households.map(household => ({
        ...household,
        members: household.members.map(member =>
          member.userId === user?.id
            ? { ...member, points: member.points - reward.pointsCost }
            : member
        ),
      }));

      const updatedRedemptions = [...redemptions, newRedemption];
      await saveRedemptions(updatedRedemptions);
      setHouseholds(updatedHouseholds);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al canjear la recompensa');
      throw err;
    }
  };

  const updateRedemptionStatus = async (redemptionId: string, status: 'approved' | 'rejected') => {
    try {
      const updatedRedemptions = redemptions.map(redemption =>
        redemption.id === redemptionId
          ? { ...redemption, status }
          : redemption
      );
      await saveRedemptions(updatedRedemptions);
      setError(null);
    } catch (err) {
      setError('Error al actualizar el estado del canje');
      throw err;
    }
  };

  // Computed values
  const currentHousehold = useMemo(() => {
    return households[0] || null; // For simplicity, use first household
  }, [households]);

  const pendingInvitations = useMemo(() => {
    return invitations.filter(inv => inv.status === 'pending');
  }, [invitations]);

  const weekOccurrences = useMemo(() => {
    return occurrences
      .filter(occ => occ.weekStart === selectedWeek.start && occ.weekEnd === selectedWeek.end)
      .sort((a, b) => {
        const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
        if (dateCompare !== 0) return dateCompare;
        return a.taskTitle.localeCompare(b.taskTitle);
      });
  }, [occurrences, selectedWeek]);

  const memberRanking = useMemo(() => {
    if (!currentHousehold) return [];
    return [...currentHousehold.members].sort((a, b) => b.points - a.points);
  }, [currentHousehold]);

  const activeRewards = useMemo(() => {
    return rewards.filter(reward => reward.isActive);
  }, [rewards]);

  const userRedemptions = useMemo(() => {
    return redemptions.filter(redemption => redemption.redeemedBy === user?.id);
  }, [redemptions, user?.id]);

  const clearError = () => setError(null);

  return {
    households,
    currentHousehold,
    invitations: pendingInvitations,
    tasks,
    occurrences: weekOccurrences,
    rewards: activeRewards,
    redemptions: userRedemptions,
    selectedWeek,
    memberRanking,
    isLoading,
    error,
    createHousehold,
    createTask,
    createReward,
    redeemReward,
    updateRedemptionStatus,
    generateWeekOccurrences,
    completeOccurrence,
    acceptInvitation,
    rejectInvitation,
    leaveHousehold,
    inviteToHousehold,
    setSelectedWeek,
    clearError,
  };
});

// Helper functions
function getCurrentWeek(): WeekRange {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
    label: `${formatDate(monday)} - ${formatDate(sunday)}`,
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function getWeekRange(date: Date): WeekRange {
  const monday = new Date(date);
  monday.setDate(date.getDate() - date.getDay() + 1);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
    label: `${formatDate(monday)} - ${formatDate(sunday)}`,
  };
}

export function getPreviousWeek(currentWeek: WeekRange): WeekRange {
  const monday = new Date(currentWeek.start);
  monday.setDate(monday.getDate() - 7);
  return getWeekRange(monday);
}

export function getNextWeek(currentWeek: WeekRange): WeekRange {
  const monday = new Date(currentWeek.start);
  monday.setDate(monday.getDate() + 7);
  return getWeekRange(monday);
}