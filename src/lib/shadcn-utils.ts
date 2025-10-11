/**
 * Utility classes and functions for consistent shadcn-ui token usage throughout Architex Axis
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Common component class combinations using shadcn-ui tokens
export const shadcnClasses = {
  // Layout & containers
  container: "container mx-auto px-4 sm:px-6 lg:px-8",
  card: "rounded-lg border bg-card text-card-foreground shadow-sm",
  dialog: "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200",
  
  // Links and anchors
  linkBase: "text-foreground hover:text-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
  
  // Background variants
  backgrounds: {
    clean: "bg-background",
    muted: "bg-muted/25",
    accent: "bg-accent/10",
    card: "bg-card"
  },
  
  // Navigation elements
  nav: {
    item: "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
    active: "bg-accent text-accent-foreground",
    link: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    badge: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
  },
  
  // Button variants with shadcn tokens
  button: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", 
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  },
  
  // Form elements
  form: {
    label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    input: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    error: "text-sm font-medium text-destructive"
  },
  
  // Typography using shadcn tokens
  text: {
    muted: "text-muted-foreground",
    primary: "text-foreground", 
    secondary: "text-secondary-foreground",
    destructive: "text-destructive",
    heading: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
    subheading: "scroll-m-20 text-3xl font-semibold tracking-tight",
    large: "text-lg font-semibold",
    small: "text-sm font-medium leading-none",
    muted_small: "text-sm text-muted-foreground"
  },
  
  // Status indicators using Architex brand colors
  status: {
    active: "bg-architex-success text-white",
    pending: "bg-architex-warning text-white", 
    completed: "bg-architex-primary text-white",
    cancelled: "bg-architex-error text-white",
    draft: "bg-muted text-muted-foreground"
  },
  
  // Role-based styling
  role: {
    admin: "border-l-4 border-architex-primary bg-architex-primary/10",
    freelancer: "border-l-4 border-architex-secondary bg-architex-secondary/10", 
    client: "border-l-4 border-architex-accent bg-architex-accent/10"
  },
  
  // Animation classes
  animation: {
    fadeIn: "animate-in fade-in-0 duration-300",
    slideIn: "animate-in slide-in-from-left-4 duration-300",
    slideInRight: "animate-in slide-in-from-right-4 duration-300",
    slideUp: "animate-in slide-in-from-bottom-4 duration-300"
  }
} as const

// Helper functions for dynamic class generation
export const getStatusClasses = (status: 'active' | 'pending' | 'completed' | 'cancelled' | 'draft') => {
  return shadcnClasses.status[status]
}

export const getRoleClasses = (role: 'admin' | 'freelancer' | 'client') => {
  return shadcnClasses.role[role.toLowerCase() as keyof typeof shadcnClasses.role]
}

export const getButtonVariant = (variant: keyof typeof shadcnClasses.button = 'primary') => {
  return shadcnClasses.button[variant]
}

// Common layout patterns
export const layoutPatterns = {
  dashboard: "min-h-screen bg-background",
  project: "min-h-screen bg-muted/25",
  admin: "min-h-screen bg-background border-t-4 border-architex-primary",
  sidebar: "flex h-full w-64 flex-col border-r bg-background",
  header: "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
  content: "flex-1 space-y-4 p-4 md:p-8",
  grid: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
  stack: "flex flex-col space-y-4"
} as const

// Responsive utilities with shadcn design tokens
export const responsive = {
  padding: "px-4 sm:px-6 lg:px-8",
  margin: "mx-4 sm:mx-6 lg:mx-8", 
  text: "text-sm sm:text-base lg:text-lg",
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
  flex: "flex flex-col sm:flex-row gap-4",
  flexCol: "flex flex-col sm:flex-row gap-4",
  hide: {
    mobile: "hidden md:block",
    desktop: "block md:hidden"
  }
} as const

// Accessibility helpers with proper contrast using shadcn tokens
export const a11y = {
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  srOnly: "sr-only",
  skip: "absolute left-[-10000px] top-auto w-1 h-1 overflow-hidden focus:left-6 focus:top-6 focus:w-auto focus:h-auto focus:overflow-visible focus:bg-background focus:text-foreground focus:p-2 focus:rounded-md focus:border focus:z-50"
} as const
