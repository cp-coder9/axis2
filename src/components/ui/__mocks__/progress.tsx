// Mock Progress component
import React from 'react';

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return <div className={className} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>Progress: {value}%</div>;
}
