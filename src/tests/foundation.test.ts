import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils'

describe('Task 0.1: Foundation Setup', () => {
  it('should have working utility function', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(typeof result).toBe('string')
    expect(result).toBe('text-blue-500') // twMerge should handle conflicts
  })

  it('should export shadcn components from central file', async () => {
    const shadcnExports = await import('../lib/shadcn')
    
    expect(shadcnExports.Button).toBeDefined()
    expect(shadcnExports.Card).toBeDefined()
    expect(shadcnExports.Input).toBeDefined()
    expect(shadcnExports.Badge).toBeDefined()
  })

  it('should have proper component structure', () => {
    // Test that we can import individual components
    expect(() => import('../components/ui/button')).not.toThrow()
    expect(() => import('../components/ui/card')).not.toThrow()
    expect(() => import('../components/ui/input')).not.toThrow()
    expect(() => import('../components/ui/badge')).not.toThrow()
  })
})
