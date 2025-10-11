// Mock TimerIcon component
import React from 'react';

export function Play({ className, ...props }) {
  return <svg className={className} {...props} data-testid="play-icon" />;
}

export function Pause({ className, ...props }) {
  return <svg className={className} {...props} data-testid="pause-icon" />;
}

export function Square({ className, ...props }) {
  return <svg className={className} {...props} data-testid="square-icon" />;
}

export function AlertCircle({ className, ...props }) {
  return <svg className={className} {...props} data-testid="alert-circle-icon" />;
}

export function Clock({ className, ...props }) {
  return <svg className={className} {...props} data-testid="clock-icon" />;
}

export function TimerIcon({ className, ...props }) {
  return <svg className={className} {...props} data-testid="timer-icon" />;
}
