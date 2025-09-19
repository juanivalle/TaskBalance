export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface GoogleAuthData {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}