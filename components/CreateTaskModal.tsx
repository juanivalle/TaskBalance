import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Plus, CheckCircle } from 'lucide-react-native';
import { useHome } from '@/hooks/home-store';
import type { CreateTaskData } from '@/types/home';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  householdId: string;
}

export function CreateTaskModal({ visible, onClose, householdId }: CreateTaskModalProps) {
  const { createTask, currentHousehold } = useHome();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    assignedTo: '',
    points: 10,
    daysOfWeek: [],
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: '',
      points: 10,
      daysOfWeek: [],
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    if (formData.daysOfWeek.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un día de la semana');
      return;
    }

    if (formData.points <= 0) {
      Alert.alert('Error', 'Los puntos deben ser mayor a 0');
      return;
    }

    try {
      setIsLoading(true);
      await createTask(householdId, {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        assignedTo: formData.assignedTo || undefined,
      });
      handleClose();
      Alert.alert('Éxito', 'Tarea creada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la tarea');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    const newDays = formData.daysOfWeek.includes(dayIndex)
      ? formData.daysOfWeek.filter(d => d !== dayIndex)
      : [...formData.daysOfWeek, dayIndex];
    setFormData({ ...formData, daysOfWeek: newDays });
  };

  const daysOfWeek = [
    { index: 1, name: 'Lun', fullName: 'Lunes' },
    { index: 2, name: 'Mar', fullName: 'Martes' },
    { index: 3, name: 'Mié', fullName: 'Miércoles' },
    { index: 4, name: 'Jue', fullName: 'Jueves' },
    { index: 5, name: 'Vie', fullName: 'Viernes' },
    { index: 6, name: 'Sáb', fullName: 'Sábado' },
    { index: 0, name: 'Dom', fullName: 'Domingo' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Plus size={24} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Nueva Tarea</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Ej: Lavar los platos"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
                editable={!isLoading}
              />
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe la tarea..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={300}
                editable={!isLoading}
              />
            </View>

            {/* Assigned To */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Asignar a (opcional)</Text>
              <View style={styles.membersContainer}>
                <TouchableOpacity
                  style={[
                    styles.memberButton,
                    !formData.assignedTo && styles.memberButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, assignedTo: '' })}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.memberButtonText,
                      !formData.assignedTo && styles.memberButtonTextActive,
                    ]}
                  >
                    Cualquiera
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.memberButton,
                    formData.assignedTo === 'random' && styles.memberButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, assignedTo: 'random' })}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.memberButtonText,
                      formData.assignedTo === 'random' && styles.memberButtonTextActive,
                    ]}
                  >
                    🎲 Aleatorio
                  </Text>
                </TouchableOpacity>
                {currentHousehold?.members.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberButton,
                      formData.assignedTo === member.userId && styles.memberButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, assignedTo: member.userId })}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.memberButtonText,
                        formData.assignedTo === member.userId && styles.memberButtonTextActive,
                      ]}
                    >
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Points */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Puntos *</Text>
              <TextInput
                style={styles.input}
                value={formData.points.toString()}
                onChangeText={(text) => {
                  const points = parseInt(text) || 0;
                  setFormData({ ...formData, points });
                }}
                placeholder="10"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>

            {/* Days of Week */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Días de la Semana *</Text>
              <View style={styles.daysContainer}>
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day.index}
                    style={[
                      styles.dayButton,
                      formData.daysOfWeek.includes(day.index) && styles.dayButtonActive,
                    ]}
                    onPress={() => toggleDay(day.index)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        formData.daysOfWeek.includes(day.index) && styles.dayButtonTextActive,
                      ]}
                    >
                      {day.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formData.daysOfWeek.length > 0 && (
                <Text style={styles.selectedDaysText}>
                  Seleccionados: {formData.daysOfWeek
                    .map(dayIndex => daysOfWeek.find(d => d.index === dayIndex)?.fullName)
                    .join(', ')}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.createButtonText}>
              {isLoading ? 'Creando...' : 'Crear Tarea'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  membersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    backgroundColor: 'white',
  },
  memberButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  memberButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  memberButtonTextActive: {
    color: 'white',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  dayButtonTextActive: {
    color: 'white',
  },
  selectedDaysText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});