import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { User, UserRole } from '@/types'
import { Timestamp } from 'firebase/firestore'

// Mock the validation service
vi.mock('../../../services/profileValidationService', () => ({
  validateProfileField: vi.fn().mockResolvedValue({
    field: 'name',
    isValid: true,
    isRequired: true,
    message: 'Field is valid'
  }),
  calculateProfileCompleteness: vi.fn().mockReturnValue({
    userId: 'test-user',
    userRole: 'FREELANCER',
    totalFields: 5,
    completedFields: 4,
    validFields: 4,
    missingRequired: 1,
    missingOptional: 0,
    completenessPercentage: 80,
    lastValidated: new Date(),
    validationResults: {}
  })
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

// Mock the IntegratedAvatarUpload component
vi.mock('../IntegratedAvatarUpload', () => ({
  IntegratedAvatarUpload: () => <div data-testid="avatar-upload">Avatar Upload</div>
}))

// Import after mocks
const { RoleBasedProfileEditor } = await import('../RoleBasedProfileEditor')

const mockUser: User = {
  id: 'test-user',
  name: 'John Doe',
  email: 'john@example.com',
  role: UserRole.FREELANCER,
  title: 'Senior Architect',
  hourlyRate: 75,
  phone: '+1234567890',
  company: '',
  avatarUrl: '',
  createdAt: Timestamp.now(),
  lastActive: Timestamp.now()
}

const mockCurrentUser: User = {
  ...mockUser,
  id: 'current-user',
  role: UserRole.ADMIN
}

describe('RoleBasedProfileEditor', () => {
  const mockOnUpdate = vi.fn()
  const mockOnAvatarUpload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders profile editor for freelancer', () => {
    render(
      <RoleBasedProfileEditor
        user={mockUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
        onAvatarUpload={mockOnAvatarUpload}
      />
    )

    expect(screen.getByText('Profile Completeness')).toBeInTheDocument()
    expect(screen.getByText('Basic Info')).toBeInTheDocument()
    expect(screen.getByText('Avatar')).toBeInTheDocument()
    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('shows role-specific fields for freelancer', () => {
    render(
      <RoleBasedProfileEditor
        user={mockUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
        onAvatarUpload={mockOnAvatarUpload}
      />
    )

    // Should show hourly rate for freelancer
    expect(screen.getByText('Hourly Rate')).toBeInTheDocument()
    
    // Should not show company field (client only)
    expect(screen.queryByText('Company')).not.toBeInTheDocument()
  })

  it('shows role-specific fields for client', () => {
    const clientUser = { ...mockUser, role: UserRole.CLIENT }
    
    render(
      <RoleBasedProfileEditor
        user={clientUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
        onAvatarUpload={mockOnAvatarUpload}
      />
    )

    // Should show company for client
    expect(screen.getByText('Company')).toBeInTheDocument()
    
    // Should not show hourly rate (freelancer only)
    expect(screen.queryByText('Hourly Rate')).not.toBeInTheDocument()
  })

  it('restricts access for unauthorized users', () => {
    const unauthorizedUser = { ...mockUser, id: 'unauthorized' }
    
    render(
      <RoleBasedProfileEditor
        user={mockUser}
        currentUser={unauthorizedUser}
        onUpdate={mockOnUpdate}
        onAvatarUpload={mockOnAvatarUpload}
      />
    )

    expect(screen.getByText('Profile Access Restricted')).toBeInTheDocument()
  })

  it('allows self-editing', () => {
    render(
      <RoleBasedProfileEditor
        user={mockUser}
        currentUser={mockUser}
        onUpdate={mockOnUpdate}
        onAvatarUpload={mockOnAvatarUpload}
      />
    )

    expect(screen.getByText('Profile Completeness')).toBeInTheDocument()
    expect(screen.queryByText('Profile Access Restricted')).not.toBeInTheDocument()
  })

  it('handles form submission', async () => {
    render(
      <RoleBasedProfileEditor
        user={mockUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
        onAvatarUpload={mockOnAvatarUpload}
      />
    )

    // Fill in the name field
    const nameInput = screen.getByPlaceholderText('Enter your full name')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

    // Submit the form
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled()
    })
  })

  it('shows validation messages', async () => {
    render(
      <RoleBasedProfileEditor
        user={mockUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
        onAvatarUpload={mockOnAvatarUpload}
      />
    )

    // The validation should show up after the component loads
    await waitFor(() => {
      expect(screen.getByText('80% Complete')).toBeInTheDocument()
    })
  })
})