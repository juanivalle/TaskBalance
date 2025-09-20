import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import jwt from 'jsonwebtoken';

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  console.log('=== CREATING tRPC CONTEXT ===');
  console.log('Request method:', opts.req.method);
  console.log('Request URL:', opts.req.url);
  console.log('Request headers:', Object.fromEntries(opts.req.headers.entries()));
  
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
  console.log('Request URL:', ctx.req.url);
  console.log('Request method:', ctx.req.method);
  
  const authHeader = ctx.req.headers.get('authorization');
  console.log('Authorization header present:', !!authHeader);
  console.log('Authorization header value:', authHeader ? authHeader.substring(0, 30) + '...' : 'None');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid authorization header found');
    console.log('Expected format: Bearer <token>');
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Token de autenticación requerido',
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('Extracted token length:', token.length);
  console.log('Token preview:', token.substring(0, 20) + '...');
  console.log('Token type detection:', {
    isDemo: token.startsWith('demo_token_'),
    isGoogle: token.startsWith('google_token_'),
    isJWT: !token.startsWith('demo_token_') && !token.startsWith('google_token_')
  });
  
  try {
    // Handle demo tokens for development/testing
    if (token.startsWith('demo_token_') || token.startsWith('google_token_')) {
      console.log('Processing demo token for authentication');
      
      // For demo tokens, extract timestamp to create a unique user ID
      const timestamp = token.split('_').pop() || Date.now().toString();
      const isGoogle = token.includes('google');
      
      const demoUser = {
        userId: isGoogle ? `google_demo_user_${timestamp}` : `demo_user_${timestamp}`,
        email: isGoogle ? 'demo@gmail.com' : 'demo@taskbalance.com',
        name: isGoogle ? 'Usuario Demo Google' : 'Usuario Demo',
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
    console.log('Verifying JWT token with secret...');
    console.log('JWT_SECRET available:', !!JWT_SECRET);
    console.log('JWT_SECRET length:', JWT_SECRET.length);
    
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
    };
    
    console.log('JWT token verified successfully');
    console.log('Decoded user:', { userId: decoded.userId, email: decoded.email, name: decoded.name });
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
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Token was:', token.substring(0, 50) + '...');
    
    // Provide more specific error messages
    let errorMessage = 'Token de autenticación inválido';
    if (error instanceof Error) {
      console.log('Processing JWT error:', error.name);
      if (error.message.includes('jwt expired')) {
        errorMessage = 'Token de autenticación expirado. Por favor inicia sesión nuevamente.';
      } else if (error.message.includes('jwt malformed')) {
        errorMessage = 'Token de autenticación mal formado';
      } else if (error.message.includes('invalid signature')) {
        errorMessage = 'Token de autenticación con firma inválida';
      } else if (error.message.includes('invalid token')) {
        errorMessage = 'Token de autenticación inválido';
      }
    }
    
    console.error('Final error message:', errorMessage);
    
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: errorMessage,
    });
  }
});

// Protected procedure with authentication
export const protectedProcedure = t.procedure.use(authMiddleware);