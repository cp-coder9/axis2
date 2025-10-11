import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileDeletionManager } from '../ProfileDeletionManager';
import { User, UserRole } from '../../../types';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

// Mock the services
jest.mock('../../../services/profileManagementService', () => ({
  checkProfileDeletionPermissions: jest.fn(),
  generateUserDataExport: jest.fn(),
  downloadUserDataExport: jest.fn(),
  deactivateUserProfile: jest.fn(),
  deleteUserProfile: jest.fn(),
  logProfileAction: jest.fn(),
}));

// Import the mocked services
import {
  checkProfileDeletionPermissions,
  generateUserDataExport,
  downloadUserDataExport,
  deactivateUserProfile,
  deleteUserProfile,
} from '../../../services/profileManagementService';

// Mock the AppContext
jest.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => ({
    deleteUser: jest.fn(),
  }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockCurrentUser: User = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
  title: 'Administrator',
  hourlyRate: 0,
  phone: '',
  company: 'Architex Axis',
  avatarUrl: '',
  createdAt: new Timestamp(Date.now() / 1000, 0),
  lastActive: new Timestamp(Date.now() / 1000, 0),
  onboardingCompleted: true,
  accountStatus: 'active',
};

const mockTargetUser: User = {
  id: 'freelancer-1',
  name: 'John Freelancer',
  email: 'john@example.com',
  role: UserRole.FREELANCER,
  title: 'Architect',
  hourlyRate: 75,
  phone: '+1234567890',
  company: 'Freelance',
  avatarUrl: '',
  createdAt: new Timestamp(Date.now() / 1000, 0),
  lastActive: new Timestamp(Date.now() / 1000, 0),
  onboardingCompleted: true,
  accountStatus: 'active',
};

describe('ProfileDeletionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the permission check to return admin permissions
    (checkProfileDeletionPermissions as jest.Mock).mockReturnValue({
      canDelete: true,
      canDeactivate: true,
      reason: 'Profile can be deleted or deactivated'
    });
  });

  it('renders profile deletion manager for admin user', () => {
    render(
      <ProfileDeletionManager
        targetUser={mockTargetUser}
        currentUser={mockCurrentUser}
      />
    );

    expect(screen.getByText('Profile Management')).toBeInTheDocument();
    expect(screen.getByText('Export User Data')).toBeInTheDocument();
    expect(screen.getByText('Deactivate Profile')).toBeInTheDocument();
    expect(screen.getByText('Permanent Deletion')).toBeInTheDocument();
  });

  it('shows restricted access for non-admin users', () => {
    const nonAdminUser = { ...mockCurrentUser, role: UserRole.FREELANCER };
    
    // Mock permission check to return no permissions
    (checkProfileDeletionPermissions as jest.Mock).mockReturnValue({
      canDelete: false,
      canDeactivate: false,
      reason: 'Only administrators can delete or deactivate profiles'
    });

    render(
      <ProfileDeletionManager
        targetUser={mockTargetUser}
        currentUser={nonAdminUser}
      />
    );

    expect(screen.getByText('Profile Management Restricted')).toBeInTheDocument();
    expect(screen.getByText('Only administrators can manage profile deletion and deactivation.')).toBeInTheDocument();
  });

  it('handles data export correctly', async () => {
    const mockExportData = { profile: mockTargetUser };
    
    (generateUserDataExport as jest.Mock).mockResolvedValue(mockExportData);
    (downloadUserDataExport as jest.Mock).mockImplementation(() => {});

    const onDataExported = jest.fn();

    render(
      <ProfileDeletionManager
        targetUser={mockTargetUser}
        currentUser={mockCurrentUser}
        onDataExported={onDataExported}
      />
    );

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(generateUserDataExport).toHaveBeenCalledWith(mockTargetUser, mockCurrentUser);
      expect(downloadUserDataExport).toHaveBeenCalledWith(mockExportData, mockTargetUser);
      expect(toast.success).toHaveBeenCalledWith('User data exported successfully');
      expect(onDataExported).toHaveBeenCalledWith(mockTargetUser.id, mockExportData);
    });
  });

  it('handles profile deactivation correctly', async () => {
    (deactivateUserProfile as jest.Mock).mockResolvedValue(undefined);

    const onProfileDeactivated = jest.fn();

    render(
      <ProfileDeletionManager
        targetUser={mockTargetUser}
        currentUser={mockCurrentUser}
        onProfileDeactivated={onProfileDeactivated}
      />
    );

    // Click deactivate button
    const deactivateButton = screen.getByText('Deactivate');
    fireEvent.click(deactivateButton);

    // Confirm in dialog
    const confirmButton = screen.getByText('Deactivate Profile');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deactivateUserProfile).toHaveBeenCalledWith(mockTargetUser, mockCurrentUser, '');
      expect(toast.success).toHaveBeenCalledWith(`Profile for ${mockTargetUser.name} has been deactivated`);
      expect(onProfileDeactivated).toHaveBeenCalledWith(mockTargetUser.id);
    });
  });

  it('requires deletion reason for permanent deletion', async () => {
    render(
      <ProfileDeletionManager
        targetUser={mockTargetUser}
        currentUser={mockCurrentUser}
      />
    );

    // Click delete button
    const deleteButton = screen.getByText('Delete Profile');
    fireEvent.click(deleteButton);

    // Check that confirm button is disabled without reason
    const confirmButton = screen.getByText('Delete Permanently');
    expect(confirmButton).toBeDisabled();

    // Add reason
    const reasonTextarea = screen.getByPlaceholderText('Enter reason for permanently deleting this profile...');
    fireEvent.change(reasonTextarea, { target: { value: 'Test deletion reason' } });

    // Now confirm button should be enabled
    expect(confirmButton).not.toBeDisabled();
  });

  it('handles profile deletion correctly', async () => {
    (deleteUserProfile as jest.Mock).mockResolvedValue(undefined);

    const onProfileDeleted = jest.fn();

    render(
      <ProfileDeletionManager
        targetUser={mockTargetUser}
        currentUser={mockCurrentUser}
        onProfileDeleted={onProfileDeleted}
      />
    );

    // Click delete button
    const deleteButton = screen.getByText('Delete Profile');
    fireEvent.click(deleteButton);

    // Add deletion reason
    const reasonTextarea = screen.getByPlaceholderText('Enter reason for permanently deleting this profile...');
    fireEvent.change(reasonTextarea, { target: { value: 'Test deletion reason' } });

    // Confirm deletion
    const confirmButton = screen.getByText('Delete Permanently');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteUserProfile).toHaveBeenCalledWith(mockTargetUser, mockCurrentUser, 'Test deletion reason', true);
      expect(toast.success).toHaveBeenCalledWith(`Profile for ${mockTargetUser.name} has been permanently deleted`);
      expect(onProfileDeleted).toHaveBeenCalledWith(mockTargetUser.id);
    });
  });
});