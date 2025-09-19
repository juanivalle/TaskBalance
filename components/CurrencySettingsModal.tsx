import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { X, Settings, RefreshCw, Check } from 'lucide-react-native';
import { useFinance } from '@/hooks/finance-store';
import { CURRENCIES, DEFAULT_EXCHANGE_RATES, getExchangeRate } from '@/constants/currencies';
import type { Currency, CurrencySettings } from '@/types/finance';

interface CurrencySettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CurrencySettingsModal({ visible, onClose }: CurrencySettingsModalProps) {
  const { currencySettings, updateCurrencySettings, forceUpdateExchangeRates } = useFinance();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [localSettings, setLocalSettings] = useState<CurrencySettings>(currencySettings);

  // Update local settings when currency settings change
  useEffect(() => {
    setLocalSettings(currencySettings);
  }, [currencySettings]);

  const handleClose = () => {
    setLocalSettings(currencySettings);
    onClose();
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateCurrencySettings(localSettings);
      Alert.alert('Éxito', 'Configuración de moneda actualizada');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBaseCurrencyChange = (currency: Currency) => {
    setLocalSettings({
      ...localSettings,
      baseCurrency: currency,
    });
  };

  const handleExchangeRateChange = (currency: Currency, rate: string) => {
    const numericRate = parseFloat(rate) || 1;
    // Asegurar que la tasa sea positiva y razonable
    const validRate = Math.max(0.0001, Math.min(10000, numericRate));
    setLocalSettings({
      ...localSettings,
      exchangeRates: {
        ...localSettings.exchangeRates,
        [currency]: validRate,
      },
    });
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Restablecer Configuración',
      '¿Estás seguro de que quieres restablecer las tasas de cambio a los valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            setLocalSettings({
              ...localSettings,
              exchangeRates: DEFAULT_EXCHANGE_RATES,
            });
          },
        },
      ]
    );
  };

  const updateRatesFromAPI = async () => {
    try {
      setIsUpdatingRates(true);
      const success = await forceUpdateExchangeRates();
      if (success) {
        Alert.alert('Éxito', 'Tasas de cambio actualizadas desde la API');
      } else {
        Alert.alert('Información', 'No se pudieron obtener tasas actualizadas. Se mantienen las tasas actuales.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al actualizar las tasas de cambio');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Settings size={24} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Configuración de Moneda</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Base Currency Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Moneda Principal</Text>
              <Text style={styles.sectionDescription}>
                Todos los montos se convertirán a esta moneda para los cálculos
              </Text>
              
              <View style={styles.currencyOptions}>
                {Object.values(CURRENCIES).map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyOption,
                      localSettings.baseCurrency === currency.code && styles.currencyOptionSelected,
                    ]}
                    onPress={() => handleBaseCurrencyChange(currency.code)}
                    disabled={isLoading}
                  >
                    <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyName}>{currency.name}</Text>
                      <Text style={styles.currencyCode}>{currency.code}</Text>
                    </View>
                    {localSettings.baseCurrency === currency.code && (
                      <Check size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Exchange Rates */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tasas de Cambio</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[styles.actionButton, isUpdatingRates && styles.actionButtonDisabled]}
                    onPress={updateRatesFromAPI}
                    disabled={isLoading || isUpdatingRates}
                  >
                    <RefreshCw size={14} color={isUpdatingRates ? "#9CA3AF" : "#3B82F6"} />
                    <Text style={[styles.actionButtonText, isUpdatingRates && styles.actionButtonTextDisabled]}>
                      {isUpdatingRates ? 'Actualizando...' : 'Actualizar'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={resetToDefaults}
                    disabled={isLoading || isUpdatingRates}
                  >
                    <Text style={styles.resetButtonText}>Restablecer</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.sectionDescription}>
                Tasas de cambio mostradas en {CURRENCIES[localSettings.baseCurrency].name}. Los valores se almacenan internamente en UYU:
              </Text>

              {Object.entries(CURRENCIES)
                .filter(([code]) => code !== localSettings.baseCurrency)
                .map(([code, currency]) => {
                  // Obtener la tasa de cambio correcta para mostrar
                  const exchangeRate = getExchangeRate(
                    currency.code as Currency,
                    localSettings.baseCurrency,
                    localSettings.exchangeRates
                  );
                  
                  // La tasa interna siempre se almacena como 1 USD = X UYU
                  const internalRate = localSettings.exchangeRates[code as Currency] || 1;
                  
                  return (
                    <View key={code} style={styles.exchangeRateItem}>
                      <View style={styles.exchangeRateInfo}>
                        <Text style={styles.exchangeRateSymbol}>{currency.symbol}</Text>
                        <Text style={styles.exchangeRateName}>
                          1 {currency.code} = {CURRENCIES[localSettings.baseCurrency].symbol}{exchangeRate.toFixed(4)}
                        </Text>
                      </View>
                      <View style={styles.exchangeRateInput}>
                        <TextInput
                          style={styles.rateInput}
                          value={exchangeRate.toFixed(4)}
                          onChangeText={(text) => {
                            const rate = parseFloat(text) || 1;
                            // Convertir la tasa mostrada a la tasa interna (siempre en UYU)
                            let internalRateValue: number;
                            if (localSettings.baseCurrency === 'UYU') {
                              // Si la base es UYU, la tasa mostrada es directa (1 USD = X UYU)
                              internalRateValue = rate;
                            } else {
                              // Si la base no es UYU, necesitamos calcular correctamente
                              // Por ejemplo, si base es USD y estamos editando EUR:
                              // Mostramos 1 EUR = X USD, pero internamente necesitamos 1 EUR = Y UYU
                              // Y UYU = X USD * (UYU por USD)
                              const baseToUYURate = localSettings.exchangeRates[localSettings.baseCurrency] || 1;
                              internalRateValue = rate * baseToUYURate;
                            }
                            handleExchangeRateChange(code as Currency, internalRateValue.toString());
                          }}
                          keyboardType="numeric"
                          placeholder="1.00"
                          editable={!isLoading}
                        />
                        <Text style={styles.rateUnit}>{CURRENCIES[localSettings.baseCurrency].code}</Text>
                      </View>
                    </View>
                  );
                })}
            </View>

            {/* Last Updated */}
            <View style={styles.section}>
              <Text style={styles.lastUpdated}>
                Última actualización: {new Date(localSettings.lastUpdated).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
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
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  currencyOptions: {
    gap: 8,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currencyOptionSelected: {
    borderColor: '#3B82F6',
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 6,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 4,
  },
  actionButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  actionButtonTextDisabled: {
    color: '#9CA3AF',
  },
  exchangeRateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  exchangeRateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exchangeRateSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    width: 30,
    textAlign: 'center',
  },
  exchangeRateName: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  exchangeRateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
  },
  rateInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
    paddingRight: 8,
  },
  rateUnit: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
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
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});