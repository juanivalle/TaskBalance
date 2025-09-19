import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { publicProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';
import { findUserByEmail, createUser } from '../user-storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  name: z.string().min(1, 'El nombre es requerido'),
});

// Simple test procedure
export const testProcedure = publicProcedure
  .input(z.object({ message: z.string() }))
  .mutation(async ({ input }) => {
    console.log('=== AUTH TEST PROCEDURE CALLED ===');
    console.log('Test procedure called with:', input);
    const result = { 
      success: true, 
      message: `Echo: ${input.message}`,
      timestamp: new Date().toISOString(),
      backend: 'Auth backend is working'
    };
    console.log('Test procedure result:', result);
    return result;
  });

export const registerProcedure = publicProcedure
  .input(registerSchema)
  .mutation(async ({ input }) => {
    console.log('=== REGISTER PROCEDURE START ===');
    console.log('Register procedure called with input:', {
      email: input.email,
      name: input.name,
      passwordLength: input.password.length
    });
    
    const { email, password, name } = input;

    try {
      // Validate input data with detailed logging
      console.log('Validating input data...');
      
      if (!email || !email.trim()) {
        console.log('Validation failed: email is empty');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El email es requerido',
        });
      }
      
      if (!password || password.length < 8) {
        console.log('Validation failed: password too short');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'La contraseña debe tener al menos 8 caracteres',
        });
      }
      
      if (!name || !name.trim()) {
        console.log('Validation failed: name is empty');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El nombre es requerido',
        });
      }
      
      console.log('Input validation passed');

      // Check if user already exists
      console.log('Checking if user exists with email:', email);
      const existingUser = findUserByEmail(email);
      if (existingUser) {
        console.log('User already exists:', email);
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ya existe una cuenta con este email',
        });
      }
      console.log('User does not exist, proceeding with registration');

      // Hash password with error handling
      console.log('Starting password hashing...');
      let hashedPassword: string;
      try {
        const saltRounds = 10; // Reduced from 12 for better performance
        hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Password hashed successfully');
      } catch (hashError) {
        console.error('Password hashing failed:', hashError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al procesar la contraseña',
        });
      }

      // Create user with error handling
      console.log('Creating user in database...');
      let newUser;
      try {
        newUser = createUser({
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: name.trim(),
          provider: 'email',
        });
        console.log('User created successfully:', { id: newUser.id, email: newUser.email, name: newUser.name });
      } catch (createError) {
        console.error('User creation failed:', createError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al crear el usuario',
        });
      }

      // Generate JWT token with error handling
      console.log('Generating JWT token...');
      let token: string;
      try {
        token = jwt.sign(
          { 
            userId: newUser.id, 
            email: newUser.email,
            name: newUser.name 
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        console.log('JWT token generated successfully');
      } catch (jwtError) {
        console.error('JWT generation failed:', jwtError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al generar el token de autenticación',
        });
      }

      const result = {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
        token,
      };
      
      console.log('Register procedure completed successfully');
      console.log('=== REGISTER PROCEDURE END ===');
      return result;
    } catch (error) {
      console.error('=== REGISTER PROCEDURE ERROR ===');
      console.error('Error in register procedure:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        code: error instanceof TRPCError ? error.code : 'UNKNOWN'
      });
      
      // If it's already a TRPCError, re-throw it
      if (error instanceof TRPCError) {
        throw error;
      }
      
      // Otherwise, wrap it in a TRPCError
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor al crear la cuenta',
        cause: error,
      });
    }
  });