/**
 * File Upload Test Fixtures
 * Comprehensive file test data for timer component file upload testing
 */

import { vi } from 'vitest'

// Mock File constructor for testing
export class MockFile extends File {
  constructor(
    bits: BlobPart[],
    name: string,
    options: FilePropertyBag = {}
  ) {
    super(bits, name, options);
  }
}

// Helper to create mock files
const createMockFile = (
  name: string,
  size: number,
  type: string,
  content: string = 'Mock file content'
): File => {
  const blob = new Blob([content], { type });
  return new MockFile([blob], name, { type, lastModified: Date.now() });
};

// Valid image files
export const validImageFiles = {
  smallJpeg: createMockFile(
    'screenshot.jpg',
    1024 * 100, // 100KB
    'image/jpeg',
    'Mock JPEG content'
  ),
  
  mediumPng: createMockFile(
    'design-mockup.png',
    1024 * 500, // 500KB
    'image/png',
    'Mock PNG content'
  ),
  
  largeWebp: createMockFile(
    'hero-image.webp',
    1024 * 1024 * 2, // 2MB
    'image/webp',
    'Mock WebP content'
  ),
  
  maxSizeImage: createMockFile(
    'large-screenshot.jpg',
    1024 * 1024 * 5 - 1, // Just under 5MB limit
    'image/jpeg',
    'Mock large JPEG content'
  )
};

// Valid document files
export const validDocumentFiles = {
  smallPdf: createMockFile(
    'time-log-evidence.pdf',
    1024 * 200, // 200KB
    'application/pdf',
    'Mock PDF content'
  ),
  
  wordDoc: createMockFile(
    'project-notes.docx',
    1024 * 300, // 300KB
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Mock DOCX content'
  ),
  
  textFile: createMockFile(
    'log-details.txt',
    1024 * 10, // 10KB
    'text/plain',
    'Mock text file content with detailed time log information'
  ),
  
  markdownFile: createMockFile(
    'work-summary.md',
    1024 * 25, // 25KB
    'text/markdown',
    '# Work Summary\n\n## Tasks Completed\n- Feature implementation\n- Bug fixes'
  )
};

// Invalid files (wrong type)
export const invalidTypeFiles = {
  executable: createMockFile(
    'malicious.exe',
    1024 * 50, // 50KB
    'application/x-msdownload',
    'Mock executable content'
  ),
  
  videoFile: createMockFile(
    'screen-recording.mp4',
    1024 * 1024 * 10, // 10MB
    'video/mp4',
    'Mock video content'
  ),
  
  audioFile: createMockFile(
    'meeting-recording.mp3',
    1024 * 1024 * 5, // 5MB
    'audio/mpeg',
    'Mock audio content'
  ),
  
  zipFile: createMockFile(
    'source-code.zip',
    1024 * 1024 * 3, // 3MB
    'application/zip',
    'Mock ZIP content'
  )
};

// Files exceeding size limit (5MB)
export const oversizedFiles = {
  hugeImage: createMockFile(
    'huge-image.jpg',
    1024 * 1024 * 6, // 6MB
    'image/jpeg',
    'Mock huge JPEG content'
  ),
  
  largePdf: createMockFile(
    'large-document.pdf',
    1024 * 1024 * 10, // 10MB
    'application/pdf',
    'Mock large PDF content'
  ),
  
  massiveFile: createMockFile(
    'massive-file.txt',
    1024 * 1024 * 50, // 50MB
    'text/plain',
    'Mock massive text content'
  )
};

// Edge case files
export const edgeCaseFiles = {
  emptyFile: createMockFile(
    'empty.txt',
    0, // 0 bytes
    'text/plain',
    ''
  ),
  
  noExtensionFile: createMockFile(
    'noextension',
    1024 * 10, // 10KB
    'text/plain',
    'File without extension'
  ),
  
  specialCharsFile: createMockFile(
    'file with spaces & symbols!@#$.txt',
    1024 * 5, // 5KB
    'text/plain',
    'File with special characters in name'
  ),
  
  unicodeFile: createMockFile(
    '测试文件.txt',
    1024 * 5, // 5KB
    'text/plain',
    'Unicode filename test'
  ),
  
  longNameFile: createMockFile(
    'this-is-a-very-long-filename-that-might-cause-issues-in-some-systems-and-should-be-tested.txt',
    1024 * 5, // 5KB
    'text/plain',
    'File with very long name'
  )
};

