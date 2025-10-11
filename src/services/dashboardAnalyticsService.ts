/**
 * Dashboard Analytics Service
 * Implements:
 * - Dashboard usage analytics
 * - Widget performance metrics
 * - Dashboard interaction tracking
 * - Dashboard optimization suggestions
 */

import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { DashboardWidget, WidgetLayout } from '../types/dashboard';

export interface DashboardUsageMetrics {
  userId: string;
  sessionId: string;
  sessionStart: Timestamp;
  sessionEnd?: Timestamp;
  sessionDuration?: number; // in seconds
  widgetsViewed: string[];
  widgetInteractions: WidgetInteraction[];
  layoutChanges: number;
  refreshCount: number;
  errorCount: number;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browserInfo: string;
}

export interface WidgetInteraction {
  widgetId: string;
  widgetTitle: string;
  interactionType: 'view' | 'click' | 'refresh' | 'resize' | 'move' | 'configure' | 'export';
  timestamp: Timestamp;
  duration?: number; // time spent on interaction in ms
  metadata?: Record<string, any>;
}

export interface WidgetPerformanceMetrics {
  widgetId: string;
  widgetTitle: string;
  loadTime: number; // in ms
  renderTime: number; // in ms
  errorRate: number; // percentage
  interactionCount: number;
  viewCount: number;
  refreshCount: number;
  averageViewDuration: number; // in seconds
  lastUpdated: Timestamp;
}

export interface DashboardAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
  totalSessions: number;
  averageSessionDuration: number;
  totalInteractions: number;
  mostUsedWidgets: Array<{
    widgetId: string;
    widgetTitle: string;
    usageCount: number;
    percentage: number;
  }>;
  leastUsedWidgets: Array<{
    widgetId: string;
    widgetTitle: string;
    usageCount: number;
    percentage: number;
  }>;
  widgetPerformance: WidgetPerformanceMetrics[];
  layoutChangeFrequency: number;
  errorFrequency: number;
  peakUsageHours: number[];
  deviceDistribution: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
  generatedAt: Timestamp;
}

export interface OptimizationSuggestion {
  type: 'performance' | 'layout' | 'widget' | 'usability';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  affectedWidgets?: string[];
  estimatedImpact: string;
  actionable: boolean;
}

/**
 * Tracks dashboard session start
 */
export const startDashboardSession = async (
  userId: string,
  deviceType: 'desktop' | 'tablet' | 'mobile'
): Promise<string> => {
  try {
    const sessionRef = await addDoc(collection(db, 'dashboardSessions'), {
      userId,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionStart: Timestamp.now(),
      widgetsViewed: [],
      widgetInteractions: [],
      layoutChanges: 0,
      refreshCount: 0,
      errorCount: 0,
      deviceType,
      browserInfo: navigator.userAgent
    });

    console.log('Dashboard session started:', sessionRef.id);
    return sessionRef.id;
  } catch (error) {
    console.error('Error starting dashboard session:', error);
    throw error;
  }
};

/**
 * Tracks dashboard session end
 */
export const endDashboardSession = async (
  sessionId: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'dashboardSessions', sessionId);
    const sessionEnd = Timestamp.now();
    
    // Calculate session duration
    const sessionDoc = await getDocs(query(
      collection(db, 'dashboardSessions'),
      where('sessionId', '==', sessionId)
    ));

    if (!sessionDoc.empty) {
      const sessionData = sessionDoc.docs[0].data();
      const sessionStart = sessionData.sessionStart.toDate();
      const sessionDuration = Math.floor((sessionEnd.toDate().getTime() - sessionStart.getTime()) / 1000);

      await addDoc(collection(db, 'dashboardSessions'), {
        ...sessionData,
        sessionEnd,
        sessionDuration
      });
    }

    console.log('Dashboard session ended:', sessionId);
  } catch (error) {
    console.error('Error ending dashboard session:', error);
    throw error;
  }
};

/**
 * Tracks widget interaction
 */
