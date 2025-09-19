import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import jwt from 'jsonwebtoken';

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  console.log('Creating tRPC context for request:', opts.req.method, opts.req.url);
  
  return {
    req: opts.req,
    // You can add more context items here like database connections, auth, etc.
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC with transformer
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    console.log('tRPC Error formatting:', { shape, error: error.message });
    return {
      ...shape,
      data: {
        ...shape.data,
        message: error.message,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const authHeader = ctx.req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Token de autenticación requerido',
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
    };
    
    return next({
      ctx: {
        ...ctx,
        user: decoded,
      },
    });
  } catch {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Token de autenticación inválido',
    });
  }
});

// Protected procedure with authentication
export const protectedProcedure = t.procedure.use(authMiddleware);