// File collections for different test scenarios
export const allValidFiles = [
  ...Object.values(validImageFiles),
  ...Object.values(validDocumentFiles)
];

export const allInvalidFiles = [
  ...Object.values(invalidTypeFiles),
  ...Object.values(oversizedFiles)
];

export const allEdgeCaseFiles = Object.values(edgeCaseFiles);

// File validation scenarios
export const fileValidationScenarios = [
  {
    name: 'Valid JPEG image under size limit',
    file: validImageFiles.smallJpeg,
    isValid: true,
    expectedError: null,
    shouldShowPreview: true
  },
  {
    name: 'Valid PDF document',
    file: validDocumentFiles.smallPdf,
    isValid: true,
    expectedError: null,
    shouldShowPreview: false
  },
  {
    name: 'Invalid file type (executable)',
    file: invalidTypeFiles.executable,
    isValid: false,
    expectedError: 'Invalid file type. Please upload images, PDFs, or documents only.',
    shouldShowPreview: false
  },
  {
    name: 'File exceeding size limit',
    file: oversizedFiles.hugeImage,
    isValid: false,
    expectedError: 'File size must be less than 5MB.',
    shouldShowPreview: false
  },
  {
    name: 'Empty file',
    file: edgeCaseFiles.emptyFile,
    isValid: false,
    expectedError: 'File cannot be empty.',
    shouldShowPreview: false
  },
  {
    name: 'File at maximum size limit',
    file: validImageFiles.maxSizeImage,
    isValid: true,
    expectedError: null,
    shouldShowPreview: true
  }
];

// File upload test scenarios
export const fileUploadScenarios = [
  {
    name: 'Single image upload with preview',
    files: [validImageFiles.mediumPng],
    expectedFiles: 1,
    expectsPreview: true,
    expectsSuccess: true
  },
  {
    name: 'Multiple file upload (should take first)',
    files: [validImageFiles.smallJpeg, validDocumentFiles.smallPdf],
    expectedFiles: 1, // Only first file should be accepted
    expectsPreview: true,
    expectsSuccess: true
  },
  {
    name: 'Invalid file type rejection',
    files: [invalidTypeFiles.videoFile],
    expectedFiles: 0,
    expectsPreview: false,
    expectsSuccess: false,
    expectedError: 'Invalid file type'
  },
  {
    name: 'Oversized file rejection',
    files: [oversizedFiles.largePdf],
    expectedFiles: 0,
    expectsPreview: false,
    expectsSuccess: false,
    expectedError: 'File size must be less than 5MB'
  },
  {
    name: 'Document upload without preview',
    files: [validDocumentFiles.textFile],
    expectedFiles: 1,
    expectsPreview: false,
    expectsSuccess: true
  }
];

// Drag and drop test scenarios
export const dragDropScenarios = [
  {
    name: 'Valid drag and drop',
    files: [validImageFiles.smallJpeg],
    shouldAccept: true,
    expectedHighlight: true
  },
  {
    name: 'Invalid file drag and drop',
    files: [invalidTypeFiles.executable],
    shouldAccept: false,
    expectedHighlight: false,
    expectedError: 'Invalid file type'
  },
  {
    name: 'Multiple files drag (accept first)',
    files: [validImageFiles.smallJpeg, validDocumentFiles.smallPdf],
    shouldAccept: true,
    expectedHighlight: true,
    expectedFiles: 1
  },
  {
    name: 'Empty drag event',
    files: [],
    shouldAccept: false,
    expectedHighlight: false,
    expectedError: 'No files detected'
  }
];

