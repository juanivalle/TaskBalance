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
      console.log('Creating household:', { name, description, currency, userId: user.userId });
      
      const household = householdRepository.create({
        name: name.trim(),
        description: description?.trim(),
        currency: currency || 'UYU',
        createdBy: user.userId,
      });

      console.log('Household created successfully:', household);
      
      // Get members with user details
      const members = householdRepository.getMembers(household.id);
      
      return {
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
    } catch (error) {
      console.error('Error creating household:', error);
      
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