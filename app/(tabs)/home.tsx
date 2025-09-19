import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Home as HomeIcon,
  Users,
  Calendar,
  Trophy,
  Plus,
  ChevronLeft,
  ChevronRight,
  Mail,
  CheckCircle,
  Settings,
  UserPlus,
  LogOut,
  Gift,
} from 'lucide-react-native';
import { useHome, getPreviousWeek, getNextWeek } from '@/hooks/home-store';
import { useTheme } from '@/hooks/theme-store';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { CreateHouseholdModal } from '@/components/CreateHouseholdModal';
import { TaskOccurrenceItem } from '@/components/TaskOccurrenceItem';
import { InvitationCard } from '@/components/InvitationCard';
import { InviteUserModal } from '@/components/InviteUserModal';
import { CreateRewardModal } from '@/components/CreateRewardModal';
import { RewardCard } from '@/components/RewardCard';

export default function HomeScreen() {
  const { theme } = useTheme();
  const {
    currentHousehold,
    invitations,
    tasks,
    occurrences,
    rewards,
    selectedWeek,
    memberRanking,
    isLoading,
    error,
    generateWeekOccurrences,
    createReward,
    redeemReward,
    setSelectedWeek,
    leaveHousehold,
    clearError,
  } = useHome();

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateHouseholdModal, setShowCreateHouseholdModal] = useState(false);
  const [showInviteUserModal, setShowInviteUserModal] = useState(false);
  const [showCreateRewardModal, setShowCreateRewardModal] = useState(false);

  const handlePreviousWeek = () => {
    const previousWeek = getPreviousWeek(selectedWeek);
    setSelectedWeek(previousWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = getNextWeek(selectedWeek);
    setSelectedWeek(nextWeek);
  };

  const handleGenerateWeek = async () => {
    try {
      await generateWeekOccurrences(selectedWeek);
      Alert.alert('Éxito', 'Semana generada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar la semana');
    }
  };

  const handleLeaveHousehold = () => {
    if (!currentHousehold) return;
    
    Alert.alert(
      'Salir del Hogar',
      `¿Estás seguro de que quieres salir del hogar "${currentHousehold.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveHousehold(currentHousehold.id);
              Alert.alert('Éxito', 'Has salido del hogar correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo salir del hogar');
            }
          },
        },
      ]
    );
  };

  if (!currentHousehold) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* No Household State */}
          <View style={styles.emptyContainer}>
            <HomeIcon size={64} color="#9CA3AF" />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Sin Hogar Asignado</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Aún no perteneces a ningún hogar. Acepta una invitación o crea uno nuevo.
            </Text>
            <TouchableOpacity
              style={styles.createHouseholdButton}
              onPress={() => setShowCreateHouseholdModal(true)}
            >
              <Plus size={16} color="white" />
              <Text style={styles.createHouseholdButtonText}>Crear Hogar</Text>
            </TouchableOpacity>
          </View>

          {/* Invitations */}
          {invitations.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Invitaciones Pendientes</Text>
              {invitations.map((invitation) => (
                <InvitationCard key={invitation.id} invitation={invitation} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Household Info */}
        <View style={[styles.householdHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <View style={styles.householdInfo}>
            <HomeIcon size={24} color="#3B82F6" />
            <View style={styles.householdDetails}>
              <Text style={[styles.householdName, { color: theme.colors.text }]}>{currentHousehold.name}</Text>
              <Text style={[styles.householdMembers, { color: theme.colors.textSecondary }]}>
                {currentHousehold.members.length} miembros
              </Text>
            </View>
          </View>
          <View style={styles.householdActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowInviteUserModal(true)}
            >
              <UserPlus size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLeaveHousehold}
            >
              <LogOut size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>



        {/* Tasks Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle size={20} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tareas del Hogar</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateTaskModal(true)}
            >
              <Plus size={16} color="white" />
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.emptyTasksContainer}>
              <Text style={styles.emptyTasksText}>
                No hay tareas creadas. Crea la primera tarea semanal.
              </Text>
              <TouchableOpacity
                style={styles.createTaskButton}
                onPress={() => setShowCreateTaskModal(true)}
              >
                <Text style={styles.createTaskButtonText}>Crear Tarea</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tasksInfo}>
              <Text style={styles.tasksCount}>
                {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} semanal{tasks.length !== 1 ? 'es' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Week Selection */}
        {tasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.weekHeader}>
              <TouchableOpacity style={styles.weekButton} onPress={handlePreviousWeek}>
                <ChevronLeft size={20} color="#6B7280" />
              </TouchableOpacity>
              <View style={styles.weekInfo}>
                <Text style={styles.weekLabel}>Semana</Text>
                <Text style={styles.weekRange}>{selectedWeek.label}</Text>
              </View>
              <TouchableOpacity style={styles.weekButton} onPress={handleNextWeek}>
                <ChevronRight size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.generateButton} onPress={handleGenerateWeek}>
              <Calendar size={16} color="white" />
              <Text style={styles.generateButtonText}>Generar Semana</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Week Occurrences */}
        {occurrences.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tareas de la Semana</Text>
            <View style={styles.occurrencesList}>
              {occurrences.map((occurrence) => (
                <TaskOccurrenceItem key={occurrence.id} occurrence={occurrence} />
              ))}
            </View>
          </View>
        )}

        {/* Rewards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gift size={20} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recompensas</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateRewardModal(true)}
            >
              <Plus size={16} color="white" />
            </TouchableOpacity>
          </View>

          {rewards.length === 0 ? (
            <View style={styles.emptyRewardsContainer}>
              <Text style={styles.emptyRewardsText}>
                No hay recompensas disponibles. Crea la primera recompensa.
              </Text>
              <TouchableOpacity
                style={styles.createRewardButton}
                onPress={() => setShowCreateRewardModal(true)}
              >
                <Text style={styles.createRewardButtonText}>Crear Recompensa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.rewardsList}>
              {rewards.map((reward) => {
                // Find current user's points from the household members
                const currentUser = currentHousehold?.members.find(m => m.email === 'demo@taskbalance.com'); // This should be dynamic based on logged user
                const userPoints = currentUser?.points || 0;
                return (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    userPoints={userPoints}
                    onRedeem={redeemReward}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* Member Ranking */}
        {memberRanking.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Trophy size={20} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ranking de Puntos</Text>
            </View>
            <View style={styles.rankingList}>
              {memberRanking.map((member, index) => (
                <View key={member.id} style={styles.rankingItem}>
                  <View style={styles.rankingPosition}>
                    <Text style={styles.rankingNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.rankingInfo}>
                    <Text style={styles.rankingName}>{member.name}</Text>
                    <Text style={styles.rankingRole}>
                      {member.role === 'owner' ? 'Propietario' : 'Miembro'}
                    </Text>
                  </View>
                  <Text style={styles.rankingPoints}>{member.points} pts</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorButton}>
              <Text style={styles.errorButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CreateTaskModal
        visible={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        householdId={currentHousehold.id}
      />
      
      <CreateHouseholdModal
        visible={showCreateHouseholdModal}
        onClose={() => setShowCreateHouseholdModal(false)}
      />
      
      {currentHousehold && (
        <InviteUserModal
          visible={showInviteUserModal}
          onClose={() => setShowInviteUserModal(false)}
          householdId={currentHousehold.id}
        />
      )}
      
      {currentHousehold && (
        <CreateRewardModal
          visible={showCreateRewardModal}
          onClose={() => setShowCreateRewardModal(false)}
          onSubmit={(data) => createReward(currentHousehold.id, data)}
        />
      )}
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
  householdHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  householdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  householdActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  householdDetails: {
    marginLeft: 12,
  },
  householdName: {
    fontSize: 18,
    fontWeight: '600',
  },
  householdMembers: {
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createHouseholdButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createHouseholdButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTasksContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyTasksText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  createTaskButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createTaskButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyRewardsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyRewardsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  createRewardButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createRewardButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  rewardsList: {
    gap: 8,
  },
  tasksInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tasksCount: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  weekButton: {
    padding: 8,
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  weekRange: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  occurrencesList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rankingList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rankingPosition: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  rankingRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  rankingPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  errorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});