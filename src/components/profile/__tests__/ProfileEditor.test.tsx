import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileEditor } from '../ProfileEditor'
import { User, UserRole } from '../../../types'
import { Timestamp } from 'firebase/firestore'

// Mock the services
jest.mock('../../../services/profileValidationService', () => ({
  validateProfileField: jest.fn().mockResolvedValue({
    field: 'name',
    isValid: true,
    isRequired: true,
    message: 'Name is valid'
  }),
  calculateProfileCompleteness: jest.fn().mockReturnValue({
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

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

const mockUser: User = {
  id: 'test-user',
  name: 'John Doe',
  email: 'john@example.com',
  role: UserRole.FREELANCER,
  title: 'Senior Architect',
  hourlyRate: 75,
  phone: '+1 555 123 4567',
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

const mockOnUpdate = jest.fn().mockResolvedValue(undefined)

describe('ProfileEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders profile editor form', () => {
    render(
      <ProfileEditor
        user={mockUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByText('Profile Completeness')).toBeInTheDocument()
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Job Title/)).toBeInTheDocument()
  })

  it('shows role-specific fields for freelancer', () => {
    render(
      <ProfileEditor
        user={mockUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByLabelText(/Hourly Rate/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Company/)).not.toBeInTheDocument()
  })

  it('shows role-specific fields for client', () => {
    const clientUser = { ...mockUser, role: UserRole.CLIENT }
    
    render(
      <ProfileEditor
        user={clientUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByLabelText(/Company/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Hourly Rate/)).not.toBeInTheDocument()
  })

  it('shows email notification settings for self profile', () => {
    render(
      <ProfileEditor
        user={mockUser}
        currentUser={mockUser} // Same user editing their own profile
        onUpdate={mockOnUpdate}
        showAllSections={true}
      />
    )

    expect(screen.getByText('Email Notifications')).toBeInTheDocument()
    expect(screen.getByText('Project Updates')).toBeInTheDocument()
    expect(screen.getByText('New Messages')).toBeInTheDocument()
  })

  it('handles form submission', async () => {
    render(
      <ProfileEditor
        user={mockUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
      />
    )

    const nameInput = screen.getByLabelText(/Name/)
    const saveButton = screen.getByText('Save Profile')

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Doe'
        })
      )
    })
  })

  it('shows access restricted message for unauthorized users', () => {
    const unauthorizedUser = { ...mockUser, id: 'unauthorized', role: UserRole.CLIENT }
    
    render(
      <ProfileEditor
        user={mockUser}
        currentUser={unauthorizedUser}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByText('Profile Access Restricted')).toBeInTheDocument()
    expect(screen.getByText(/You can only edit your own profile/)).toBeInTheDocument()
  })

  it('disables sensitive fields for non-admin users editing others', () => {
    const freelancerUser = { ...mockUser, id: 'freelancer', role: UserRole.FREELANCER }
    
    render(
      <ProfileEditor
        user={mockUser}
        currentUser={freelancerUser}
        onUpdate={mockOnUpdate}
      />
    )

    // Should show access restricted since freelancer can't edit other user's profile
    expect(screen.getByText('Profile Access Restricted')).toBeInTheDocument()
  })

  it('shows completeness report', () => {
    render(
      <ProfileEditor
        user={mockUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByText('80% Complete')).toBeInTheDocument()
    expect(screen.getByText('4/5 fields')).toBeInTheDocument()
  })

  it('shows unsaved changes warning', async () => {
    render(
      <ProfileEditor
        user={mockUser}
        currentUser={mockCurrentUser}
        onUpdate={mockOnUpdate}
      />
    )

    const nameInput = screen.getByLabelText(/Name/)
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } })

    await waitFor(() => {
      expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument()
    })
  })
})