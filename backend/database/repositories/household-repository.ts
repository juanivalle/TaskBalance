import { getDatabase } from '../connection';

export interface Household {
  id: string;
  name: string;
  description?: string;
  currency: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

export interface CreateHouseholdData {
  name: string;
  description?: string;
  currency?: string;
  createdBy: string;
}

export class HouseholdRepository {
  private db = getDatabase();

  findById(id: string): Household | undefined {
    const stmt = this.db.prepare(`
      SELECT id, name, description, currency, created_by as createdBy,
             created_at as createdAt, updated_at as updatedAt
      FROM households 
      WHERE id = ?
    `);
    
    return stmt.get(id) as Household | undefined;
  }

  findByUserId(userId: string): Household[] {
    const stmt = this.db.prepare(`
      SELECT h.id, h.name, h.description, h.currency, h.created_by as createdBy,
             h.created_at as createdAt, h.updated_at as updatedAt
      FROM households h
      INNER JOIN household_members hm ON h.id = hm.household_id
      WHERE hm.user_id = ?
      ORDER BY h.created_at DESC
    `);
    
    return stmt.all(userId) as Household[];
  }

  create(householdData: CreateHouseholdData): Household {
    const id = `household_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const transaction = this.db.transaction(() => {
      // Create household
      const insertHousehold = this.db.prepare(`
        INSERT INTO households (id, name, description, currency, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertHousehold.run(
        id,
        householdData.name.trim(),
        householdData.description?.trim() || null,
        householdData.currency || 'USD',
        householdData.createdBy,
        now,
        now
      );
      
      // Add creator as admin member
      const insertMember = this.db.prepare(`
        INSERT INTO household_members (id, household_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      insertMember.run(memberId, id, householdData.createdBy, 'owner', now);
    });
    
    transaction();
    
    const newHousehold = this.findById(id);
    if (!newHousehold) {
      throw new Error('Failed to create household');
    }
    
    return newHousehold;
  }

  update(id: string, updates: Partial<Pick<Household, 'name' | 'description' | 'currency'>>): Household | undefined {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }
    
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description?.trim() || null);
    }
    
    if (updates.currency) {
      fields.push('currency = ?');
      values.push(updates.currency);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push('updated_at = ?');
    values.push(now, id);
    
    const stmt = this.db.prepare(`
      UPDATE households 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  addMember(householdId: string, userId: string, role: string = 'member'): HouseholdMember {
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO household_members (id, household_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(memberId, householdId, userId, role, now);
    
    return {
      id: memberId,
      householdId,
      userId,
      role,
      joinedAt: now,
    };
  }

  removeMember(householdId: string, userId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM household_members 
      WHERE household_id = ? AND user_id = ?
    `);
    
    const result = stmt.run(householdId, userId);
    return result.changes > 0;
  }

  getMembers(householdId: string): (HouseholdMember & { userName: string; userEmail: string })[] {
    const stmt = this.db.prepare(`
      SELECT hm.id, hm.household_id as householdId, hm.user_id as userId, 
             hm.role, hm.joined_at as joinedAt,
             u.name as userName, u.email as userEmail
      FROM household_members hm
      INNER JOIN users u ON hm.user_id = u.id
      WHERE hm.household_id = ?
      ORDER BY hm.joined_at ASC
    `);
    
    return stmt.all(householdId) as (HouseholdMember & { userName: string; userEmail: string })[];
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM households WHERE id = ?');
    const result = stmt.run(id);
    
    return result.changes > 0;
  }

  isUserMember(householdId: string, userId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT 1 FROM household_members 
      WHERE household_id = ? AND user_id = ?
    `);
    
    return !!stmt.get(householdId, userId);
  }

  getUserRole(householdId: string, userId: string): string | undefined {
    const stmt = this.db.prepare(`
      SELECT role FROM household_members 
      WHERE household_id = ? AND user_id = ?
    `);
    
    const result = stmt.get(householdId, userId) as { role: string } | undefined;
    return result?.role;
  }
}

// Export singleton instance
export const householdRepository = new HouseholdRepository();