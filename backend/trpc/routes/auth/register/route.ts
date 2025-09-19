import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { publicProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';
import { userRepository } from '@/backend/database/repositories/user-repository';

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

export const registerProcedure = publicProcedure
  .input(registerSchema)
  .mutation(async ({ input }) => {
    const { email, password, name } = input;

    try {
      // Validate input data
      if (!email || !email.trim()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El email es requerido',
        });
      }
      
      if (!password || password.length < 8) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'La contraseña debe tener al menos 8 caracteres',
        });
      }
      
      if (!name || !name.trim()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El nombre es requerido',
        });
      }

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ya existe una cuenta con este email',
        });
      }

      // Hash password
      let hashedPassword: string;
      try {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al procesar la contraseña',
        });
      }

      // Create user
      let newUser;
      try {
        newUser = await userRepository.create({
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: name.trim(),
          provider: 'email',
        });
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al crear el usuario',
        });
      }

      // Generate JWT token
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
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al generar el token de autenticación',
        });
      }

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
        token,
      };
    } catch (error) {
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