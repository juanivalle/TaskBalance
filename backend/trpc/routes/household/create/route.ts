import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';
import { householdRepository } from '@/backend/database/repositories/household-repository';

const createHouseholdSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  description: z.string().optional(),
  currency: z.string().optional().default('UYU'),
});

export const createHouseholdProcedure = protectedProcedure
  .input(createHouseholdSchema)
  .mutation(async ({ input, ctx }) => {
    const { name, description, currency } = input;
    const { user } = ctx;

    try {
      console.log('=== BACKEND: CREATING HOUSEHOLD START ===');
      console.log('Input data:', { name, description, currency, userId: user.userId });
      console.log('User context:', user);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Is Production:', process.env.VERCEL || process.env.NODE_ENV === 'production');
      console.log('Database connection available:', !!householdRepository);
      
      // Validate input again on backend
      if (!name || !name.trim()) {
        console.error('Backend validation failed: empty name');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El nombre del hogar es requerido',
        });
      }
      
      if (!user || !user.userId) {
        console.error('Backend validation failed: no user');
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuario no autenticado',
        });
      }
      
      console.log('Creating household with repository...');
      const household = await householdRepository.create({
        name: name.trim(),
        description: description?.trim(),
        currency: currency || 'UYU',
        createdBy: user.userId,
      });

      console.log('Household created successfully:', household);
      console.log('Getting members for household:', household.id);
      
      // Get members with user details
      const members = await householdRepository.getMembers(household.id);
      console.log('Members retrieved:', members);
      
      const result = {
        ...household,
        members: members.map(member => ({
          id: member.id,
          userId: member.userId,
          householdId: member.householdId,
          name: member.userName,
          email: member.userEmail,
          role: member.role,
          joinedAt: member.joinedAt,
          points: 0, // Initialize with 0 points
        })),
      };
      
      console.log('Final result:', result);
      console.log('=== BACKEND: CREATING HOUSEHOLD SUCCESS ===');
      return result;
    } catch (error) {
      console.error('=== BACKEND: CREATING HOUSEHOLD ERROR ===');
      console.error('Error creating household:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error name:', error instanceof Error ? error.name : 'Unknown error type');
      
      // If it's already a TRPCError, re-throw it
      if (error instanceof TRPCError) {
        throw error;
      }
      
      if (error instanceof Error) {
        // Handle specific database errors
        if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate key')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Ya existe un hogar con ese nombre',
          });
        }
        
        if (error.message.includes('FOREIGN KEY constraint failed') || error.message.includes('foreign key')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Usuario no válido',
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Error del servidor: ${error.message}`,
        });
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error desconocido al crear el hogar',
      });
    }
  });