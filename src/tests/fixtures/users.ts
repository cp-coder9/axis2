/**
 * User Test Fixtures
 * Comprehensive user test data for timer component testing
 */

import { User, UserRole } from '../../types';

// Base user template
const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-001',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.FREELANCER,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  lastActiveAt: new Date(),
  profileImage: null,
  settings: {
    theme: 'light',
    notifications: true,
    timezone: 'UTC'
  },
  ...overrides
});

// Admin user with full permissions
export const adminUser: User = createUser({
  id: 'admin-001',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: UserRole.ADMIN,
  settings: {
    theme: 'dark',
    notifications: true,
    timezone: 'America/New_York'
  }
});

// Active freelancer with timer permissions
export const freelancerUser: User = createUser({
  id: 'freelancer-001',
  email: 'freelancer@example.com',
  firstName: 'John',
  lastName: 'Freelancer',
  role: UserRole.FREELANCER,
  isActive: true,
  profileImage: 'https://example.com/avatar.jpg'
});

// Secondary freelancer for assignment testing
export const freelancerUser2: User = createUser({
  id: 'freelancer-002',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Developer',
  role: UserRole.FREELANCER,
  isActive: true
});

// Client user (should not see timers)
export const clientUser: User = createUser({
  id: 'client-001',
  email: 'client@example.com',
  firstName: 'Client',
  lastName: 'User',
  role: UserRole.CLIENT,
  settings: {
    theme: 'light',
    notifications: false,
    timezone: 'Europe/London'
  }
});

// Inactive user for testing access restrictions
export const inactiveUser: User = createUser({
  id: 'inactive-001',
  email: 'inactive@example.com',
  firstName: 'Inactive',
  lastName: 'User',
  role: UserRole.FREELANCER,
  isActive: false,
  lastActiveAt: new Date('2024-01-01')
});

// User without role (edge case)
export const userWithoutRole: User = createUser({
  id: 'no-role-001',
  email: 'norole@example.com',
  firstName: 'No',
  lastName: 'Role',
  role: undefined as any,
  isActive: true
});

// User collections for different test scenarios
export const allUsers = [
  adminUser,
  freelancerUser,
  freelancerUser2,
  clientUser,
  inactiveUser,
  userWithoutRole
];

export const activeUsers = allUsers.filter(user => user.isActive);
export const timerEnabledUsers = allUsers.filter(user => 
  user.role !== UserRole.CLIENT && user.isActive
);

// Role-specific user groups
export const usersByRole = {
  [UserRole.ADMIN]: [adminUser],
  [UserRole.FREELANCER]: [freelancerUser, freelancerUser2],
  [UserRole.CLIENT]: [clientUser]
};

// Test scenarios for user access
export const userAccessScenarios = [
  {
    name: 'Admin with full access',
    user: adminUser,
    canUseTimer: true,
    canOverride: true,
    expectedVisibility: 'full'
  },
  {
    name: 'Active freelancer with standard access',
    user: freelancerUser,
    canUseTimer: true,
    canOverride: false,
    expectedVisibility: 'standard'
  },
  {
    name: 'Client with no timer access',
    user: clientUser,
    canUseTimer: false,
    canOverride: false,
    expectedVisibility: 'hidden'
  },
  {
    name: 'Inactive user with restricted access',
    user: inactiveUser,
    canUseTimer: false,
    canOverride: false,
    expectedVisibility: 'restricted'
  }
];

// User factory for dynamic test creation
export const createTestUser = (role: UserRole, overrides: Partial<User> = {}): User => {
  const baseUsers = {
    [UserRole.ADMIN]: adminUser,
    [UserRole.FREELANCER]: freelancerUser,
    [UserRole.CLIENT]: clientUser
  };

  return createUser({
    ...baseUsers[role],
    id: `test-${role.toLowerCase()}-${Date.now()}`,
    ...overrides
  });
};

// Edge case users for negative testing
export const edgeCaseUsers = {
  nullUser: null,
  undefinedUser: undefined,
  emptyUser: {} as User,
  userWithMissingFields: {
    id: 'partial-001',
    email: 'partial@example.com'
  } as User,
  userWithInvalidRole: createUser({
    role: 'INVALID_ROLE' as UserRole
  })
};

export default {
  adminUser,
  freelancerUser,
  freelancerUser2,
  clientUser,
  inactiveUser,
  userWithoutRole,
  // Aliases for test convenience
  admin: adminUser,
  freelancer: freelancerUser,
  client: clientUser,
  // Collections
  allUsers,
  activeUsers,
  timerEnabledUsers,
  usersByRole,
  userAccessScenarios,
  createTestUser,
  edgeCaseUsers
};