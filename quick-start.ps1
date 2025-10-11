# Architex Axis Quick Start Script
# Run this from the a.7.1-s directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Architex Axis Management Suite" -ForegroundColor Cyan
Write-Host "Quick Start Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the a.7.1-s directory" -ForegroundColor Yellow
    Write-Host "Example: cd a.7.1-s; .\quick-start.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Correct directory confirmed" -ForegroundColor Green
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# Check .env.local
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local found" -ForegroundColor Green
    
    # Check for required variables
    $envContent = Get-Content ".env.local" -Raw
    $requiredVars = @(
        "VITE_API_KEY",
        "VITE_AUTH_DOMAIN",
        "VITE_PROJECT_ID",
        "VITE_STORAGE_BUCKET",
        "VITE_MESSAGING_SENDER_ID",
        "VITE_APP_ID"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch $var) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "WARNING: Missing environment variables:" -ForegroundColor Yellow
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✓ All required environment variables present" -ForegroundColor Green
    }
} else {
    Write-Host "WARNING: .env.local not found" -ForegroundColor Yellow
    Write-Host "Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "✓ Created .env.local from template" -ForegroundColor Green
        Write-Host "⚠ Please edit .env.local with your Firebase credentials" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: .env.example not found" -ForegroundColor Red
    }
}
Write-Host ""

# Check Firebase CLI
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue
if ($firebaseInstalled) {
    Write-Host "✓ Firebase CLI installed" -ForegroundColor Green
    
    # Offer to deploy rules
    Write-Host ""
    $deployRules = Read-Host "Deploy Firestore rules? (y/n)"
    if ($deployRules -eq "y") {
        Write-Host "Deploying Firestore rules..." -ForegroundColor Yellow
        firebase deploy --only firestore:rules
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Firestore rules deployed" -ForegroundColor Green
        } else {
            Write-Host "⚠ Failed to deploy rules (you may need to login first)" -ForegroundColor Yellow
        }
    }
    
    $deployIndexes = Read-Host "Deploy Firestore indexes? (y/n)"
    if ($deployIndexes -eq "y") {
        Write-Host "Deploying Firestore indexes..." -ForegroundColor Yellow
        firebase deploy --only firestore:indexes
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Firestore indexes deployed" -ForegroundColor Green
        } else {
            Write-Host "⚠ Failed to deploy indexes" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠ Firebase CLI not installed" -ForegroundColor Yellow
    Write-Host "Install with: npm install -g firebase-tools" -ForegroundColor Cyan
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Ensure Firebase services are enabled:" -ForegroundColor White
Write-Host "   - Authentication (Email/Password)" -ForegroundColor White
Write-Host "   - Firestore Database" -ForegroundColor White
Write-Host "   - Storage" -ForegroundColor White
Write-Host ""
Write-Host "2. Create an admin user in Firebase Console" -ForegroundColor White
Write-Host "   See GETTING_STARTED.md for instructions" -ForegroundColor White
Write-Host ""
Write-Host "3. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see:" -ForegroundColor Yellow
Write-Host "  - GETTING_STARTED.md" -ForegroundColor Cyan
Write-Host "  - DIAGNOSTIC_CHECKLIST.md" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to start dev server
$startDev = Read-Host "Start development server now? (y/n)"
if ($startDev -eq "y") {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}
