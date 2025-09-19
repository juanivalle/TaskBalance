import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { X, Plus, Target, DollarSign, Percent } from 'lucide-react-native';
import { useGoals } from '@/hooks/goals-store';
import { useFinance } from '@/hooks/finance-store';
import { formatCurrency } from '@/constants/currencies';
import type { Goal } from '@/types/goals';

interface ContributeModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
}

export function ContributeModal({ visible, goal, onClose }: ContributeModalProps) {
  const { contributeToGoal } = useGoals();
  const { summary } = useFinance();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contributionMode, setContributionMode] = useState<'manual' | 'percentage'>('manual');
  const [percentage, setPercentage] = useState(10);

  const resetForm = () => {
    setAmount('');
    setNote('');
    setContributionMode('manual');
    setPercentage(10);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!goal) return;

    const contributionAmount = getContributionAmount();
    if (!contributionAmount || contributionAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    try {
      setIsLoading(true);
      await contributeToGoal(goal.id, contributionAmount, note.trim() || undefined);
      handleClose();
      
      const newTotal = goal.currentAmount + contributionAmount;
      const isCompleted = newTotal >= goal.targetAmount;
      
      if (isCompleted) {
        Alert.alert('¡Felicitaciones!', `¡Has completado tu meta "${goal.title}"! 🎉`);
      } else {
        Alert.alert('Éxito', 'Contribución agregada correctamente');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar la contribución');
    } finally {
      setIsLoading(false);
    }
  };

  const getContributionAmount = () => {
    if (contributionMode === 'manual') {
      return parseFloat(amount) || 0;
    } else {
      return (summary.annualSavings * percentage) / 100;
    }
  };

  const handleContributeAll = () => {
    if (!goal) return;
    const remaining = goal.targetAmount - goal.currentAmount;
    const available = Math.min(remaining, summary.annualSavings);
    setAmount(available.toString());
    setContributionMode('manual');
  };

  const contributionAmount = getContributionAmount();
  const newTotal = (goal?.currentAmount || 0) + contributionAmount;
  const remaining = Math.max(0, (goal?.targetAmount || 0) - newTotal);

  if (!goal) return null;

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
            <Text style={styles.title}>Contribuir a Meta</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Goal Info */}
          <View style={styles.goalInfo}>
            <View style={styles.goalHeader}>
              <Target size={20} color="#3B82F6" />
              <Text style={styles.goalTitle}>{goal.title}</Text>
            </View>
            <Text style={styles.goalProgress}>
              {formatCurrency(goal.currentAmount, goal.currency)} / {formatCurrency(goal.targetAmount, goal.currency)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Contribution Mode */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Modo de Contribución</Text>
              <View style={styles.modeContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    contributionMode === 'manual' && styles.modeButtonActive,
                  ]}
                  onPress={() => setContributionMode('manual')}
                  disabled={isLoading}
                >
                  <DollarSign size={16} color={contributionMode === 'manual' ? 'white' : '#3B82F6'} />
                  <Text style={[
                    styles.modeText,
                    contributionMode === 'manual' && styles.modeTextActive,
                  ]}>Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    contributionMode === 'percentage' && styles.modeButtonActive,
                  ]}
                  onPress={() => setContributionMode('percentage')}
                  disabled={isLoading}
                >
                  <Percent size={16} color={contributionMode === 'percentage' ? 'white' : '#3B82F6'} />
                  <Text style={[
                    styles.modeText,
                    contributionMode === 'percentage' && styles.modeTextActive,
                  ]}>% Ahorro</Text>
                </TouchableOpacity>
              </View>
            </View>

            {contributionMode === 'manual' ? (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Monto a Contribuir *</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  editable={!isLoading}
                  autoFocus
                />
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={handleContributeAll}
                    disabled={isLoading || summary.annualSavings <= 0}
                  >
                    <Text style={styles.quickButtonText}>Todo mi ahorro</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Porcentaje del Ahorro Anual ({percentage}%)</Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={100}
                    value={percentage}
                    onValueChange={setPercentage}
                    step={1}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor="#3B82F6"
                    disabled={isLoading}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>1%</Text>
                    <Text style={styles.sliderLabel}>100%</Text>
                  </View>
                </View>
                <Text style={styles.percentageAmount}>
                  {formatCurrency(contributionAmount, goal?.currency || 'UYU')}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nota (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={note}
                onChangeText={setNote}
                placeholder="Ej: Ahorro del mes de enero"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={200}
                editable={!isLoading}
              />
            </View>

            {/* Preview */}
            {contributionAmount > 0 && (
              <View style={styles.preview}>
                <Text style={styles.previewTitle}>Vista Previa</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Nuevo total:</Text>
                  <Text style={styles.previewValue}>{formatCurrency(newTotal, goal?.currency || 'UYU')}</Text>
                </View>
                {remaining > 0 ? (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Restante:</Text>
                    <Text style={styles.previewValue}>{formatCurrency(remaining, goal?.currency || 'UYU')}</Text>
                  </View>
                ) : (
                  <View style={styles.completedPreview}>
                    <Text style={styles.completedText}>¡Meta completada! 🎉</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contributeButton, isLoading && styles.contributeButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading || !contributionAmount}
          >
            <Text style={styles.contributeButtonText}>
              {isLoading ? 'Agregando...' : 'Contribuir'}
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
    padding: 16,
  },
  goalInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  goalProgress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  form: {
    flex: 1,
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
  preview: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#0369A1',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
  },
  completedPreview: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
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
  contributeButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  contributeButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  contributeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  modeTextActive: {
    color: 'white',
  },
  quickActions: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  quickButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  quickButtonText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  sliderThumb: {
    backgroundColor: '#3B82F6',
    width: 20,
    height: 20,
  },
  percentageAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
});