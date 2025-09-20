
import { createTRPCRouter, publicProcedure, protectedProcedure } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { registerProcedure } from "./routes/auth/register/route";
import { loginProcedure } from "./routes/auth/login/route";
import { googleAuthProcedure } from "./routes/auth/google/route";
import { getUserProfileProcedure } from "./routes/user/profile/route";
import { getDatabaseStatusProcedure } from "./routes/database/status/route";
import { createHouseholdProcedure } from "./routes/household/create/route";
import { householdRepository } from "@/backend/database/repositories/household-repository";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  database: createTRPCRouter({
    status: getDatabaseStatusProcedure,
  }),
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    register: registerProcedure,
    login: loginProcedure,
    googleAuth: googleAuthProcedure,
  }),
  user: createTRPCRouter({
    profile: getUserProfileProcedure,
  }),
  household: createTRPCRouter({
    create: createHouseholdProcedure,
    test: protectedProcedure.query(async ({ ctx }) => {
      console.log('=== HOUSEHOLD TEST ENDPOINT ===');
      console.log('User context:', ctx.user);
      
      try {
        // Test database connection
        const testHousehold = await householdRepository.create({
          name: 'Test Household ' + Date.now(),
          description: 'Test description',
          currency: 'UYU',
          createdBy: ctx.user.userId,
        });
        
        console.log('Test household created:', testHousehold);
        
        // Get members
        const members = await householdRepository.getMembers(testHousehold.id);
        console.log('Test household members:', members);
        
        // Clean up - delete test household
        await householdRepository.delete(testHousehold.id);
        console.log('Test household deleted');
        
        return {
          success: true,
          message: 'Household creation test passed',
          testData: {
            household: testHousehold,
            members,
          },
        };
      } catch (error) {
        console.error('Household test failed:', error);
        return {
          success: false,
          message: 'Household creation test failed',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
    debug: protectedProcedure.query(async ({ ctx }) => {
      console.log('=== HOUSEHOLD DEBUG ENDPOINT ===');
      console.log('User context:', ctx.user);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Is Production:', process.env.VERCEL || process.env.NODE_ENV === 'production');
      
      try {
        // Check if user exists in database
        const { userRepository } = await import('@/backend/database/repositories/user-repository');
        const user = await userRepository.findById(ctx.user.userId);
        console.log('User found in database:', user);
        
        // Check database connection
        const { isProduction, sql, getDatabase } = await import('@/backend/database/connection');
        console.log('Database connection info:', { isProduction });
        
        if (isProduction) {
          // Test PostgreSQL connection
          const result = await sql`SELECT 1 as test`;
          console.log('PostgreSQL connection test:', result.rows);
          
          // Check if tables exist
          const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'households', 'household_members')
          `;
          console.log('PostgreSQL tables:', tables.rows);
        } else {
          // Test SQLite connection
          const db = getDatabase();
          const result = db.prepare('SELECT 1 as test').get();
          console.log('SQLite connection test:', result);
          
          // Check if tables exist
          const tables = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name IN ('users', 'households', 'household_members')
          `).all();
          console.log('SQLite tables:', tables);
        }
        
        return {
          success: true,
          environment: {
            nodeEnv: process.env.NODE_ENV,
            isProduction,
            vercel: !!process.env.VERCEL,
          },
          user: {
            contextUser: ctx.user,
            databaseUser: user,
          },
          database: {
            type: isProduction ? 'PostgreSQL' : 'SQLite',
            connected: true,
          },
        };
      } catch (error) {
        console.error('Debug endpoint failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;