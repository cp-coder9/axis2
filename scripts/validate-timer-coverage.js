#!/usr/bin/env node

/**
 * Timer Coverage Validation Script
 * 
 * Validates that timer components meet minimum coverage thresholds
 * and generates detailed coverage reports for CI/CD integration.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

// Timer coverage requirements
const TIMER_COVERAGE_REQUIREMENTS = {
  // Core timer components - 95% coverage
  'src/components/timer/CountdownTimer.tsx': { lines: 95, functions: 95, branches: 90, statements: 95 },
  'src/components/timer/EnhancedTimerDisplay.tsx': { lines: 95, functions: 95, branches: 90, statements: 95 },
  'src/components/timer/StopTimerModal.tsx': { lines: 95, functions: 95, branches: 90, statements: 95 },
  
  // Legacy components - 85% coverage
  'src/components/timer/LegacyTimer.tsx': { lines: 85, functions: 85, branches: 80, statements: 85 },
  'src/components/timer/TimerSyncStatus.tsx': { lines: 85, functions: 85, branches: 80, statements: 85 },
  
  // Business logic modules - 98% coverage
  'src/contexts/modules/timer.ts': { lines: 98, functions: 98, branches: 95, statements: 98 },
  'src/contexts/modules/auth.ts': { lines: 90, functions: 90, branches: 85, statements: 90 },
  'src/contexts/modules/projects.ts': { lines: 90, functions: 90, branches: 85, statements: 90 },
  
  // Utility functions - 95% coverage
  'src/utils/offlineSync.ts': { lines: 95, functions: 95, branches: 90, statements: 95 },
  'src/utils/auditLogger.ts': { lines: 95, functions: 95, branches: 90, statements: 95 },
  'src/utils/firebaseHelpers.ts': { lines: 90, functions: 90, branches: 85, statements: 90 },
  'src/utils/firebaseErrorHandler.ts': { lines: 90, functions: 90, branches: 85, statements: 90 }
}

function validateTimerCoverage() {
  const coverageFile = path.join(__dirname, '../coverage/coverage-final.json')
  
  if (!fs.existsSync(coverageFile)) {
    console.error('❌ Coverage file not found. Run tests with coverage first:')
    console.error('   npm run test:timer-coverage')
    process.exit(1)
  }
  
  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'))
  
  let passed = true
  const results = []
  
  console.log('\n🔍 Timer Coverage Validation Report')
  console.log('=====================================\n')
  
  for (const [file, requirements] of Object.entries(TIMER_COVERAGE_REQUIREMENTS)) {
    const fileCoverage = coverage[file]
    
    if (!fileCoverage) {
      console.log(`❌ ${file}: No coverage data found`)
      results.push({ file, status: 'missing', coverage: null, requirements })
      passed = false
      continue
    }
    
    const actual = {
      lines: fileCoverage.lines.pct,
      functions: fileCoverage.functions.pct,
      branches: fileCoverage.branches.pct,
      statements: fileCoverage.statements.pct
    }
    
    const meetsRequirements = 
      actual.lines >= requirements.lines &&
      actual.functions >= requirements.functions &&
      actual.branches >= requirements.branches &&
      actual.statements >= requirements.statements
    
    if (meetsRequirements) {
      console.log(`✅ ${file}`)
      console.log(`   Lines: ${actual.lines}% (req: ${requirements.lines}%)`)
      console.log(`   Functions: ${actual.functions}% (req: ${requirements.functions}%)`)
      console.log(`   Branches: ${actual.branches}% (req: ${requirements.branches}%)`)
      console.log(`   Statements: ${actual.statements}% (req: ${requirements.statements}%)\n`)
    } else {
      console.log(`❌ ${file}`)
      console.log(`   Lines: ${actual.lines}% (req: ${requirements.lines}%) ${actual.lines < requirements.lines ? '⚠️' : '✅'}`)
      console.log(`   Functions: ${actual.functions}% (req: ${requirements.functions}%) ${actual.functions < requirements.functions ? '⚠️' : '✅'}`)
      console.log(`   Branches: ${actual.branches}% (req: ${requirements.branches}%) ${actual.branches < requirements.branches ? '⚠️' : '✅'}`)
      console.log(`   Statements: ${actual.statements}% (req: ${requirements.statements}%) ${actual.statements < requirements.statements ? '⚠️' : '✅'}\n`)
      passed = false
    }
    
    results.push({ file, status: meetsRequirements ? 'passed' : 'failed', coverage: actual, requirements })
  }
  
  // Summary
  const totalFiles = Object.keys(TIMER_COVERAGE_REQUIREMENTS).length
  const passedFiles = results.filter(r => r.status === 'passed').length
  const failedFiles = results.filter(r => r.status === 'failed').length
  const missingFiles = results.filter(r => r.status === 'missing').length
  
  console.log('📊 Summary:')
  console.log(`   Total files: ${totalFiles}`)
  console.log(`   Passed: ${passedFiles} ✅`)
  console.log(`   Failed: ${failedFiles} ❌`)
  console.log(`   Missing: ${missingFiles} ⚠️`)
  
  if (passed) {
    console.log('\n🎉 All timer components meet coverage requirements!')
    process.exit(0)
  } else {
    console.log('\n💥 Some timer components do not meet coverage requirements.')
    console.log('\nTo improve coverage:')
    console.log('1. Add more test cases for uncovered lines')
    console.log('2. Test edge cases and error scenarios')
    console.log('3. Add integration tests for component interactions')
    console.log('4. Ensure all branches are tested')
    console.log('\nRun with more details:')
    console.log('   npm run test:timer-coverage')
    process.exit(1)
  }
}

// Generate coverage report summary
function generateCoverageSummary() {
  const coverageFile = path.join(__dirname, '../coverage/coverage-final.json')
  
  if (!fs.existsSync(coverageFile)) {
    console.error('Coverage file not found')
    return
  }
  
  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'))
  const summary = {
    timestamp: new Date().toISOString(),
    timerComponents: {},
    overall: {
      totalFiles: 0,
      coveredFiles: 0,
      averageCoverage: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0
      }
    }
  }
  
  let totalLines = 0, totalFunctions = 0, totalBranches = 0, totalStatements = 0
  let coveredFiles = 0
  
  for (const [file, requirements] of Object.entries(TIMER_COVERAGE_REQUIREMENTS)) {
    const fileCoverage = coverage[file]
    
    if (fileCoverage) {
      summary.timerComponents[file] = {
        coverage: {
          lines: fileCoverage.lines.pct,
          functions: fileCoverage.functions.pct,
          branches: fileCoverage.branches.pct,
          statements: fileCoverage.statements.pct
        },
        requirements,
        passed: 
          fileCoverage.lines.pct >= requirements.lines &&
          fileCoverage.functions.pct >= requirements.functions &&
          fileCoverage.branches.pct >= requirements.branches &&
          fileCoverage.statements.pct >= requirements.statements
      }
      
      totalLines += fileCoverage.lines.pct
      totalFunctions += fileCoverage.functions.pct
      totalBranches += fileCoverage.branches.pct
      totalStatements += fileCoverage.statements.pct
      coveredFiles++
    }
  }
  
  summary.overall.totalFiles = Object.keys(TIMER_COVERAGE_REQUIREMENTS).length
  summary.overall.coveredFiles = coveredFiles
  
  if (coveredFiles > 0) {
    summary.overall.averageCoverage = {
      lines: totalLines / coveredFiles,
      functions: totalFunctions / coveredFiles,
      branches: totalBranches / coveredFiles,
      statements: totalStatements / coveredFiles
    }
  }
  
  // Write summary file
  const summaryFile = path.join(__dirname, '../coverage/timer-summary.json')
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))
  
  console.log(`📊 Coverage summary written to: ${summaryFile}`)
}

// Main execution
if (require.main === module) {
  const command = process.argv[2]
  
  switch (command) {
    case 'validate':
      validateTimerCoverage()
      break
    case 'summary':
      generateCoverageSummary()
      break
    default:
      validateTimerCoverage()
      generateCoverageSummary()
  }
}

module.exports = {
  validateTimerCoverage,
  generateCoverageSummary,
  TIMER_COVERAGE_REQUIREMENTS
}