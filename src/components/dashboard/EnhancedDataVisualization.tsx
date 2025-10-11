import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles, Trophy, Target } from 'lucide-react';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  milestone?: number;
  celebrateOnComplete?: boolean;
  className?: string;
}

export function AnimatedProgress({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'primary',
  milestone,
  celebrateOnComplete = true,
  className
}: AnimatedProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = percentage / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, percentage);
      setAnimatedValue(current);

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValue(percentage);
        
        // Trigger celebration if at milestone or complete
        if (celebrateOnComplete && (percentage >= 100 || (milestone && percentage >= milestone))) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2000);
        }
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [percentage, milestone, celebrateOnComplete]);

  const colorMap = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const isMilestoneReached = milestone && animatedValue >= milestone;
  const isComplete = animatedValue >= 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
        )}
        {showPercentage && (
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-semibold transition-colors duration-300',
              isComplete && 'text-green-600 dark:text-green-400'
            )}>
              {Math.round(animatedValue)}%
            </span>
            {showCelebration && (
              <Sparkles className="h-4 w-4 text-yellow-500 animate-bounce" />
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <Progress 
          value={animatedValue} 
          className={cn(
            'h-2 transition-all duration-300',
            showCelebration && 'animate-pulse'
          )}
        />
        
        {/* Milestone indicator */}
        {milestone && (
          <div
            className="absolute top-0 h-2 w-0.5 bg-yellow-500"
            style={{ left: `${milestone}%` }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4">
              <Target className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
        )}

        {/* Celebration effect */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-yellow-500 animate-bounce" />
          </div>
        )}
      </div>

      {/* Milestone message */}
      {isMilestoneReached && !isComplete && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 animate-fade-in">
          Milestone reached! 🎯
        </p>
      )}
      
      {isComplete && (
        <p className="text-xs text-green-600 dark:text-green-400 animate-fade-in">
          Complete! 🎉
        </p>
      )}
    </div>
  );
}

// Interactive chart tooltip component
interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any) => string;
}

export function InteractiveChartTooltip({
  active,
  payload,
  label,
  formatter
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <Card className="shadow-lg border-2 animate-scale-in">
      <CardContent className="p-3 space-y-2">
        {label && (
          <p className="text-sm font-semibold text-foreground">{label}</p>
        )}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-semibold">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Real-time update animation component
interface RealTimeValueProps {
  value: number;
  previousValue?: number;
  label: string;
  formatter?: (value: number) => string;
  updateInterval?: number;
}

export function RealTimeValue({
  value,
  previousValue,
  label,
  formatter = (v) => v.toString(),
  updateInterval = 3000
}: RealTimeValueProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showChange, setShowChange] = useState(false);

  useEffect(() => {
    if (previousValue !== undefined && value !== previousValue) {
      setIsUpdating(true);
      setShowChange(true);

      // Animate to new value
      const duration = 500;
      const steps = 30;
      const increment = (value - previousValue) / steps;
      let current = previousValue;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current += increment;
        setDisplayValue(current);

        if (step >= steps) {
          clearInterval(timer);
          setDisplayValue(value);
          setIsUpdating(false);
          setTimeout(() => setShowChange(false), 2000);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, previousValue]);

  const change = previousValue !== undefined ? value - previousValue : 0;
  const isIncrease = change > 0;

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={cn(
          'text-2xl font-bold transition-all duration-300',
          isUpdating && 'text-primary animate-pulse'
        )}>
          {formatter(Math.round(displayValue))}
        </span>
        
        {showChange && change !== 0 && (
          <Badge
            variant={isIncrease ? 'default' : 'destructive'}
            className="animate-slide-in-right"
          >
            {isIncrease ? '+' : ''}{formatter(Math.round(change))}
          </Badge>
        )}
      </div>
    </div>
  );
}

// Visual comparison tool
interface ComparisonBarProps {
  items: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  max?: number;
  showValues?: boolean;
}

export function ComparisonBar({
  items,
  max,
  showValues = true
}: ComparisonBarProps) {
  const maxValue = max || Math.max(...items.map(item => item.value));
  const [animatedItems, setAnimatedItems] = useState(items.map(item => ({ ...item, animatedValue: 0 })));

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);

      setAnimatedItems(items.map(item => ({
        ...item,
        animatedValue: item.value * progress
      })));

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedItems(items.map(item => ({ ...item, animatedValue: item.value })));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [items]);

  return (
    <div className="space-y-3">
      {animatedItems.map((item, index) => {
        const percentage = (item.animatedValue / maxValue) * 100;
        
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.label}</span>
              {showValues && (
                <span className="text-sm text-muted-foreground">
                  {Math.round(item.animatedValue).toLocaleString()}
                </span>
              )}
            </div>
            <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-lg transition-all duration-300',
                  'bg-gradient-to-r from-primary to-primary/80'
                )}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Chart loading state component
export function ChartLoadingState() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 bg-muted rounded flex-1 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart error state with retry
interface ChartErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ChartErrorState({ error, onRetry }: ChartErrorStateProps) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="p-6 text-center space-y-4">
        <div className="text-destructive">
          <svg
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-destructive">Failed to load chart</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        )}
      </CardContent>
    </Card>
  );
}
