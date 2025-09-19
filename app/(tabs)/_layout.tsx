import { Tabs, router } from "expo-router";
import { Target, DollarSign, Home, LogOut, Settings, Bell } from "lucide-react-native";
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Alert, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/auth-store';
import { useHome } from '@/hooks/home-store';
import { NotificationBell } from '@/components/NotificationBell';
import { useTheme } from '@/hooks/theme-store';

export default function TabLayout() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading, isInitialized, logout } = useAuth();
  const { invitations } = useHome();
  const [showNotifications, setShowNotifications] = useState(false);
  const hasNotifications = invitations.length > 0;

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isInitialized]);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: theme.colors.text,
        },
        headerRight: () => (
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setShowNotifications(true)}
            >
              <View style={styles.bellContainer}>
                <Bell size={20} color={theme.colors.textSecondary} />
                {hasNotifications && <View style={styles.notificationBadge} />}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <LogOut size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="goals"
        options={{
          title: "Metas",
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Finanzas",
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Hogar",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Configuración",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      </Tabs>
      
      <NotificationBell
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
  },
  bellContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  logoutButton: {
    padding: 8,
  },
});