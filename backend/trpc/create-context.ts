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
  console.log('=== AUTH MIDDLEWARE START ===');
  const authHeader = ctx.req.headers.get('authorization');
  console.log('Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid authorization header found');
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Token de autenticación requerido',
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('Extracted token:', token.substring(0, 20) + '...');
  
  try {
    // Handle demo tokens for development/testing
    if (token.startsWith('demo_token_') || token.startsWith('google_token_')) {
      console.log('Using demo token for authentication');
      
      // Extract user info from stored auth or create a demo user
      const demoUser = {
        userId: token.includes('google') ? 'google_demo_user' : 'demo_user_123',
        email: 'demo@taskbalance.com',
        name: 'Usuario Demo',
      };
      
      console.log('Demo user authenticated:', demoUser);
      console.log('=== AUTH MIDDLEWARE SUCCESS (DEMO) ===');
      
      return next({
        ctx: {
          ...ctx,
          user: demoUser,
        },
      });
    }
    
    // Handle real JWT tokens
    console.log('Verifying JWT token...');
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
    };
    
    console.log('JWT token verified, user:', { userId: decoded.userId, email: decoded.email });
    console.log('=== AUTH MIDDLEWARE SUCCESS (JWT) ===');
    
    return next({
      ctx: {
        ...ctx,
        user: decoded,
      },
    });
  } catch (error) {
    console.error('=== AUTH MIDDLEWARE ERROR ===');
    console.error('Token verification failed:', error);
    console.error('Token was:', token.substring(0, 50) + '...');
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Token de autenticación inválido',
    });
  }
});

// Protected procedure with authentication
export const protectedProcedure = t.procedure.use(authMiddleware);