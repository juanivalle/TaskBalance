import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { registerProcedure, testProcedure } from "./routes/auth/register/route";
import { loginProcedure } from "./routes/auth/login/route";
import { googleAuthProcedure } from "./routes/auth/google/route";
import { getAllUsers } from "./routes/auth/user-storage";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    console.log('=== HEALTH CHECK CALLED ===');
    const result = { status: 'ok', timestamp: new Date().toISOString(), backend: 'working' };
    console.log('Health check result:', result);
    return result;
  }),
  debug: publicProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      console.log('=== DEBUG ENDPOINT CALLED ===');
      console.log('Debug endpoint called with:', input);
      const result = { 
        success: true, 
        echo: input.message,
        timestamp: new Date().toISOString(),
        server: 'tRPC backend is working',
        environment: process.env.NODE_ENV || 'development'
      };
      console.log('Debug endpoint result:', result);
      return result;
    }),
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    test: testProcedure,
    register: registerProcedure,
    login: loginProcedure,
    googleAuth: googleAuthProcedure,
    listUsers: publicProcedure.query(() => {
      console.log('=== LIST USERS CALLED ===');
      const users = getAllUsers();
      console.log('Users in database:', users);
      return { users, total: users.length };
    }),
  }),
});

export type AppRouter = typeof appRouter;