export interface Theme {
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string;
    primaryLight: string;
    border: string;
    shadow: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export const lightTheme: Theme = {
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    primary: '#3B82F6',
    primaryLight: '#F0F9FF',
    border: '#F3F4F6',
    shadow: '#000000',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
  },
};

export const darkTheme: Theme = {
  colors: {
    background: '#0F172A',
    surface: '#1E293B',
    card: '#334155',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    primary: '#3B82F6',
    primaryLight: '#1E3A8A',
    border: '#475569',
    shadow: '#000000',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
  },
};