/**
 * Dashboard Analytics System
 * 
 * Provides comprehensive analytics for dashboard usage, widget performance,
 * user interactions, and optimization recommendations.
 * 
 * This utility complements the dashboardAnalyticsService by providing
 * client-side analytics processing and visualization helpers.
 */

import { DashboardWidget, WidgetLayout } from '../types/dashboard';
import {
  DashboardAnalytics,
  WidgetPerformanceMetrics,
  OptimizationSuggestion,
  WidgetInteraction
} from '../services/dashboardAnalyticsService';

/**
 * Calculates widget usage score based on multiple factors
 */
export const calculateWidgetUsageScore = (
  widget: DashboardWidget,
  analytics: DashboardAnalytics
): number => {
  const widgetAnalytics = analytics.widgetPerformance.find(
    (w) => w.widgetId === widget.id
  );

  if (!widgetAnalytics) return 0;

  // Factors: view count (40%), interaction count (30%), low error rate (20%), fast load time (10%)
  const viewScore = Math.min((widgetAnalytics.viewCount / analytics.totalSessions) * 100, 100) * 0.4;
  const interactionScore = Math.min((widgetAnalytics.interactionCount / analytics.totalInteractions) * 100, 100) * 0.3;
  const errorScore = (100 - widgetAnalytics.errorRate) * 0.2;
  const performanceScore = Math.max(0, (1 - widgetAnalytics.loadTime / 5000) * 100) * 0.1;

  return Math.round(viewScore + interactionScore + errorScore + performanceScore);
};

/**
 * Identifies widgets that need attention
 */
export const identifyProblematicWidgets = (
  analytics: DashboardAnalytics
): Array<{ widgetId: string; widgetTitle: string; issues: string[] }> => {
  const problematicWidgets: Array<{ widgetId: string; widgetTitle: string; issues: string[] }> = [];

  analytics.widgetPerformance.forEach((widget) => {
    const issues: string[] = [];

    if (widget.loadTime > 3000) {
      issues.push('Slow loading (>3s)');
    }

    if (widget.errorRate > 15) {
      issues.push(`High error rate (${widget.errorRate.toFixed(1)}%)`);
    }

    if (widget.viewCount < analytics.totalSessions * 0.1) {
      issues.push('Low usage');
    }

    if (widget.interactionCount < 5) {
      issues.push('Low engagement');
    }

    if (issues.length > 0) {
      problematicWidgets.push({
        widgetId: widget.widgetId,
        widgetTitle: widget.widgetTitle,
        issues
      });
    }
  });

  return problematicWidgets;
};

/**
 * Generates widget placement recommendations based on usage patterns
 */
export const generatePlacementRecommendations = (
  analytics: DashboardAnalytics,
  currentLayout: WidgetLayout[]
): Array<{ widgetId: string; recommendation: string; reason: string }> => {
  const recommendations: Array<{ widgetId: string; recommendation: string; reason: string }> = [];

  // Recommend moving most-used widgets to top-left
  const topUsedWidgets = analytics.mostUsedWidgets.slice(0, 3);
  topUsedWidgets.forEach((widget, index) => {
    const currentWidget = currentLayout.find((w) => w.id === widget.widgetId);
    if (currentWidget && (currentWidget.y > 2 || currentWidget.x > 2)) {
      recommendations.push({
        widgetId: widget.widgetId,
        recommendation: `Move to position (${index}, 0)`,
        reason: `High usage widget (${widget.usageCount} interactions) should be more accessible`
      });
    }
  });

  // Recommend hiding or repositioning least-used widgets
  const leastUsedWidgets = analytics.leastUsedWidgets.filter((w) => w.usageCount < 3);
  leastUsedWidgets.forEach((widget) => {
    recommendations.push({
      widgetId: widget.widgetId,
      recommendation: 'Consider hiding or moving to bottom',
      reason: `Very low usage (${widget.usageCount} interactions)`
    });
  });

  return recommendations;
};

/**
 * Calculates dashboard health score (0-100)
 */
export const calculateDashboardHealthScore = (analytics: DashboardAnalytics): number => {
  // Factors: low error frequency (30%), good performance (25%), high engagement (25%), optimal layout (20%)
  const errorScore = Math.max(0, (1 - analytics.errorFrequency / 10) * 100) * 0.3;
  
  const avgLoadTime = analytics.widgetPerformance.reduce((sum, w) => sum + w.loadTime, 0) / 
    analytics.widgetPerformance.length || 0;
  const performanceScore = Math.max(0, (1 - avgLoadTime / 5000) * 100) * 0.25;
  
  const engagementScore = Math.min((analytics.totalInteractions / (analytics.totalSessions * 10)) * 100, 100) * 0.25;
  
  const layoutScore = Math.max(0, (1 - analytics.layoutChangeFrequency / 20) * 100) * 0.2;

  return Math.round(errorScore + performanceScore + engagementScore + layoutScore);
};

/**
 * Formats analytics data for chart visualization
 */
export const formatAnalyticsForChart = (analytics: DashboardAnalytics) => {
  return {
    widgetUsage: analytics.mostUsedWidgets.map((w) => ({
      name: w.widgetTitle,
      value: w.usageCount,
      percentage: w.percentage
    })),
    widgetPerformance: analytics.widgetPerformance.map((w) => ({
      name: w.widgetTitle,
      loadTime: w.loadTime,
      errorRate: w.errorRate,
      viewCount: w.viewCount
    })),
    deviceDistribution: [
      { name: 'Desktop', value: analytics.deviceDistribution.desktop },
      { name: 'Tablet', value: analytics.deviceDistribution.tablet },
      { name: 'Mobile', value: analytics.deviceDistribution.mobile }
    ],
    peakUsage: analytics.peakUsageHours.map((hour) => ({
      hour: `${hour}:00`,
      value: hour
    }))
  };
};

