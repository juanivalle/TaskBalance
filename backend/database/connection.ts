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
    console.log('=== INITIALIZING DATABASE ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Is Production:', isProduction);
    console.log('Vercel Environment:', !!process.env.VERCEL);
    
    if (isProduction) {
      // In production, use Vercel Postgres
      console.log('✅ Using Vercel Postgres in production');
      initializePostgresSchema();
      return null; // No SQLite instance in production
    } else {
      // In development, use SQLite
      console.log('✅ Using SQLite in development');
      return initializeSQLite();
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

function initializeSQLite() {
  console.log('=== INITIALIZING SQLITE ===');
  console.log('Database path:', DB_PATH);
  
  // Create data directory if it doesn't exist
  try {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    console.log('✅ Data directory created/verified');
  } catch (error) {
    console.log('Data directory already exists or error:', error);
  }

  // Initialize database
  db = new Database(DB_PATH);
  console.log('✅ SQLite database connection established');
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  console.log('✅ Foreign keys enabled');
  
  // Set journal mode to WAL for better performance
  db.pragma('journal_mode = WAL');
  console.log('✅ WAL mode enabled');
  
  // Read and execute schema
  const schemaPath = join(process.cwd(), 'backend', 'database', 'schema.sql');
  console.log('Schema path:', schemaPath);
  
  try {
    const schema = readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file read successfully');
    
    // Execute schema in a transaction
    db.exec(schema);
    console.log('✅ Schema executed successfully');
  } catch (error) {
    console.error('❌ Failed to read or execute schema:', error);
    throw error;
  }
  
  console.log('✅ SQLite database initialized successfully');
  
  // Insert demo users if they don't exist
  insertDemoUsers();
  
  return db;
}

async function initializePostgresSchema() {
  try {
    console.log('=== INITIALIZING POSTGRESQL SCHEMA ===');
    
    // Create tables if they don't exist
    console.log('Creating users table...');
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

    console.log('Creating households table...');
    await sql`
      CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        currency TEXT DEFAULT 'UYU',
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Add foreign key constraint separately for PostgreSQL compatibility
    try {
      await sql`
        ALTER TABLE households 
        ADD CONSTRAINT fk_households_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      `;
    } catch (error) {
      // Constraint might already exist, ignore error
      console.log('Foreign key constraint might already exist:', error);
    }

    console.log('Creating household_members table...');
    await sql`
      CREATE TABLE IF NOT EXISTS household_members (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(household_id, user_id)
      )
    `;
    
    // Add foreign key constraints separately for PostgreSQL compatibility
    try {
      await sql`
        ALTER TABLE household_members 
        ADD CONSTRAINT fk_household_members_household_id 
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
      `;
    } catch (error) {
      console.log('Foreign key constraint might already exist:', error);
    }
    
    try {
      await sql`
        ALTER TABLE household_members 
        ADD CONSTRAINT fk_household_members_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `;
    } catch (error) {
      console.log('Foreign key constraint might already exist:', error);
    }

    console.log('Creating transactions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        household_id TEXT,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        date TIMESTAMP NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Add foreign key constraints separately
    try {
      await sql`
        ALTER TABLE transactions 
        ADD CONSTRAINT fk_transactions_household_id 
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL
      `;
    } catch (error) {
      console.log('Foreign key constraint might already exist:', error);
    }
    
    try {
      await sql`
        ALTER TABLE transactions 
        ADD CONSTRAINT fk_transactions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `;
    } catch (error) {
      console.log('Foreign key constraint might already exist:', error);
    }

    console.log('Creating goals table...');
    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        household_id TEXT,
        title TEXT NOT NULL,
        target_amount DECIMAL(10,2) NOT NULL,
        current_amount DECIMAL(10,2) DEFAULT 0,
        target_date TIMESTAMP,
        category TEXT,
        description TEXT,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Add foreign key constraints separately
    try {
      await sql`
        ALTER TABLE goals 
        ADD CONSTRAINT fk_goals_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `;
    } catch (error) {
      console.log('Foreign key constraint might already exist:', error);
    }
    
    try {
      await sql`
        ALTER TABLE goals 
        ADD CONSTRAINT fk_goals_household_id 
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL
      `;
    } catch (error) {
      console.log('Foreign key constraint might already exist:', error);
    }

    console.log('✅ PostgreSQL schema initialized successfully');
    
    // Insert demo users if they don't exist
    await insertDemoUsersPostgres();
  } catch (error) {
    console.error('❌ Failed to initialize PostgreSQL schema:', error);
    console.error('PostgreSQL Error details:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

function insertDemoUsers() {
  try {
    // Check if demo users already exist
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@taskbalance.com');
    console.log('Existing demo user check:', existingUser);
    
    if (!existingUser) {
      const insertUser = db.prepare(`
        INSERT INTO users (id, email, password, name, provider, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      // Insert demo users
      console.log('Inserting demo user with ID: demo1');
      insertUser.run(
        'demo1',
        'demo@taskbalance.com',
        bcrypt.hashSync('demo123', 10),
        'Usuario Demo',
        'email',
        new Date().toISOString()
      );
      
      console.log('Inserting test user with ID: test1');
      insertUser.run(
        'test1',
        'test@test.com',
        bcrypt.hashSync('test123', 10),
        'Usuario Test',
        'email',
        new Date().toISOString()
      );
      
      console.log('✅ Demo users inserted successfully');
      
      // Verify insertion
      const verifyUser = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get('demo@taskbalance.com');
      console.log('Verification - Demo user after insertion:', verifyUser);
    } else {
      console.log('✅ Demo users already exist');
      // Show existing users for debugging
      const allUsers = db.prepare('SELECT id, email, name FROM users').all();
      console.log('All existing users:', allUsers);
    }
  } catch (error) {
    console.error('❌ Failed to insert demo users:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
  }
}

async function insertDemoUsersPostgres() {
  try {
    // Check if demo users already exist
    const existingUser = await sql`SELECT id FROM users WHERE email = 'demo@taskbalance.com'`;
    console.log('PostgreSQL - Existing demo user check:', existingUser.rows);
    
    if (existingUser.rows.length === 0) {
      console.log('PostgreSQL - Inserting demo users...');
      // Insert demo users
      await sql`
        INSERT INTO users (id, email, password, name, provider, created_at)
        VALUES 
          ('demo1', 'demo@taskbalance.com', ${bcrypt.hashSync('demo123', 10)}, 'Usuario Demo', 'email', CURRENT_TIMESTAMP),
          ('test1', 'test@test.com', ${bcrypt.hashSync('test123', 10)}, 'Usuario Test', 'email', CURRENT_TIMESTAMP)
      `;
      
      console.log('✅ Demo users inserted successfully in PostgreSQL');
      
      // Verify insertion
      const verifyUser = await sql`SELECT id, email, name FROM users WHERE email = 'demo@taskbalance.com'`;
      console.log('PostgreSQL - Verification - Demo user after insertion:', verifyUser.rows[0]);
    } else {
      console.log('✅ Demo users already exist in PostgreSQL');
      // Show existing users for debugging
      const allUsers = await sql`SELECT id, email, name FROM users`;
      console.log('PostgreSQL - All existing users:', allUsers.rows);
    }
  } catch (error) {
    console.error('❌ Failed to insert demo users in PostgreSQL:', error);
    console.error('PostgreSQL Error details:', error instanceof Error ? error.message : String(error));
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
console.log('=== DATABASE MODULE LOADING ===');
try {
  initializeDatabase();
  console.log('=== DATABASE MODULE LOADED SUCCESSFULLY ===');
} catch (error) {
  console.error('=== DATABASE MODULE FAILED TO LOAD ===');
  console.error('Error:', error);
}