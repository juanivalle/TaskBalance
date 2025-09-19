export interface Household {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  members: HouseholdMember[];
}

export interface HouseholdMember {
  id: string;
  userId: string;
  householdId: string;
  name: string;
  email: string;
  points: number;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface Invitation {
  id: string;
  householdId: string;
  householdName: string;
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  expiresAt: string;
}

export interface WeeklyTask {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  points: number;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  isActive: boolean;
  createdAt: string;
}

export interface TaskOccurrence {
  id: string;
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  assignedTo?: string;
  assignedToName?: string;
  points: number;
  scheduledDate: string;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  weekStart: string;
  weekEnd: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assignedTo?: string;
  points: number;
  daysOfWeek: number[];
}

export interface WeekRange {
  start: string;
  end: string;
  label: string;
}

export interface Reward {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  pointsCost: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  pointsCost: number;
  redeemedBy: string;
  redeemedByName: string;
  redeemedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CreateRewardData {
  title: string;
  description?: string;
  pointsCost: number;
}