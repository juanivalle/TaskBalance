
import { createTRPCRouter, publicProcedure } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { registerProcedure } from "./routes/auth/register/route";
import { loginProcedure } from "./routes/auth/login/route";
import { googleAuthProcedure } from "./routes/auth/google/route";


export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    register: registerProcedure,
    login: loginProcedure,
    googleAuth: googleAuthProcedure,
  }),
});

export type AppRouter = typeof appRouter;