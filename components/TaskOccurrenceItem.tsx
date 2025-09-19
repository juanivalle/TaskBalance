import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CheckCircle, Clock, User } from 'lucide-react-native';
import { useHome } from '@/hooks/home-store';
import type { TaskOccurrence } from '@/types/home';

interface TaskOccurrenceItemProps {
  occurrence: TaskOccurrence;
}

export function TaskOccurrenceItem({ occurrence }: TaskOccurrenceItemProps) {
  const { completeOccurrence } = useHome();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const handleComplete = async () => {
    if (occurrence.completedAt) return;

    try {
      await completeOccurrence(occurrence.id);
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la tarea');
    }
  };

  const isCompleted = !!occurrence.completedAt;

  return (
    <View style={[styles.container, isCompleted && styles.completedContainer]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, isCompleted && styles.completedTitle]}>
            {occurrence.taskTitle}
          </Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{occurrence.points} pts</Text>
          </View>
        </View>

        {occurrence.taskDescription && (
          <Text style={[styles.description, isCompleted && styles.completedDescription]}>
            {occurrence.taskDescription}
          </Text>
        )}

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.metadataText}>{formatDate(occurrence.scheduledDate)}</Text>
          </View>

          {occurrence.assignedToName && (
            <View style={styles.metadataItem}>
              <User size={14} color="#6B7280" />
              <Text style={styles.metadataText}>{occurrence.assignedToName}</Text>
            </View>
          )}
        </View>

        {isCompleted ? (
          <View style={styles.completedInfo}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.completedText}>
              Completada por {occurrence.completedByName}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <CheckCircle size={16} color="white" />
            <Text style={styles.completeButtonText}>Completar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  completedContainer: {
    backgroundColor: '#F0FDF4',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  completedTitle: {
    color: '#059669',
  },
  pointsBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  completedDescription: {
    color: '#059669',
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 12,
    color: '#6B7280',
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});