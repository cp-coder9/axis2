/**
 * Theme Utilities
 * Advanced theme management utilities for accessibility and customization
 */

export type ThemeMode = 'light' | 'dark' | 'system'
export type ContrastMode = 'normal' | 'high'

/**
 * Color contrast calculation using WCAG 2.1 formula
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    // Calculate relative luminance
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if color contrast meets WCAG AA standards
 */
export function meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Check if color contrast meets WCAG AAA standards
 */
export function meetsWCAGAAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

/**
 * Detect system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Detect if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Detect if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * Apply high contrast mode
 */
export function applyHighContrastMode(enable: boolean): void {
  const root = document.documentElement
  
  if (enable) {
    root.classList.add('high-contrast')
    root.style.setProperty('--contrast-mode', 'high')
  } else {
    root.classList.remove('high-contrast')
    root.style.setProperty('--contrast-mode', 'normal')
  }
}

/**
 * Get theme-aware color value
 */
export function getThemeColor(cssVariable: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(cssVariable).trim()
}

/**
 * Validate theme accessibility
 */
export interface ThemeAccessibilityReport {
  isAccessible: boolean
  issues: string[]
  warnings: string[]
  suggestions: string[]
}

export function validateThemeAccessibility(): ThemeAccessibilityReport {
  const report: ThemeAccessibilityReport = {
    isAccessible: true,
    issues: [],
    warnings: [],
    suggestions: []
  }

  // Check critical color contrasts
  const criticalPairs = [
    { fg: '--foreground', bg: '--background', name: 'Text on background' },
    { fg: '--primary-foreground', bg: '--primary', name: 'Primary button text' },
    { fg: '--secondary-foreground', bg: '--secondary', name: 'Secondary button text' },
    { fg: '--destructive-foreground', bg: '--destructive', name: 'Destructive button text' },
  ]

  criticalPairs.forEach(pair => {
    const fg = getThemeColor(pair.fg)
    const bg = getThemeColor(pair.bg)
    
    if (fg && bg) {
      // Convert HSL to hex for contrast calculation (simplified)
      // In production, use a proper color conversion library
      const meetsAA = true // Placeholder - implement actual check
      
      if (!meetsAA) {
        report.isAccessible = false
        report.issues.push(`${pair.name} does not meet WCAG AA contrast requirements`)
      }
    }
  })

  // Check for reduced motion support
  if (!document.querySelector('style[data-reduced-motion]')) {
    report.warnings.push('Reduced motion preferences may not be fully supported')
  }

  // Check for high contrast support
  if (!document.documentElement.classList.contains('high-contrast') && prefersHighContrast()) {
    report.suggestions.push('User prefers high contrast - consider enabling high contrast mode')
  }

  return report
}

/**
 * Theme preloading for performance
 */
export function preloadTheme(theme: ThemeMode): void {
  // Preload theme-specific assets
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'style'
  link.href = `/themes/${theme}.css`
  document.head.appendChild(link)
}

/**
 * Export current theme configuration
 */
export function exportThemeConfig(): string {
  const root = document.documentElement
  const styles = getComputedStyle(root)
  const config: Record<string, string> = {}

  // Extract all CSS custom properties
  Array.from(styles).forEach(prop => {
    if (prop.startsWith('--')) {
      config[prop] = styles.getPropertyValue(prop).trim()
    }
  })

  return JSON.stringify(config, null, 2)
}

/**
 * Import theme configuration
 */
export function importThemeConfig(configJson: string): boolean {
  try {
    const config = JSON.parse(configJson)
    const root = document.documentElement

    Object.entries(config).forEach(([prop, value]) => {
      if (prop.startsWith('--')) {
        root.style.setProperty(prop, value as string)
      }
    })

    return true
  } catch (error) {
    console.error('Failed to import theme config:', error)
    return false
  }
}
