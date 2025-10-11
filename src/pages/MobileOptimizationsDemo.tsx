import React, { useState, useRef, useEffect } from 'react';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { MobileErrorBoundary, MobileErrorToast } from '../components/mobile/MobileErrorBoundary';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Target,
  Gauge
} from 'lucide-react';

export const MobileOptimizationsDemo: React.FC = () => {
  const [items, setItems] = useState<string[]>(
    Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`)
  );
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [touchTargetResults, setTouchTargetResults] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    deviceInfo,
    isOnline,
    touchGesture,
    layoutConfig,
    triggerHapticFeedback,
    validateTouchTargets,
    optimizeScrolling
  } = useMobileOptimization({
    enableTouchGestures: true,
    optimizeImages: true,
    reducedAnimations: false,
    compactLayout: true
  });

  // Optimize scrolling on mount
  useEffect(() => {
    if (containerRef.current) {
      optimizeScrolling(containerRef.current);
    }
  }, [optimizeScrolling]);

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add new items
    setItems(prev => [
      `New Item ${Date.now()}`,
      ...prev
    ]);
    
    triggerHapticFeedback('medium');
  };

  const handleValidateTouchTargets = () => {
    if (containerRef.current) {
      const results = validateTouchTargets(containerRef.current);
      setTouchTargetResults(results);
      triggerHapticFeedback('light');
    }
  };

  const handleTestError = () => {
    setShowErrorToast(true);
    triggerHapticFeedback('heavy');
  };

  return (
    <MobileErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-primary" />
              Mobile Optimizations Demo
            </h1>
          </div>
        </div>

        {/* Device Info Card */}
        <div className="p-4">
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              Device Information
            </h2>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium text-foreground">
                  {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-success" />
                ) : (
                  <WifiOff className="w-4 h-4 text-destructive" />
                )}
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium ${isOnline ? 'text-success' : 'text-destructive'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="col-span-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Viewport:</span>
                <span className="font-medium text-foreground">
                  {deviceInfo.viewportWidth} × {deviceInfo.viewportHeight}
                </span>
              </div>
              
              <div className="col-span-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Orientation:</span>
                <span className="font-medium text-foreground capitalize">
                  {deviceInfo.orientation}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Touch Gesture Info */}
        {touchGesture && (
          <div className="px-4 pb-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-medium text-primary">
                Gesture Detected: {touchGesture.type}
                {touchGesture.direction && ` (${touchGesture.direction})`}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-4 pb-4 space-y-3">
          <button
            onClick={handleValidateTouchTargets}
            className="w-full touch-target-lg flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium shadow-md active:scale-98 transition-transform"
          >
            <Target className="w-5 h-5" />
            Validate Touch Targets
          </button>

          <button
            onClick={handleTestError}
            className="w-full touch-target-lg flex items-center justify-center gap-2 px-4 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium shadow-md active:scale-98 transition-transform"
          >
            <AlertCircle className="w-5 h-5" />
            Test Error Toast
          </button>
        </div>

        {/* Touch Target Validation Results */}
        {touchTargetResults && (
          <div className="px-4 pb-4">
            <div className={`rounded-lg border p-4 ${
              touchTargetResults.isValid 
                ? 'bg-success/10 border-success/20' 
                : 'bg-warning/10 border-warning/20'
            }`}>
              <div className="flex items-start gap-3">
                {touchTargetResults.isValid ? (
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    touchTargetResults.isValid ? 'text-success' : 'text-warning'
                  }`}>
                    {touchTargetResults.isValid 
                      ? 'All touch targets meet WCAG 2.1 AA standards!' 
                      : `Found ${touchTargetResults.issues.length} touch target issues`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Checked {touchTargetResults.totalChecked} interactive elements
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pull-to-Refresh List */}
        <div className="px-4 pb-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Pull to Refresh Demo
          </h2>
          
          <PullToRefresh
            onRefresh={handleRefresh}
            className="bg-card rounded-lg border border-border overflow-hidden"
            config={{
              threshold: 80,
              resistance: 0.5,
              maxPullDistance: 150
            }}
          >
            <div 
              ref={containerRef}
              className="touch-scroll momentum-scroll max-h-96 divide-y divide-border"
            >
              {items.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="touch-feedback p-4 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-foreground font-medium">{item}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tap to interact • Swipe for gestures
                  </p>
                </div>
              ))}
            </div>
          </PullToRefresh>
        </div>

        {/* Layout Config Info */}
        <div className="px-4 pb-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Active Optimizations
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Mobile Layout: {layoutConfig.useMobileLayout ? 'Enabled' : 'Disabled'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Hardware Acceleration: {layoutConfig.useHardwareAcceleration ? 'Enabled' : 'Disabled'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Optimized Scrolling: {layoutConfig.optimizeScrolling ? 'Enabled' : 'Disabled'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Reduced Animations: {layoutConfig.useReducedAnimations ? 'Enabled' : 'Disabled'}
              </li>
            </ul>
          </div>
        </div>

        {/* Error Toast */}
        {showErrorToast && (
          <MobileErrorToast
            message="This is a test error message with retry functionality"
            onRetry={() => {
              setShowErrorToast(false);
              triggerHapticFeedback('light');
            }}
            onDismiss={() => setShowErrorToast(false)}
          />
        )}
      </div>
    </MobileErrorBoundary>
  );
};
