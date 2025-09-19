import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Bell, X, Mail, Check, XCircle } from 'lucide-react-native';
import { useHome } from '@/hooks/home-store';
import type { Invitation } from '@/types/home';

interface NotificationBellProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationBell({ visible, onClose }: NotificationBellProps) {
  const { invitations, acceptInvitation, rejectInvitation } = useHome();

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      Alert.alert('Éxito', 'Invitación aceptada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo aceptar la invitación');
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await rejectInvitation(invitationId);
      Alert.alert('Éxito', 'Invitación rechazada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar la invitación');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Bell size={24} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Notificaciones</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {invitations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Sin notificaciones</Text>
              <Text style={styles.emptySubtitle}>
                No tienes notificaciones pendientes en este momento.
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              <Text style={styles.sectionTitle}>Invitaciones de Hogar</Text>
              {invitations.map((invitation) => (
                <InvitationNotificationCard
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={() => handleAcceptInvitation(invitation.id)}
                  onReject={() => handleRejectInvitation(invitation.id)}
                  formatDate={formatDate}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

interface InvitationNotificationCardProps {
  invitation: Invitation;
  onAccept: () => void;
  onReject: () => void;
  formatDate: (date: string) => string;
}

function InvitationNotificationCard({
  invitation,
  onAccept,
  onReject,
  formatDate,
}: InvitationNotificationCardProps) {
  return (
    <View style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <Mail size={20} color="#3B82F6" />
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>Invitación a Hogar</Text>
          <Text style={styles.notificationDate}>
            {formatDate(invitation.createdAt)}
          </Text>
        </View>
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.inviterName}>{invitation.inviterName}</Text>
          {' te ha invitado a unirte al hogar '}
          <Text style={styles.householdName}>"{invitation.householdName}"</Text>
        </Text>
      </View>

      <View style={styles.notificationActions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={onReject}
        >
          <XCircle size={16} color="#EF4444" />
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={onAccept}
        >
          <Check size={16} color="white" />
          <Text style={styles.acceptButtonText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  notificationCard: {
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
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  notificationDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  notificationContent: {
    marginBottom: 16,
  },
  notificationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  inviterName: {
    fontWeight: '600',
    color: '#1F2937',
  },
  householdName: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#10B981',
    borderRadius: 8,
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});