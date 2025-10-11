import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Hover Scale Component
interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export function HoverScale({ children, scale = 1.02, className = '' }: HoverScaleProps) {
  return (
    <div
      className={cn(
        'transition-transform duration-200 ease-out hover:scale-[var(--scale)]',
        className
      )}
      style={{ '--scale': scale } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Press Feedback Component
interface PressFeedbackProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
  onPress?: () => void;
}

export function PressFeedback({ 
  children, 
  scale = 0.95, 
  className = '',
  onPress
}: PressFeedbackProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'transition-transform duration-100 ease-out active:scale-[var(--scale)]',
        className
      )}
      style={{ '--scale': scale } as React.CSSProperties}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPress?.();
        }
      }}
    >
      {children}
    </div>
  );
}

// Ripple Effect Component
interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function RippleEffect({ children, className = '', color = 'rgba(255, 255, 255, 0.5)' }: RippleEffectProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const createRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  };

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      className={cn('relative overflow-hidden', className)}
      onClick={createRipple}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          createRipple(e as any);
        }
      }}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            backgroundColor: color,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </div>
  );
}

// Magnetic Button Component
interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({ 
  children, 
  strength = 0.3, 
  className = '',
  onClick
}: MagneticButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (event.clientX - centerX) * strength;
    const deltaY = (event.clientY - centerY) * strength;

    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={buttonRef}
      role="button"
      tabIndex={0}
      className={cn('transition-transform duration-200 ease-out', className)}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {children}
    </div>
  );
}

// Floating Label Input
interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FloatingLabelInput({ 
  label, 
  error, 
  className = '',
  ...props 
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const isFloating = isFocused || hasValue;

  return (
    <div className="relative">
      <input
        {...props}
        className={cn(
          'peer w-full px-4 pt-6 pb-2 border rounded-md transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          setHasValue(!!e.target.value);
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          setHasValue(!!e.target.value);
          props.onChange?.(e);
        }}
      />
      <label
        className={cn(
          'absolute left-4 transition-all duration-200 pointer-events-none',
          isFloating
            ? 'top-2 text-xs text-muted-foreground'
            : 'top-1/2 -translate-y-1/2 text-base text-muted-foreground',
          error && 'text-destructive'
        )}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1 text-sm text-destructive animate-slide-down">{error}</p>
      )}
    </div>
  );
}

// Animated Counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  className = '',
  prefix = '',
  suffix = ''
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const difference = value - startValue;

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + difference * easeOut;

      setDisplayValue(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// Stagger Children Container
interface StaggerChildrenProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function StaggerChildren({ children, delay = 0.1, className = '' }: StaggerChildrenProps) {
  return (
    <div className={cn('stagger-children', className)} style={{ '--stagger-delay': `${delay}s` } as React.CSSProperties}>
      {React.Children.map(children, (child, index) => (
        <div style={{ '--index': index } as React.CSSProperties} className="animate-spring-in">
          {child}
        </div>
      ))}
    </div>
  );
}
