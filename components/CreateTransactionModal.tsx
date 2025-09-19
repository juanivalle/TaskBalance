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
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Plus, TrendingUp, TrendingDown, Calendar, ChevronDown, Users, User } from 'lucide-react-native';
import { useFinance } from '@/hooks/finance-store';
import { useHome } from '@/hooks/home-store';
import { CURRENCIES } from '@/constants/currencies';
import type { CreateTransactionData, Currency, Transaction } from '@/types/finance';

interface CreateTransactionModalProps {
  visible: boolean;
  transaction?: Transaction | null;
  onClose: () => void;
}

export function CreateTransactionModal({ visible, transaction, onClose }: CreateTransactionModalProps) {
  const { createTransaction, updateTransaction, currencySettings } = useFinance();
  const { currentHousehold } = useHome();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [formData, setFormData] = useState<CreateTransactionData>({
    type: 'income',
    amount: 0,
    currency: currencySettings.baseCurrency,
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    isShared: false,
    householdId: undefined,
  });

  const isEditing = !!transaction;

  const resetForm = () => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.originalAmount,
        currency: transaction.originalCurrency,
        description: transaction.description,
        category: transaction.category || '',
        date: transaction.date,
        isShared: transaction.isShared || false,
        householdId: transaction.householdId,
      });
    } else {
      setFormData({
        type: 'income',
        amount: 0,
        currency: currencySettings.baseCurrency,
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        isShared: false,
        householdId: undefined,
      });
    }
    setShowDatePicker(false);
    setShowCurrencyPicker(false);
  };

  // Reset form when transaction changes
  React.useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, transaction]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (formData.amount <= 0) {
      Alert.alert('Error', 'El monto debe ser mayor a 0');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }

    try {
      setIsLoading(true);
      
      const transactionData = {
        ...formData,
        description: formData.description.trim(),
        category: formData.category?.trim() || undefined,
        householdId: formData.isShared ? currentHousehold?.id : undefined,
      };
      
      if (isEditing && transaction) {
        await updateTransaction(transaction.id, transactionData);
        Alert.alert('Éxito', 'Movimiento actualizado correctamente');
      } else {
        await createTransaction(transactionData);
        Alert.alert('Éxito', 'Movimiento registrado correctamente');
      }
      
      handleClose();
    } catch (error) {
      Alert.alert('Error', isEditing ? 'No se pudo actualizar el movimiento' : 'No se pudo registrar el movimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate.toISOString().split('T')[0] });
    }
  };

  const handleCurrencySelect = (currency: Currency) => {
    setFormData({ ...formData, currency });
    setShowCurrencyPicker(false);
  };

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
            <Text style={styles.title}>{isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Type Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de Movimiento</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'income' && styles.typeButtonActive,
                    { borderColor: '#10B981' },
                    formData.type === 'income' && { backgroundColor: '#10B981' },
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'income' })}
                  disabled={isLoading}
                >
                  <TrendingUp
                    size={20}
                    color={formData.type === 'income' ? 'white' : '#10B981'}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      formData.type === 'income' && styles.typeTextActive,
                    ]}
                  >
                    Ingreso
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'expense' && styles.typeButtonActive,
                    { borderColor: '#EF4444' },
                    formData.type === 'expense' && { backgroundColor: '#EF4444' },
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'expense' })}
                  disabled={isLoading}
                >
                  <TrendingDown
                    size={20}
                    color={formData.type === 'expense' ? 'white' : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      formData.type === 'expense' && styles.typeTextActive,
                    ]}
                  >
                    Egreso
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Monto *</Text>
              <TextInput
                style={styles.input}
                value={formData.amount > 0 ? formData.amount.toString() : ''}
                onChangeText={(text) => {
                  const amount = parseFloat(text) || 0;
                  setFormData({ ...formData, amount });
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
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Ej: Salario enero, Compra supermercado..."
                placeholderTextColor="#9CA3AF"
                maxLength={200}
                editable={!isLoading}
              />
            </View>

            {/* Category */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Categoría (opcional)</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                placeholder="Ej: Alimentación, Transporte, Trabajo..."
                placeholderTextColor="#9CA3AF"
                maxLength={100}
                editable={!isLoading}
              />
            </View>

            {/* Date */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity
                style={styles.pickerContainer}
                onPress={() => setShowDatePicker(true)}
                disabled={isLoading}
              >
                <Calendar size={20} color="#6B7280" />
                <Text style={styles.pickerText}>{formatDate(formData.date)}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Household Sharing */}
            {currentHousehold && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Compartir con el hogar</Text>
                <View style={styles.sharingContainer}>
                  <TouchableOpacity
                    style={[
                      styles.sharingButton,
                      !formData.isShared && styles.sharingButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, isShared: false })}
                    disabled={isLoading}
                  >
                    <User
                      size={20}
                      color={!formData.isShared ? '#3B82F6' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.sharingText,
                        !formData.isShared && styles.sharingTextActive,
                      ]}
                    >
                      Personal
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sharingButton,
                      formData.isShared && styles.sharingButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, isShared: true })}
                    disabled={isLoading}
                  >
                    <Users
                      size={20}
                      color={formData.isShared ? '#3B82F6' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.sharingText,
                        formData.isShared && styles.sharingTextActive,
                      ]}
                    >
                      Hogar
                    </Text>
                  </TouchableOpacity>
                </View>
                {formData.isShared && (
                  <Text style={styles.sharingDescription}>
                    Este movimiento será visible para todos los miembros del hogar &quot;{currentHousehold.name}&quot;
                  </Text>
                )}
              </View>
            )}
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
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            themeVariant="light"
            textColor="#1F2937"
            accentColor="#3B82F6"
          />
        )}

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
                  onPress={() => handleCurrencySelect(currency.code)}
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
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  typeTextActive: {
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
  sharingContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sharingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  sharingButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  sharingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  sharingTextActive: {
    color: '#3B82F6',
  },
  sharingDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
});