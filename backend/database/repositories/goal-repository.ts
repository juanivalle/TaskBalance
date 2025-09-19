import { getDatabase } from '../connection';

export interface Goal {
  id: string;
  userId: string;
  householdId?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  date: string;
  description?: string;
}

export interface CreateGoalData {
  userId: string;
  householdId?: string;
  title: string;
  targetAmount: number;
  targetDate?: string;
  category?: string;
  description?: string;
}

export interface CreateContributionData {
  goalId: string;
  userId: string;
  amount: number;
  description?: string;
}

export class GoalRepository {
  private db = getDatabase();

  findById(id: string): Goal | undefined {
    const stmt = this.db.prepare(`
      SELECT id, user_id as userId, household_id as householdId, title, 
             target_amount as targetAmount, current_amount as currentAmount,
             target_date as targetDate, category, description, is_completed as isCompleted,
             created_at as createdAt, updated_at as updatedAt
      FROM goals 
      WHERE id = ?
    `);
    
    return stmt.get(id) as Goal | undefined;
  }

  findByUserId(userId: string): Goal[] {
    const stmt = this.db.prepare(`
      SELECT id, user_id as userId, household_id as householdId, title, 
             target_amount as targetAmount, current_amount as currentAmount,
             target_date as targetDate, category, description, is_completed as isCompleted,
             created_at as createdAt, updated_at as updatedAt
      FROM goals 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    
    return stmt.all(userId) as Goal[];
  }

  findByHouseholdId(householdId: string): Goal[] {
    const stmt = this.db.prepare(`
      SELECT id, user_id as userId, household_id as householdId, title, 
             target_amount as targetAmount, current_amount as currentAmount,
             target_date as targetDate, category, description, is_completed as isCompleted,
             created_at as createdAt, updated_at as updatedAt
      FROM goals 
      WHERE household_id = ?
      ORDER BY created_at DESC
    `);
    
    return stmt.all(householdId) as Goal[];
  }

  findByUserAndHousehold(userId: string, householdId?: string): Goal[] {
    let query: string;
    let params: any[];
    
    if (householdId) {
      query = `
        SELECT id, user_id as userId, household_id as householdId, title, 
               target_amount as targetAmount, current_amount as currentAmount,
               target_date as targetDate, category, description, is_completed as isCompleted,
               created_at as createdAt, updated_at as updatedAt
        FROM goals 
        WHERE (user_id = ? AND household_id IS NULL) OR household_id = ?
        ORDER BY created_at DESC
      `;
      params = [userId, householdId];
    } else {
      query = `
        SELECT id, user_id as userId, household_id as householdId, title, 
               target_amount as targetAmount, current_amount as currentAmount,
               target_date as targetDate, category, description, is_completed as isCompleted,
               created_at as createdAt, updated_at as updatedAt
        FROM goals 
        WHERE user_id = ? AND household_id IS NULL
        ORDER BY created_at DESC
      `;
      params = [userId];
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Goal[];
  }

  create(goalData: CreateGoalData): Goal {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO goals (id, user_id, household_id, title, target_amount, target_date, category, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      goalData.userId,
      goalData.householdId || null,
      goalData.title.trim(),
      goalData.targetAmount,
      goalData.targetDate || null,
      goalData.category?.trim() || null,
      goalData.description?.trim() || null,
      now,
      now
    );
    
    const newGoal = this.findById(id);
    if (!newGoal) {
      throw new Error('Failed to create goal');
    }
    
    return newGoal;
  }

  update(id: string, updates: Partial<Omit<CreateGoalData, 'userId'>>): Goal | undefined {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.title) {
      fields.push('title = ?');
      values.push(updates.title.trim());
    }
    
    if (updates.targetAmount !== undefined) {
      fields.push('target_amount = ?');
      values.push(updates.targetAmount);
    }
    
    if (updates.targetDate !== undefined) {
      fields.push('target_date = ?');
      values.push(updates.targetDate || null);
    }
    
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category?.trim() || null);
    }
    
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description?.trim() || null);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push('updated_at = ?');
    values.push(now, id);
    
    const stmt = this.db.prepare(`
      UPDATE goals 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  addContribution(contributionData: CreateContributionData): GoalContribution {
    const id = `contribution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const transaction = this.db.transaction(() => {
      // Add contribution record
      const insertContribution = this.db.prepare(`
        INSERT INTO goal_contributions (id, goal_id, user_id, amount, date, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertContribution.run(
        id,
        contributionData.goalId,
        contributionData.userId,
        contributionData.amount,
        now,
        contributionData.description?.trim() || null
      );
      
      // Update goal current amount
      const updateGoal = this.db.prepare(`
        UPDATE goals 
        SET current_amount = current_amount + ?, updated_at = ?
        WHERE id = ?
      `);
      
      updateGoal.run(contributionData.amount, now, contributionData.goalId);
      
      // Check if goal is completed
      const checkCompletion = this.db.prepare(`
        UPDATE goals 
        SET is_completed = CASE WHEN current_amount >= target_amount THEN 1 ELSE 0 END,
            updated_at = ?
        WHERE id = ?
      `);
      
      checkCompletion.run(now, contributionData.goalId);
    });
    
    transaction();
    
    return {
      id,
      goalId: contributionData.goalId,
      userId: contributionData.userId,
      amount: contributionData.amount,
      date: now,
      description: contributionData.description,
    };
  }

  getContributions(goalId: string): GoalContribution[] {
    const stmt = this.db.prepare(`
      SELECT id, goal_id as goalId, user_id as userId, amount, date, description
      FROM goal_contributions 
      WHERE goal_id = ?
      ORDER BY date DESC
    `);
    
    return stmt.all(goalId) as GoalContribution[];
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM goals WHERE id = ?');
    const result = stmt.run(id);
    
    return result.changes > 0;
  }

  markCompleted(id: string, completed: boolean = true): Goal | undefined {
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      UPDATE goals 
      SET is_completed = ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(completed ? 1 : 0, now, id);
    
    return this.findById(id);
  }

  getProgress(id: string): { percentage: number; remaining: number } {
    const goal = this.findById(id);
    if (!goal) {
      return { percentage: 0, remaining: 0 };
    }
    
    const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
    
    return { percentage, remaining };
  }
}

// Export singleton instance
export const goalRepository = new GoalRepository();