# Architex Axis

A modern, feature-rich project management platform built with React, TypeScript, and Firebase, designed for architecture and design firms to manage projects, teams, and freelancers.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Firebase Configuration](#firebase-configuration)
- [Development](#development)
  - [Available Scripts](#available-scripts)
  - [Project Structure](#project-structure)
  - [Development with Firebase Emulator](#development-with-firebase-emulator)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [User Roles & Permissions](#user-roles--permissions)
- [Key Features Deep Dive](#key-features-deep-dive)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🎯 Overview

Architex Axis is a comprehensive project management solution specifically designed for architecture and design firms. It provides role-based dashboards for administrators, freelancers, and clients, enabling seamless collaboration, time tracking, file management, and project oversight.

The platform has been migrated to use **shadcn/ui** components, providing a modern, accessible, and highly customizable user interface built on top of Radix UI primitives and styled with Tailwind CSS.

## ✨ Features

### Core Functionality
- **Role-Based Access Control**: Three distinct user roles (Admin, Freelancer, Client) with tailored dashboards and permissions
- **Project Management**: Create, track, and manage projects with job cards, milestones, and deliverables
- **Time Tracking**: Built-in timer system for freelancers to track billable hours
- **Team Collaboration**: Real-time messaging, file sharing, and project updates
- **File Management**: Secure document storage and sharing with version control
- **Analytics & Reporting**: Comprehensive dashboards with performance metrics and insights
- **User Management**: Admin panel for managing users, roles, and permissions
- **Activity Monitoring**: Track user activities and system usage

### Dashboard Features by Role

#### Admin Dashboard
- User management and role assignment
- System-wide analytics and performance monitoring
- Activity monitoring across all projects
- Project oversight and budget tracking
- Report generation (cost reports, performance metrics)

#### Freelancer Dashboard
- Project assignments and task management
- Time tracking with start/stop timers
- Earnings dashboard with payment history
- Project applications and proposals
- Weekly time logs and statistics
- Performance metrics

#### Client Dashboard
- Active project overview
- Real-time project updates
- Secure document access
- Direct messaging with project teams
- Budget and timeline tracking
- Project milestones and deliverables

### UI/UX Features
- **Dark Mode Support**: System-aware theme switching with manual override
- **Responsive Design**: Mobile-first design that works on all devices
- **Glassmorphism Effects**: Modern UI with frosted glass effects
- **Bottom Sheets**: Mobile-optimized modal experiences
- **Skeleton Loading**: Smooth loading states for better UX
- **Toast Notifications**: User-friendly feedback system
- **Accessibility**: WCAG compliant with keyboard navigation support

## 🛠 Tech Stack

### Frontend
- **React 18.2.0** - UI framework
- **TypeScript 5.2.2** - Type safety
- **Vite 5.0** - Build tool and dev server
- **React Router 6.22** - Client-side routing
- **Tailwind CSS 3.3.5** - Utility-first styling
- **shadcn/ui** - Component library (built on Radix UI)
- **Lucide React** - Icon library
- **Recharts 3.1.2** - Data visualization

### Backend & Services
- **Firebase 12.4.0**
  - Authentication - User management
  - Firestore - NoSQL database
  - Storage - File management
  - Emulator Suite - Local development

### State Management & Forms
- **React Context API** - Global state management
- **React Hook Form 7.62** - Form handling
- **Zod 4.1** - Schema validation

### Development Tools
- **ESLint** - Code linting
- **Stylelint** - CSS linting
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **TypeScript ESLint** - TypeScript linting

### UI Component Libraries
- **@radix-ui/react-*** - Accessible UI primitives
- **@hello-pangea/dnd** - Drag and drop functionality
- **date-fns** - Date utilities
- **cmdk** - Command menu
- **sonner** - Toast notifications

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **Git**
- **Firebase CLI** (for deployment and emulator)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/cp-coder9/axis2.git
cd axis2
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase configuration (see [Environment Setup](#environment-setup)).

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Use Firebase Emulator for development
VITE_USE_FIREBASE_EMULATOR=false
```

### Firebase Configuration

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Enable Authentication, Firestore, and Storage

2. **Get your Firebase config**
   - In Firebase Console, go to Project Settings
   - Under "Your apps", click the web app icon (</>)
   - Copy the configuration values to your `.env.local`

3. **Set up Firestore Security Rules**
   - Deploy the rules from `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Set up Firestore Indexes**
   - Deploy indexes from `firestore.indexes.json`:
   ```bash
   firebase deploy --only firestore:indexes
   ```

## 💻 Development

### Available Scripts

```bash
# Start development server (port 3000)
npm run dev

# Start with Firebase Emulator
npm run dev:with-emulator

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with UI
npm test:ui

# Run timer-specific tests
npm run test:timer

# Run E2E tests
npm run test:e2e

# Run E2E timer tests
npm run test:e2e:timer

# Lint code
npm run lint

# Lint and fix
npm run lint:fix

# Migrate projects (production)
npm run migrate:projects

# Migrate projects (dry run)
npm run migrate:projects:dry-run

# Validate project data
npm run migrate:projects:validate
```

### Project Structure

```
axis2/
├── public/                 # Static assets
├── src/
│   ├── api/               # API integration
│   │   └── timers/        # Timer API endpoints
│   ├── components/        # React components
│   │   ├── admin/         # Admin-specific components
│   │   ├── analytics/     # Analytics and charts
│   │   ├── auth/          # Authentication components
│   │   ├── charts/        # Chart components
│   │   ├── client/        # Client-specific components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── demos/         # Demo/example components
│   │   ├── file/          # File management
│   │   ├── files/         # Enhanced file management
│   │   ├── freelancer/    # Freelancer-specific components
│   │   ├── messaging/     # Messaging system
│   │   ├── mobile/        # Mobile-optimized components
│   │   ├── navigation/    # Navigation and layouts
│   │   ├── performance/   # Performance monitoring
│   │   ├── profile/       # User profile components
│   │   ├── project/       # Project management components
│   │   ├── theme/         # Theme system
│   │   ├── timer/         # Timer components
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/          # React Context providers
│   │   └── modules/       # Context modules
│   ├── demo/              # Demo pages and components
│   ├── demos/             # Additional demos
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page components
│   │   └── dashboards/    # Dashboard pages
│   ├── services/          # Business logic and API calls
│   │   ├── dashboard/     # Dashboard services
│   │   ├── messaging/     # Messaging services
│   │   └── websocket/     # WebSocket services
│   ├── tests/             # Test files
│   │   ├── __mocks__/     # Test mocks
│   │   ├── fixtures/      # Test fixtures
│   │   ├── helpers/       # Test helpers
│   │   ├── integration/   # Integration tests
│   │   ├── messaging/     # Messaging tests
│   │   └── timer/         # Timer tests
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   │   └── performance/   # Performance utilities
│   ├── App.tsx            # Main App component
│   ├── Router.tsx         # Application routing
│   ├── firebase.ts        # Firebase configuration
│   ├── globals.css        # Global styles
│   └── main.tsx           # Application entry point
├── tests/                 # Additional test files
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── components.json        # shadcn/ui configuration
├── eslint.config.js      # ESLint configuration
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── playwright.config.ts  # Playwright configuration
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── vitest.config.ts      # Vitest configuration
```

### Development with Firebase Emulator

For local development without connecting to production Firebase:

1. **Install and configure the Firebase Emulator Suite**
```bash
firebase init emulators
```

2. **Start the emulators**
```bash
firebase emulators:start
```

3. **Run the dev server with emulator**
```bash
npm run dev:with-emulator
```

The emulator UI will be available at `http://localhost:4000`.

## 🧪 Testing

### Unit Tests (Vitest)
```bash
# Run all tests
npm test

# Run with UI
npm test:ui

# Run specific test suite
npm run test:timer
```

### E2E Tests (Playwright)
```bash
# Run E2E tests
npm run test:e2e

# Run timer E2E tests
npm run test:e2e:timer
```

### Test Structure
- `src/tests/` - Test files organized by feature
- `tests/` - Additional integration and E2E tests
- Coverage reports are generated in `src/tests/coverage/`

## 📦 Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

The build output will be in the `dist/` directory, optimized and ready for deployment.

### Build Optimizations
- **Code Splitting**: Automatic chunking by route and component
- **Tree Shaking**: Unused code elimination
- **Minification**: Terser-based minification
- **Asset Optimization**: Image and font optimization
- **Source Maps**: Generated for debugging
- **Vendor Chunking**: Separate chunks for React, UI libraries, and utilities

### Deployment

Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

Or deploy everything:
```bash
firebase deploy
```

## 👥 User Roles & Permissions

### Admin
**Full system access including:**
- User management (create, update, delete users)
- Role assignment and permissions
- Project creation and assignment
- System-wide analytics and reporting
- Activity monitoring
- Budget and resource management
- Application approval/rejection

### Freelancer
**Project execution and time tracking:**
- View assigned projects and tasks
- Track time with built-in timer
- Submit work and deliverables
- Apply for new projects
- View earnings and payment history
- Communicate with clients and team
- Access project files

### Client
**Project oversight and collaboration:**
- View owned projects
- Access project files and documents
- Message project teams
- Track project progress and milestones
- View budget and timeline
- Request updates and changes
- Approve deliverables

## 🔑 Key Features Deep Dive

### Time Tracking System
- Start/stop/pause timers for job cards
- Automatic time logging to Firestore
- Weekly and monthly time summaries
- Hourly rate calculations
- Time allocation vs. actual tracking
- Timer persistence across sessions

### Project Management
- Hierarchical structure: Projects → Job Cards → Tasks
- Status tracking (Draft, Planning, Active, Completed, On Hold)
- Budget and time allocation
- Team assignment and management
- File attachment and versioning
- Progress tracking and milestones

### Messaging System
- Real-time chat between users
- Project-based conversations
- Read receipts and typing indicators
- File sharing in messages
- Call initiation
- Message search and filtering

### File Management
- Secure cloud storage via Firebase Storage
- File preview and download
- Permission-based access control
- Version control
- File starring and organization
- Bulk operations

### Analytics Dashboard
- Project performance metrics
- User activity tracking
- Revenue and earnings analytics
- Time utilization reports
- Custom date range filtering
- Export to CSV/PDF

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Run linting: `npm run lint:fix`

## 🐛 Troubleshooting

### Common Issues

#### Firebase Connection Issues
**Problem**: "Firebase not initialized" or connection errors

**Solution**:
1. Check that `.env.local` has correct Firebase credentials
2. Verify Firebase project is active in console
3. Check browser console for specific error messages
4. Try clearing browser cache and localStorage

#### Build Errors
**Problem**: TypeScript compilation errors

**Solution**:
```bash
# Clean build cache
rm -rf dist node_modules/.vite
npm install
npm run build
```

#### Port Already in Use
**Problem**: "Port 3000 is already in use"

**Solution**:
```bash
# Kill the process using port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- --port 3001
```

#### Emulator Connection Issues
**Problem**: Cannot connect to Firebase emulator

**Solution**:
1. Ensure emulator is running: `firebase emulators:start`
2. Check `VITE_USE_FIREBASE_EMULATOR=true` in `.env.local`
3. Verify emulator ports in `firebase.json`
4. Clear browser cache and reload

#### Performance Issues
**Problem**: Slow page load or lag

**Solution**:
1. Check browser DevTools Performance tab
2. Enable production build optimizations
3. Review bundle size with `npm run build`
4. Consider lazy loading heavy components
5. Use React DevTools Profiler

### Getting Help

- **Documentation**: Check inline code comments and type definitions
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Firebase Console**: Monitor logs and usage in Firebase Console
- **Browser DevTools**: Use console and network tabs for debugging

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **shadcn/ui** - For the excellent component library
- **Radix UI** - For accessible UI primitives
- **Tailwind CSS** - For the utility-first CSS framework
- **Firebase** - For backend infrastructure
- **Vite** - For the blazing-fast build tool
- **React Team** - For the amazing framework

---

**Built with ❤️ by the Architex Axis team**

For questions or support, please open an issue on GitHub.
