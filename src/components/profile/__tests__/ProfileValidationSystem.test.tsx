import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileValidationSystem } from '../ProfileValidationSystem'
import { User, UserRole } from '../../../types'
import { Timestamp } from 'firebase/firestore'

// Mock the services
jest.mock('../../../services/profileValidationService', () => ({
  validateProfileField: jest.fn(),
  calculateProfileCompleteness: jest.fn(),
  getRequiredFieldsForRole: jest.fn(),
  getOptionalFieldsForRole: jest.fn()
}))

// Import the mocked services
import {
  validateProfileField,
  calculateProfileCompleteness,
  getRequiredFieldsForRole,
  getOptionalFieldsForRole
} from '../../../services/profileValidationService';

const mockUser: User = {
  id: 'user1',
  name: 'John Doe',
  email: 'john@example.com',
  role: UserRole.FREELANCER,
  title: 'Senior Architect',
  hourlyRate: 75,
  phone: '+1234567890',
  company: 'Test Company',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: Timestamp.now(),
  lastActive: Timestamp.now(),
  onboardingCompleted: true,
  accountStatus: 'active'
}

const mockAdminUser: User = {
  ...mockUser,
  id: 'admin1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: UserRole.ADMIN
}

describe('ProfileValidationSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders validation system for admin user', async () => {
    // Mock the service functions
    (validateProfileField as jest.Mock).mockResolvedValue({
      field: 'name',
      isValid: true,
      isRequired: true,
      message: 'Name is valid'
    })
    
    (calculateProfileCompleteness as jest.Mock).mockReturnValue({
      userId: mockUser.id,
      userRole: mockUser.role,
      totalFields: 5,
      completedFields: 4,
      validFields: 4,
      missingRequired: 0,
      missingOptional: 1,
      completenessPercentage: 80,
      lastValidated: new Date(),
      validationResults: {}
    })
    
    getRequiredFieldsForRole.mockReturnValue(['name', 'email', 'title', 'hourlyRate'])
    getOptionalFieldsForRole.mockReturnValue(['phone', 'avatarUrl'])

    render(
      <ProfileValidationSystem
        user={mockUser}
        currentUser={mockAdminUser}
      />
    )

    expect(screen.getByText('Profile Validation System')).toBeInTheDocument()
    expect(screen.getByText(/Role-based validation and completeness checking/)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument()
    })
  })

  it('restricts access for non-admin, non-self users', () => {
    const otherUser: User = {
      ...mockUser,
      id: 'other1',
      name: 'Other User',
      email: 'other@example.com',
      role: UserRole.CLIENT
    }

    render(
      <ProfileValidationSystem
        user={mockUser}
        currentUser={otherUser}
      />
    )

    expect(screen.getByText('Profile Validation Access Restricted')).toBeInTheDocument()
    expect(screen.getByText(/You can only view profile validation for your own profile/)).toBeInTheDocument()
  })

  it('allows self-profile validation', async () => {
    const profileValidationService = await import('../../../services/profileValidationService')
    const { validateProfileField, calculateProfileCompleteness, getRequiredFieldsForRole, getOptionalFieldsForRole } = profileValidationService
    
    validateProfileField.mockResolvedValue({
      field: 'name',
      isValid: true,
      isRequired: true,
      message: 'Name is valid'
    })
    
    calculateProfileCompleteness.mockReturnValue({
      userId: mockUser.id,
      userRole: mockUser.role,
      totalFields: 5,
      completedFields: 5,
      validFields: 5,
      missingRequired: 0,
      missingOptional: 0,
      completenessPercentage: 100,
      lastValidated: new Date(),
      validationResults: {}
    })
    
    getRequiredFieldsForRole.mockReturnValue(['name', 'email', 'title', 'hourlyRate'])
    getOptionalFieldsForRole.mockReturnValue(['phone', 'avatarUrl'])

    render(
      <ProfileValidationSystem
        user={mockUser}
        currentUser={mockUser}
      />
    )

    expect(screen.getByText('Profile Validation System')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
  })

  it('shows validation details when toggled', async () => {
    const user = userEvent.setup()
    const profileValidationService = await import('../../../services/profileValidationService')
    const { validateProfileField, calculateProfileCompleteness, getRequiredFieldsForRole, getOptionalFieldsForRole } = profileValidationService
    
    validateProfileField.mockResolvedValue({
      field: 'name',
      isValid: true,
      isRequired: true,
      message: 'Name is valid'
    })
    
    calculateProfileCompleteness.mockReturnValue({
      userId: mockUser.id,
      userRole: mockUser.role,
      totalFields: 2,
      completedFields: 2,
      validFields: 2,
      missingRequired: 0,
      missingOptional: 0,
      completenessPercentage: 100,
      lastValidated: new Date(),
      validationResults: {
        name: {
          field: 'name',
          isValid: true,
          isRequired: true,
          message: 'Name is valid'
        }
      }
    })
    
    getRequiredFieldsForRole.mockReturnValue(['name', 'email'])
    getOptionalFieldsForRole.mockReturnValue(['phone'])

    render(
      <ProfileValidationSystem
        user={mockUser}
        currentUser={mockAdminUser}
      />
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument()
    })

    // Click show details button
    const showDetailsButton = screen.getByText('Show Details')
    await user.click(showDetailsButton)

    // Should show validation details
    await waitFor(() => {
      expect(screen.getByText('Hide Details')).toBeInTheDocument()
    })
  })

  it('calls validation callbacks when provided', async () => {
    const onValidationComplete = jest.fn()
    const onFieldValidated = jest.fn()
    
    const profileValidationService = await import('../../../services/profileValidationService')
    const { validateProfileField, calculateProfileCompleteness, getRequiredFieldsForRole, getOptionalFieldsForRole } = profileValidationService
    
    validateProfileField.mockResolvedValue({
      field: 'name',
      isValid: true,
      isRequired: true,
      message: 'Name is valid'
    })
    
    const mockReport = {
      userId: mockUser.id,
      userRole: mockUser.role,
      totalFields: 1,
      completedFields: 1,
      validFields: 1,
      missingRequired: 0,
      missingOptional: 0,
      completenessPercentage: 100,
      lastValidated: new Date(),
      validationResults: {}
    }
    
    calculateProfileCompleteness.mockReturnValue(mockReport)
    getRequiredFieldsForRole.mockReturnValue(['name'])
    getOptionalFieldsForRole.mockReturnValue([])

    render(
      <ProfileValidationSystem
        user={mockUser}
        currentUser={mockAdminUser}
        onValidationComplete={onValidationComplete}
        onFieldValidated={onFieldValidated}
      />
    )

    await waitFor(() => {
      expect(onValidationComplete).toHaveBeenCalledWith(true, mockReport)
      expect(onFieldValidated).toHaveBeenCalledWith('name', true, 'Name is valid')
    })
  })
})