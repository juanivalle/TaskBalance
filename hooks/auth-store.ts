import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { standaloneClient } from '@/lib/trpc';
import type { User, AuthState, LoginCredentials, RegisterCredentials, GoogleAuthData, AuthError } from '@/types/auth';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

const AUTH_STORAGE_KEY = 'taskbalance_auth';
const TOKEN_STORAGE_KEY = 'taskbalance_token';

// Google OAuth configuration - Replace with your actual client IDs
const GOOGLE_CLIENT_ID = Platform.select({
  web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || 'your-google-client-id-web.apps.googleusercontent.com',
  default: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_MOBILE || 'your-google-client-id-mobile.apps.googleusercontent.com',
});

// For demo purposes, we'll simulate Google auth with multiple options
const DEMO_GOOGLE_ACCOUNTS = [
  {
    googleId: 'demo_google_123',
    email: 'demo@gmail.com',
    name: 'Usuario Demo Google',
    picture: 'https://via.placeholder.com/150',
  },
  {
    googleId: 'demo_google_456',
    email: 'test.user@gmail.com',
    name: 'Test User',
    picture: 'https://via.placeholder.com/150',
  },
  {
    googleId: 'demo_google_789',
    email: 'maria.garcia@gmail.com',
    name: 'María García',
    picture: 'https://via.placeholder.com/150',
  },
];

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const [error, setError] = useState<AuthError | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const loadStoredAuth = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user: User = JSON.parse(stored);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.error('Error loading stored auth:', err);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } finally {
      setIsInitialized(true);
    }
  }, []);



  // Load stored auth on app start
  useEffect(() => {
    if (!isInitialized) {
      loadStoredAuth();
    }
  }, [isInitialized, loadStoredAuth]);

  const login = useCallback(async (credentials: LoginCredentials, remember: boolean = true): Promise<boolean> => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const result = await standaloneClient.auth.login.mutate(credentials);

      // Store auth if remember is enabled
      if (remember) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      }

      setAuthState({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      const message = err?.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
      setError({ message });
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials, remember: boolean = true): Promise<boolean> => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Validate credentials before sending
      if (!credentials.email || !credentials.email.trim()) {
        throw new Error('El email es requerido');
      }
      
      if (!credentials.password || credentials.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      
      if (!credentials.name || !credentials.name.trim()) {
        throw new Error('El nombre es requerido');
      }

      const result = await standaloneClient.auth.register.mutate({
        email: credentials.email.trim(),
        password: credentials.password,
        name: credentials.name.trim(),
      });

      // Validate response
      if (!result || !result.user || !result.token) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Store auth if remember is enabled
      if (remember) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      }

      setAuthState({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (err: any) {
      let message = 'Error al crear la cuenta. Inténtalo de nuevo.';
      
      // Try to extract a more specific error message
      if (err?.message && typeof err.message === 'string') {
        message = err.message;
      } else if (err?.data?.message && typeof err.data.message === 'string') {
        message = err.data.message;
      } else if (err?.shape?.message && typeof err.shape.message === 'string') {
        message = err.shape.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      
      // Handle specific error types
      if (message.includes('CONFLICT') || message.includes('Ya existe')) {
        message = 'Ya existe una cuenta con este email';
      } else if (message.includes('BAD_REQUEST') || message.includes('inválido')) {
        message = 'Datos inválidos. Verifica la información ingresada';
      } else if (message.includes('INTERNAL_SERVER_ERROR')) {
        message = 'Error interno del servidor. Inténtalo más tarde';
      } else if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
        message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else if (message.includes('JSON') || message.includes('parse')) {
        message = 'Error de comunicación con el servidor. Inténtalo de nuevo.';
      }
      
      setError({ message });
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const loginWithGoogle = useCallback(async (selectedEmail?: string): Promise<boolean> => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // For demo purposes, simulate Google authentication
      // In production, implement proper OAuth flow
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If no email is selected, return the available accounts for selection
      if (!selectedEmail) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false; // This will trigger the account selection in the UI
      }
      
      // Find the selected account
      const selectedAccount = DEMO_GOOGLE_ACCOUNTS.find(account => account.email === selectedEmail);
      if (!selectedAccount) {
        throw new Error('Cuenta de Google no encontrada');
      }
      
      const googleAuthData: GoogleAuthData = selectedAccount;
      
      const authResult = await standaloneClient.auth.googleAuth.mutate(googleAuthData);

      // Store auth data
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authResult.user));
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, authResult.token);

      setAuthState({
        user: authResult.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (err: any) {
      let message = 'Error al iniciar sesión con Google.';
      
      if (err?.message) {
        message = err.message;
      } else if (err?.data?.message) {
        message = err.data.message;
      } else if (err?.shape?.message) {
        message = err.shape.message;
      }
      
      setError({ message });
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const getGoogleAccounts = useCallback(() => {
    return DEMO_GOOGLE_ACCOUNTS;
  }, []);



  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(() => ({
    ...authState,
    error,
    login,
    register,
    loginWithGoogle,
    getGoogleAccounts,
    logout,
    clearError,
    isInitialized,
    rememberSession,
    setRememberSession,
  }), [authState, error, login, register, loginWithGoogle, getGoogleAccounts, logout, clearError, isInitialized, rememberSession, setRememberSession]);
});