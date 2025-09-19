export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: import('@/types/finance').Currency;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface CreateGoalData {
  title: string;
  targetAmount: number;
  currency: import('@/types/finance').Currency;
  description?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface UpdateGoalData {
  title?: string;
  targetAmount?: number;
  currency?: import('@/types/finance').Currency;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}