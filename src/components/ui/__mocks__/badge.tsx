// Mock Badge component
import React from 'react';

export function Badge({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  return <span className={className} data-variant={variant}>{children}</span>;
}
