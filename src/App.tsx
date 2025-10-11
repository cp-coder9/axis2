import { useEffect } from 'react'
import Router from './Router'
import './globals.css'
import { initializePerformance, logPageLoadPerformance } from './utils/performance/initializePerformance'

/**
 * Main App component
 * All routing and layout is handled by Router.tsx
 * This file serves as the entry point for the shadcn/ui migrated application
 */
function App() {
  // Initialize performance optimizations on mount
  useEffect(() => {
    initializePerformance()
    logPageLoadPerformance()
  }, [])
  
  return <Router />
}

export default App
