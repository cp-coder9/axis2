import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Eye,
  Accessibility,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings
} from "lucide-react";
import { InteractiveTooltip } from './ChartTooltipSystem';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Accessibility configuration interface
export interface ChartAccessibilityConfig {
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableAudioDescription: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  announcementSpeed: number;
  autoPlayInterval: number;
}

// ARIA live region types
type AriaLiveType = 'off' | 'polite' | 'assertive';

// Chart accessibility hook
export const useChartAccessibility = (
  data: any[],
  config: Record<string, any>,
  initialConfig: Partial<ChartAccessibilityConfig> = {}
) => {
  const [accessibilityConfig, setAccessibilityConfig] = useState<ChartAccessibilityConfig>({
    enableScreenReader: true,
    enableKeyboardNavigation: true,
    enableAudioDescription: false,
    enableHighContrast: false,
    enableReducedMotion: false,
    announcementSpeed: 1,
    autoPlayInterval: 2000,
    ...initialConfig,
  });

  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  const [currentSeriesIndex, setCurrentSeriesIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announcementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.current = window.speechSynthesis;
    }
  }, []);

  // Data series information
  const dataSeries = Object.keys(config);
  const maxDataIndex = data.length - 1;
  const maxSeriesIndex = dataSeries.length - 1;

  // Generate accessible description for current data point
  const generateDataDescription = useCallback((dataIndex: number, seriesIndex: number) => {
    if (!data[dataIndex] || !dataSeries[seriesIndex]) return '';

    const dataPoint = data[dataIndex];
    const seriesKey = dataSeries[seriesIndex];
    const seriesLabel = config[seriesKey]?.label || seriesKey;
    const value = dataPoint[seriesKey];

    return `${seriesLabel}: ${value} for ${dataPoint.name || `item ${dataIndex + 1}`}`;
  }, [data, dataSeries, config]);

  // Announce data point information
  const announceDataPoint = useCallback((
    dataIndex: number, 
    seriesIndex: number, 
    liveType: AriaLiveType = 'polite'
  ) => {
    if (!accessibilityConfig.enableScreenReader) return;

    const description = generateDataDescription(dataIndex, seriesIndex);
    if (!description) return;

    // Update ARIA live region
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', liveType);
      announcementRef.current.textContent = description;
    }

    // Add to announcements history
    setAnnouncements(prev => [...prev.slice(-4), description]);

    // Speech synthesis (if enabled)
    if (accessibilityConfig.enableAudioDescription && speechSynthesis.current) {
      speechSynthesis.current.cancel(); // Cancel any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(description);
      utterance.rate = accessibilityConfig.announcementSpeed;
      utterance.volume = 0.8;
      
      speechSynthesis.current.speak(utterance);
    }
  }, [accessibilityConfig, generateDataDescription]);

  // Navigation functions
  const navigateToDataPoint = useCallback((dataIndex: number, seriesIndex?: number) => {
    const newDataIndex = Math.max(0, Math.min(dataIndex, maxDataIndex));
    const newSeriesIndex = seriesIndex !== undefined 
      ? Math.max(0, Math.min(seriesIndex, maxSeriesIndex))
      : currentSeriesIndex;

    setCurrentDataIndex(newDataIndex);
    setCurrentSeriesIndex(newSeriesIndex);
    announceDataPoint(newDataIndex, newSeriesIndex);
  }, [maxDataIndex, maxSeriesIndex, currentSeriesIndex, announceDataPoint]);

  const navigateNext = useCallback(() => {
    if (currentDataIndex < maxDataIndex) {
      navigateToDataPoint(currentDataIndex + 1);
    } else if (currentSeriesIndex < maxSeriesIndex) {
      navigateToDataPoint(0, currentSeriesIndex + 1);
    }
  }, [currentDataIndex, currentSeriesIndex, maxDataIndex, maxSeriesIndex, navigateToDataPoint]);

  const navigatePrevious = useCallback(() => {
    if (currentDataIndex > 0) {
      navigateToDataPoint(currentDataIndex - 1);
    } else if (currentSeriesIndex > 0) {
      navigateToDataPoint(maxDataIndex, currentSeriesIndex - 1);
    }
  }, [currentDataIndex, currentSeriesIndex, maxDataIndex, navigateToDataPoint]);

  const navigateToSeries = useCallback((seriesIndex: number) => {
    navigateToDataPoint(currentDataIndex, seriesIndex);
  }, [currentDataIndex, navigateToDataPoint]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      if (currentDataIndex < maxDataIndex) {
        navigateToDataPoint(currentDataIndex + 1);
      } else if (currentSeriesIndex < maxSeriesIndex) {
        navigateToDataPoint(0, currentSeriesIndex + 1);
      } else {
        setIsAutoPlaying(false); // Stop at the end
      }
    }, accessibilityConfig.autoPlayInterval);

    return () => clearInterval(interval);
  }, [
    isAutoPlaying, 
    currentDataIndex, 
    currentSeriesIndex, 
    maxDataIndex, 
    maxSeriesIndex, 
    accessibilityConfig.autoPlayInterval,
    navigateToDataPoint
  ]);

  // Keyboard navigation
  useEffect(() => {
    if (!accessibilityConfig.enableKeyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!chartRef.current?.contains(document.activeElement)) return;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          navigateNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          navigatePrevious();
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (currentSeriesIndex > 0) {
            navigateToSeries(currentSeriesIndex - 1);
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (currentSeriesIndex < maxSeriesIndex) {
            navigateToSeries(currentSeriesIndex + 1);
          }
          break;
        case 'Home':
          event.preventDefault();
          navigateToDataPoint(0, 0);
          break;
        case 'End':
          event.preventDefault();
          navigateToDataPoint(maxDataIndex, maxSeriesIndex);
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          announceDataPoint(currentDataIndex, currentSeriesIndex, 'assertive');
          break;
        case 'p':
        case 'P':
          event.preventDefault();
          setIsAutoPlaying(!isAutoPlaying);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    accessibilityConfig.enableKeyboardNavigation,
    currentDataIndex,
    currentSeriesIndex,
    maxDataIndex,
    maxSeriesIndex,
    isAutoPlaying,
    navigateNext,
    navigatePrevious,
    navigateToSeries,
    navigateToDataPoint,
    announceDataPoint,
  ]);

  // Generate chart summary for screen readers
  const generateChartSummary = useCallback(() => {
    const totalDataPoints = data.length;
    const totalSeries = dataSeries.length;
    const seriesNames = dataSeries.map(key => config[key]?.label || key).join(', ');
    
    return `Chart with ${totalSeries} data series: ${seriesNames}. ` +
           `Contains ${totalDataPoints} data points. ` +
           `Use arrow keys to navigate, Enter to announce current value, P to toggle auto-play.`;
  }, [data.length, dataSeries, config]);

  return {
    accessibilityConfig,
    setAccessibilityConfig,
    currentDataIndex,
    currentSeriesIndex,
    isAutoPlaying,
    setIsAutoPlaying,
    announcements,
    chartRef,
    announcementRef,
    navigateToDataPoint,
    navigateNext,
    navigatePrevious,
    navigateToSeries,
    announceDataPoint,
    generateChartSummary,
    generateDataDescription,
  };
};

