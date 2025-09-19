import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/hooks/auth-store";
import { GoalsProvider } from "@/hooks/goals-store";
import { HomeProvider } from "@/hooks/home-store";
import { FinanceProvider } from "@/hooks/finance-store";
import { ThemeProvider, useTheme } from "@/hooks/theme-store";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { theme } = useTheme();
  
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Atrás",
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.text,
      headerTitleStyle: { color: theme.colors.text }
    }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <ThemeProvider>
            <LoadingScreen />
          </ThemeProvider>
        </trpc.Provider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <GoalsProvider>
              <HomeProvider>
                <FinanceProvider>
                  <GestureHandlerRootView style={styles.container}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </FinanceProvider>
              </HomeProvider>
            </GoalsProvider>
          </AuthProvider>
        </ThemeProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}

function LoadingScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, styles.loading, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});