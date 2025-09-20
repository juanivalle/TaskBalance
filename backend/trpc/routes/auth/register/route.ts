import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { publicProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';
import { userRepository } from '@/backend/database/repositories/user-repository';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  name: z.string().min(1, 'El nombre es requerido'),
});

export const registerProcedure = publicProcedure
  .input(registerSchema)
  .mutation(async ({ input }) => {
    const { email, password, name } = input;

    console.log('=== REGISTER PROCEDURE START ===');
    console.log('Input:', { email, name, passwordLength: password.length });

    try {
      // Validate input data with detailed logging
      if (!email || !email.trim()) {
        console.log('Validation failed: Email is required');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El email es requerido',
        });
      }
      
      if (!password || password.length < 8) {
        console.log('Validation failed: Password too short');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'La contraseña debe tener al menos 8 caracteres',
        });
      }
      
      if (!name || !name.trim()) {
        console.log('Validation failed: Name is required');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El nombre es requerido',
        });
      }

      // Check if user already exists with detailed logging
      console.log('Checking if user exists with email:', email.toLowerCase().trim());
      const existingUser = await userRepository.findByEmail(email.toLowerCase().trim());
      console.log('Existing user found:', existingUser ? { id: existingUser.id, email: existingUser.email } : 'None');
      
      if (existingUser) {
        console.log('Registration failed: User already exists');
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ya existe una cuenta con este email',
        });
      }

      // Hash password
      console.log('Hashing password...');
      let hashedPassword: string;
      try {
        const saltRounds = 12; // Increased security
        hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Password hashed successfully');
      } catch (hashError) {
        console.error('Password hashing failed:', hashError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al procesar la contraseña',
        });
      }

      // Create user
      console.log('Creating user in database...');
      let newUser;
      try {
        newUser = await userRepository.create({
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: name.trim(),
          provider: 'email',
        });
        console.log('User created successfully:', { id: newUser.id, email: newUser.email });
      } catch (createError) {
        console.error('User creation failed:', createError);
        
        // Check if it's a duplicate key error
        if (createError instanceof Error && createError.message.includes('UNIQUE constraint failed')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Ya existe una cuenta con este email',
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al crear el usuario',
        });
      }

      console.log('=== REGISTER PROCEDURE SUCCESS ===');
      // Return success without token to prevent auto-login
      return {
        success: true,
        message: 'Cuenta creada exitosamente. Por favor inicia sesión.',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      };
    } catch (error) {
      console.error('=== REGISTER PROCEDURE ERROR ===');
      console.error('Error details:', error);
      
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