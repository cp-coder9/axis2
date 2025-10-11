import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedProfileEditor } from '../EnhancedProfileEditor'
import { User, UserRole } from '@/types'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('../../../services/profileValidationService', () => ({
  validateProfileField: vi.fn().mockResolvedValue({
    field: 'name',
    isValid: true,
    isRequired: true,
    message: 'Name is valid'
  }),
  calculateProfileCompleteness: vi.fn().mockReturnValue({
    userId: 'test-user',
    userRole: UserRole.FREELANCER,
    totalFields: 10,
    completedFields: 8,
    validFields: 8,
    missingRequired: 0,
    missingOptional: 2,
    completenessPercentage: 80,
    lastValidated: new Date(),
    validationResults: {}
  })
}))

vi.mock('../IntegratedAvatarUpload', () => ({
  IntegratedAvatarUpload: () => <div data-testid="avatar-upload">Avatar Upload Component</div>
}))

describe('EnhancedProfileEditor', () => {
  const mockFreelancerUser: User = {
    id: 'freelancer-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: UserRole.FREELANCER,
    title: 'Senior Architect',
    phone: '+1 555 123 4567',
    hourlyRate: 75,
    avatarUrl: '',
    createdAt: new Date(),
    lastSeen: new Date(),
    skills: ['Architecture', 'Design'],
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: false,
        inApp: true
      }
    }
  }

  const mockClientUser: User = {
    id: 'client-1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: UserRole.CLIENT,
    title: 'Project Manager',
    company: 'Acme Corp',
    phone: '+1 555 987 6543',
    avatarUrl: '',
    createdAt: new Date(),
    lastSeen: new Date(),
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: false,
        inApp: true
      }
    }
  }

  const mockAdminUser: User = {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    title: 'System Administrator',
    avatarUrl: '',
    createdAt: new Date(),
    lastSeen: new Date(),
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: false,
        inApp: true
      }
    }
  }

  const mockOnUpdate = vi.fn().mockResolvedValue(undefined)
  const mockOnAvatarUpload = vi.fn().mockResolvedValue('https://example.com/avatar.jpg')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the component without errors', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      expect(screen.getByText('Profile Completeness')).toBeInTheDocument()
    })

    it('should display profile completeness information', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      expect(screen.getByText(/80% Complete/i)).toBeInTheDocument()
    })

    it('should render all tabs', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      expect(screen.getByText('Basic Info')).toBeInTheDocument()
      expect(screen.getByText('Avatar')).toBeInTheDocument()
      expect(screen.getByText('Preferences')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })
  })

  describe('Permission Checks', () => {
    it('should allow user to edit their own profile', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      const nameInput = screen.getByPlaceholderText('Enter your full name')
      expect(nameInput).not.toBeDisabled()
    })

    it('should allow admin to edit other user profiles', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockAdminUser}
          onUpdate={mockOnUpdate}
        />
      )

      const nameInput = screen.getByPlaceholderText('Enter your full name')
      expect(nameInput).not.toBeDisabled()
    })

    it('should restrict non-admin users from editing other profiles', () => {
      render(
        <EnhancedProfileEditor
          user={mockClientUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      expect(screen.getByText('Profile Access Restricted')).toBeInTheDocument()
    })
  })

  describe('Role-Specific Fields', () => {
    it('should display hourly rate field for freelancers', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      expect(screen.getByText('Hourly Rate')).toBeInTheDocument()
    })

    it('should display company field for clients', () => {
      render(
        <EnhancedProfileEditor
          user={mockClientUser}
          currentUser={mockClientUser}
          onUpdate={mockOnUpdate}
        />
      )

      expect(screen.getByText('Company')).toBeInTheDocument()
    })

    it('should not display hourly rate for clients', () => {
      render(
        <EnhancedProfileEditor
          user={mockClientUser}
          currentUser={mockClientUser}
          onUpdate={mockOnUpdate}
        />
      )

      expect(screen.queryByText('Hourly Rate')).not.toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate name field on blur', async () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      const nameInput = screen.getByPlaceholderText('Enter your full name')
      fireEvent.blur(nameInput)

      await waitFor(() => {
        expect(screen.getByText('Name is valid')).toBeInTheDocument()
      })
    })

    it('should show required badges for required fields', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      const requiredBadges = screen.getAllByText('Required')
      expect(requiredBadges.length).toBeGreaterThan(0)
    })
  })

  describe('Form Submission', () => {
    it('should call onUpdate when form is submitted', async () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      const nameInput = screen.getByPlaceholderText('Enter your full name')
      fireEvent.change(nameInput, { target: { value: 'John Updated' } })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled()
      })
    })

    it('should show success toast on successful update', async () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      const nameInput = screen.getByPlaceholderText('Enter your full name')
      fireEvent.change(nameInput, { target: { value: 'John Updated' } })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Profile updated successfully')
      })
    })

    it('should disable save button when no changes are made', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      const saveButton = screen.getByText('Save Changes')
      expect(saveButton).toBeDisabled()
    })
  })

  describe('Avatar Management', () => {
    it('should render avatar upload component when onAvatarUpload is provided', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
          onAvatarUpload={mockOnAvatarUpload}
        />
      )

      // Switch to avatar tab
      const avatarTab = screen.getByText('Avatar')
      fireEvent.click(avatarTab)

      expect(screen.getByTestId('avatar-upload')).toBeInTheDocument()
    })
  })

  describe('Unsaved Changes Warning', () => {
    it('should show unsaved changes alert when form is dirty', async () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      const nameInput = screen.getByPlaceholderText('Enter your full name')
      fireEvent.change(nameInput, { target: { value: 'John Updated' } })

      await waitFor(() => {
        expect(screen.getByText(/You have unsaved changes/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between tabs correctly', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      // Click preferences tab
      const preferencesTab = screen.getByText('Preferences')
      fireEvent.click(preferencesTab)

      expect(screen.getByText('Timezone')).toBeInTheDocument()

      // Click notifications tab
      const notificationsTab = screen.getByText('Notifications')
      fireEvent.click(notificationsTab)

      expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
    })
  })

  describe('Notification Preferences', () => {
    it('should render notification switches', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      // Switch to notifications tab
      const notificationsTab = screen.getByText('Notifications')
      fireEvent.click(notificationsTab)

      expect(screen.getByText('Project Updates')).toBeInTheDocument()
      expect(screen.getByText('New Messages')).toBeInTheDocument()
      expect(screen.getByText('System Announcements')).toBeInTheDocument()
    })

    it('should show timer reminders for freelancers', () => {
      render(
        <EnhancedProfileEditor
          user={mockFreelancerUser}
          currentUser={mockFreelancerUser}
          onUpdate={mockOnUpdate}
        />
      )

      // Switch to notifications tab
      const notificationsTab = screen.getByText('Notifications')
      fireEvent.click(notificationsTab)

      expect(screen.getByText('Timer Reminders')).toBeInTheDocument()
    })

    it('should not show timer reminders for clients', () => {
      render(
        <EnhancedProfileEditor
          user={mockClientUser}
          currentUser={mockClientUser}
          onUpdate={mockOnUpdate}
        />
      )

      // Switch to notifications tab
      const notificationsTab = screen.getByText('Notifications')
      fireEvent.click(notificationsTab)

      expect(screen.queryByText('Timer Reminders')).not.toBeInTheDocument()
    })
  })
})
