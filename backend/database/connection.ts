import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';

// Database file path for local development
const DB_PATH = join(process.cwd(), 'data', 'app.db');

// Database instance for SQLite (local)
let db: Database.Database;

// Check if we're in production (Vercel)
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

export function initializeDatabase() {
  try {
    if (isProduction) {
      // In production, use Vercel Postgres
      console.log('✅ Using Vercel Postgres in production');
      initializePostgresSchema();
      return null; // No SQLite instance in production
    } else {
      // In development, use SQLite
      return initializeSQLite();
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

function initializeSQLite() {
  // Create data directory if it doesn't exist
  try {
    mkdirSync(dirname(DB_PATH), { recursive: true });
  } catch {
    // Directory might already exist, ignore error
  }

  // Initialize database
  db = new Database(DB_PATH);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Set journal mode to WAL for better performance
  db.pragma('journal_mode = WAL');
  
  // Read and execute schema
  const schemaPath = join(process.cwd(), 'backend', 'database', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');
  
  // Execute schema in a transaction
  db.exec(schema);
  
  console.log('✅ SQLite database initialized successfully');
  
  // Insert demo users if they don't exist
  insertDemoUsers();
  
  return db;
}

async function initializePostgresSchema() {
  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        name TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'email',
        google_id TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        currency TEXT DEFAULT 'USD',
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS household_members (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(household_id, user_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        target_amount DECIMAL(10,2) NOT NULL,
        current_amount DECIMAL(10,2) DEFAULT 0,
        target_date TIMESTAMP,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    console.log('✅ PostgreSQL schema initialized successfully');
    
    // Insert demo users if they don't exist
    await insertDemoUsersPostgres();
  } catch (error) {
    console.error('❌ Failed to initialize PostgreSQL schema:', error);
    throw error;
  }
}

function insertDemoUsers() {
  try {
    // Check if demo users already exist
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@taskbalance.com');
    
    if (!existingUser) {
      const insertUser = db.prepare(`
        INSERT INTO users (id, email, password, name, provider, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      // Insert demo users
      insertUser.run(
        'demo1',
        'demo@taskbalance.com',
        bcrypt.hashSync('demo123', 10),
        'Usuario Demo',
        'email',
        new Date().toISOString()
      );
      
      insertUser.run(
        'test1',
        'test@test.com',
        bcrypt.hashSync('test123', 10),
        'Usuario Test',
        'email',
        new Date().toISOString()
      );
      
      console.log('✅ Demo users inserted successfully');
    }
  } catch (error) {
    console.error('❌ Failed to insert demo users:', error);
  }
}

async function insertDemoUsersPostgres() {
  try {
    // Check if demo users already exist
    const existingUser = await sql`SELECT id FROM users WHERE email = 'demo@taskbalance.com'`;
    
    if (existingUser.rows.length === 0) {
      // Insert demo users
      await sql`
        INSERT INTO users (id, email, password, name, provider, created_at)
        VALUES 
          ('demo1', 'demo@taskbalance.com', ${bcrypt.hashSync('demo123', 10)}, 'Usuario Demo', 'email', CURRENT_TIMESTAMP),
          ('test1', 'test@test.com', ${bcrypt.hashSync('test123', 10)}, 'Usuario Test', 'email', CURRENT_TIMESTAMP)
      `;
      
      console.log('✅ Demo users inserted successfully in PostgreSQL');
    }
  } catch (error) {
    console.error('❌ Failed to insert demo users in PostgreSQL:', error);
  }
}

export function getDatabase(): Database.Database {
  if (isProduction) {
    throw new Error('SQLite database not available in production. Use PostgreSQL queries directly.');
  }
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Export SQL for production use
export { sql };
export { isProduction };

// Initialize database on module load
initializeDatabase();