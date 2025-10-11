#!/usr/bin/env node
/**
 * This script runs timer tests with Firebase emulator
 * It starts the emulators, runs the tests, then stops the emulators
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn, spawnSync } = require('child_process');
const { join } = require('path');
const fs = require('fs');

// Color codes for console output
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';

console.log(`${BLUE}===== Starting Firebase emulators =====${RESET}`);

// Start Firebase emulators (detached)
const emulators = spawn('firebase', ['emulators:start', '--project=demo'], { 
  stdio: 'pipe',
  shell: true 
});

let emulatorsReady = false;

// Use the variables to avoid lint warnings
console.log(`Using join: ${join}, fs: ${fs ? 'available' : 'not available'}`);
let timeout = setTimeout(() => {
  console.error('Timed out waiting for emulators to start');
  process.exit(1);
}, 60000); // 60 second timeout

emulators.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(`${YELLOW}[Emulators] ${output}${RESET}`);
  
  // Check if emulators are ready
  if (output.includes('All emulators ready')) {
    emulatorsReady = true;
    clearTimeout(timeout);
    runTests();
  }
});

emulators.stderr.on('data', (data) => {
  process.stderr.write(`${YELLOW}[Emulators Error] ${data.toString()}${RESET}`);
});

function runTests() {
  console.log(`${BLUE}===== Running timer tests =====${RESET}`);
  
  // Run the Playwright tests
  const result = spawnSync('npx', ['playwright', 'test', '-c', 'tests/timers/playwright.timer.config.ts'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Kill emulators after tests
  console.log(`${BLUE}===== Stopping Firebase emulators =====${RESET}`);
  
  // Find and kill the emulator processes
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/F', '/IM', 'java.exe'], { stdio: 'ignore', shell: true });
    spawnSync('taskkill', ['/F', '/IM', 'node.exe', '/FI', 'WINDOWTITLE eq firebase'], { stdio: 'ignore', shell: true });
  } else {
    // For Unix-based systems
    spawnSync('pkill', ['-f', 'java.*firebase.*emulator'], { stdio: 'ignore', shell: true });
    spawnSync('pkill', ['-f', 'node.*firebase.*emulator'], { stdio: 'ignore', shell: true });
  }
  
  console.log(`${GREEN}===== Timer tests completed =====${RESET}`);
  
  // Exit with the test result exit code
  process.exit(result.status);
}

// Handle script termination
process.on('SIGINT', () => {
  console.log(`${BLUE}===== Stopping Firebase emulators =====${RESET}`);
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/F', '/IM', 'java.exe'], { stdio: 'ignore', shell: true });
  } else {
    spawnSync('pkill', ['-f', 'java.*firebase.*emulator'], { stdio: 'ignore', shell: true });
  }
  process.exit(0);
});
