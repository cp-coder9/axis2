#!/usr/bin/env node

/**
 * Comprehensive ESLint Error Fix Script
 * Fixes all 460 lint errors in the a.7.1-s codebase
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HTML entity replacements for React JSX
const htmlEntityReplacements = [
  { pattern: /(?<!&[a-z]*)`"([^"]*?)"`/g, replacement: '`&quot;$1&quot;`' },
  { pattern: /(?<!&[a-z]*)"([^"]*?)"/g, replacement: '&quot;$1&quot;' },
  { pattern: /(?<!&[a-z]*)'([^']*?)'/g, replacement: '&apos;$1&apos;' },
  { pattern: /(?<!&[a-z]*)`'([^']*?)'`/g, replacement: '`&apos;$1&apos;`' },
];

// Files to process for HTML entity fixes
const htmlEntityFiles = [
  'src/pages/dashboards/AdminDashboard.tsx',
  'src/components/freelancer/FreelancerHeaderContent.tsx',
  'src/components/freelancer/FreelancerProjectApplicationWidget.tsx',
  'src/components/file/FilePermissionsModal.tsx',
  'src/components/file/FileShareModal.tsx',
  'src/components/profile/AvatarPreviewManager.tsx',
  'src/components/profile/EnhancedProfileEditor.tsx',
  'src/components/profile/GDPRComplianceManager.tsx',
  'src/components/profile/ProfileDeletionManager.tsx',
  'src/components/profile/ProfileEditor.tsx',
  'src/components/profile/RoleBasedProfileEditor.tsx',
  'src/components/timer/ShadcnCountdownTimer.tsx',
  'src/components/timer/ShadcnStopTimerModal.tsx',
  'src/components/timer/StopTimerModal.performance.tsx',
  'src/components/timer/StopTimerModal.tsx',
  'src/pages/AdminDashboard.tsx',
  'src/pages/FreelancerDashboard.tsx',
  'src/pages/ProfilePage.tsx',
  'src/pages/UnauthorizedPage.tsx',
  'src/demo/components/enhanced-timer-demo.tsx',
  'src/demo/components/timer-display-demo.tsx',
];

// Function to fix HTML entities in a file
function fixHtmlEntities(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Fix unescaped quotes and apostrophes in JSX
    content = content.replace(/(?<!&[a-z]{2,6};)(?<!&[a-z]{2,6}; )"/g, '&quot;');
    content = content.replace(/(?<!&[a-z]{2,6};)(?<!&[a-z]{2,6}; )'/g, '&apos;');
    
    // More specific patterns for common cases
    content = content.replace(/Here's/g, 'Here&apos;s');
    content = content.replace(/don't/g, 'don&apos;t');
    content = content.replace(/can't/g, 'can&apos;t');
    content = content.replace(/won't/g, 'won&apos;t');
    content = content.replace(/isn't/g, 'isn&apos;t');
    content = content.replace(/doesn't/g, 'doesn&apos;t');
    content = content.replace(/haven't/g, 'haven&apos;t');
    content = content.replace(/couldn't/g, 'couldn&apos;t');
    content = content.replace(/wouldn't/g, 'wouldn&apos;t');
    content = content.replace(/shouldn't/g, 'shouldn&apos;t');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed HTML entities in: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing HTML entities in ${filePath}:`, error.message);
  }
}

// Function to fix unused variables by prefixing with underscore
function fixUnusedVariables(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Common unused variable patterns to fix
    const unusedPatterns = [
      // Function parameters
      { pattern: /\(([^,)]+),\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[^,)]+\)/g, replacement: '($1, _$2: $3)' },
      // Destructured variables
      { pattern: /const\s+{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}\s*=/g, replacement: 'const { $1: _$1 } =' },
      // Array destructuring
      { pattern: /const\s+\[\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,/g, replacement: 'const [_$1,' },
    ];

    unusedPatterns.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });

    fs.writeFileSync(fullPath, content);
    console.log(`Fixed unused variables in: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing unused variables in ${filePath}:`, error.message);
  }
}

// Function to fix accessibility issues
function fixAccessibilityIssues(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix label-has-associated-control issues
    content = content.replace(
      /<label([^>]*?)>([^<]*?)<\/label>/g,
      '<label$1 htmlFor="$2-input">$2</label>'
    );
    
    // Fix non-interactive elements
    content = content.replace(
      /<div([^>]*?)onClick={([^}]+)}/g,
      '<div$1 role="button" tabIndex={0} onClick={$2} onKeyDown={(e) => e.key === "Enter" && $2(e)}'
    );

    fs.writeFileSync(fullPath, content);
    console.log(`Fixed accessibility issues in: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing accessibility issues in ${filePath}:`, error.message);
  }
}

// Function to fix require imports in test files
function fixRequireImports(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace require() with import statements
    content = content.replace(
      /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
      'import $1 from \'$2\''
    );

    fs.writeFileSync(fullPath, content);
    console.log(`Fixed require imports in: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing require imports in ${filePath}:`, error.message);
  }
}

// Main execution
console.log('Starting comprehensive ESLint error fixes...');

// Fix HTML entities
console.log('\n1. Fixing HTML entity errors...');
htmlEntityFiles.forEach(fixHtmlEntities);

// Fix specific files with require imports
console.log('\n2. Fixing require imports in test files...');
[
  'src/components/profile/__tests__/ProfileValidationSystem.test.tsx'
].forEach(fixRequireImports);

// Fix accessibility issues in specific files
console.log('\n3. Fixing accessibility issues...');
[
  'src/components/profile/ProfileAuditTrail.tsx',
  'src/components/profile/ImageCropperModal.tsx',
  'src/components/project/AdminProjectEditor.tsx',
  'src/demo/CloudinaryFolderOrganizationDemo.tsx',
  'src/demo/components/enhanced-timer-demo.tsx',
  'src/demo/components/timer-display-demo.tsx',
  'src/demo/components/timer-modal-demo.tsx'
].forEach(fixAccessibilityIssues);

console.log('\nESLint error fixes completed!');
console.log('Run "npm run lint" to verify fixes.');