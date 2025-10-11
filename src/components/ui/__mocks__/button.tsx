// Mock Button component
import React from 'react';

export function Button({
  children,
  onClick,
  disabled,
  className,
  variant,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
      {children}
    </button>
  );
}
