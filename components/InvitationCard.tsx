import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Mail, Check, X } from 'lucide-react-native';
import { useHome } from '@/hooks/home-store';
import type { Invitation } from '@/types/home';

interface InvitationCardProps {
  invitation: Invitation;
}

export function InvitationCard({ invitation }: InvitationCardProps) {
  const { acceptInvitation, rejectInvitation } = useHome();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleAccept = async () => {
    Alert.alert(
      'Aceptar Invitación',
      `¿Quieres unirte al hogar "${invitation.householdName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            try {
              await acceptInvitation(invitation.id);
              Alert.alert('Éxito', 'Te has unido al hogar correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo aceptar la invitación');
            }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Rechazar Invitación',
      `¿Estás seguro de que quieres rechazar la invitación a "${invitation.householdName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectInvitation(invitation.id);
              Alert.alert('Invitación rechazada', 'Has rechazado la invitación correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar la invitación');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Mail size={20} color="#3B82F6" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.householdName}>{invitation.householdName}</Text>
          <Text style={styles.inviterInfo}>
            Invitado por {invitation.inviterName}
          </Text>
        </View>
      </View>

      <Text style={styles.expiryText}>
        Expira el {formatDate(invitation.expiresAt)}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
          <X size={16} color="#EF4444" />
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
          <Check size={16} color="white" />
          <Text style={styles.acceptButtonText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  headerInfo: {
    flex: 1,
  },
  householdName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  inviterInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  expiryText: {
    fontSize: 12,
    color: '#F59E0B',
    marginBottom: 16,
  },
  actions: {
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
    borderColor: '#EF4444',
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
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
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});