/**
 * Generates a summary report of dashboard analytics
 */
export const generateAnalyticsSummary = (analytics: DashboardAnalytics): string => {
  const healthScore = calculateDashboardHealthScore(analytics);
  const problematicWidgets = identifyProblematicWidgets(analytics);
  
  let summary = `Dashboard Analytics Summary (${analytics.period})\n\n`;
  summary += `Health Score: ${healthScore}/100\n`;
  summary += `Total Sessions: ${analytics.totalSessions}\n`;
  summary += `Average Session Duration: ${Math.floor(analytics.averageSessionDuration / 60)} minutes\n`;
  summary += `Total Interactions: ${analytics.totalInteractions}\n\n`;
  
  summary += `Top Performing Widgets:\n`;
  analytics.mostUsedWidgets.slice(0, 3).forEach((w, i) => {
    summary += `${i + 1}. ${w.widgetTitle} (${w.usageCount} uses, ${w.percentage.toFixed(1)}%)\n`;
  });
  
  if (problematicWidgets.length > 0) {
    summary += `\nWidgets Needing Attention:\n`;
    problematicWidgets.forEach((w) => {
      summary += `- ${w.widgetTitle}: ${w.issues.join(', ')}\n`;
    });
  }
  
  summary += `\nPeak Usage Hours: ${analytics.peakUsageHours.map(h => `${h}:00`).join(', ')}\n`;
  summary += `Device Distribution: Desktop ${analytics.deviceDistribution.desktop}, `;
  summary += `Tablet ${analytics.deviceDistribution.tablet}, Mobile ${analytics.deviceDistribution.mobile}\n`;
  
  return summary;
};

/**
 * Compares analytics between two periods
 */
export const compareAnalyticsPeriods = (
  current: DashboardAnalytics,
  previous: DashboardAnalytics
) => {
  return {
    sessionChange: {
      value: current.totalSessions - previous.totalSessions,
      percentage: ((current.totalSessions - previous.totalSessions) / previous.totalSessions) * 100
    },
    durationChange: {
      value: current.averageSessionDuration - previous.averageSessionDuration,
      percentage: ((current.averageSessionDuration - previous.averageSessionDuration) / 
        previous.averageSessionDuration) * 100
    },
    interactionChange: {
      value: current.totalInteractions - previous.totalInteractions,
      percentage: ((current.totalInteractions - previous.totalInteractions) / 
        previous.totalInteractions) * 100
    },
    errorChange: {
      value: current.errorFrequency - previous.errorFrequency,
      percentage: ((current.errorFrequency - previous.errorFrequency) / 
        previous.errorFrequency) * 100
    }
  };
};

/**
 * Filters optimization suggestions by severity
 */
export const filterSuggestionsBySeverity = (
  suggestions: OptimizationSuggestion[],
  severity: 'low' | 'medium' | 'high'
): OptimizationSuggestion[] => {
  return suggestions.filter((s) => s.severity === severity);
};

/**
 * Groups optimization suggestions by type
 */
export const groupSuggestionsByType = (
  suggestions: OptimizationSuggestion[]
): Record<string, OptimizationSuggestion[]> => {
  return suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = [];
    }
    acc[suggestion.type].push(suggestion);
    return acc;
  }, {} as Record<string, OptimizationSuggestion[]>);
};

/**
 * Calculates widget engagement rate
 */
export const calculateWidgetEngagementRate = (
  widgetId: string,
  analytics: DashboardAnalytics
): number => {
  const widgetPerf = analytics.widgetPerformance.find((w) => w.widgetId === widgetId);
  if (!widgetPerf || widgetPerf.viewCount === 0) return 0;

  return (widgetPerf.interactionCount / widgetPerf.viewCount) * 100;
};

/**
 * Identifies trending widgets (increasing usage)
 */
export const identifyTrendingWidgets = (
  currentAnalytics: DashboardAnalytics,
  previousAnalytics: DashboardAnalytics
): Array<{ widgetId: string; widgetTitle: string; trend: number }> => {
  const trending: Array<{ widgetId: string; widgetTitle: string; trend: number }> = [];

  currentAnalytics.mostUsedWidgets.forEach((currentWidget) => {
    const previousWidget = previousAnalytics.mostUsedWidgets.find(
      (w) => w.widgetId === currentWidget.widgetId
    );

    if (previousWidget) {
      const trend = ((currentWidget.usageCount - previousWidget.usageCount) / 
        previousWidget.usageCount) * 100;
      
      if (trend > 20) {
        trending.push({
          widgetId: currentWidget.widgetId,
          widgetTitle: currentWidget.widgetTitle,
          trend
        });
      }
    }
  });

  return trending.sort((a, b) => b.trend - a.trend);
};

/**
 * Exports analytics data in CSV format
 */
export const exportAnalyticsToCSV = (analytics: DashboardAnalytics): string => {
  let csv = 'Widget Performance Report\n\n';
  csv += 'Widget,Load Time (ms),Render Time (ms),Error Rate (%),View Count,Interaction Count\n';
  
  analytics.widgetPerformance.forEach((widget) => {
    csv += `"${widget.widgetTitle}",${widget.loadTime.toFixed(0)},${widget.renderTime.toFixed(0)},`;
    csv += `${widget.errorRate.toFixed(2)},${widget.viewCount},${widget.interactionCount}\n`;
  });
  
  csv += '\n\nWidget Usage Report\n\n';
  csv += 'Widget,Usage Count,Percentage\n';
  
  analytics.mostUsedWidgets.forEach((widget) => {
    csv += `"${widget.widgetTitle}",${widget.usageCount},${widget.percentage.toFixed(2)}%\n`;
  });
  
  return csv;
};
