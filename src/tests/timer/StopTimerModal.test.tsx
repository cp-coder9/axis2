import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StopTimerModal } from '../../components/timer/StopTimerModal';
import { TestWrapper } from '../helpers/TestWrapper';
import mockConfig from '../mockConfig';
import filesData from '../fixtures/files';

// Create testData object for compatibility with existing test code
const testData = {
  jobCards: {
    valid: {
      title: "Test Job Card"
    }
  },
  projects: {
    active: {
      name: "Test Project"
    }
  },
  files: {
    validImage: filesData.validImageFiles.smallJpeg,
    tooLarge: filesData.oversizedFiles.hugeImage,
    invalidType: filesData.invalidTypeFiles.executable,
    validPdf: filesData.validDocumentFiles.smallPdf
  }
};

// Mock file functions for file upload testing
const mockFileReader = {
  readAsDataURL: vi.fn(),
  onload: null as any,
  onerror: null as any,
  result: null as any,
};

global.FileReader = vi.fn(() => mockFileReader) as any;

// Mock drag and drop events
const createDragEvent = (type: string, files: File[] = []) => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      dropEffect: 'copy',
      effectAllowed: 'all',
      items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
      types: ['Files'],
    },
  });
  return event;
};

describe('StopTimerModal', () => {
  const user = userEvent.setup();
  
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    jobCardTitle: testData.jobCards.valid.title,
    projectName: testData.projects.active.name,
    allocatedHours: 8,
    actualHours: 6.5,
    timeExceeded: false,
  };

  beforeEach(() => {
    mockConfig.setupMocks();
    vi.clearAllMocks();
    mockFileReader.result = null;
  });

  afterEach(() => {
    mockConfig.cleanupMocks();
  });

  describe('Modal Rendering', () => {
    it('renders when open', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Complete Timer Session')).toBeInTheDocument();
      expect(screen.getByText(testData.jobCards.valid.title)).toBeInTheDocument();
      expect(screen.getByText(testData.projects.active.name)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} isOpen={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Complete Timer Session')).not.toBeInTheDocument();
    });

    it('displays time summary correctly', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} allocatedHours={8} actualHours={6.5} />
        </TestWrapper>
      );

      expect(screen.getByText('8 hours')).toBeInTheDocument(); // Allocated
      expect(screen.getByText('6.5 hours')).toBeInTheDocument(); // Used
      expect(screen.getByText('1.5 hours')).toBeInTheDocument(); // Remaining
    });

    it('shows exceeded time warning when over allocation', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} allocatedHours={8} actualHours={10} />
        </TestWrapper>
      );

      expect(screen.getByText('Time allocation exceeded')).toBeInTheDocument();
      expect(screen.getByText('10 hours')).toBeInTheDocument(); // Used
      expect(screen.getByText('2 hours over')).toBeInTheDocument(); // Exceeded
    });
  });

  describe('Form Validation', () => {
    it('requires minimum 10 characters for notes', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      const submitButton = screen.getByRole('button', { name: /complete timer/i });

      // Enter text less than 10 characters
      await user.type(notesInput, 'Short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Work description must be at least 10 characters')).toBeInTheDocument();
      });

      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('validates notes character count', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      
      await user.type(notesInput, 'This is a valid description');

      expect(screen.getByText('31 / 1000')).toBeInTheDocument();
    });

    it('accepts valid form submission', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      const submitButton = screen.getByRole('button', { name: /complete timer/i });

      await user.type(notesInput, 'This is a valid work description with enough characters');
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          notes: 'This is a valid work description with enough characters',
          file: null,
        });
      });
    });

    it('requires file when time is exceeded', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} allocatedHours={8} actualHours={10} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      const submitButton = screen.getByRole('button', { name: /complete timer/i });

      await user.type(notesInput, 'Valid description for exceeded time');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('File substantiation is required when time allocation is exceeded')).toBeInTheDocument();
      });

      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('File Upload', () => {
    it('allows file selection via input', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/choose file/i);
      const testFile = testData.files.validImage;

      // Mock FileReader for image preview
      mockFileReader.result = 'data:image/jpeg;base64,mockimagedata';
      
      await user.upload(fileInput, testFile);

      // Simulate FileReader onload
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: mockFileReader } as any);
        }
      }, 0);

      await waitFor(() => {
        expect(screen.getByText(testFile.name)).toBeInTheDocument();
        expect(screen.getByAltText('File preview')).toBeInTheDocument();
      });
    });

    it('validates file size limits', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/choose file/i);
      const largeFile = testData.files.tooLarge;

      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
      });
    });

    it('validates file types', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/choose file/i);
      const invalidFile = testData.files.invalidType;

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText('Invalid file type. Please upload an image, PDF, or document.')).toBeInTheDocument();
      });
    });

    it('supports drag and drop file upload', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const dropZone = screen.getByText(/drag and drop/i).closest('div');
      const testFile = testData.files.validPdf;

      // Mock FileReader for file handling
      mockFileReader.result = 'data:application/pdf;base64,mockpdfdata';

      // Simulate drag enter
      const dragEnterEvent = createDragEvent('dragenter', [testFile]);
      dropZone?.dispatchEvent(dragEnterEvent);

      // Simulate drop
      const dropEvent = createDragEvent('drop', [testFile]);
      dropZone?.dispatchEvent(dropEvent);

      // Simulate FileReader onload
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: mockFileReader } as any);
        }
      }, 0);

      await waitFor(() => {
        expect(screen.getByText(testFile.name)).toBeInTheDocument();
      });
    });

    it('removes uploaded file', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/choose file/i);
      const testFile = testData.files.validImage;

      // Upload file
      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(screen.getByText(testFile.name)).toBeInTheDocument();
      });

      // Remove file
      const removeButton = screen.getByRole('button', { name: /remove file/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText(testFile.name)).not.toBeInTheDocument();
      });
    });

    it('generates image preview', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/choose file/i);
      const imageFile = testData.files.validImage;

      // Mock FileReader result
      const mockImageData = 'data:image/jpeg;base64,mockimagedata';
      mockFileReader.result = mockImageData;

      await user.upload(fileInput, imageFile);

      // Simulate FileReader onload
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: mockFileReader } as any);
        }
      }, 0);

      await waitFor(() => {
        const preview = screen.getByAltText('File preview');
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', mockImageData);
      });
    });
  });

  describe('Progress Visualization', () => {
    it('shows progress bar for normal time usage', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} allocatedHours={8} actualHours={6} />
        </TestWrapper>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75'); // 6/8 = 75%
    });

    it('shows exceeded progress for overtime', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} allocatedHours={8} actualHours={10} />
        </TestWrapper>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(progressBar).toHaveClass('bg-destructive');
    });

    it('handles zero allocation gracefully', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} allocatedHours={0} actualHours={2} />
        </TestWrapper>
      );

      expect(screen.getByText('No allocation')).toBeInTheDocument();
      expect(screen.getByText('2 hours')).toBeInTheDocument();
    });

    it('formats time display correctly', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} allocatedHours={1.5} actualHours={2.75} />
        </TestWrapper>
      );

      expect(screen.getByText('1.5 hours')).toBeInTheDocument();
      expect(screen.getByText('2.75 hours')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('calls onClose when cancelled', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when X button clicked', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('prevents close when form has unsaved changes', async () => {
      const onClose = vi.fn();
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} onClose={onClose} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      await user.type(notesInput, 'Some unsaved changes');

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('allows close after confirming unsaved changes', async () => {
      const onClose = vi.fn();
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} onClose={onClose} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      await user.type(notesInput, 'Some unsaved changes');

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Confirm discard changes
      await waitFor(() => {
        const discardButton = screen.getByRole('button', { name: /discard changes/i });
        return user.click(discardButton);
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('cancels close when keeping unsaved changes', async () => {
      const onClose = vi.fn();
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} onClose={onClose} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      await user.type(notesInput, 'Some unsaved changes');

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Keep changes
      await waitFor(() => {
        const keepButton = screen.getByRole('button', { name: /keep editing/i });
        return user.click(keepButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      const fileInput = screen.getByLabelText(/choose file/i);
      const submitButton = screen.getByRole('button', { name: /complete timer/i });

      const testFile = testData.files.validPdf;

      await user.type(notesInput, 'Completed the project requirements successfully');
      await user.upload(fileInput, testFile);
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          notes: 'Completed the project requirements successfully',
          file: testFile,
        });
      });
    });

    it('shows loading state during submission', async () => {
      const slowSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} onSubmit={slowSubmit} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      const submitButton = screen.getByRole('button', { name: /complete timer/i });

      await user.type(notesInput, 'Valid submission description');
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByRole('button', { name: /completing/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /completing/i })).toBeDisabled();

      await waitFor(() => {
        expect(slowSubmit).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    it('handles submission errors gracefully', async () => {
      const errorSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} onSubmit={errorSubmit} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      const submitButton = screen.getByRole('button', { name: /complete timer/i });

      await user.type(notesInput, 'Valid submission description');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to complete timer. Please try again.')).toBeInTheDocument();
      });

      // Form should remain open for retry
      expect(screen.getByText('Complete Timer Session')).toBeInTheDocument();
    });

    it('resets form after successful submission', async () => {
      const successSubmit = vi.fn().mockResolvedValue(undefined);
      
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} onSubmit={successSubmit} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      const submitButton = screen.getByRole('button', { name: /complete timer/i });

      await user.type(notesInput, 'Valid submission description');
      await user.click(submitButton);

      await waitFor(() => {
        expect(successSubmit).toHaveBeenCalled();
      });

      // Form should be reset
      expect(notesInput).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Time usage progress');
      expect(screen.getByLabelText(/work description/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      const fileInput = screen.getByLabelText(/choose file/i);
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const submitButton = screen.getByRole('button', { name: /complete timer/i });

      // Tab through elements
      await user.tab();
      expect(notesInput).toHaveFocus();

      await user.tab();
      expect(fileInput).toHaveFocus();

      await user.tab();
      expect(cancelButton).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('manages focus properly', async () => {
      const { rerender } = render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} isOpen={false} />
        </TestWrapper>
      );

      // Open modal
      rerender(
        <TestWrapper>
          <StopTimerModal {...defaultProps} isOpen={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });

      // Focus should be trapped in modal
      const notesInput = screen.getByLabelText(/work description/i);
      expect(notesInput).toHaveFocus();
    });

    it('has descriptive error messages', async () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const notesInput = screen.getByLabelText(/work description/i);
      const submitButton = screen.getByRole('button', { name: /complete timer/i });

      await user.type(notesInput, 'Short');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Work description must be at least 10 characters');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing job card title', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} jobCardTitle="" />
        </TestWrapper>
      );

      expect(screen.getByText('Unnamed Task')).toBeInTheDocument();
    });

    it('handles missing project name', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} projectName="" />
        </TestWrapper>
      );

      expect(screen.getByText('Unnamed Project')).toBeInTheDocument();
    });

    it('handles negative time values', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} allocatedHours={-1} actualHours={-0.5} />
        </TestWrapper>
      );

      expect(screen.getByText('0 hours')).toBeInTheDocument();
    });

    it('handles very large time values', () => {
      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} allocatedHours={999.99} actualHours={1000.5} />
        </TestWrapper>
      );

      expect(screen.getByText('999.99 hours')).toBeInTheDocument();
      expect(screen.getByText('1000.5 hours')).toBeInTheDocument();
    });

    it('handles file upload without FileReader support', async () => {
      // Temporarily disable FileReader
      const originalFileReader = global.FileReader;
      (global as any).FileReader = undefined;

      render(
        <TestWrapper>
          <StopTimerModal {...defaultProps} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/choose file/i);
      const testFile = testData.files.validImage;

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(screen.getByText(testFile.name)).toBeInTheDocument();
        // Should not show preview without FileReader
        expect(screen.queryByAltText('File preview')).not.toBeInTheDocument();
      });

      // Restore FileReader
      global.FileReader = originalFileReader;
    });
  });
});