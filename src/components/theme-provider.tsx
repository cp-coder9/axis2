import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  enableTransitions?: boolean
  enableKeyboardShortcuts?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'dark' | 'light'
  isTransitioning: boolean
  toggleTheme: () => void
  cycleTheme: () => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light',
  isTransitioning: false,
  toggleTheme: () => null,
  cycleTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'architex-ui-theme',
  enableTransitions = true,
  enableKeyboardShortcuts = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('light')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimeoutRef = useRef<NodeJS.Timeout>()

  // Apply theme with smooth transitions
  const applyTheme = useCallback((newTheme: 'dark' | 'light') => {
    const root = window.document.documentElement

    if (enableTransitions) {
      setIsTransitioning(true)
      
      // Add transition class
      root.style.setProperty('--theme-transition-duration', '300ms')
      root.classList.add('theme-transitioning')
      
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      
      // Remove transition class after animation completes
      transitionTimeoutRef.current = setTimeout(() => {
        root.classList.remove('theme-transitioning')
        setIsTransitioning(false)
      }, 300)
    }

    root.classList.remove('light', 'dark')
    root.classList.add(newTheme)
    setActualTheme(newTheme)

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        newTheme === 'dark' ? '#0a0a0a' : '#ffffff'
      )
    }
  }, [enableTransitions])

  // Handle theme changes
  useEffect(() => {
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      applyTheme(systemTheme)
      return
    }

    applyTheme(theme)
  }, [theme, applyTheme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        applyTheme(systemTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, applyTheme])

  // Keyboard shortcuts (Ctrl+Shift+T to toggle theme)
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault()
        cycleTheme()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, theme])

  // Set theme with validation and persistence
  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme)
      setThemeState(newTheme)
    } catch (error) {
      console.error('Failed to save theme preference:', error)
      // Still apply the theme even if localStorage fails
      setThemeState(newTheme)
    }
  }, [storageKey])

  // Toggle between light and dark (ignores system)
  const toggleTheme = useCallback(() => {
    const newTheme = actualTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [actualTheme, setTheme])

  // Cycle through all theme options: light -> dark -> system
  const cycleTheme = useCallback(() => {
    const themeOrder: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themeOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }, [theme, setTheme])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  const value = {
    theme,
    setTheme,
    actualTheme,
    isTransitioning,
    toggleTheme,
    cycleTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

// Legacy hook for backward compatibility with existing codebase
export const useDarkMode = () => {
  const { setTheme, actualTheme } = useTheme()
  
  return {
    isDarkMode: actualTheme === 'dark',
    toggleDarkMode: () => {
      setTheme(actualTheme === 'dark' ? 'light' : 'dark')
    },
    theme: actualTheme,
    setTheme: (isDark: boolean) => {
      setTheme(isDark ? 'dark' : 'light')
    }
  }
}
