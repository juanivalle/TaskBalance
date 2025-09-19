import { protectedProcedure } from '@/backend/trpc/create-context';
import { userRepository } from '@/backend/database/repositories/user-repository';

export const getUserProfileProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const user = userRepository.findById(ctx.user.userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      createdAt: user.createdAt,
    };
  });