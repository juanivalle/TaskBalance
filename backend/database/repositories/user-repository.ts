import { getDatabase } from '../connection';
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
  private db = getDatabase();

  findByEmail(email: string): User | undefined {
    console.log('UserRepository.findByEmail called with:', email);
    
    const stmt = this.db.prepare(`
      SELECT id, email, password, name, provider, google_id as googleId, 
             created_at as createdAt, updated_at as updatedAt
      FROM users 
      WHERE LOWER(email) = LOWER(?)
    `);
    
    const user = stmt.get(email) as User | undefined;
    console.log('Found user:', user ? { id: user.id, email: user.email } : 'No user found');
    
    return user;
  }

  findById(id: string): User | undefined {
    const stmt = this.db.prepare(`
      SELECT id, email, password, name, provider, google_id as googleId,
             created_at as createdAt, updated_at as updatedAt
      FROM users 
      WHERE id = ?
    `);
    
    return stmt.get(id) as User | undefined;
  }

  findByGoogleId(googleId: string): User | undefined {
    const stmt = this.db.prepare(`
      SELECT id, email, password, name, provider, google_id as googleId,
             created_at as createdAt, updated_at as updatedAt
      FROM users 
      WHERE google_id = ?
    `);
    
    return stmt.get(googleId) as User | undefined;
  }

  create(userData: CreateUserData): User {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
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
    
    console.log('User created:', { id, email: userData.email, provider: userData.provider });
    
    const newUser = this.findById(id);
    if (!newUser) {
      throw new Error('Failed to create user');
    }
    
    return newUser;
  }

  updatePassword(userId: string, newPassword: string): void {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      UPDATE users 
      SET password = ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(hashedPassword, now, userId);
  }

  updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>): User | undefined {
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
    
    const stmt = this.db.prepare(`
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(userId);
  }

  getAllUsers(): Omit<User, 'password'>[] {
    const stmt = this.db.prepare(`
      SELECT id, email, name, provider, google_id as googleId,
             created_at as createdAt, updated_at as updatedAt
      FROM users
      ORDER BY created_at DESC
    `);
    
    return stmt.all() as Omit<User, 'password'>[];
  }

  deleteUser(userId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(userId);
    
    return result.changes > 0;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();