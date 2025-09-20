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
import { formatCurrency, convertCurrency } from '@/constants/currencies';
import type { Goal } from '@/types/goals';

interface ContributeModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
}

export function ContributeModal({ visible, goal, onClose }: ContributeModalProps) {
  const { contributeToGoal, getTotalContributedPercentage } = useGoals();
  const { summary, currencySettings } = useFinance();
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

    const contributionPercentage = getContributionPercentage();
    if (!contributionPercentage || contributionPercentage <= 0) {
      Alert.alert('Error', 'Ingresa un porcentaje válido');
      return;
    }

    try {
      setIsLoading(true);
      await contributeToGoal(goal.id, contributionPercentage, summary.annualSavings, note.trim() || undefined);
      handleClose();
      Alert.alert('Éxito', 'Contribución agregada correctamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo agregar la contribución';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getContributionPercentage = () => {
    if (contributionMode === 'manual') {
      const manualAmount = parseFloat(amount) || 0;
      if (summary.annualSavings <= 0) return 0;
      
      // Convert manual amount from goal currency to base currency
      const amountInBaseCurrency = convertCurrency(
        manualAmount,
        goal?.currency || 'UYU',
        currencySettings.baseCurrency,
        currencySettings.exchangeRates
      );
      
      return (amountInBaseCurrency / summary.annualSavings) * 100;
    } else {
      return percentage;
    }
  };

  const getContributionAmount = () => {
    if (contributionMode === 'manual') {
      return parseFloat(amount) || 0;
    } else {
      // Convert annual savings from base currency to goal currency
      const savingsInGoalCurrency = convertCurrency(
        summary.annualSavings,
        currencySettings.baseCurrency,
        goal?.currency || 'UYU',
        currencySettings.exchangeRates
      );
      return (savingsInGoalCurrency * percentage) / 100;
    }
  };

  const handleContributeAll = () => {
    if (!goal) return;
    const remaining = goal.targetAmount - goal.currentAmount;
    
    // Convert annual savings from base currency to goal currency
    const savingsInGoalCurrency = convertCurrency(
      summary.annualSavings,
      currencySettings.baseCurrency,
      goal.currency,
      currencySettings.exchangeRates
    );
    
    const available = Math.min(remaining, savingsInGoalCurrency);
    setAmount(available.toString());
    setContributionMode('manual');
  };

  const contributionAmount = getContributionAmount();
  const contributionPercentage = getContributionPercentage();
  const currentTotalPercentage = goal ? getTotalContributedPercentage(goal.id) : 0;
  const remainingPercentage = Math.max(0, 100 - currentTotalPercentage);
  const canContribute = contributionPercentage <= remainingPercentage;
  
  // Calculate current amount dynamically based on current annual savings
  const currentAmount = goal ? convertCurrency(
    (summary.annualSavings * currentTotalPercentage) / 100,
    currencySettings.baseCurrency,
    goal.currency,
    currencySettings.exchangeRates
  ) : 0;
  
  const newTotal = currentAmount + contributionAmount;
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
              {formatCurrency(currentAmount, goal.currency)} / {formatCurrency(goal.targetAmount, goal.currency)}
            </Text>
            <Text style={styles.percentageInfo}>
              {currentTotalPercentage.toFixed(1)}% del ahorro anual asignado
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((currentAmount / goal.targetAmount) * 100, 100)}%`,
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
                <Text style={styles.availablePercentage}>
                  Disponible: {remainingPercentage.toFixed(1)}%
                </Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={Math.max(1, remainingPercentage)}
                    value={Math.min(percentage, remainingPercentage)}
                    onValueChange={(value) => setPercentage(Math.min(value, remainingPercentage))}
                    step={1}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor="#3B82F6"
                    disabled={isLoading || remainingPercentage <= 0}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>1%</Text>
                    <Text style={styles.sliderLabel}>{Math.max(1, remainingPercentage).toFixed(0)}%</Text>
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
              <View style={[styles.preview, !canContribute && styles.previewError]}>
                <Text style={styles.previewTitle}>Vista Previa</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Porcentaje a contribuir:</Text>
                  <Text style={[styles.previewValue, !canContribute && styles.previewValueError]}>
                    {contributionPercentage.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Total asignado:</Text>
                  <Text style={[styles.previewValue, !canContribute && styles.previewValueError]}>
                    {(currentTotalPercentage + contributionPercentage).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Nuevo total:</Text>
                  <Text style={styles.previewValue}>{formatCurrency(newTotal, goal?.currency || 'UYU')}</Text>
                </View>
                {!canContribute && (
                  <View style={styles.errorPreview}>
                    <Text style={styles.errorText}>
                      ⚠️ No puedes contribuir más del 100%. Restante: {remainingPercentage.toFixed(1)}%
                    </Text>
                  </View>
                )}
                {remaining > 0 && canContribute ? (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Restante:</Text>
                    <Text style={styles.previewValue}>{formatCurrency(remaining, goal?.currency || 'UYU')}</Text>
                  </View>
                ) : canContribute ? (
                  <View style={styles.completedPreview}>
                    <Text style={styles.completedText}>¡Meta completada! 🎉</Text>
                  </View>
                ) : null}
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
            style={[styles.contributeButton, (isLoading || !canContribute || !contributionAmount) && styles.contributeButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading || !canContribute || !contributionAmount}
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
  percentageInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  availablePercentage: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 8,
    fontWeight: '500',
  },
  previewError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  previewValueError: {
    color: '#DC2626',
  },
  errorPreview: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    textAlign: 'center',
  },
});