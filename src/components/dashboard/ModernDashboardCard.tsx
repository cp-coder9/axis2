import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendData {
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  period?: string;
}

interface ModernDashboardCardProps {
  title: string;
  description?: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: TrendData;
  sparklineData?: number[];
  className?: string;
  loading?: boolean;
  onClick?: () => void;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export function ModernDashboardCard({
  title,
  description,
  value,
  icon: Icon,
  trend,
  sparklineData,
  className,
  loading = false,
  onClick,
  badge
}: ModernDashboardCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Animated counter effect
  useEffect(() => {
    if (loading || typeof value !== 'number') return;

    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, value);
      setAnimatedValue(Math.round(current));

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValue(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, loading]);

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend.changeType) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        'cursor-pointer group',
        loading && 'animate-pulse',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover gradient effect */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
      )} />

      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {badge && (
              <Badge variant={badge.variant || 'default'} className="text-xs">
                {badge.text}
              </Badge>
            )}
            {Icon && (
              <div className={cn(
                'p-2 rounded-lg bg-primary/10 transition-transform duration-300',
                isHovered && 'scale-110'
              )}>
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="space-y-3">
          {/* Main value with animation */}
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-3xl font-bold tracking-tight',
              'transition-all duration-300',
              isHovered && 'text-primary'
            )}>
              {loading ? '...' : typeof value === 'number' ? animatedValue : value}
            </span>
            
            {/* Trend indicator */}
            {trend && !loading && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                getTrendColor(),
                'transition-all duration-300'
              )}>
                {getTrendIcon()}
                <span>{Math.abs(trend.change)}%</span>
                {trend.period && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {trend.period}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sparkline visualization */}
          {sparklineData && sparklineData.length > 0 && !loading && (
            <div className="h-12 w-full">
              <Sparkline data={sparklineData} color="primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Sparkline component for trend visualization
interface SparklineProps {
  data: number[];
  color?: 'primary' | 'success' | 'warning' | 'error';
  height?: number;
}

function Sparkline({ data, color = 'primary', height = 48 }: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((max - value) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const colorMap = {
    primary: 'stroke-primary',
    success: 'stroke-green-500',
    warning: 'stroke-yellow-500',
    error: 'stroke-red-500'
  };

  const fillColorMap = {
    primary: 'fill-primary/10',
    success: 'fill-green-500/10',
    warning: 'fill-yellow-500/10',
    error: 'fill-red-500/10'
  };

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
      style={{ height: `${height}px` }}
    >
      {/* Area fill */}
      <polygon
        points={`0,100 ${points} 100,100`}
        className={cn(fillColorMap[color], 'transition-all duration-300')}
      />
      
      {/* Line */}
      <polyline
        points={points}
        className={cn(
          colorMap[color],
          'fill-none stroke-2 transition-all duration-300',
          'animate-draw-line'
        )}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Animated statistics card with counting animation
interface AnimatedStatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'error';
  trend?: TrendData;
}

export function AnimatedStatCard({
  label,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  color = 'primary',
  trend
}: AnimatedStatCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, value);
      setCount(current);

      if (step >= steps) {
        clearInterval(timer);
        setCount(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const colorMap = {
    primary: 'text-primary',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400'
  };

  const bgColorMap = {
    primary: 'bg-primary/10',
    success: 'bg-green-500/10',
    warning: 'bg-yellow-500/10',
    error: 'bg-red-500/10'
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-300">
      {Icon && (
        <div className={cn('p-3 rounded-full', bgColorMap[color])}>
          <Icon className={cn('h-6 w-6', colorMap[color])} />
        </div>
      )}
      
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={cn('text-2xl font-bold', colorMap[color])}>
            {prefix}{Math.round(count).toLocaleString()}{suffix}
          </p>
          {trend && (
            <span className={cn(
              'text-xs font-medium flex items-center gap-1',
              trend.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.changeType === 'increase' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.change)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
