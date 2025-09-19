import { createTRPCReact } from "@trpc/react-query";
import { httpLink, createTRPCClient } from "@trpc/client";
import superjson from "superjson";
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // For production builds, use a placeholder URL or disable backend calls
  if (process.env.NODE_ENV === 'production' && !process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('Production build detected without backend URL - using placeholder');
    return 'https://placeholder-backend.com'; // This will fail gracefully
  }
  
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('Using EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Auto-detect base URL based on platform and environment
  if (typeof window !== 'undefined') {
    // Web environment - use current host
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '3000'; // Default Expo dev server port
    const url = `${protocol}//${hostname}:${port}`;
    console.log('Web environment detected, using URL:', url);
    return url;
  } else {
    // Mobile environment - try multiple detection methods
    console.log('Mobile environment detected, trying to find backend URL...');
    
    // Method 1: Check for explicit dev server URL
    const devServerUrl = process.env.EXPO_PUBLIC_DEV_SERVER_URL;
    if (devServerUrl) {
      console.log('Using EXPO_PUBLIC_DEV_SERVER_URL:', devServerUrl);
      return devServerUrl;
    }
    
    // Method 2: Try to extract from Expo's bundler URL
    const bundlerUrl = process.env.EXPO_PUBLIC_BUNDLER_URL;
    if (bundlerUrl) {
      try {
        const url = new URL(bundlerUrl);
        const backendUrl = `${url.protocol}//${url.hostname}:3000`;
        console.log('Extracted from EXPO_PUBLIC_BUNDLER_URL:', backendUrl);
        return backendUrl;
      } catch (error) {
        console.warn('Failed to parse EXPO_PUBLIC_BUNDLER_URL:', bundlerUrl, error);
      }
    }
    
    // Method 3: Try common development IPs based on your network
    const commonIPs = [
      '192.168.1.21:3000',  // Your current IP
      '192.168.1.100:3000', // Common router IP range
      '192.168.0.100:3000', // Another common range
      '10.0.0.100:3000',    // Another common range
      'localhost:3000'      // Fallback for simulators
    ];
    
    // Try your specific IP first
    const fallbackUrl = `http://${commonIPs[0]}`; // Your IP: 192.168.1.21
    console.log('🔍 Mobile environment detected');
    console.log('📱 Using your IP address:', fallbackUrl);
    console.log('🌐 Available environment variables:');
    console.log('   - EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    console.log('   - EXPO_PUBLIC_DEV_SERVER_URL:', process.env.EXPO_PUBLIC_DEV_SERVER_URL);
    console.log('   - EXPO_PUBLIC_BUNDLER_URL:', process.env.EXPO_PUBLIC_BUNDLER_URL);
    console.log('💡 If this doesn\'t work, make sure both devices are on the same WiFi network');
    console.log('💡 And that your firewall allows connections on port 3000');
    console.log('💡 Try running: ipconfig (Windows) to verify your current IP');
    
    return fallbackUrl;
  }
};

const createTrpcClient = () => {
  return trpc.createClient({
    links: [
      httpLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers: {
          'Content-Type': 'application/json',
        },
        fetch: async (url, options) => {
          if (!url || typeof url !== 'string') {
            console.error('Invalid URL provided:', url);
            throw new Error('Invalid URL provided');
          }
          
          // In production without proper backend, return mock data
          if (process.env.NODE_ENV === 'production' && url.includes('placeholder-backend.com')) {
            console.log('Production mode - returning mock response');
            return Promise.resolve(new Response(JSON.stringify({ result: { data: null } }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }));
          }
          
          // Get auth token from AsyncStorage
          const token = await AsyncStorage.getItem('taskbalance_token');
          const authHeaders: Record<string, string> = {};
          if (token) {
            authHeaders.Authorization = `Bearer ${token}`;
          }
          
          console.log('=== tRPC REQUEST START ===');
          console.log('URL:', url);
          console.log('Method:', options?.method);
          console.log('Headers:', { ...options?.headers, ...authHeaders });
          console.log('Body:', options?.body);
          console.log('Auth Token:', token ? 'Present' : 'Not found');
          
          return fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options?.headers,
              ...authHeaders,
            },
          }).then(async response => {
            console.log('=== tRPC RESPONSE RECEIVED ===');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);
            console.log('Headers:', Object.fromEntries(response.headers.entries()));
            
            // Always try to get the response text first
            const responseText = await response.text();
            console.log('Response Text Length:', responseText.length);
            console.log('Response Text:', responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : ''));
            
            if (!response.ok) {
              console.error('=== tRPC ERROR RESPONSE ===');
              console.error('Status:', response.status);
              console.error('Response Text:', responseText);
              
              // Try to parse as JSON for better error handling
              try {
                const errorData = JSON.parse(responseText);
                console.error('Parsed Error Data:', errorData);
                const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(errorMessage);
              } catch (parseError) {
                console.error('Failed to parse error response as JSON:', parseError);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
              }
            }
            
            console.log('=== tRPC REQUEST SUCCESS ===');
            
            // Create a new response with the text we already read
            return new Response(responseText, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          }).catch(error => {
            console.error('=== tRPC FETCH ERROR ===');
            console.error('Error:', error);
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
            
            // Provide more helpful error messages for common issues
            if (error.message?.includes('Network request failed')) {
              const baseUrl = getBaseUrl();
              if (baseUrl.includes('localhost') && typeof window === 'undefined') {
                throw new Error(
                  'No se pudo conectar al servidor. ' +
                  'Si estás usando un dispositivo móvil, configura EXPO_PUBLIC_RORK_API_BASE_URL con la IP de tu computadora. ' +
                  'Ejemplo: EXPO_PUBLIC_RORK_API_BASE_URL=http://192.168.1.100:3000'
                );
              }
              throw new Error('No se pudo conectar al servidor. Verifica que el backend esté ejecutándose y que estés en la misma red.');
            }
            
            if (error.message?.includes('fetch')) {
              throw new Error('Error de conexión. Verifica tu conexión a internet y que el servidor esté disponible.');
            }
            
            throw error;
          });
        },
      }),
    ],
  });
};

export const trpcClient = createTrpcClient();

// Also create a standalone client for non-React usage
export const standaloneClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: {
        'Content-Type': 'application/json',
      },
      fetch: async (url, options) => {
        if (!url || typeof url !== 'string') {
          throw new Error('Invalid URL provided');
        }
        
        // Get auth token from AsyncStorage
        const token = await AsyncStorage.getItem('taskbalance_token');
        const authHeaders: Record<string, string> = {};
        if (token) {
          authHeaders.Authorization = `Bearer ${token}`;
        }
        
        console.log('Standalone tRPC request:', { url, method: options?.method, body: options?.body, hasToken: !!token });
        return fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
            ...authHeaders,
          },
        }).then(async response => {
          console.log('Standalone tRPC response:', { status: response.status, statusText: response.statusText });
          
          // Always try to get the response text first
          const responseText = await response.text();
          console.log('Standalone tRPC response text:', responseText);
          
          if (!response.ok) {
            console.error('Standalone tRPC error response:', responseText);
            
            // Try to parse as JSON for better error handling
            try {
              const errorData = JSON.parse(responseText);
              throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            } catch {
              throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
            }
          }
          
          // Create a new response with the text we already read
          return new Response(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }).catch(error => {
          console.error('Standalone tRPC fetch error:', error);
          throw error;
        });
      },
    }),
  ],
});