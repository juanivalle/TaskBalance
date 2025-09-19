import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import './database/connection'; // Initialize database on startup

// app will be mounted at /api
const app = new Hono();

// Add logger middleware
app.use('*', logger());

// Enable CORS for all routes with specific headers
app.use("*", cors({
  origin: '*', // Allow all origins in development
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'trpc-batch-mode', 'x-trpc-source', 'x-requested-with'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Add request logging and error handling
app.use('*', async (c, next) => {
  const clientIP = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  console.log(`=== ${c.req.method} ${c.req.url} from ${clientIP} ===`);
  console.log('Request headers:', Object.fromEntries(c.req.raw.headers.entries()));
  
  // Add response headers for better mobile compatibility
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, trpc-batch-mode, x-trpc-source, x-requested-with');
  c.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return c.text('', 200);
  }
  
  try {
    await next();
    console.log(`=== ${c.req.method} ${c.req.url} COMPLETED ===`);
  } catch (error) {
    console.error(`=== ${c.req.method} ${c.req.url} ERROR ===`);
    console.error('Request processing error:', error);
    
    // Return proper JSON error response
    return c.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      },
      500
    );
  }
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
    onError: ({ error, path, type, input }) => {
      console.error(`=== tRPC Error [${type}] on ${path} ===`);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        cause: error.cause,
        input,
        stack: error.stack,
      });
      console.error('=== End tRPC Error ===');
    },
    responseMeta: ({ ctx, paths, errors, type }) => {
      console.log('tRPC Response Meta:', { paths, type, hasErrors: errors.length > 0 });
      return {
        headers: {
          'Content-Type': 'application/json',
        },
      };
    },
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;