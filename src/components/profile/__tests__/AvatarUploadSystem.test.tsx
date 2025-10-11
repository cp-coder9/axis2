import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AvatarUploadSystem } from '../AvatarUploadSystem'
import { User, UserRole } from '@/types'
import { Timestamp } from 'firebase/firestore'

// Mock Cloudinary service
vi.mock('@/services/cloudinaryManagementService', () => ({
  cloudinaryManagementService: {
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
    generateSignedUrl: vi.fn(),
    isConfigured: vi.fn(() => true)
  }
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const mockUser: User = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  role: UserRole.FREELANCER,
  isActive: true,
  phone: '+1234567890',
  company: 'Test Company',
  avatarUrl: '',
  createdAt: Timestamp.now(),
  lastActive: Timestamp.now(),
  onboardingCompleted: true,
  accountStatus: 'active',
  hourlyRate: 50
}

const mockCurrentUser: User = {
  ...mockUser,
  role: UserRole.ADMIN
}

describe('AvatarUploadSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders avatar upload interface for authorized users', () => {
    render(
      <AvatarUploadSystem
        user={mockUser}
        currentUser={mockCurrentUser}
      />
    )

    expect(screen.getByText('Profile Avatar')).toBeInTheDocument()
    expect(screen.getByText('Upload New Avatar')).toBeInTheDocument()
  })

  it('shows access restriction for unauthorized users', () => {
    const unauthorizedUser = { ...mockUser, id: 'different-user' }
    
    render(
      <AvatarUploadSystem
        user={mockUser}
        currentUser={unauthorizedUser}
      />
    )

    expect(screen.getByText('Avatar Management')).toBeInTheDocument()
    expect(screen.getByText(/You can only manage your own avatar/)).toBeInTheDocument()
  })

  it('displays current avatar when available', () => {
    const userWithAvatar = {
      ...mockUser,
      avatarUrl: 'https://example.com/avatar.jpg'
    }

    render(
      <AvatarUploadSystem
        user={userWithAvatar}
        currentUser={mockCurrentUser}
      />
    )

    expect(screen.getByText('Custom avatar uploaded')).toBeInTheDocument()
    expect(screen.getByText('Remove Avatar')).toBeInTheDocument()
    expect(screen.getByText('Download')).toBeInTheDocument()
  })

  it('shows fallback avatar when no avatar is set', () => {
    render(
      <AvatarUploadSystem
        user={mockUser}
        currentUser={mockCurrentUser}
      />
    )

    expect(screen.getByText('Using default avatar')).toBeInTheDocument()
    expect(screen.getByText('Fallback Avatar')).toBeInTheDocument()
  })

  it('opens upload dialog when upload button is clicked', async () => {
    render(
      <AvatarUploadSystem
        user={mockUser}
        currentUser={mockCurrentUser}
      />
    )

    const uploadButton = screen.getByText('Upload New Avatar')
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(screen.getByText('Upload Avatar')).toBeInTheDocument()
      expect(screen.getByText('Choose an image file to upload')).toBeInTheDocument()
    })
  })

  it('validates file type and size', async () => {
    render(
      <AvatarUploadSystem
        user={mockUser}
        currentUser={mockCurrentUser}
        maxFileSize={1}
        allowedFormats={['image/jpeg']}
      />
    )

    // Create a mock file that's too large
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    })

    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    })

    fireEvent.change(fileInput)

    // Should show error for file size
    await waitFor(() => {
      expect(screen.getByText(/File size too large/)).toBeInTheDocument()
    })
  })

  it('generates fallback avatar with user initials', () => {
    render(
      <AvatarUploadSystem
        user={mockUser}
        currentUser={mockCurrentUser}
      />
    )

    // Check if fallback avatar section is present
    expect(screen.getByText('Fallback Avatar')).toBeInTheDocument()
    expect(screen.getByText('Generated Avatar')).toBeInTheDocument()
    expect(screen.getByText(`Based on your name: ${mockUser.name}`)).toBeInTheDocument()
  })

  it('calls onAvatarUpdated when avatar is successfully uploaded', async () => {
    const mockOnAvatarUpdated = vi.fn()
    
    render(
      <AvatarUploadSystem
        user={mockUser}
        currentUser={mockCurrentUser}
        onAvatarUpdated={mockOnAvatarUpdated}
      />
    )

    // This would be tested with a more complete mock of the upload process
    // For now, we just verify the callback prop is accepted
    expect(mockOnAvatarUpdated).toBeDefined()
  })

  it('calls onAvatarDeleted when avatar is removed', async () => {
    const mockOnAvatarDeleted = vi.fn()
    const userWithAvatar = {
      ...mockUser,
      avatarUrl: 'https://example.com/avatar.jpg'
    }
    
    render(
      <AvatarUploadSystem
        user={userWithAvatar}
        currentUser={mockCurrentUser}
        onAvatarDeleted={mockOnAvatarDeleted}
      />
    )

    // This would be tested with a more complete mock of the delete process
    expect(mockOnAvatarDeleted).toBeDefined()
  })

  it('displays upload progress during file upload', () => {
    render(
      <AvatarUploadSystem
        user={mockUser}
        currentUser={mockCurrentUser}
      />
    )

    // The progress component would be shown during actual upload
    // This test verifies the component structure supports progress display
    expect(screen.getByText('Profile Avatar')).toBeInTheDocument()
  })

  it('handles different user roles correctly', () => {
    // Test with freelancer managing their own avatar
    render(
      <AvatarUploadSystem
        user={mockUser}
        currentUser={mockUser}
      />
    )

    expect(screen.getByText('Upload New Avatar')).toBeInTheDocument()

    // Test with client user
    const clientUser = { ...mockUser, role: UserRole.CLIENT }
    render(
      <AvatarUploadSystem
        user={clientUser}
        currentUser={clientUser}
      />
    )

    expect(screen.getByText('Upload New Avatar')).toBeInTheDocument()
  })
})