export const trackWidgetInteraction = async (
  sessionId: string,
  interaction: Omit<WidgetInteraction, 'timestamp'>
): Promise<void> => {
  try {
    await addDoc(collection(db, 'widgetInteractions'), {
      sessionId,
      ...interaction,
      timestamp: Timestamp.now()
    });

    console.log('Widget interaction tracked:', interaction.widgetId, interaction.interactionType);
  } catch (error) {
    console.error('Error tracking widget interaction:', error);
    throw error;
  }
};

/**
 * Tracks widget performance
 */
export const trackWidgetPerformance = async (
  widgetId: string,
  widgetTitle: string,
  metrics: {
    loadTime: number;
    renderTime: number;
    hasError: boolean;
  }
): Promise<void> => {
  try {
    await addDoc(collection(db, 'widgetPerformance'), {
      widgetId,
      widgetTitle,
      loadTime: metrics.loadTime,
      renderTime: metrics.renderTime,
      hasError: metrics.hasError,
      timestamp: Timestamp.now()
    });

    console.log('Widget performance tracked:', widgetId);
  } catch (error) {
    console.error('Error tracking widget performance:', error);
    throw error;
  }
};

/**
 * Gets dashboard analytics for a user
 */
export const getDashboardAnalytics = async (
  userId: string,
  period: 'day' | 'week' | 'month' | 'year' = 'week'
): Promise<DashboardAnalytics> => {
  try {
    const now = new Date();
    const periodStart = new Date();

    switch (period) {
      case 'day':
        periodStart.setDate(now.getDate() - 1);
        break;
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get sessions
    const sessionsQuery = query(
      collection(db, 'dashboardSessions'),
      where('userId', '==', userId),
      where('sessionStart', '>=', Timestamp.fromDate(periodStart))
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);

    const sessions: DashboardUsageMetrics[] = [];
    sessionsSnapshot.forEach((doc) => {
      sessions.push(doc.data() as DashboardUsageMetrics);
    });

    // Calculate metrics
    const totalSessions = sessions.length;
    const averageSessionDuration = sessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / totalSessions || 0;

    // Get widget interactions
    const interactionsQuery = query(
      collection(db, 'widgetInteractions'),
      where('timestamp', '>=', Timestamp.fromDate(periodStart))
    );
    const interactionsSnapshot = await getDocs(interactionsQuery);

    const interactions: WidgetInteraction[] = [];
    interactionsSnapshot.forEach((doc) => {
      interactions.push(doc.data() as WidgetInteraction);
    });

    const totalInteractions = interactions.length;

    // Calculate widget usage
    const widgetUsage = new Map<string, { title: string; count: number }>();
    interactions.forEach((interaction) => {
      const current = widgetUsage.get(interaction.widgetId) || { title: interaction.widgetTitle, count: 0 };
      widgetUsage.set(interaction.widgetId, { ...current, count: current.count + 1 });
    });

    const sortedWidgets = Array.from(widgetUsage.entries())
      .map(([widgetId, data]) => ({
        widgetId,
        widgetTitle: data.title,
        usageCount: data.count,
        percentage: (data.count / totalInteractions) * 100
      }))
      .sort((a, b) => b.usageCount - a.usageCount);

    const mostUsedWidgets = sortedWidgets.slice(0, 5);
    const leastUsedWidgets = sortedWidgets.slice(-5).reverse();

    // Get widget performance
    const performanceQuery = query(
      collection(db, 'widgetPerformance'),
      where('timestamp', '>=', Timestamp.fromDate(periodStart))
    );
    const performanceSnapshot = await getDocs(performanceQuery);

    const performanceData = new Map<string, WidgetPerformanceMetrics>();
    performanceSnapshot.forEach((doc) => {
      const data = doc.data();
      const existing = performanceData.get(data.widgetId);
      
      if (!existing) {
        performanceData.set(data.widgetId, {
          widgetId: data.widgetId,
          widgetTitle: data.widgetTitle,
          loadTime: data.loadTime,
          renderTime: data.renderTime,
          errorRate: data.hasError ? 100 : 0,
          interactionCount: 0,
          viewCount: 1,
          refreshCount: 0,
          averageViewDuration: 0,
          lastUpdated: data.timestamp
        });
      } else {
        const count = existing.viewCount + 1;
        performanceData.set(data.widgetId, {
          ...existing,
          loadTime: (existing.loadTime * existing.viewCount + data.loadTime) / count,
          renderTime: (existing.renderTime * existing.viewCount + data.renderTime) / count,
          errorRate: data.hasError ? ((existing.errorRate * existing.viewCount + 100) / count) : (existing.errorRate * existing.viewCount / count),
          viewCount: count,
          lastUpdated: data.timestamp
        });
      }
    });

    // Calculate device distribution
    const deviceDistribution = {
      desktop: sessions.filter(s => s.deviceType === 'desktop').length,
      tablet: sessions.filter(s => s.deviceType === 'tablet').length,
      mobile: sessions.filter(s => s.deviceType === 'mobile').length
    };

    // Calculate peak usage hours
    const hourCounts = new Array(24).fill(0);
    sessions.forEach((session) => {
      const hour = session.sessionStart.toDate().getHours();
      hourCounts[hour]++;
    });
    const peakUsageHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    const analytics: DashboardAnalytics = {
      userId,
      period,
      totalSessions,
      averageSessionDuration,
      totalInteractions,
      mostUsedWidgets,
      leastUsedWidgets,
      widgetPerformance: Array.from(performanceData.values()),
      layoutChangeFrequency: sessions.reduce((sum, s) => sum + s.layoutChanges, 0) / totalSessions || 0,
      errorFrequency: sessions.reduce((sum, s) => sum + s.errorCount, 0) / totalSessions || 0,
      peakUsageHours,
      deviceDistribution,
      generatedAt: Timestamp.now()
    };

    return analytics;
  } catch (error) {
    console.error('Error getting dashboard analytics:', error);
    throw error;
  }
};

/**
 * Generates optimization suggestions based on analytics
 */
export const generateOptimizationSuggestions = (
  analytics: DashboardAnalytics,
  currentLayout: WidgetLayout[]
): OptimizationSuggestion[] => {
  const suggestions: OptimizationSuggestion[] = [];

  // Check for slow-loading widgets
  const slowWidgets = analytics.widgetPerformance.filter(w => w.loadTime > 2000);
  if (slowWidgets.length > 0) {
    suggestions.push({
      type: 'performance',
      severity: 'high',
      title: 'Slow Widget Loading',
      description: `${slowWidgets.length} widget(s) are taking more than 2 seconds to load`,
      recommendation: 'Consider optimizing data queries or implementing lazy loading for these widgets',
      affectedWidgets: slowWidgets.map(w => w.widgetId),
      estimatedImpact: 'Could improve dashboard load time by 30-50%',
      actionable: true
    });
  }

  // Check for high error rate widgets
  const errorProneWidgets = analytics.widgetPerformance.filter(w => w.errorRate > 10);
  if (errorProneWidgets.length > 0) {
    suggestions.push({
      type: 'performance',
      severity: 'high',
      title: 'High Widget Error Rate',
      description: `${errorProneWidgets.length} widget(s) have error rates above 10%`,
      recommendation: 'Review widget error logs and implement better error handling',
      affectedWidgets: errorProneWidgets.map(w => w.widgetId),
      estimatedImpact: 'Will improve dashboard stability and user experience',
      actionable: true
    });
  }

  // Check for unused widgets
  if (analytics.leastUsedWidgets.length > 0) {
    const unusedWidgets = analytics.leastUsedWidgets.filter(w => w.usageCount < 5);
    if (unusedWidgets.length > 0) {
      suggestions.push({
        type: 'widget',
        severity: 'low',
        title: 'Underutilized Widgets',
        description: `${unusedWidgets.length} widget(s) are rarely used`,
        recommendation: 'Consider removing or repositioning these widgets to improve dashboard clarity',
        affectedWidgets: unusedWidgets.map(w => w.widgetId),
        estimatedImpact: 'Could simplify dashboard and improve focus on important metrics',
        actionable: true
      });
    }
  }

  // Check for layout optimization
  if (analytics.layoutChangeFrequency > 5) {
    suggestions.push({
      type: 'layout',
      severity: 'medium',
      title: 'Frequent Layout Changes',
      description: 'Users are frequently rearranging widgets',
      recommendation: 'Current layout may not be optimal. Consider reviewing widget placement',
      estimatedImpact: 'Could reduce user frustration and improve workflow efficiency',
      actionable: true
    });
  }

  // Check for mobile optimization
  if (analytics.deviceDistribution.mobile > analytics.totalSessions * 0.3) {
    suggestions.push({
      type: 'usability',
      severity: 'medium',
      title: 'Mobile Usage Detected',
      description: 'Significant mobile usage detected',
      recommendation: 'Ensure dashboard is optimized for mobile devices with responsive layouts',
      estimatedImpact: 'Will improve mobile user experience',
      actionable: true
    });
  }

  // Check for widget density
  const totalWidgets = currentLayout.length;
  if (totalWidgets > 10) {
    suggestions.push({
      type: 'layout',
      severity: 'low',
      title: 'High Widget Density',
      description: `Dashboard has ${totalWidgets} widgets`,
      recommendation: 'Consider using tabs or categories to organize widgets',
      estimatedImpact: 'Could reduce cognitive load and improve dashboard navigation',
      actionable: true
    });
  }

  return suggestions;
};

/**
 * Exports analytics report
 */
export const exportAnalyticsReport = (analytics: DashboardAnalytics): string => {
  const report = {
    summary: {
      period: analytics.period,
      totalSessions: analytics.totalSessions,
      averageSessionDuration: `${Math.floor(analytics.averageSessionDuration / 60)} minutes`,
      totalInteractions: analytics.totalInteractions
    },
    widgetUsage: {
      mostUsed: analytics.mostUsedWidgets,
      leastUsed: analytics.leastUsedWidgets
    },
    performance: analytics.widgetPerformance.map(w => ({
      widget: w.widgetTitle,
      loadTime: `${w.loadTime.toFixed(0)}ms`,
      errorRate: `${w.errorRate.toFixed(1)}%`,
      viewCount: w.viewCount
    })),
    insights: {
      peakUsageHours: analytics.peakUsageHours.map(h => `${h}:00`),
      deviceDistribution: analytics.deviceDistribution,
      layoutChangeFrequency: analytics.layoutChangeFrequency.toFixed(2),
      errorFrequency: analytics.errorFrequency.toFixed(2)
    },
    generatedAt: analytics.generatedAt.toDate().toISOString()
  };

  return JSON.stringify(report, null, 2);
};

/**
 * Gets widget-specific analytics
 */
export const getWidgetAnalytics = async (
  widgetId: string,
  period: 'day' | 'week' | 'month' = 'week'
): Promise<WidgetPerformanceMetrics | null> => {
  try {
    const now = new Date();
    const periodStart = new Date();

    switch (period) {
      case 'day':
        periodStart.setDate(now.getDate() - 1);
        break;
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
    }

    const performanceQuery = query(
      collection(db, 'widgetPerformance'),
      where('widgetId', '==', widgetId),
      where('timestamp', '>=', Timestamp.fromDate(periodStart))
    );
    const performanceSnapshot = await getDocs(performanceQuery);

    if (performanceSnapshot.empty) {
      return null;
    }

    let totalLoadTime = 0;
    let totalRenderTime = 0;
    let errorCount = 0;
    let viewCount = 0;
    let widgetTitle = '';

    performanceSnapshot.forEach((doc) => {
      const data = doc.data();
      totalLoadTime += data.loadTime;
      totalRenderTime += data.renderTime;
      if (data.hasError) errorCount++;
      viewCount++;
      widgetTitle = data.widgetTitle;
    });

    const interactionsQuery = query(
      collection(db, 'widgetInteractions'),
      where('widgetId', '==', widgetId),
      where('timestamp', '>=', Timestamp.fromDate(periodStart))
    );
    const interactionsSnapshot = await getDocs(interactionsQuery);

    const metrics: WidgetPerformanceMetrics = {
      widgetId,
      widgetTitle,
      loadTime: totalLoadTime / viewCount,
      renderTime: totalRenderTime / viewCount,
      errorRate: (errorCount / viewCount) * 100,
      interactionCount: interactionsSnapshot.size,
      viewCount,
      refreshCount: 0,
      averageViewDuration: 0,
      lastUpdated: Timestamp.now()
    };

    return metrics;
  } catch (error) {
    console.error('Error getting widget analytics:', error);
    throw error;
  }
};
