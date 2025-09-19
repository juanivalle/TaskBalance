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
      console.log('=== CREATING HOUSEHOLD START ===');
      console.log('Input data:', { name, description, currency, userId: user.userId });
      console.log('User context:', user);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Is Production:', process.env.VERCEL || process.env.NODE_ENV === 'production');
      
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
      console.log('=== CREATING HOUSEHOLD SUCCESS ===');
      return result;
    } catch (error) {
      console.error('=== CREATING HOUSEHOLD ERROR ===');
      console.error('Error creating household:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      
      if (error instanceof Error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al crear el hogar',
      });
    }
  });