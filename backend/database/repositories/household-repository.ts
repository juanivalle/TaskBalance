import { getDatabase, sql, isProduction } from '../connection';

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
  private db = isProduction ? null : getDatabase();

  async findById(id: string): Promise<Household | undefined> {
    if (isProduction) {
      const result = await sql`
        SELECT id, name, description, currency, created_by as "createdBy",
               created_at as "createdAt", updated_at as "updatedAt"
        FROM households 
        WHERE id = ${id}
      `;
      return result.rows[0] as Household | undefined;
    } else {
      const stmt = this.db!.prepare(`
        SELECT id, name, description, currency, created_by as createdBy,
               created_at as createdAt, updated_at as updatedAt
        FROM households 
        WHERE id = ?
      `);
      
      return stmt.get(id) as Household | undefined;
    }
  }

  async findByUserId(userId: string): Promise<Household[]> {
    if (isProduction) {
      const result = await sql`
        SELECT h.id, h.name, h.description, h.currency, h.created_by as "createdBy",
               h.created_at as "createdAt", h.updated_at as "updatedAt"
        FROM households h
        INNER JOIN household_members hm ON h.id = hm.household_id
        WHERE hm.user_id = ${userId}
        ORDER BY h.created_at DESC
      `;
      return result.rows as Household[];
    } else {
      const stmt = this.db!.prepare(`
        SELECT h.id, h.name, h.description, h.currency, h.created_by as createdBy,
               h.created_at as createdAt, h.updated_at as updatedAt
        FROM households h
        INNER JOIN household_members hm ON h.id = hm.household_id
        WHERE hm.user_id = ?
        ORDER BY h.created_at DESC
      `);
      
      return stmt.all(userId) as Household[];
    }
  }

  async create(householdData: CreateHouseholdData): Promise<Household> {
    console.log('=== HOUSEHOLD REPOSITORY CREATE START ===');
    console.log('Input data:', householdData);
    console.log('Is production:', isProduction);
    
    const id = `household_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    console.log('Generated ID:', id);
    console.log('Timestamp:', now);
    
    if (isProduction) {
      console.log('Using PostgreSQL for household creation');
      // PostgreSQL transaction
      await sql`BEGIN`;
      try {
        // Create household
        await sql`
          INSERT INTO households (id, name, description, currency, created_by, created_at, updated_at)
          VALUES (${id}, ${householdData.name.trim()}, ${householdData.description?.trim() || null}, ${householdData.currency || 'UYU'}, ${householdData.createdBy}, ${now}, ${now})
        `;
        
        // Add creator as admin member
        const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await sql`
          INSERT INTO household_members (id, household_id, user_id, role, joined_at)
          VALUES (${memberId}, ${id}, ${householdData.createdBy}, 'owner', ${now})
        `;
        
        await sql`COMMIT`;
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } else {
      // SQLite transaction
      const transaction = this.db!.transaction(() => {
        // Create household
        const insertHousehold = this.db!.prepare(`
          INSERT INTO households (id, name, description, currency, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        insertHousehold.run(
          id,
          householdData.name.trim(),
          householdData.description?.trim() || null,
          householdData.currency || 'UYU',
          householdData.createdBy,
          now,
          now
        );
        
        // Add creator as admin member
        const insertMember = this.db!.prepare(`
          INSERT INTO household_members (id, household_id, user_id, role, joined_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        insertMember.run(memberId, id, householdData.createdBy, 'owner', now);
      });
      
      transaction();
      console.log('SQLite transaction completed successfully');
    }
    
    console.log('Attempting to find created household with ID:', id);
    const newHousehold = await this.findById(id);
    console.log('Found household:', newHousehold);
    
    if (!newHousehold) {
      console.error('Failed to find created household');
      throw new Error('Failed to create household');
    }
    
    console.log('=== HOUSEHOLD REPOSITORY CREATE SUCCESS ===');
    return newHousehold;
  }

  async update(id: string, updates: Partial<Pick<Household, 'name' | 'description' | 'currency'>>): Promise<Household | undefined> {
    const now = new Date().toISOString();
    
    if (isProduction) {
      const setParts: string[] = [];
      const values: any[] = [];
      
      if (updates.name) {
        setParts.push(`name = $${values.length + 1}`);
        values.push(updates.name.trim());
      }
      
      if (updates.description !== undefined) {
        setParts.push(`description = $${values.length + 1}`);
        values.push(updates.description?.trim() || null);
      }
      
      if (updates.currency) {
        setParts.push(`currency = $${values.length + 1}`);
        values.push(updates.currency);
      }
      
      if (setParts.length === 0) {
        return await this.findById(id);
      }
      
      setParts.push(`updated_at = $${values.length + 1}`);
      values.push(now);
      values.push(id);
      
      await sql.query(`
        UPDATE households 
        SET ${setParts.join(', ')}
        WHERE id = $${values.length}
      `, values);
    } else {
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
        return await this.findById(id);
      }
      
      fields.push('updated_at = ?');
      values.push(now, id);
      
      const stmt = this.db!.prepare(`
        UPDATE households 
        SET ${fields.join(', ')}
        WHERE id = ?
      `);
      
      stmt.run(...values);
    }
    
    return await this.findById(id);
  }

  async addMember(householdId: string, userId: string, role: string = 'member'): Promise<HouseholdMember> {
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    if (isProduction) {
      await sql`
        INSERT INTO household_members (id, household_id, user_id, role, joined_at)
        VALUES (${memberId}, ${householdId}, ${userId}, ${role}, ${now})
      `;
    } else {
      const stmt = this.db!.prepare(`
        INSERT INTO household_members (id, household_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(memberId, householdId, userId, role, now);
    }
    
    return {
      id: memberId,
      householdId,
      userId,
      role,
      joinedAt: now,
    };
  }

  async removeMember(householdId: string, userId: string): Promise<boolean> {
    if (isProduction) {
      const result = await sql`
        DELETE FROM household_members 
        WHERE household_id = ${householdId} AND user_id = ${userId}
      `;
      return (result.rowCount || 0) > 0;
    } else {
      const stmt = this.db!.prepare(`
        DELETE FROM household_members 
        WHERE household_id = ? AND user_id = ?
      `);
      
      const result = stmt.run(householdId, userId);
      return result.changes > 0;
    }
  }

  async getMembers(householdId: string): Promise<(HouseholdMember & { userName: string; userEmail: string })[]> {
    if (isProduction) {
      const result = await sql`
        SELECT hm.id, hm.household_id as "householdId", hm.user_id as "userId", 
               hm.role, hm.joined_at as "joinedAt",
               u.name as "userName", u.email as "userEmail"
        FROM household_members hm
        INNER JOIN users u ON hm.user_id = u.id
        WHERE hm.household_id = ${householdId}
        ORDER BY hm.joined_at ASC
      `;
      return result.rows as (HouseholdMember & { userName: string; userEmail: string })[];
    } else {
      const stmt = this.db!.prepare(`
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
  }

  async delete(id: string): Promise<boolean> {
    if (isProduction) {
      const result = await sql`DELETE FROM households WHERE id = ${id}`;
      return (result.rowCount || 0) > 0;
    } else {
      const stmt = this.db!.prepare('DELETE FROM households WHERE id = ?');
      const result = stmt.run(id);
      
      return result.changes > 0;
    }
  }

  async isUserMember(householdId: string, userId: string): Promise<boolean> {
    if (isProduction) {
      const result = await sql`
        SELECT 1 FROM household_members 
        WHERE household_id = ${householdId} AND user_id = ${userId}
      `;
      return result.rows.length > 0;
    } else {
      const stmt = this.db!.prepare(`
        SELECT 1 FROM household_members 
        WHERE household_id = ? AND user_id = ?
      `);
      
      return !!stmt.get(householdId, userId);
    }
  }

  async getUserRole(householdId: string, userId: string): Promise<string | undefined> {
    if (isProduction) {
      const result = await sql`
        SELECT role FROM household_members 
        WHERE household_id = ${householdId} AND user_id = ${userId}
      `;
      return result.rows[0]?.role;
    } else {
      const stmt = this.db!.prepare(`
        SELECT role FROM household_members 
        WHERE household_id = ? AND user_id = ?
      `);
      
      const result = stmt.get(householdId, userId) as { role: string } | undefined;
      return result?.role;
    }
  }
}

// Export singleton instance
export const householdRepository = new HouseholdRepository();