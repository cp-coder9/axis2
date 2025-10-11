import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RoleBasedFileUpload } from '../RoleBasedFileUpload';
import { UserRole } from '@/types';

// Mock the hooks
vi.mock('@/hooks/useCloudinaryUpload', () => ({
  useFileUploadManager: () => ({
    uploadFiles: vi.fn(),
    uploads: [],
    isUploading: false,
    removeUpload: vi.fn(),
    clearAllUploads: vi.fn(),
    isConfigured: true
  })
}));

vi.mock('@/utils/formatters', () => ({
  formatFileSize: (size: number) => `${(size / 1024 / 1024).toFixed(1)}MB`
}));

const mockProps = {
  userId: 'user-123',
  userName: 'Test User',
  userRole: UserRole.FREELANCER,
  onUploadComplete: vi.fn(),
  onUploadError: vi.fn()
};

describe('RoleBasedFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area with role-specific information', () => {
    render(<RoleBasedFileUpload {...mockProps} />);
    
    expect(screen.getByText('FREELANCER Upload Permissions')).toBeInTheDocument();
    expect(screen.getByText('Project files - Upload work deliverables and substantiation documents')).toBeInTheDocument();
    expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
  });

  it('shows correct limits for freelancer role', () => {
    render(<RoleBasedFileUpload {...mockProps} />);
    
    expect(screen.getByText('Max 20 files')).toBeInTheDocument();
    expect(screen.getByText('50.0MB per file')).toBeInTheDocument();
    expect(screen.getByText('2048.0MB monthly')).toBeInTheDocument();
  });

  it('shows different limits for admin role', () => {
    render(<RoleBasedFileUpload {...mockProps} userRole={UserRole.ADMIN} />);
    
    expect(screen.getByText('ADMIN Upload Permissions')).toBeInTheDocument();
    expect(screen.getByText('Max 50 files')).toBeInTheDocument();
    expect(screen.getByText('100.0MB per file')).toBeInTheDocument();
    expect(screen.getByText('10240.0MB monthly')).toBeInTheDocument();
  });

  it('shows restricted limits for client role', () => {
    render(<RoleBasedFileUpload {...mockProps} userRole={UserRole.CLIENT} />);
    
    expect(screen.getByText('CLIENT Upload Permissions')).toBeInTheDocument();
    expect(screen.getByText('Max 10 files')).toBeInTheDocument();
    expect(screen.getByText('25.0MB per file')).toBeInTheDocument();
    expect(screen.getByText('500.0MB monthly')).toBeInTheDocument();
  });

  it('displays quota usage progress', () => {
    render(<RoleBasedFileUpload {...mockProps} />);
    
    expect(screen.getByText('Monthly Quota Usage')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows allowed categories for freelancer', () => {
    render(<RoleBasedFileUpload {...mockProps} />);
    
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Substantiation')).toBeInTheDocument();
    expect(screen.getByText('Deliverables')).toBeInTheDocument();
    
    // Should not show admin-only categories
    expect(screen.queryByText('System Files')).not.toBeInTheDocument();
  });

  it('shows permission level selector for admin only', () => {
    const { rerender } = render(<RoleBasedFileUpload {...mockProps} />);
    
    // Freelancer should not see permission selector
    expect(screen.queryByText('Permission Level')).not.toBeInTheDocument();
    
    // Admin should see permission selector
    rerender(<RoleBasedFileUpload {...mockProps} userRole={UserRole.ADMIN} />);
    expect(screen.getByText('Permission Level')).toBeInTheDocument();
  });

  it('handles file selection and validation', async () => {
    render(<RoleBasedFileUpload {...mockProps} />);
    
    const fileInput = screen.getByRole('button', { name: /drop files here or click to browse/i });
    
    // Create a mock file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    // Mock the file input change
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('validates file size limits', async () => {
    render(<RoleBasedFileUpload {...mockProps} />);
    
    // Create a file that exceeds the freelancer limit (50MB)
    const largeFile = new File(['x'.repeat(60 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText(/exceeds.*limit for FREELANCER role/)).toBeInTheDocument();
    });
  });

  it('validates file type restrictions', async () => {
    render(<RoleBasedFileUpload {...mockProps} />);
    
    // Create a file type not allowed for freelancers
    const videoFile = new File(['video content'], 'video.mp4', { type: 'video/mp4' });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [videoFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText(/is not allowed for FREELANCER role/)).toBeInTheDocument();
    });
  });

  it('requires category selection before upload', async () => {
    render(<RoleBasedFileUpload {...mockProps} />);
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      const uploadButton = screen.getByRole('button', { name: /upload 1 file/i });
      expect(uploadButton).toBeDisabled();
    });
  });

  it('enables upload button when category is selected', async () => {
    render(<RoleBasedFileUpload {...mockProps} />);
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      // Select a category
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);
      fireEvent.click(screen.getByText('Documents'));
      
      const uploadButton = screen.getByRole('button', { name: /upload 1 file/i });
      expect(uploadButton).not.toBeDisabled();
    });
  });

  it('shows configuration warning when Cloudinary is not configured', () => {
    // Mock unconfigured state
    vi.mocked(await import('@/hooks/useCloudinaryUpload')).useFileUploadManager.mockReturnValue({
      uploadFiles: vi.fn(),
      uploads: [],
      isUploading: false,
      removeUpload: vi.fn(),
      clearAllUploads: vi.fn(),
      isConfigured: false
    });
    
    render(<RoleBasedFileUpload {...mockProps} />);
    
    expect(screen.getByText('Cloudinary is not configured. Please check your environment variables.')).toBeInTheDocument();
  });
});