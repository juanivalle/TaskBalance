import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Gift, Star } from 'lucide-react-native';
import type { Reward } from '@/types/home';

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onRedeem: (rewardId: string) => Promise<void>;
}

export function RewardCard({ reward, userPoints, onRedeem }: RewardCardProps) {
  const canRedeem = userPoints >= reward.pointsCost;

  const handleRedeem = () => {
    if (!canRedeem) {
      Alert.alert(
        'Puntos Insuficientes',
        `Necesitas ${reward.pointsCost - userPoints} puntos más para canjear esta recompensa.`
      );
      return;
    }

    Alert.alert(
      'Confirmar Canje',
      `¿Estás seguro de que quieres canjear "${reward.title}" por ${reward.pointsCost} puntos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Canjear',
          style: 'default',
          onPress: () => onRedeem(reward.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Gift size={20} color="#3B82F6" />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{reward.title}</Text>
          <Text style={styles.creator}>Por {reward.createdByName}</Text>
        </View>
        <View style={styles.pointsContainer}>
          <Star size={16} color="#F59E0B" />
          <Text style={styles.points}>{reward.pointsCost}</Text>
        </View>
      </View>

      {reward.description && (
        <Text style={styles.description}>{reward.description}</Text>
      )}

      <View style={styles.footer}>
        <Text style={[styles.status, canRedeem ? styles.canRedeem : styles.cannotRedeem]}>
          {canRedeem ? 'Disponible para canje' : `Necesitas ${reward.pointsCost - userPoints} puntos más`}
        </Text>
        <TouchableOpacity
          style={[styles.redeemButton, !canRedeem && styles.disabledButton]}
          onPress={handleRedeem}
          disabled={!canRedeem}
        >
          <Text style={[styles.redeemButtonText, !canRedeem && styles.disabledButtonText]}>
            Canjear
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  creator: {
    fontSize: 12,
    color: '#6B7280',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  points: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  canRedeem: {
    color: '#059669',
  },
  cannotRedeem: {
    color: '#DC2626',
  },
  redeemButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});