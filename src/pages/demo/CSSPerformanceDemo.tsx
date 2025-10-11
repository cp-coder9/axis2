/**
 * CSS Performance Optimization Demo
 * 
 * Demonstrates all CSS performance optimizations including:
 * - CSS containment
 * - Will-change optimization
 * - Lazy loading with intersection observer
 * - Performance monitoring
 */

import React, { useState } from 'react';
import {
  PerformanceOptimizedCard,
  PerformanceOptimizedList,
  PerformanceOptimizedTable,
} from '../../components/performance/PerformanceOptimizedCard';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  measureCSSPerformance,
  willChangeManager,
} from '../../utils/performance/cssOptimization';
import { mark, measure } from '../../utils/performance/initializePerformance';

export default function CSSPerformanceDemo() {
  const [metrics, setMetrics] = useState<any>(null);
  const [animating, setAnimating] = useState(false);
  
  const handleMeasurePerformance = () => {
    mark('measure-start');
    const perfMetrics = measureCSSPerformance();
    mark('measure-end');
    measure('CSS Performance Measurement', 'measure-start', 'measure-end');
    setMetrics(perfMetrics);
  };
  
  const handleTestAnimation = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1000);
  };
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">CSS Performance Optimization Demo</h1>
        <p className="text-muted-foreground">
          Explore the CSS performance optimizations implemented in the application
        </p>
      </div>
      
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Measure current CSS performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleMeasurePerformance}>
            Measure CSS Performance
          </Button>
          
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Stylesheets"
                value={metrics.stylesheetCount}
                unit=""
              />
              <MetricCard
                label="CSS Rules"
                value={metrics.ruleCount}
                unit=""
              />
              <MetricCard
                label="Custom Properties"
                value={metrics.customPropertyCount}
                unit=""
              />
              <MetricCard
                label="Analysis Time"
                value={metrics.loadTime.toFixed(2)}
                unit="ms"
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* CSS Containment Demo */}
      <Card>
        <CardHeader>
          <CardTitle>CSS Containment</CardTitle>
          <CardDescription>
            Components with CSS containment for improved rendering performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PerformanceOptimizedCard containment="layout">
              <div className="p-4 space-y-2">
                <Badge>layout</Badge>
                <h3 className="font-semibold">Layout Containment</h3>
                <p className="text-sm text-muted-foreground">
                  Isolates layout calculations from the rest of the page
                </p>
              </div>
            </PerformanceOptimizedCard>
            
            <PerformanceOptimizedCard containment="paint">
              <div className="p-4 space-y-2">
                <Badge>paint</Badge>
                <h3 className="font-semibold">Paint Containment</h3>
                <p className="text-sm text-muted-foreground">
                  Isolates paint operations for better performance
                </p>
              </div>
            </PerformanceOptimizedCard>
            
            <PerformanceOptimizedCard containment="layout paint">
              <div className="p-4 space-y-2">
                <Badge>layout paint</Badge>
                <h3 className="font-semibold">Combined Containment</h3>
                <p className="text-sm text-muted-foreground">
                  Best for dashboard cards and complex components
                </p>
              </div>
            </PerformanceOptimizedCard>
          </div>
        </CardContent>
      </Card>
      
      {/* Will-Change Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Will-Change Optimization</CardTitle>
          <CardDescription>
            Hardware-accelerated animations with will-change hints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTestAnimation}>
            Test Animation
          </Button>
          
          <div
            className={`
              p-8 bg-gradient-to-r from-primary to-secondary rounded-lg
              transition-all duration-500
              ${animating ? 'scale-110 rotate-3' : 'scale-100 rotate-0'}
            `}
            style={{
              willChange: animating ? 'transform' : 'auto',
            }}
          >
            <p className="text-primary-foreground text-center font-semibold">
              {animating ? 'Animating with will-change!' : 'Click button to animate'}
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>
              The will-change property is applied during animation and removed after,
              ensuring optimal performance without memory overhead.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Lazy Loading Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Lazy Loading with Intersection Observer</CardTitle>
          <CardDescription>
            Components load only when they enter the viewport
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <PerformanceOptimizedCard
                key={i}
                lazyLoad
                onVisible={() => console.log(`Card ${i + 1} is now visible`)}
              >
                <div className="p-4">
                  <h3 className="font-semibold">Lazy Loaded Card {i + 1}</h3>
                  <p className="text-sm text-muted-foreground">
                    This card was loaded when it entered the viewport
                  </p>
                </div>
              </PerformanceOptimizedCard>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Optimized List Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Optimized List</CardTitle>
          <CardDescription>
            Lists with content containment for better performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceOptimizedList>
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <p className="font-medium">List Item {i + 1}</p>
                <p className="text-sm text-muted-foreground">
                  Optimized with CSS containment
                </p>
              </div>
            ))}
          </PerformanceOptimizedList>
        </CardContent>
      </Card>
      
      {/* Optimized Table Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Optimized Table</CardTitle>
          <CardDescription>
            Tables with strict containment for maximum performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceOptimizedTable>
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Performance</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => (
                <tr key={i} className="border-b hover:bg-muted/50">
                  <td className="p-2">Component {i + 1}</td>
                  <td className="p-2">
                    <Badge variant="outline">Optimized</Badge>
                  </td>
                  <td className="p-2">
                    <span className="text-green-600">✓ Fast</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </PerformanceOptimizedTable>
        </CardContent>
      </Card>
      
      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
          <CardDescription>
            Guidelines for optimal CSS performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <BestPractice
              title="Use CSS Containment"
              description="Apply containment to complex, independent components like cards, modals, and tables"
              type="do"
            />
            <BestPractice
              title="Apply Will-Change Temporarily"
              description="Only use will-change during animations, remove it after completion"
              type="do"
            />
            <BestPractice
              title="Lazy Load Below-the-Fold"
              description="Use intersection observer to load content only when needed"
              type="do"
            />
            <BestPractice
              title="Don't Overuse Will-Change"
              description="Applying will-change to too many elements can hurt performance"
              type="dont"
            />
            <BestPractice
              title="Don't Animate Expensive Properties"
              description="Avoid animating width, height, top, left - use transform instead"
              type="dont"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function BestPractice({
  title,
  description,
  type,
}: {
  title: string;
  description: string;
  type: 'do' | 'dont';
}) {
  return (
    <div className="flex gap-3">
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
        type === 'do' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {type === 'do' ? '✓' : '✗'}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
