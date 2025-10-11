// Mock Alert components
import React from 'react';

export function Alert({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  return <div className={className} data-variant={variant}>{children}</div>;
}

export function AlertDescription({
  children
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
