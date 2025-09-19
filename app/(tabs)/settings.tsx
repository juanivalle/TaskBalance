import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Settings, DollarSign, Info, Moon, Sun, LogOut, Mail, Shield, User } from 'lucide-react-native';
import { CurrencySettingsModal } from '@/components/CurrencySettingsModal';
import { useTheme } from '@/hooks/theme-store';
import { useAuth } from '@/hooks/auth-store';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const [showCurrencySettings, setShowCurrencySettings] = useState(false);
  const { theme, themeMode, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const getUserInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const settingsOptions = [
    {
      id: 'currency',
      title: 'Configuración de Moneda',
      description: 'Cambiar moneda principal y tasas de cambio',
      icon: <DollarSign size={24} color={theme.colors.primary} />,
      onPress: () => setShowCurrencySettings(true),
    },
    {
      id: 'about',
      title: 'Acerca de',
      description: 'Información de la aplicación',
      icon: <Info size={24} color={theme.colors.primary} />,
      onPress: () => {
        Alert.alert(
          'TaskBalance Mobile',
          'Versión 1.0.0\n\nUna aplicación para organizar tu vida personal y del hogar con metas, finanzas y tareas compartidas.',
          [{ text: 'OK' }]
        );
      },
    },
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    optionsList: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    themeToggleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    versionText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    userSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    userAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    userAvatarText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    userDetails: {
      gap: 12,
    },
    userDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
    },
    userDetailText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 12,
      flex: 1,
    },
    userDetailLabel: {
      fontWeight: '500',
    },
    logoutButton: {
      backgroundColor: '#FEE2E2',
      borderWidth: 1,
      borderColor: '#FECACA',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
    },
    logoutButtonText: {
      color: '#DC2626',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <ScrollView style={dynamicStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        {isAuthenticated && user && (
          <View style={dynamicStyles.section}>
            <View style={dynamicStyles.userSection}>
              <View style={dynamicStyles.userHeader}>
                <View style={dynamicStyles.userAvatar}>
                  <Text style={dynamicStyles.userAvatarText}>
                    {getUserInitials(user.name)}
                  </Text>
                </View>
                <View style={dynamicStyles.userInfo}>
                  <Text style={dynamicStyles.userName}>{user.name}</Text>
                  <Text style={dynamicStyles.userEmail}>{user.email}</Text>
                </View>
              </View>
              
              <View style={dynamicStyles.userDetails}>
                <View style={dynamicStyles.userDetailItem}>
                  <Mail size={16} color={theme.colors.primary} />
                  <Text style={dynamicStyles.userDetailText}>
                    <Text style={dynamicStyles.userDetailLabel}>Email: </Text>
                    {user.email}
                  </Text>
                </View>
                <View style={dynamicStyles.userDetailItem}>
                  <Shield size={16} color={theme.colors.primary} />
                  <Text style={dynamicStyles.userDetailText}>
                    <Text style={dynamicStyles.userDetailLabel}>ID de Usuario: </Text>
                    {user.id}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={dynamicStyles.logoutButton}
                onPress={handleLogout}
              >
                <LogOut size={20} color="#DC2626" />
                <Text style={dynamicStyles.logoutButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.sectionHeader}>
            <Settings size={24} color={theme.colors.text} />
            <Text style={dynamicStyles.sectionTitle}>Configuración</Text>
          </View>
          
          <View style={dynamicStyles.optionsList}>
            {/* Dark Mode Toggle */}
            <View style={dynamicStyles.themeToggleItem}>
              <View style={dynamicStyles.optionIcon}>
                {themeMode === 'dark' ? (
                  <Moon size={24} color={theme.colors.primary} />
                ) : (
                  <Sun size={24} color={theme.colors.primary} />
                )}
              </View>
              <View style={dynamicStyles.optionContent}>
                <Text style={dynamicStyles.optionTitle}>Modo Oscuro</Text>
                <Text style={dynamicStyles.optionDescription}>
                  {themeMode === 'dark' ? 'Activado' : 'Desactivado'}
                </Text>
              </View>
              <Switch
                value={themeMode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>
            
            {settingsOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  dynamicStyles.optionItem,
                  index === settingsOptions.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={option.onPress}
              >
                <View style={dynamicStyles.optionIcon}>
                  {option.icon}
                </View>
                <View style={dynamicStyles.optionContent}>
                  <Text style={dynamicStyles.optionTitle}>{option.title}</Text>
                  <Text style={dynamicStyles.optionDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.versionText}>TaskBalance Mobile v1.0.0</Text>
        </View>
      </ScrollView>

      <CurrencySettingsModal
        visible={showCurrencySettings}
        onClose={() => setShowCurrencySettings(false)}
      />
    </View>
  );
}

