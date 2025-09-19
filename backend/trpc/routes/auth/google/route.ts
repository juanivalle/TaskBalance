import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { publicProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';
import { userRepository } from '@/backend/database/repositories/user-repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const googleAuthSchema = z.object({
  googleId: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().optional(),
});

export const googleAuthProcedure = publicProcedure
  .input(googleAuthSchema)
  .mutation(async ({ input }) => {
    console.log('=== GOOGLE AUTH PROCEDURE START ===');
    console.log('Google auth procedure called with input:', {
      googleId: input.googleId,
      email: input.email,
      name: input.name
    });
    
    const { googleId, email, name } = input;

    try {
      // Validate input data
      if (!googleId || !googleId.trim()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Google ID es requerido',
        });
      }
      
      if (!email || !email.trim()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email es requerido',
        });
      }
      
      if (!name || !name.trim()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nombre es requerido',
        });
      }

      // Check if user exists by Google ID
      console.log('Checking if user exists by Google ID...');
      let user = userRepository.findByGoogleId(googleId);
      
      if (!user) {
        console.log('User not found by Google ID, checking by email...');
        // Check if user exists by email (might have registered with email/password)
        const existingUser = userRepository.findByEmail(email);
        if (existingUser && existingUser.provider === 'email') {
          console.log('User exists with email provider, throwing conflict error');
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Ya existe una cuenta con este email. Por favor inicia sesión con email y contraseña.',
          });
        }

        // Create new user
        console.log('Creating new Google user...');
        user = userRepository.create({
          email: email.toLowerCase().trim(),
          name: name.trim(),
          provider: 'google',
          googleId: googleId.trim(),
        });
        console.log('Google user created:', { id: user.id, email: user.email, name: user.name });
      } else {
        console.log('Existing Google user found:', { id: user.id, email: user.email, name: user.name });
      }

      // Generate JWT token
      console.log('Generating JWT token for Google user...');
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          name: user.name 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('JWT token generated successfully for Google user');

      const result = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      };
      
      console.log('Google auth procedure completed successfully');
      console.log('=== GOOGLE AUTH PROCEDURE END ===');
      return result;
    } catch (error) {
      console.error('=== GOOGLE AUTH PROCEDURE ERROR ===');
      console.error('Error in Google auth procedure:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      // If it's already a TRPCError, re-throw it
      if (error instanceof TRPCError) {
        throw error;
      }
      
      // Handle JWT errors
      if (error instanceof Error && error.message.includes('jwt')) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al generar el token de autenticación',
        });
      }
      
      // Otherwise, wrap it in a TRPCError
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor durante la autenticación con Google',
        cause: error,
      });
    }
  });