// Accessibility controls component
interface ChartAccessibilityControlsProps {
  config: ChartAccessibilityConfig;
  onConfigChange: (config: ChartAccessibilityConfig) => void;
  isAutoPlaying: boolean;
  onAutoPlayToggle: () => void;
  onNavigate: (direction: 'prev' | 'next' | 'home' | 'end') => void;
  currentPosition: { dataIndex: number; seriesIndex: number };
  maxPosition: { dataIndex: number; seriesIndex: number };
  className?: string;
}

export const ChartAccessibilityControls: React.FC<ChartAccessibilityControlsProps> = ({
  config,
  onConfigChange,
  isAutoPlaying,
  onAutoPlayToggle,
  onNavigate,
  currentPosition,
  maxPosition,
  className = '',
}) => {
  const updateConfig = (updates: Partial<ChartAccessibilityConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const progress = maxPosition.dataIndex > 0 
    ? (currentPosition.dataIndex / maxPosition.dataIndex) * 100 
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Accessibility className="w-4 h-4" />
          Accessibility Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Navigation Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Navigation</Label>
          
          <div className="flex items-center gap-2">
            <InteractiveTooltip content="Go to beginning">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('home')}
                className="h-8 w-8 p-0"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
            
            <InteractiveTooltip content="Previous data point">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('prev')}
                disabled={currentPosition.dataIndex === 0 && currentPosition.seriesIndex === 0}
                className="h-8 w-8 p-0"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
            
            <InteractiveTooltip content={isAutoPlaying ? "Pause auto-play" : "Start auto-play"}>
              <Button
                variant={isAutoPlaying ? "default" : "outline"}
                size="sm"
                onClick={onAutoPlayToggle}
                className="h-8 w-8 p-0"
              >
                {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </InteractiveTooltip>
            
            <InteractiveTooltip content="Next data point">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('next')}
                disabled={
                  currentPosition.dataIndex === maxPosition.dataIndex && 
                  currentPosition.seriesIndex === maxPosition.seriesIndex
                }
                className="h-8 w-8 p-0"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
            
            <InteractiveTooltip content="Go to end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('end')}
                className="h-8 w-8 p-0"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
          </div>

          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Position: {currentPosition.dataIndex + 1} / {maxPosition.dataIndex + 1}</span>
              <span>Series: {currentPosition.seriesIndex + 1} / {maxPosition.seriesIndex + 1}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Accessibility Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Settings</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="screen-reader" className="text-sm">Screen Reader</Label>
              <Switch
                id="screen-reader"
                checked={config.enableScreenReader}
                onCheckedChange={(checked) => updateConfig({ enableScreenReader: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="keyboard-nav" className="text-sm">Keyboard Navigation</Label>
              <Switch
                id="keyboard-nav"
                checked={config.enableKeyboardNavigation}
                onCheckedChange={(checked) => updateConfig({ enableKeyboardNavigation: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="audio-desc" className="text-sm">Audio Description</Label>
              <Switch
                id="audio-desc"
                checked={config.enableAudioDescription}
                onCheckedChange={(checked) => updateConfig({ enableAudioDescription: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="high-contrast" className="text-sm">High Contrast</Label>
              <Switch
                id="high-contrast"
                checked={config.enableHighContrast}
                onCheckedChange={(checked) => updateConfig({ enableHighContrast: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="reduced-motion" className="text-sm">Reduced Motion</Label>
              <Switch
                id="reduced-motion"
                checked={config.enableReducedMotion}
                onCheckedChange={(checked) => updateConfig({ enableReducedMotion: checked })}
              />
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        {config.enableAudioDescription && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Audio Settings</Label>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Speech Speed</Label>
                <Badge variant="outline" className="text-xs">
                  {config.announcementSpeed}x
                </Badge>
              </div>
              <Slider
                value={[config.announcementSpeed]}
                onValueChange={([value]) => updateConfig({ announcementSpeed: value })}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto-play Speed</Label>
                <Badge variant="outline" className="text-xs">
                  {config.autoPlayInterval}ms
                </Badge>
              </div>
              <Slider
                value={[config.autoPlayInterval]}
                onValueChange={([value]) => updateConfig({ autoPlayInterval: value })}
                min={500}
                max={5000}
                step={100}
                className="w-full"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ARIA live region component
interface AriaLiveRegionProps {
  children: React.ReactNode;
  level?: AriaLiveType;
  atomic?: boolean;
  className?: string;
}

export const AriaLiveRegion: React.FC<AriaLiveRegionProps> = ({
  children,
  level = 'polite',
  atomic = true,
  className = '',
}) => {
  return (
    <div
      aria-live={level}
      aria-atomic={atomic}
      className={`sr-only ${className}`}
    >
      {children}
    </div>
  );
};

// Screen reader only content component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span className="sr-only">{children}</span>;
};