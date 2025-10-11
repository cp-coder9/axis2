// Chart components
export { default as AccessibleChart } from './AccessibleChart';
export { default as InteractiveChart } from './InteractiveChart';
export { default as InteractiveChartDemo } from './InteractiveChartDemo';
export { default as EnhancedShadcnChart } from './EnhancedShadcnChart';

// Chart systems
export {
  ChartZoomPanControls,
  ZoomPanChartContainer,
  useChartZoomPan,
  type ZoomState,
} from './ChartZoomPanSystem';

export {
  EnhancedChartTooltip,
  InteractiveTooltip,
  InteractiveLegend,
  DataPointHighlight,
  type ChartTooltipData,
  type DataPointHighlight as DataPointHighlightType,
} from './ChartTooltipSystem';

export {
  SelectionToolbar,
  EnhancedTooltip,
  SelectionInfo,
  DomainSelector,
  useChartInteractiveFeatures,
  type SelectionMode,
  type DataSelection,
  type EnhancedTooltipData,
} from './ChartInteractiveFeatures';

// Chart theme
export {
  ChartThemeProvider,
  useChartTheme,
  transformChartDataWithTheme,
  type ChartThemeConfig,
} from './ChartThemeProvider';

// Re-export shadcn/ui ChartConfig type for backward compatibility
export type { ChartConfig } from '@/components/ui/chart';