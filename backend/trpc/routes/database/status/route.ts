import { publicProcedure } from '@/backend/trpc/create-context';
import { getDatabase } from '@/backend/database/connection';

export const getDatabaseStatusProcedure = publicProcedure
  .query(async () => {
    try {
      const db = getDatabase();
      
      // Test database connection by counting users
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const householdCount = db.prepare('SELECT COUNT(*) as count FROM households').get() as { count: number };
      const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
      const goalCount = db.prepare('SELECT COUNT(*) as count FROM goals').get() as { count: number };
      
      return {
        status: 'connected',
        database: 'SQLite',
        tables: {
          users: userCount.count,
          households: householdCount.count,
          transactions: transactionCount.count,
          goals: goalCount.count,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Database status check failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  });