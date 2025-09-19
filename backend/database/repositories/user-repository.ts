import { getDatabase, sql, isProduction } from '../connection';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  provider: 'email' | 'google';
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  password?: string;
  name: string;
  provider: 'email' | 'google';
  googleId?: string;
}

export class UserRepository {
  private db = isProduction ? null : getDatabase();

  async findByEmail(email: string): Promise<User | undefined> {
    console.log('UserRepository.findByEmail called with:', email);
    
    if (isProduction) {
      const result = await sql`
        SELECT id, email, password, name, provider, google_id as "googleId", 
               created_at as "createdAt", updated_at as "updatedAt"
        FROM users 
        WHERE LOWER(email) = LOWER(${email})
      `;
      
      const user = result.rows[0] as User | undefined;
      console.log('Found user:', user ? { id: user.id, email: user.email } : 'No user found');
      return user;
    } else {
      const stmt = this.db!.prepare(`
        SELECT id, email, password, name, provider, google_id as googleId, 
               created_at as createdAt, updated_at as updatedAt
        FROM users 
        WHERE LOWER(email) = LOWER(?)
      `);
      
      const user = stmt.get(email) as User | undefined;
      console.log('Found user:', user ? { id: user.id, email: user.email } : 'No user found');
      return user;
    }
  }

  async findById(id: string): Promise<User | undefined> {
    if (isProduction) {
      const result = await sql`
        SELECT id, email, password, name, provider, google_id as "googleId",
               created_at as "createdAt", updated_at as "updatedAt"
        FROM users 
        WHERE id = ${id}
      `;
      
      return result.rows[0] as User | undefined;
    } else {
      const stmt = this.db!.prepare(`
        SELECT id, email, password, name, provider, google_id as googleId,
               created_at as createdAt, updated_at as updatedAt
        FROM users 
        WHERE id = ?
      `);
      
      return stmt.get(id) as User | undefined;
    }
  }

  async findByGoogleId(googleId: string): Promise<User | undefined> {
    if (isProduction) {
      const result = await sql`
        SELECT id, email, password, name, provider, google_id as "googleId",
               created_at as "createdAt", updated_at as "updatedAt"
        FROM users 
        WHERE google_id = ${googleId}
      `;
      
      return result.rows[0] as User | undefined;
    } else {
      const stmt = this.db!.prepare(`
        SELECT id, email, password, name, provider, google_id as googleId,
               created_at as createdAt, updated_at as updatedAt
        FROM users 
        WHERE google_id = ?
      `);
      
      return stmt.get(googleId) as User | undefined;
    }
  }

  async create(userData: CreateUserData): Promise<User> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    if (isProduction) {
      await sql`
        INSERT INTO users (id, email, password, name, provider, google_id, created_at, updated_at)
        VALUES (${id}, ${userData.email.toLowerCase().trim()}, ${userData.password || null}, 
                ${userData.name.trim()}, ${userData.provider}, ${userData.googleId || null}, 
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
    } else {
      const stmt = this.db!.prepare(`
        INSERT INTO users (id, email, password, name, provider, google_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        userData.email.toLowerCase().trim(),
        userData.password,
        userData.name.trim(),
        userData.provider,
        userData.googleId || null,
        now,
        now
      );
    }
    
    console.log('User created:', { id, email: userData.email, provider: userData.provider });
    
    const newUser = await this.findById(id);
    if (!newUser) {
      throw new Error('Failed to create user');
    }
    
    return newUser;
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    if (isProduction) {
      await sql`
        UPDATE users 
        SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
      `;
    } else {
      const now = new Date().toISOString();
      const stmt = this.db!.prepare(`
        UPDATE users 
        SET password = ?, updated_at = ?
        WHERE id = ?
      `);
      
      stmt.run(hashedPassword, now, userId);
    }
  }

  async updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User | undefined> {
    if (isProduction) {
      const fields: string[] = [];
      const values: any = {};
      
      if (updates.name) {
        fields.push('name = ${name}');
        values.name = updates.name.trim();
      }
      
      if (updates.email) {
        fields.push('email = ${email}');
        values.email = updates.email.toLowerCase().trim();
      }
      
      if (fields.length === 0) {
        return this.findById(userId);
      }
      
      // This is a simplified version - in a real app you'd want to use a proper query builder
      if (updates.name && updates.email) {
        await sql`
          UPDATE users 
          SET name = ${updates.name.trim()}, email = ${updates.email.toLowerCase().trim()}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
        `;
      } else if (updates.name) {
        await sql`
          UPDATE users 
          SET name = ${updates.name.trim()}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
        `;
      } else if (updates.email) {
        await sql`
          UPDATE users 
          SET email = ${updates.email.toLowerCase().trim()}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
        `;
      }
    } else {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: any[] = [];
      
      if (updates.name) {
        fields.push('name = ?');
        values.push(updates.name.trim());
      }
      
      if (updates.email) {
        fields.push('email = ?');
        values.push(updates.email.toLowerCase().trim());
      }
      
      if (fields.length === 0) {
        return this.findById(userId);
      }
      
      fields.push('updated_at = ?');
      values.push(now, userId);
      
      const stmt = this.db!.prepare(`
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = ?
      `);
      
      stmt.run(...values);
    }
    
    return this.findById(userId);
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    if (isProduction) {
      const result = await sql`
        SELECT id, email, name, provider, google_id as "googleId",
               created_at as "createdAt", updated_at as "updatedAt"
        FROM users
        ORDER BY created_at DESC
      `;
      
      return result.rows as Omit<User, 'password'>[];
    } else {
      const stmt = this.db!.prepare(`
        SELECT id, email, name, provider, google_id as googleId,
               created_at as createdAt, updated_at as updatedAt
        FROM users
        ORDER BY created_at DESC
      `);
      
      return stmt.all() as Omit<User, 'password'>[];
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (isProduction) {
      const result = await sql`DELETE FROM users WHERE id = ${userId}`;
      return (result.rowCount || 0) > 0;
    } else {
      const stmt = this.db!.prepare('DELETE FROM users WHERE id = ?');
      const result = stmt.run(userId);
      return result.changes > 0;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();