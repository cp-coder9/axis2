/**
 * Architex Axis Theme Constants
 * 
 * This file contains the design tokens and constants used throughout the application.
 * It provides a centralized way to manage colors, spacing, and other design values.
 */

// Brand Color Palette
export const ARCHITEX_COLORS = {
  // Primary brand colors
  primary: {
    50: 'hsl(210, 100%, 97%)',
    100: 'hsl(210, 100%, 94%)',
    200: 'hsl(210, 100%, 87%)',
    300: 'hsl(210, 100%, 80%)',
    400: 'hsl(210, 100%, 70%)',
    500: 'hsl(210, 100%, 50%)', // Main brand color
    600: 'hsl(210, 100%, 45%)',
    700: 'hsl(210, 100%, 40%)',
    800: 'hsl(210, 100%, 35%)',
    900: 'hsl(210, 100%, 25%)',
    950: 'hsl(210, 100%, 15%)',
  },
  
  // Secondary brand colors
  secondary: {
    50: 'hsl(200, 95%, 95%)',
    100: 'hsl(200, 95%, 90%)',
    200: 'hsl(200, 95%, 80%)',
    300: 'hsl(200, 95%, 70%)',
    400: 'hsl(200, 95%, 60%)',
    500: 'hsl(200, 95%, 45%)', // Main secondary color
    600: 'hsl(200, 95%, 40%)',
    700: 'hsl(200, 95%, 35%)',
    800: 'hsl(200, 95%, 30%)',
    900: 'hsl(200, 95%, 20%)',
    950: 'hsl(200, 95%, 10%)',
  },
  
  // Accent color
  accent: {
    50: 'hsl(45, 100%, 95%)',
    100: 'hsl(45, 100%, 90%)',
    200: 'hsl(45, 100%, 80%)',
    300: 'hsl(45, 100%, 70%)',
    400: 'hsl(45, 100%, 65%)',
    500: 'hsl(45, 100%, 55%)', // Main accent color
    600: 'hsl(45, 100%, 50%)',
    700: 'hsl(45, 100%, 45%)',
    800: 'hsl(45, 100%, 40%)',
    900: 'hsl(45, 100%, 30%)',
    950: 'hsl(45, 100%, 20%)',
  }
} as const

// Semantic Colors
export const SEMANTIC_COLORS = {
  success: {
    50: 'hsl(142, 76%, 95%)',
    100: 'hsl(142, 76%, 90%)',
    200: 'hsl(142, 76%, 80%)',
    300: 'hsl(142, 76%, 70%)',
    400: 'hsl(142, 76%, 50%)',
    500: 'hsl(142, 76%, 36%)', // Main success color
    600: 'hsl(142, 76%, 30%)',
    700: 'hsl(142, 76%, 25%)',
    800: 'hsl(142, 76%, 20%)',
    900: 'hsl(142, 76%, 15%)',
  },
  
  warning: {
    50: 'hsl(38, 92%, 95%)',
    100: 'hsl(38, 92%, 90%)',
    200: 'hsl(38, 92%, 80%)',
    300: 'hsl(38, 92%, 70%)',
    400: 'hsl(38, 92%, 60%)',
    500: 'hsl(38, 92%, 50%)', // Main warning color
    600: 'hsl(38, 92%, 45%)',
    700: 'hsl(38, 92%, 40%)',
    800: 'hsl(38, 92%, 35%)',
    900: 'hsl(38, 92%, 25%)',
  },
  
  error: {
    50: 'hsl(0, 84%, 95%)',
    100: 'hsl(0, 84%, 90%)',
    200: 'hsl(0, 84%, 80%)',
    300: 'hsl(0, 84%, 70%)',
    400: 'hsl(0, 84%, 65%)',
    500: 'hsl(0, 84%, 60%)', // Main error color
    600: 'hsl(0, 84%, 55%)',
    700: 'hsl(0, 84%, 50%)',
    800: 'hsl(0, 84%, 45%)',
    900: 'hsl(0, 84%, 35%)',
  },
  
  info: {
    50: 'hsl(217, 91%, 95%)',
    100: 'hsl(217, 91%, 90%)',
    200: 'hsl(217, 91%, 80%)',
    300: 'hsl(217, 91%, 70%)',
    400: 'hsl(217, 91%, 65%)',
    500: 'hsl(217, 91%, 60%)', // Main info color
    600: 'hsl(217, 91%, 55%)',
    700: 'hsl(217, 91%, 50%)',
    800: 'hsl(217, 91%, 45%)',
    900: 'hsl(217, 91%, 35%)',
  }
} as const

// Typography Scale
export const TYPOGRAPHY = {
  fontSizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
  },
  
  fontWeights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  }
} as const

// Spacing Scale (matches Tailwind but with semantic names)
export const SPACING = {
  none: '0',
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
  '5xl': '8rem',    // 128px
} as const

// Component-specific constants
export const COMPONENT_CONSTANTS = {
  // Timer related
  timer: {
    maxPauseTimeMinutes: 3,
    warningThresholdMinutes: 30,
    criticalThresholdMinutes: 15,
  },
  
  // File upload
  fileUpload: {
    maxFileSizeMB: 50,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  // Animation durations
  animations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  }
} as const

// Breakpoints (matches tailwind.config.js)
export const BREAKPOINTS = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
  '3xl': '1600px',
} as const

// Role-based styling
export const ROLE_COLORS = {
  admin: ARCHITEX_COLORS.primary[500],
  freelancer: SEMANTIC_COLORS.info[500],
  client: ARCHITEX_COLORS.secondary[500],
} as const

// Status colors
export const STATUS_COLORS = {
  active: SEMANTIC_COLORS.success[500],
  inactive: 'hsl(var(--muted-foreground))',
  pending: SEMANTIC_COLORS.warning[500],
  completed: SEMANTIC_COLORS.success[600],
  cancelled: SEMANTIC_COLORS.error[500],
  draft: 'hsl(var(--muted-foreground))',
} as const

// Common CSS-in-JS utility functions
export const getCSSVariable = (variable: string) => `hsl(var(--${variable}))`

export const getArchitexColor = (variant: keyof typeof ARCHITEX_COLORS, shade: keyof typeof ARCHITEX_COLORS.primary = 500) => {
  return ARCHITEX_COLORS[variant][shade]
}

export const getSemanticColor = (variant: keyof typeof SEMANTIC_COLORS, shade: keyof typeof SEMANTIC_COLORS.success = 500) => {
  return SEMANTIC_COLORS[variant][shade]
}

// Common class combinations for reuse
export const COMMON_CLASSES = {
  // Card variants
  card: {
    elevated: 'bg-card border border-border shadow-lg',
    flat: 'bg-card border border-border',
    ghost: 'bg-transparent border-transparent',
  },
  
  // Text variants
  text: {
    title: 'text-2xl font-semibold tracking-tight',
    subtitle: 'text-lg font-medium text-muted-foreground',
    body: 'text-sm text-foreground',
    caption: 'text-xs text-muted-foreground',
    label: 'text-sm font-medium text-foreground',
  },
  
  // Layout
  layout: {
    container: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
    section: 'py-8 lg:py-12',
    grid: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
  },
  
  // Interactive states
  interactive: {
    hover: 'hover:bg-accent hover:text-accent-foreground transition-colors',
    focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  }
} as const
