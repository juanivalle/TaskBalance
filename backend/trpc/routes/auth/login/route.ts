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
    console.log('=== LOGIN PROCEDURE START ===');
    console.log('Login attempt with email:', input.email);
    
    const { email, password } = input;

    // Find user by email
    console.log('Searching for user with email:', email);
    console.log('Email to search (trimmed, lowercase):', email.toLowerCase().trim());
    
    // Debug: List all users in storage
    const { getAllUsers } = await import('../user-storage');
    const allUsers = getAllUsers();
    console.log('All users in storage:', allUsers.map(u => ({ id: u.id, email: u.email, provider: u.provider })));
    
    const user = findUserByEmail(email);
    console.log('User found:', user ? { id: user.id, email: user.email, provider: user.provider } : 'No user found');
    
    if (!user) {
      console.log('Login failed: User not found');
      console.log('Available emails:', allUsers.map(u => u.email));
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
    console.log('Verifying password...');
    console.log('Stored password hash:', user.password.substring(0, 20) + '...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Login failed: Invalid password');
      console.log('Input password:', password);
      console.log('Stored hash:', user.password);
      console.log('bcrypt.compare result:', isValidPassword);
      
      // Try a direct comparison for debugging
      const directMatch = password === user.password;
      console.log('Direct password match (for debugging):', directMatch);
      
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

    const result = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
    
    console.log('Login successful for user:', user.email);
    console.log('=== LOGIN PROCEDURE END ===');
    return result;
  });