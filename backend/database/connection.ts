import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import bcrypt from 'bcryptjs';

// Database file path
const DB_PATH = join(process.cwd(), 'data', 'app.db');

// Create database instance
let db: Database.Database;

export function initializeDatabase() {
  try {
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
    
    console.log('✅ Database initialized successfully');
    
    // Insert demo users if they don't exist
    insertDemoUsers();
    
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
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

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Initialize database on module load
initializeDatabase();