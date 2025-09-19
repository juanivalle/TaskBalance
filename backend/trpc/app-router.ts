
import { createTRPCRouter, publicProcedure } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { registerProcedure } from "./routes/auth/register/route";
import { loginProcedure } from "./routes/auth/login/route";
import { googleAuthProcedure } from "./routes/auth/google/route";
import { getUserProfileProcedure } from "./routes/user/profile/route";
import { getDatabaseStatusProcedure } from "./routes/database/status/route";
import { createHouseholdProcedure } from "./routes/household/create/route";


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
  }),
});

export type AppRouter = typeof appRouter;