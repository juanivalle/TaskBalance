import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogIn, Eye, EyeOff, Check, UserPlus, Mail, X } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/theme-store';


export default function LoginScreen() {
  const { login, register, loginWithGoogle, getGoogleAccounts, isLoading, error, clearError, isAuthenticated, isInitialized, rememberSession, setRememberSession } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGoogleAccountModal, setShowGoogleAccountModal] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
  });


  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace('/(tabs)/goals');
    }
  }, [isAuthenticated, isInitialized]);

  // Validate password in real-time
  useEffect(() => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  }, [password]);

  const handleSubmit = async () => {
    try {
      if (isRegisterMode) {
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
          Alert.alert('Error', 'Por favor completa todos los campos');
          return;
        }

        if (password !== confirmPassword) {
          Alert.alert('Error', 'Las contraseñas no coinciden');
          return;
        }

        const isPasswordValid = Object.values(passwordValidation).every(Boolean);
        if (!isPasswordValid) {
          Alert.alert('Error', 'La contraseña no cumple con los requisitos');
          return;
        }

        console.log('Starting registration from UI...');
        clearError();
        const success = await register({ 
          name: name.trim(), 
          email: email.trim(), 
          password 
        }, rememberSession);
        
        console.log('Registration result:', success);
        if (success) {
          console.log('Registration successful, switching to login mode...');
          // Switch to login mode after successful registration
          setIsRegisterMode(false);
          setEmail(email.trim()); // Keep the email for easy login
          setPassword('');
          setConfirmPassword('');
          setName('');
          Alert.alert('Éxito', 'Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
        } else {
          console.log('Registration failed, error should be displayed');
        }
      } else {
        if (!email.trim() || !password.trim()) {
          Alert.alert('Error', 'Por favor completa todos los campos');
          return;
        }

        console.log('Starting login from UI...');
        clearError();
        const success = await login({ email: email.trim(), password }, rememberSession);
        
        console.log('Login result:', success);
        if (success) {
          console.log('Login successful, navigating to goals...');
          router.replace('/(tabs)/goals');
        } else {
          console.log('Login failed, error should be displayed');
        }
      }
    } catch (err) {
      console.error('Unexpected error in handleSubmit:', err);
      Alert.alert('Error', 'Error inesperado. Inténtalo de nuevo.');
    }
  };

  const handleGoogleSignIn = async () => {
    setShowGoogleAccountModal(true);
  };

  const handleGoogleAccountSelect = async (email: string) => {
    setShowGoogleAccountModal(false);
    clearError();
    const success = await loginWithGoogle(email);
    
    if (success) {
      router.replace('/(tabs)/goals');
    }
  };



  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    clearError();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    form: {
      width: '100%',
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.text,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.text,
    },
    eyeButton: {
      padding: 14,
    },
    validationContainer: {
      marginTop: 8,
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    validationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    validationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    validationText: {
      fontSize: 12,
      marginLeft: 8,
    },
    validationValid: {
      color: '#10B981',
    },
    validationInvalid: {
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      backgroundColor: '#FEF2F2',
      borderWidth: 1,
      borderColor: '#FECACA',
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
    },
    errorText: {
      color: '#DC2626',
      fontSize: 14,
      textAlign: 'center',
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 16,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
    },
    submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    googleButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 24,
    },
    googleButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    toggleContainer: {
      alignItems: 'center',
    },
    toggleText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    toggleButton: {
      marginTop: 8,
    },
    toggleButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    rememberContainer: {
      marginBottom: 20,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 4,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkboxLabel: {
      fontSize: 14,
      color: theme.colors.text,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    demoInfo: {
      backgroundColor: theme.colors.primary + '10',
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
    },
    demoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    demoText: {
      fontSize: 12,
      color: theme.colors.primary,
      lineHeight: 16,
      marginBottom: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 8,
    },
    accountItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    accountAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    accountAvatarText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 4,
    },
    accountEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });

  if (!isInitialized) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {isRegisterMode ? (
                <UserPlus size={48} color={theme.colors.primary} />
              ) : (
                <LogIn size={48} color={theme.colors.primary} />
              )}
            </View>
            <Text style={styles.title}>TaskBalance</Text>
            <Text style={styles.subtitle}>
              {isRegisterMode ? 'Crea tu cuenta' : 'Organiza tu vida personal y del hogar'}
            </Text>
          </View>

          <View style={styles.form}>
            {isRegisterMode && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre completo"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            )}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isRegisterMode ? "Mínimo 8 caracteres" : "Tu contraseña"}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              
              {isRegisterMode && password.length > 0 && (
                <View style={styles.validationContainer}>
                  <Text style={styles.validationTitle}>Requisitos de contraseña:</Text>
                  <View style={styles.validationItem}>
                    <Check 
                      size={16} 
                      color={passwordValidation.minLength ? '#10B981' : theme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.validationText,
                      passwordValidation.minLength ? styles.validationValid : styles.validationInvalid
                    ]}>
                      Mínimo 8 caracteres
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Check 
                      size={16} 
                      color={passwordValidation.hasLowercase ? '#10B981' : theme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.validationText,
                      passwordValidation.hasLowercase ? styles.validationValid : styles.validationInvalid
                    ]}>
                      Al menos una letra minúscula
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Check 
                      size={16} 
                      color={passwordValidation.hasUppercase ? '#10B981' : theme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.validationText,
                      passwordValidation.hasUppercase ? styles.validationValid : styles.validationInvalid
                    ]}>
                      Al menos una letra mayúscula
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Check 
                      size={16} 
                      color={passwordValidation.hasNumber ? '#10B981' : theme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.validationText,
                      passwordValidation.hasNumber ? styles.validationValid : styles.validationInvalid
                    ]}>
                      Al menos un número
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {isRegisterMode && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmar contraseña</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirma tu contraseña"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={theme.colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={theme.colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.rememberContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberSession(!rememberSession)}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, rememberSession && styles.checkboxChecked]}>
                  {rememberSession && <Check size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>Recordar sesión</Text>
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading 
                  ? (isRegisterMode ? 'Creando cuenta...' : 'Iniciando sesión...') 
                  : (isRegisterMode ? 'Crear cuenta' : 'Iniciar sesión')
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Mail size={20} color={theme.colors.text} />
              <Text style={styles.googleButtonText}>
                {isRegisterMode ? 'Registrarse con Google' : 'Iniciar sesión con Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isRegisterMode ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              </Text>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={toggleMode}
                disabled={isLoading}
              >
                <Text style={styles.toggleButtonText}>
                  {isRegisterMode ? 'Iniciar sesión' : 'Crear cuenta'}
                </Text>
              </TouchableOpacity>
            </View>


          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Account Selection Modal */}
      <Modal
        visible={showGoogleAccountModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoogleAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cuenta de Google</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowGoogleAccountModal(false)}
              >
                <X size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {getGoogleAccounts().map((account) => (
                <TouchableOpacity
                  key={account.googleId}
                  style={styles.accountItem}
                  onPress={() => handleGoogleAccountSelect(account.email)}
                  disabled={isLoading}
                >
                  <View style={styles.accountAvatar}>
                    <Text style={styles.accountAvatarText}>
                      {account.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountEmail}>{account.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}