// File preview scenarios
export const filePreviewScenarios = [
  {
    name: 'Image preview generation',
    file: validImageFiles.mediumPng,
    shouldGeneratePreview: true,
    expectedPreviewType: 'image',
    expectedBase64: true
  },
  {
    name: 'PDF document (no preview)',
    file: validDocumentFiles.smallPdf,
    shouldGeneratePreview: false,
    expectedPreviewType: 'document',
    expectedBase64: false
  },
  {
    name: 'Text file (no preview)',
    file: validDocumentFiles.textFile,
    shouldGeneratePreview: false,
    expectedPreviewType: 'document',
    expectedBase64: false
  }
];

// File removal scenarios
export const fileRemovalScenarios = [
  {
    name: 'Remove uploaded image',
    initialFile: validImageFiles.smallJpeg,
    expectsCleanup: true,
    expectsStateReset: true
  },
  {
    name: 'Remove uploaded document',
    initialFile: validDocumentFiles.smallPdf,
    expectsCleanup: true,
    expectsStateReset: true
  }
];

// Mock FileReader for testing
export const createMockFileReader = (shouldSucceed: boolean = true) => {
  return {
    readAsDataURL: vi.fn((file: File) => {
      setTimeout(() => {
        if (shouldSucceed) {
          const mockResult = `data:${file.type};base64,mockBase64Data`;
          (mockFileReader as any).result = mockResult;
          (mockFileReader as any).onload?.({ target: mockFileReader });
        } else {
          (mockFileReader as any).onerror?.({ target: mockFileReader });
        }
      }, 10);
    }),
    result: null,
    onload: null,
    onerror: null
  };
};

// Global mock FileReader instance
export const mockFileReader = createMockFileReader();

// File factory for dynamic test creation
export const createTestFile = (
  name: string = 'test-file.txt',
  size: number = 1024,
  type: string = 'text/plain',
  content: string = 'Test file content'
): File => {
  return createMockFile(name, size, type, content);
};

// File upload form data scenarios
export const formDataScenarios = [
  {
    name: 'Complete form with image',
    notes: 'Completed the frontend component implementation',
    file: validImageFiles.smallJpeg,
    isValid: true,
    expectedSubmission: true
  },
  {
    name: 'Complete form with document',
    notes: 'Fixed critical bugs and updated documentation',
    file: validDocumentFiles.smallPdf,
    isValid: true,
    expectedSubmission: true
  },
  {
    name: 'Form with short notes (invalid)',
    notes: 'Too short', // Less than 10 characters
    file: validImageFiles.smallJpeg,
    isValid: false,
    expectedError: 'Notes must be at least 10 characters long'
  },
  {
    name: 'Form without file (time exceeded)',
    notes: 'Completed work but exceeded time allocation significantly',
    file: null,
    isValid: false, // When time is exceeded, file is required
    expectedError: 'File upload is required when time allocation is exceeded'
  },
  {
    name: 'Form without file (normal completion)',
    notes: 'Completed work within allocated time',
    file: null,
    isValid: true, // When time is not exceeded, file is optional
    expectedSubmission: true
  }
];

// Error scenarios for file handling
export const fileErrorScenarios = {
  fileReaderError: {
    name: 'FileReader error during preview generation',
    file: validImageFiles.mediumPng,
    mockFileReader: createMockFileReader(false),
    expectedError: 'Failed to generate file preview',
    expectedPreview: null
  },
  
  networkError: {
    name: 'Network error during file upload',
    file: validDocumentFiles.smallPdf,
    simulateNetworkError: true,
    expectedError: 'Failed to upload file',
    expectedRetry: true
  },
  
  serverError: {
    name: 'Server error during file processing',
    file: validImageFiles.smallJpeg,
    simulateServerError: true,
    expectedError: 'Server error processing file',
    expectedRetry: false
  }
};

export default {
  validImageFiles,
  validDocumentFiles,
  invalidTypeFiles,
  oversizedFiles,
  edgeCaseFiles,
  allValidFiles,
  allInvalidFiles,
  allEdgeCaseFiles,
  fileValidationScenarios,
  fileUploadScenarios,
  dragDropScenarios,
  filePreviewScenarios,
  fileRemovalScenarios,
  formDataScenarios,
  fileErrorScenarios,
  createMockFileReader,
  mockFileReader,
  createTestFile,
  MockFile
};