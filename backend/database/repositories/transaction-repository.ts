import { getDatabase } from '../connection';

export interface Transaction {
  id: string;
  userId: string;
  householdId?: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  userId: string;
  householdId?: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  description?: string;
}

export class TransactionRepository {
  private db = getDatabase();

  findById(id: string): Transaction | undefined {
    const stmt = this.db.prepare(`
      SELECT id, user_id as userId, household_id as householdId, title, amount, 
             category, type, date, description,
             created_at as createdAt, updated_at as updatedAt
      FROM transactions 
      WHERE id = ?
    `);
    
    return stmt.get(id) as Transaction | undefined;
  }

  findByUserId(userId: string, limit?: number, offset?: number): Transaction[] {
    let query = `
      SELECT id, user_id as userId, household_id as householdId, title, amount, 
             category, type, date, description,
             created_at as createdAt, updated_at as updatedAt
      FROM transactions 
      WHERE user_id = ?
      ORDER BY date DESC, created_at DESC
    `;
    
    if (limit) {
      query += ` LIMIT ${limit}`;
      if (offset) {
        query += ` OFFSET ${offset}`;
      }
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(userId) as Transaction[];
  }

  findByHouseholdId(householdId: string, limit?: number, offset?: number): Transaction[] {
    let query = `
      SELECT id, user_id as userId, household_id as householdId, title, amount, 
             category, type, date, description,
             created_at as createdAt, updated_at as updatedAt
      FROM transactions 
      WHERE household_id = ?
      ORDER BY date DESC, created_at DESC
    `;
    
    if (limit) {
      query += ` LIMIT ${limit}`;
      if (offset) {
        query += ` OFFSET ${offset}`;
      }
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(householdId) as Transaction[];
  }

  findByUserAndHousehold(userId: string, householdId?: string, limit?: number, offset?: number): Transaction[] {
    let query: string;
    let params: any[];
    
    if (householdId) {
      query = `
        SELECT id, user_id as userId, household_id as householdId, title, amount, 
               category, type, date, description,
               created_at as createdAt, updated_at as updatedAt
        FROM transactions 
        WHERE (user_id = ? AND household_id IS NULL) OR household_id = ?
        ORDER BY date DESC, created_at DESC
      `;
      params = [userId, householdId];
    } else {
      query = `
        SELECT id, user_id as userId, household_id as householdId, title, amount, 
               category, type, date, description,
               created_at as createdAt, updated_at as updatedAt
        FROM transactions 
        WHERE user_id = ? AND household_id IS NULL
        ORDER BY date DESC, created_at DESC
      `;
      params = [userId];
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
      if (offset) {
        query += ` OFFSET ${offset}`;
      }
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Transaction[];
  }

  create(transactionData: CreateTransactionData): Transaction {
    const id = `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO transactions (id, user_id, household_id, title, amount, category, type, date, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      transactionData.userId,
      transactionData.householdId || null,
      transactionData.title.trim(),
      transactionData.amount,
      transactionData.category,
      transactionData.type,
      transactionData.date,
      transactionData.description?.trim() || null,
      now,
      now
    );
    
    const newTransaction = this.findById(id);
    if (!newTransaction) {
      throw new Error('Failed to create transaction');
    }
    
    return newTransaction;
  }

  update(id: string, updates: Partial<Omit<CreateTransactionData, 'userId'>>): Transaction | undefined {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.title) {
      fields.push('title = ?');
      values.push(updates.title.trim());
    }
    
    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount);
    }
    
    if (updates.category) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    
    if (updates.type) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    
    if (updates.date) {
      fields.push('date = ?');
      values.push(updates.date);
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
      UPDATE transactions 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM transactions WHERE id = ?');
    const result = stmt.run(id);
    
    return result.changes > 0;
  }

  getBalance(userId: string, householdId?: string): { income: number; expense: number; balance: number } {
    let query: string;
    let params: any[];
    
    if (householdId) {
      query = `
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM transactions 
        WHERE (user_id = ? AND household_id IS NULL) OR household_id = ?
      `;
      params = [userId, householdId];
    } else {
      query = `
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM transactions 
        WHERE user_id = ? AND household_id IS NULL
      `;
      params = [userId];
    }
    
    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { income: number | null; expense: number | null };
    
    const income = result.income || 0;
    const expense = result.expense || 0;
    
    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  getCategoryTotals(userId: string, householdId?: string, type?: 'income' | 'expense'): { category: string; total: number }[] {
    let query: string;
    let params: any[];
    
    if (householdId) {
      query = `
        SELECT category, SUM(amount) as total
        FROM transactions 
        WHERE ((user_id = ? AND household_id IS NULL) OR household_id = ?)
      `;
      params = [userId, householdId];
    } else {
      query = `
        SELECT category, SUM(amount) as total
        FROM transactions 
        WHERE user_id = ? AND household_id IS NULL
      `;
      params = [userId];
    }
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' GROUP BY category ORDER BY total DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as { category: string; total: number }[];
  }
}

// Export singleton instance
export const transactionRepository = new TransactionRepository();