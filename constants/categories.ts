import { DollarSign, Home, Car, ShoppingBag, Utensils, Heart, Gamepad2, Briefcase, Gift, Zap } from 'lucide-react-native';

export const EXPENSE_CATEGORIES = [
  { id: 'housing', name: 'Vivienda', icon: Home, color: '#8B5CF6' },
  { id: 'transport', name: 'Transporte', icon: Car, color: '#06B6D4' },
  { id: 'food', name: 'Comida', icon: Utensils, color: '#F59E0B' },
  { id: 'shopping', name: 'Compras', icon: ShoppingBag, color: '#EC4899' },
  { id: 'health', name: 'Salud', icon: Heart, color: '#EF4444' },
  { id: 'entertainment', name: 'Entretenimiento', icon: Gamepad2, color: '#10B981' },
  { id: 'utilities', name: 'Servicios', icon: Zap, color: '#F97316' },
  { id: 'other', name: 'Otros', icon: DollarSign, color: '#6B7280' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', name: 'Salario', icon: Briefcase, color: '#10B981' },
  { id: 'freelance', name: 'Freelance', icon: DollarSign, color: '#3B82F6' },
  { id: 'investment', name: 'Inversiones', icon: DollarSign, color: '#8B5CF6' },
  { id: 'gift', name: 'Regalo', icon: Gift, color: '#F59E0B' },
  { id: 'other', name: 'Otros', icon: DollarSign, color: '#6B7280' },
];