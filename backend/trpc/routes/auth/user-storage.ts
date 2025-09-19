import bcrypt from 'bcryptjs';

// Helper function to create bcrypt hash
const createHash = (password: string): string => {
  return bcrypt.hashSync(password, 10);
};

// Simulated database - replace with real database in production
export const users: {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  provider: 'email' | 'google';
  googleId?: string;
}[] = [
  // Keep existing demo users for backward compatibility
  {
    id: 'demo1',
    email: 'demo@taskbalance.com',
    password: createHash('demo123'), // demo123
    name: 'Usuario Demo',
    createdAt: new Date('2024-01-01'),
    provider: 'email',
  },
  {
    id: 'test1',
    email: 'test@test.com',
    password: createHash('test123'), // test123
    name: 'Usuario Test',
    createdAt: new Date('2024-01-01'),
    provider: 'email',
  },
];

export const findUserByEmail = (email: string) => {
  console.log('findUserByEmail called with:', email);
  console.log('Total users in storage:', users.length);
  console.log('Available emails:', users.map(u => u.email));
  
  const normalizedEmail = email.toLowerCase().trim();
  console.log('Normalized email to search:', normalizedEmail);
  
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  console.log('Found user:', user ? { id: user.id, email: user.email } : 'No user found');
  
  return user;
};

export const findUserById = (id: string) => {
  return users.find(u => u.id === id);
};

export const findUserByGoogleId = (googleId: string) => {
  return users.find(u => u.googleId === googleId);
};

export const createUser = (userData: Omit<typeof users[0], 'id' | 'createdAt'>) => {
  const newUser = {
    ...userData,
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  };
  users.push(newUser);
  console.log('User created and added to storage:', { id: newUser.id, email: newUser.email, provider: newUser.provider });
  console.log('Total users in storage:', users.length);
  return newUser;
};

export const getAllUsers = () => {
  return users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    createdAt: user.createdAt,
    hasPassword: !!user.password,
  }));
};