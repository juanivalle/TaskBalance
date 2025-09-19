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
import { X, Target, ChevronDown } from 'lucide-react-native';
import { useGoals } from '@/hooks/goals-store';
import { useFinance } from '@/hooks/finance-store';
import { CURRENCIES } from '@/constants/currencies';
import type { CreateGoalData, Goal, UpdateGoalData } from '@/types/goals';
import type { Currency } from '@/types/finance';

interface CreateGoalModalProps {
  visible: boolean;
  goal?: Goal | null;
  onClose: () => void;
}

export function CreateGoalModal({ visible, goal, onClose }: CreateGoalModalProps) {
  const { createGoal, updateGoal } = useGoals();
  const { currencySettings } = useFinance();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [formData, setFormData] = useState<CreateGoalData>({
    title: '',
    targetAmount: 0,
    currency: currencySettings.baseCurrency,
    description: '',
    priority: 'medium',
  });

  const isEditing = !!goal;

  const resetForm = () => {
    if (goal) {
      setFormData({
        title: goal.title,
        targetAmount: goal.targetAmount,
        currency: goal.currency,
        description: goal.description || '',
        priority: goal.priority,
      });
    } else {
      setFormData({
        title: '',
        targetAmount: 0,
        currency: currencySettings.baseCurrency,
        description: '',
        priority: 'medium',
      });
    }
    setShowCurrencyPicker(false);
  };

  // Reset form when goal changes
  React.useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, goal]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    if (formData.targetAmount <= 0) {
      Alert.alert('Error', 'El monto objetivo debe ser mayor a 0');
      return;
    }

    try {
      setIsLoading(true);
      
      if (isEditing && goal) {
        const updateData: UpdateGoalData = {
          title: formData.title.trim(),
          targetAmount: formData.targetAmount,
          currency: formData.currency,
          description: formData.description?.trim() || undefined,
          priority: formData.priority,
        };
        await updateGoal(goal.id, updateData);
        Alert.alert('Éxito', 'Meta actualizada correctamente');
      } else {
        await createGoal({
          ...formData,
          title: formData.title.trim(),
          description: formData.description?.trim() || undefined,
        });
        Alert.alert('Éxito', 'Meta creada correctamente');
      }
      
      handleClose();
    } catch (error) {
      Alert.alert('Error', isEditing ? 'No se pudo actualizar la meta' : 'No se pudo crear la meta');
    } finally {
      setIsLoading(false);
    }
  };

  const priorities = [
    { value: 'low', label: 'Baja', color: '#10B981' },
    { value: 'medium', label: 'Media', color: '#F59E0B' },
    { value: 'high', label: 'Alta', color: '#DC2626' },
  ] as const;

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
              <Target size={24} color="#3B82F6" />
            </View>
            <Text style={styles.title}>{isEditing ? 'Editar Meta' : 'Nueva Meta'}</Text>
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
                placeholder="Ej: Vacaciones en Europa"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
                editable={!isLoading}
              />
            </View>

            {/* Target Amount */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Monto Objetivo *</Text>
              <TextInput
                style={styles.input}
                value={formData.targetAmount > 0 ? formData.targetAmount.toString() : ''}
                onChangeText={(text) => {
                  const amount = parseFloat(text) || 0;
                  setFormData({ ...formData, targetAmount: amount });
                }}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>

            {/* Currency */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Moneda</Text>
              <TouchableOpacity
                style={styles.pickerContainer}
                onPress={() => setShowCurrencyPicker(true)}
                disabled={isLoading}
              >
                <Text style={styles.pickerText}>
                  {CURRENCIES[formData.currency].symbol} - {CURRENCIES[formData.currency].name}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe tu meta..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={500}
                editable={!isLoading}
              />
            </View>

            {/* Priority */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Prioridad</Text>
              <View style={styles.priorityContainer}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityButton,
                      formData.priority === priority.value && styles.priorityButtonActive,
                      { borderColor: priority.color },
                      formData.priority === priority.value && { backgroundColor: priority.color },
                    ]}
                    onPress={() => setFormData({ ...formData, priority: priority.value })}
                    disabled={isLoading}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: priority.color },
                        formData.priority === priority.value && { backgroundColor: 'white' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        formData.priority === priority.value && styles.priorityTextActive,
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
              {isLoading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar Cambios' : 'Crear Meta')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Currency Picker Modal */}
        <Modal
          visible={showCurrencyPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCurrencyPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.currencyModal}>
              <View style={styles.currencyHeader}>
                <Text style={styles.currencyTitle}>Seleccionar Moneda</Text>
                <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {Object.values(CURRENCIES).map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyOption,
                    formData.currency === currency.code && styles.currencyOptionSelected,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, currency: currency.code });
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                    <Text style={styles.currencyCode}>{currency.code}</Text>
                  </View>
                  {formData.currency === currency.code && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
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
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  priorityButtonActive: {
    backgroundColor: '#3B82F6',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  priorityTextActive: {
    color: 'white',
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
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  currencyModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  currencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  currencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  currencyOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    width: 40,
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  currencyCode: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
  },
});