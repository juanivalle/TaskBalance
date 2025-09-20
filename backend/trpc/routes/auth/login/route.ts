import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { publicProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';
import { userRepository } from '@/backend/database/repositories/user-repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const loginProcedure = publicProcedure
  .input(loginSchema)
  .mutation(async ({ input }) => {
    const { email, password } = input;

    console.log('=== LOGIN PROCEDURE START ===');
    console.log('Input:', { email, passwordLength: password.length });

    try {
      // Validate input
      if (!email || !email.trim()) {
        console.log('Validation failed: Email is required');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El email es requerido',
        });
      }
      
      if (!password || !password.trim()) {
        console.log('Validation failed: Password is required');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'La contraseña es requerida',
        });
      }

      // Find user by email with detailed logging
      console.log('Looking for user with email:', email.toLowerCase().trim());
      const user = await userRepository.findByEmail(email.toLowerCase().trim());
      console.log('User found:', user ? { id: user.id, email: user.email, provider: user.provider } : 'None');
      
      if (!user) {
        console.log('Login failed: User not found');
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Credenciales inválidas',
        });
      }

      // Check if user registered with Google or has no password
      if (user.provider === 'google' || !user.password) {
        console.log('Login failed: Google account or no password');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Esta cuenta fue creada con Google. Por favor inicia sesión con Google.',
        });
      }

      // Verify password with detailed logging
      console.log('Verifying password...');
      let isValidPassword: boolean;
      try {
        isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password verification result:', isValidPassword);
      } catch (compareError) {
        console.error('Password comparison failed:', compareError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al verificar la contraseña',
        });
      }
      
      if (!isValidPassword) {
        console.log('Login failed: Invalid password');
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Credenciales inválidas',
        });
      }

      // Generate JWT token
      console.log('Generating JWT token...');
      let token: string;
      try {
        token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email,
            name: user.name 
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        console.log('JWT token generated successfully');
      } catch (tokenError) {
        console.error('JWT token generation failed:', tokenError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al generar el token de autenticación',
        });
      }

      console.log('=== LOGIN PROCEDURE SUCCESS ===');
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      };
    } catch (error) {
      console.error('=== LOGIN PROCEDURE ERROR ===');
      console.error('Error details:', error);
      
      // If it's already a TRPCError, re-throw it
      if (error instanceof TRPCError) {
        throw error;
      }
      
      // Otherwise, wrap it in a TRPCError
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor al iniciar sesión',
        cause: error,
      });
    }
  });