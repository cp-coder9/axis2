import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: ReactNode
  className?: string
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4',
      className
    )}>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
