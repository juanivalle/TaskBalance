import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { publicProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';
import { findUserByEmail } from '../user-storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const loginProcedure = publicProcedure
  .input(loginSchema)
  .mutation(async ({ input }) => {
    const { email, password } = input;

    // Find user by email
    const user = findUserByEmail(email);
    
    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Credenciales inválidas',
      });
    }

    // Check if user registered with Google
    if (user.provider === 'google') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Esta cuenta fue creada con Google. Por favor inicia sesión con Google.',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Credenciales inválidas',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  });