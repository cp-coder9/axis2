// Mock UI components used in CountdownTimer
import { ReactNode } from 'react'

// Button mock
export function Button({ children, onClick, disabled, className }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  )
}

// Card components mocks
export function Card({ children, className }: { 
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>
}

export function CardHeader({ children, className }: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>
}

export function CardTitle({ children, className }: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>
}

export function CardContent({ children, className }: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>
}

// Progress component mock
export function Progress({ value, className }: { 
  value: number;
  className?: string;
}) {
  return <div className={className}>Progress: {value}%</div>
}

// Badge component mock
export function Badge({ children, variant: _variant, className }: { 
  children: ReactNode;
  variant?: string;
  className?: string;
}) {
  return <span className={className}>{children}</span>
}

// Alert components mocks
export function Alert({ children, variant: _variant, className }: { 
  children: ReactNode;
  variant?: string;
  className?: string;
}) {
  return <div className={className}>{children}</div>
}

export function AlertDescription({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}
