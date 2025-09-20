
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
  }),
});

export type AppRouter = typeof appRouter;