/**
 * Timer Analytics System
 * Task 5.4: Timer usage statistics, productivity insights, and performance metrics
 */

import { Timestamp } from 'firebase/firestore';
import { TimeLog, Project, User, TimeAllocation, TimeSlot, TimePurchase } from '../types';

export interface TimerUsageStatistics {
  totalSessions: number;
  totalTimeMinutes: number;
  averageSessionMinutes: number;
  longestSessionMinutes: number;
  shortestSessionMinutes: number;
  totalPauses: number;
  averagePausesPerSession: number;
  manualEntries: number;
  timerEntries: number;
  period: DateRange;
}

export interface ProductivityInsights {
  peakProductivityHours: number[];
  peakProductivityDays: string[];
  averageFocusTime: number;
  distractionRate: number;
  consistencyScore: number;
  efficiencyScore: number;
  recommendations: string[];
  trends: ProductivityTrend[];
}

export interface ProductivityTrend {
  date: string;
  totalMinutes: number;
  sessions: number;
  focusScore: number;
}

export interface TimeTrackingPattern {
  patternType: 'consistent' | 'irregular' | 'improving' | 'declining';
  workingHoursDistribution: HourDistribution[];
  dayOfWeekDistribution: DayDistribution[];
  projectTimeDistribution: ProjectTimeDistribution[];
  sessionLengthDistribution: SessionLengthDistribution;
  breakPatterns: BreakPattern[];
}

export interface HourDistribution {
  hour: number;
  minutes: number;
  sessions: number;
  percentage: number;
}

export interface DayDistribution {
  day: string;
  minutes: number;
  sessions: number;
  percentage: number;
}

export interface ProjectTimeDistribution {
  projectId: string;
  projectTitle: string;
  minutes: number;
  sessions: number;
  percentage: number;
  earnings?: number;
}

export interface SessionLengthDistribution {
  short: number; // < 30 min
  medium: number; // 30-90 min
  long: number; // 90-180 min
  veryLong: number; // > 180 min
}

export interface BreakPattern {
  averageBreakMinutes: number;
  breakFrequency: number;
  optimalBreakTime: number;
  breakEffectiveness: number;
}

export interface TimerPerformanceMetrics {
  accuracy: number;
  reliability: number;
  userEngagement: number;
  systemHealth: number;
  errorRate: number;
  recoveryRate: number;
  averageResponseTime: number;
  uptime: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface TimerAnalyticsReport {
  userId: string;
  userName: string;
  period: DateRange;
  statistics: TimerUsageStatistics;
  insights: ProductivityInsights;
  patterns: TimeTrackingPattern;
  performance: TimerPerformanceMetrics;
  generatedAt: Date;
}

// Time Management Allocation Analytics Interfaces
export interface FreelancerUtilizationMetrics {
  freelancerId: string;
  freelancerName: string;
  totalAllocatedHours: number;
  totalUtilizedHours: number;
  utilizationRate: number;
  availableSlots: number;
  purchasedSlots: number;
  completedSlots: number;
  averageSlotUtilization: number;
  efficiencyScore: number;
  revenueGenerated: number;
  costEfficiency: number;
  projectBreakdown?: Array<{
    projectId: string;
    projectTitle: string;
    allocatedHours: number;
    utilizedHours: number;
    utilizationRate: number;
  }>;
  activeProjects?: number;
  unutilizedHours?: number;
  recommendations?: string[];
}

export interface ProjectProfitabilityMetrics {
  projectId: string;
  projectTitle: string;
  totalAllocatedBudget: number;
  totalSpent: number;
  totalRevenue: number;
  profitMargin: number;
  allocationUtilization: number;
  freelancerCount: number;
  averageHourlyRate: number;
  timeSlotEfficiency: number;
  returnOnInvestment: number;
}

export interface AllocationUtilizationComparison {
  period: DateRange;
  totalAllocations: number;
  totalAllocatedHours: number;
  totalUtilizedHours: number;
  overallUtilizationRate: number;
  allocationEfficiency: number;
  revenueEfficiency: number;
  timeSlotPerformance: {
    available: number;
    purchased: number;
    inProgress: number;
    completed: number;
    expired: number;
  };
  trends: AllocationTrend[];
  recommendations: string[];
}

export interface AllocationTrend {
  date: string;
  allocations: number;
  utilizedHours: number;
  utilizationRate: number;
  revenue: number;
  allocationEfficiency?: number;
}

export interface TimeManagementAnalyticsReport {
  period: DateRange;
  freelancerUtilization: FreelancerUtilizationMetrics[];
  projectProfitability: ProjectProfitabilityMetrics[];
  allocationComparison: AllocationUtilizationComparison;
  generatedAt: Date;
}

export class TimerAnalytics {
  /**
   * Generate comprehensive timer usage statistics
   */
  static generateUsageStatistics(
    timeLogs: TimeLog[],
    period: DateRange
  ): TimerUsageStatistics {
    const filteredLogs = this.filterLogsByPeriod(timeLogs, period);

    if (filteredLogs.length === 0) {
      return {
        totalSessions: 0,
        totalTimeMinutes: 0,
        averageSessionMinutes: 0,
        longestSessionMinutes: 0,
        shortestSessionMinutes: 0,
        totalPauses: 0,
        averagePausesPerSession: 0,
        manualEntries: 0,
        timerEntries: 0,
        period,
      };
    }

    const totalTimeMinutes = filteredLogs.reduce(
      (sum, log) => sum + log.durationMinutes,
      0
    );

    const durations = filteredLogs.map((log) => log.durationMinutes);
    const totalPauses = filteredLogs.reduce(
      (sum, log) => sum + (log.pausedTime ? 1 : 0),
      0
    );

    const manualEntries = filteredLogs.filter((log) => log.manualEntry).length;
    const timerEntries = filteredLogs.length - manualEntries;

    return {
      totalSessions: filteredLogs.length,
      totalTimeMinutes,
      averageSessionMinutes: totalTimeMinutes / filteredLogs.length,
      longestSessionMinutes: Math.max(...durations),
      shortestSessionMinutes: Math.min(...durations),
      totalPauses,
      averagePausesPerSession: totalPauses / filteredLogs.length,
      manualEntries,
      timerEntries,
      period,
    };
  }

  /**
   * Generate productivity insights
   */
  static generateProductivityInsights(
    timeLogs: TimeLog[],
    period: DateRange
  ): ProductivityInsights {
    const filteredLogs = this.filterLogsByPeriod(timeLogs, period);

    if (filteredLogs.length === 0) {
      return {
        peakProductivityHours: [],
        peakProductivityDays: [],
        averageFocusTime: 0,
        distractionRate: 0,
        consistencyScore: 0,
        efficiencyScore: 0,
        recommendations: ['Not enough data to generate insights'],
        trends: [],
      };
    }

    const peakHours = this.calculatePeakProductivityHours(filteredLogs);
    const peakDays = this.calculatePeakProductivityDays(filteredLogs);
    const focusTime = this.calculateAverageFocusTime(filteredLogs);
    const distractionRate = this.calculateDistractionRate(filteredLogs);
    const consistencyScore = this.calculateConsistencyScore(filteredLogs);
    const efficiencyScore = this.calculateEfficiencyScore(filteredLogs);
    const trends = this.calculateProductivityTrends(filteredLogs, period);
    const recommendations = this.generateRecommendations(
      peakHours,
      peakDays,
      focusTime,
      distractionRate,
      consistencyScore,
      efficiencyScore
    );

    return {
      peakProductivityHours: peakHours,
      peakProductivityDays: peakDays,
      averageFocusTime: focusTime,
      distractionRate,
      consistencyScore,
      efficiencyScore,
      recommendations,
      trends,
    };
  }

  /**
   * Analyze time tracking patterns
   */
  static analyzeTimeTrackingPatterns(
    timeLogs: TimeLog[],
    projects: Project[]
  ): TimeTrackingPattern {
    if (timeLogs.length === 0) {
      return {
        patternType: 'irregular',
        workingHoursDistribution: [],
        dayOfWeekDistribution: [],
        projectTimeDistribution: [],
        sessionLengthDistribution: { short: 0, medium: 0, long: 0, veryLong: 0 },
        breakPatterns: [],
      };
    }

    const patternType = this.determinePatternType(timeLogs);
    const hourDistribution = this.calculateHourDistribution(timeLogs);
    const dayDistribution = this.calculateDayDistribution(timeLogs);
    const projectDistribution = this.calculateProjectDistribution(timeLogs, projects);
    const sessionDistribution = this.calculateSessionLengthDistribution(timeLogs);
    const breakPatterns = this.analyzeBreakPatterns(timeLogs);

    return {
      patternType,
      workingHoursDistribution: hourDistribution,
      dayOfWeekDistribution: dayDistribution,
      projectTimeDistribution: projectDistribution,
      sessionLengthDistribution: sessionDistribution,
      breakPatterns,
    };
  }

  /**
   * Calculate timer performance metrics
   */
  static calculatePerformanceMetrics(
    timeLogs: TimeLog[],
    errorLogs: any[] = []
  ): TimerPerformanceMetrics {
    const totalSessions = timeLogs.length;
    const manualEntries = timeLogs.filter((log) => log.manualEntry).length;
    const timerEntries = totalSessions - manualEntries;

    // Accuracy: ratio of timer entries to total (higher is better)
    const accuracy = totalSessions > 0 ? (timerEntries / totalSessions) * 100 : 100;

    // Reliability: based on error rate
    const errorRate = errorLogs.length / Math.max(totalSessions, 1);
    const reliability = Math.max(0, 100 - errorRate * 100);

    // User engagement: based on session frequency
    const userEngagement = this.calculateUserEngagement(timeLogs);

    // System health: composite score
    const systemHealth = (accuracy + reliability + userEngagement) / 3;

    // Recovery rate: successful recoveries from errors
    const recoveryRate = errorLogs.length > 0 ? 85 : 100; // Placeholder

    return {
      accuracy,
      reliability,
      userEngagement,
      systemHealth,
      errorRate: errorRate * 100,
      recoveryRate,
      averageResponseTime: 150, // ms - placeholder
      uptime: 99.9, // percentage - placeholder
    };
  }

  /**
   * Generate comprehensive analytics report
   */
  static generateAnalyticsReport(
    userId: string,
    userName: string,
    timeLogs: TimeLog[],
    projects: Project[],
    period: DateRange
  ): TimerAnalyticsReport {
    const statistics = this.generateUsageStatistics(timeLogs, period);
    const insights = this.generateProductivityInsights(timeLogs, period);
    const patterns = this.analyzeTimeTrackingPatterns(timeLogs, projects);
    const performance = this.calculatePerformanceMetrics(timeLogs);

    return {
      userId,
      userName,
      period,
      statistics,
      insights,
      patterns,
      performance,
      generatedAt: new Date(),
    };
  }

  // Helper methods

  private static filterLogsByPeriod(logs: TimeLog[], period: DateRange): TimeLog[] {
    return logs.filter((log) => {
      const logDate = log.startTime.toDate();
      return logDate >= period.startDate && logDate <= period.endDate;
    });
  }

  private static calculatePeakProductivityHours(logs: TimeLog[]): number[] {
    const hourMap = new Map<number, number>();

    logs.forEach((log) => {
      const hour = log.startTime.toDate().getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + log.durationMinutes);
    });

    const sorted = Array.from(hourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return sorted.map(([hour]) => hour);
  }

  private static calculatePeakProductivityDays(logs: TimeLog[]): string[] {
    const dayMap = new Map<string, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    logs.forEach((log) => {
      const day = dayNames[log.startTime.toDate().getDay()];
      dayMap.set(day, (dayMap.get(day) || 0) + log.durationMinutes);
    });

    const sorted = Array.from(dayMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return sorted.map(([day]) => day);
  }

  private static calculateAverageFocusTime(logs: TimeLog[]): number {
    const timerLogs = logs.filter((log) => !log.manualEntry);
    if (timerLogs.length === 0) return 0;

    const totalFocusTime = timerLogs.reduce(
      (sum, log) => sum + log.durationMinutes,
      0
    );

    return totalFocusTime / timerLogs.length;
  }

  private static calculateDistractionRate(logs: TimeLog[]): number {
    const totalPauses = logs.reduce(
      (sum, log) => sum + (log.pausedTime ? 1 : 0),
      0
    );

    return logs.length > 0 ? (totalPauses / logs.length) * 100 : 0;
  }

  private static calculateConsistencyScore(logs: TimeLog[]): number {
    if (logs.length < 2) return 0;

    // Group logs by date
    const dateMap = new Map<string, number>();
    logs.forEach((log) => {
      const date = log.startTime.toDate().toDateString();
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Calculate standard deviation of daily sessions
    const dailyCounts = Array.from(dateMap.values());
    const mean = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
    const variance =
      dailyCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
      dailyCounts.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    const consistencyScore = Math.max(0, 100 - stdDev * 10);

    return Math.min(100, consistencyScore);
  }

  private static calculateEfficiencyScore(logs: TimeLog[]): number {
    const timerLogs = logs.filter((log) => !log.manualEntry);
    if (logs.length === 0) return 0;

    // Efficiency based on timer usage vs manual entries
    const timerRatio = (timerLogs.length / logs.length) * 100;

    // Efficiency based on session length (optimal is 60-90 minutes)
    const optimalSessions = logs.filter(
      (log) => log.durationMinutes >= 60 && log.durationMinutes <= 90
    ).length;
    const optimalRatio = (optimalSessions / logs.length) * 100;

    return (timerRatio + optimalRatio) / 2;
  }

  private static calculateProductivityTrends(
    logs: TimeLog[],
    period: DateRange
  ): ProductivityTrend[] {
    const dateMap = new Map<string, { minutes: number; sessions: number }>();

    logs.forEach((log) => {
      const date = log.startTime.toDate().toISOString().split('T')[0];
      const existing = dateMap.get(date) || { minutes: 0, sessions: 0 };
      dateMap.set(date, {
        minutes: existing.minutes + log.durationMinutes,
        sessions: existing.sessions + 1,
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        totalMinutes: data.minutes,
        sessions: data.sessions,
        focusScore: this.calculateDailyFocusScore(data.minutes, data.sessions),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static calculateDailyFocusScore(minutes: number, sessions: number): number {
    // Optimal: 4-6 hours per day, 4-8 sessions
    const timeScore = Math.min(100, (minutes / 360) * 100);
    const sessionScore = Math.min(100, (sessions / 6) * 100);
    return (timeScore + sessionScore) / 2;
  }

  private static generateRecommendations(
    peakHours: number[],
    peakDays: string[],
    focusTime: number,
    distractionRate: number,
    consistencyScore: number,
    efficiencyScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (peakHours.length > 0) {
      recommendations.push(
        `Your peak productivity hours are ${peakHours.join(', ')}:00. Schedule important tasks during these times.`
      );
    }

    if (peakDays.length > 0) {
      recommendations.push(
        `You're most productive on ${peakDays.join(', ')}. Plan critical work for these days.`
      );
    }

    if (focusTime < 45) {
      recommendations.push(
        'Your average focus time is below optimal. Try the Pomodoro technique (25-minute focused sessions).'
      );
    } else if (focusTime > 120) {
      recommendations.push(
        'Your sessions are quite long. Consider taking breaks every 90 minutes to maintain focus.'
      );
    }

    if (distractionRate > 30) {
      recommendations.push(
        'High distraction rate detected. Try minimizing interruptions and using focus mode.'
      );
    }

    if (consistencyScore < 50) {
      recommendations.push(
        'Work on building a more consistent routine. Regular work patterns improve productivity.'
      );
    }

    if (efficiencyScore < 60) {
      recommendations.push(
        'Consider using the timer more consistently for better time tracking accuracy.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Your time tracking habits are excellent. Keep it up!');
    }

    return recommendations;
  }

  private static determinePatternType(
    logs: TimeLog[]
  ): 'consistent' | 'irregular' | 'improving' | 'declining' {
    if (logs.length < 7) return 'irregular';

    const consistencyScore = this.calculateConsistencyScore(logs);

    // Check for trend
    const recentLogs = logs.slice(-7);
    const olderLogs = logs.slice(0, Math.min(7, logs.length - 7));

    if (olderLogs.length > 0) {
      const recentAvg =
        recentLogs.reduce((sum, log) => sum + log.durationMinutes, 0) /
        recentLogs.length;
      const olderAvg =
        olderLogs.reduce((sum, log) => sum + log.durationMinutes, 0) /
        olderLogs.length;

      if (recentAvg > olderAvg * 1.2) return 'improving';
      if (recentAvg < olderAvg * 0.8) return 'declining';
    }

    return consistencyScore > 70 ? 'consistent' : 'irregular';
  }

  private static calculateHourDistribution(logs: TimeLog[]): HourDistribution[] {
    const hourMap = new Map<number, { minutes: number; sessions: number }>();
    const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);

    logs.forEach((log) => {
      const hour = log.startTime.toDate().getHours();
      const existing = hourMap.get(hour) || { minutes: 0, sessions: 0 };
      hourMap.set(hour, {
        minutes: existing.minutes + log.durationMinutes,
        sessions: existing.sessions + 1,
      });
    });

    return Array.from(hourMap.entries())
      .map(([hour, data]) => ({
        hour,
        minutes: data.minutes,
        sessions: data.sessions,
        percentage: (data.minutes / totalMinutes) * 100,
      }))
      .sort((a, b) => a.hour - b.hour);
  }

  private static calculateDayDistribution(logs: TimeLog[]): DayDistribution[] {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap = new Map<string, { minutes: number; sessions: number }>();
    const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);

    logs.forEach((log) => {
      const day = dayNames[log.startTime.toDate().getDay()];
      const existing = dayMap.get(day) || { minutes: 0, sessions: 0 };
      dayMap.set(day, {
        minutes: existing.minutes + log.durationMinutes,
        sessions: existing.sessions + 1,
      });
    });

    return dayNames.map((day) => {
      const data = dayMap.get(day) || { minutes: 0, sessions: 0 };
      return {
        day,
        minutes: data.minutes,
        sessions: data.sessions,
        percentage: totalMinutes > 0 ? (data.minutes / totalMinutes) * 100 : 0,
      };
    });
  }

  private static calculateProjectDistribution(
    logs: TimeLog[],
    projects: Project[]
  ): ProjectTimeDistribution[] {
    const projectMap = new Map<string, { minutes: number; sessions: number; earnings: number }>();
    const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);

    logs.forEach((log) => {
      const existing = projectMap.get(log.projectId) || {
        minutes: 0,
        sessions: 0,
        earnings: 0,
      };
      projectMap.set(log.projectId, {
        minutes: existing.minutes + log.durationMinutes,
        sessions: existing.sessions + 1,
        earnings: existing.earnings + (log.earnings || 0),
      });
    });

    return Array.from(projectMap.entries())
      .map(([projectId, data]) => {
        const project = projects.find((p) => p.id === projectId);
        return {
          projectId,
          projectTitle: project?.title || 'Unknown Project',
          minutes: data.minutes,
          sessions: data.sessions,
          percentage: (data.minutes / totalMinutes) * 100,
          earnings: data.earnings,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);
  }

  private static calculateSessionLengthDistribution(
    logs: TimeLog[]
  ): SessionLengthDistribution {
    const distribution = {
      short: 0,
      medium: 0,
      long: 0,
      veryLong: 0,
    };

    logs.forEach((log) => {
      if (log.durationMinutes < 30) {
        distribution.short++;
      } else if (log.durationMinutes < 90) {
        distribution.medium++;
      } else if (log.durationMinutes < 180) {
        distribution.long++;
      } else {
        distribution.veryLong++;
      }
    });

    return distribution;
  }

  private static analyzeBreakPatterns(logs: TimeLog[]): BreakPattern[] {
    // Sort logs by start time
    const sortedLogs = [...logs].sort(
      (a, b) => a.startTime.toMillis() - b.startTime.toMillis()
    );

    const breaks: number[] = [];

    for (let i = 1; i < sortedLogs.length; i++) {
      const prevEnd = sortedLogs[i - 1].endTime.toMillis();
      const currentStart = sortedLogs[i].startTime.toMillis();
      const breakMinutes = (currentStart - prevEnd) / (1000 * 60);

      // Only consider breaks between 5 minutes and 4 hours
      if (breakMinutes >= 5 && breakMinutes <= 240) {
        breaks.push(breakMinutes);
      }
    }

    if (breaks.length === 0) {
      return [];
    }

    const averageBreak = breaks.reduce((a, b) => a + b, 0) / breaks.length;
    const breakFrequency = breaks.length / logs.length;

    return [
      {
        averageBreakMinutes: averageBreak,
        breakFrequency,
        optimalBreakTime: 15, // Recommended break time
        breakEffectiveness: this.calculateBreakEffectiveness(averageBreak),
      },
    ];
  }

  private static calculateBreakEffectiveness(averageBreak: number): number {
    // Optimal break is 10-20 minutes
    if (averageBreak >= 10 && averageBreak <= 20) return 100;
    if (averageBreak < 10) return (averageBreak / 10) * 100;
    if (averageBreak > 20) return Math.max(0, 100 - (averageBreak - 20) * 2);
    return 50;
  }

  private static calculateUserEngagement(logs: TimeLog[]): number {
    if (logs.length === 0) return 0;

    // Calculate engagement based on frequency and recency
    const now = Date.now();
    const recentLogs = logs.filter((log) => {
      const logTime = log.startTime.toMillis();
      const daysSince = (now - logTime) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });

    const engagementScore = Math.min(100, (recentLogs.length / 7) * 100);
    return engagementScore;
  }

  // Time Management Allocation Analytics Methods

  /**
   * Calculate freelancer utilization metrics
   */
  static calculateFreelancerUtilization(
    allocations: TimeAllocation[],
    slots: TimeSlot[],
    purchases: TimePurchase[],
    timeLogs: TimeLog[],
    period: DateRange
  ): FreelancerUtilizationMetrics[] {
    const freelancerMetrics = new Map<string, FreelancerUtilizationMetrics>();

    // Process allocations
    allocations.forEach(allocation => {
      if (!freelancerMetrics.has(allocation.freelancerId)) {
        freelancerMetrics.set(allocation.freelancerId, {
          freelancerId: allocation.freelancerId,
          freelancerName: allocation.freelancerName,
          totalAllocatedHours: 0,
          totalUtilizedHours: 0,
          utilizationRate: 0,
          availableSlots: 0,
          purchasedSlots: 0,
          completedSlots: 0,
          averageSlotUtilization: 0,
          efficiencyScore: 0,
          revenueGenerated: 0,
          costEfficiency: 0
        });
      }

      const metrics = freelancerMetrics.get(allocation.freelancerId)!;
      metrics.totalAllocatedHours += allocation.allocatedHours;
    });

    // Process time slots
    slots.forEach(slot => {
      const metrics = freelancerMetrics.get(slot.freelancerId);
      if (!metrics) return;

      switch (slot.status) {
        case 'AVAILABLE':
          metrics.availableSlots++;
          break;
        case 'PURCHASED':
          metrics.purchasedSlots++;
          break;
        case 'COMPLETED':
          metrics.completedSlots++;
          break;
      }
    });

    // Calculate utilization from time logs
    timeLogs.forEach(log => {
      const metrics = freelancerMetrics.get(log.loggedById);
      if (metrics && log.timeSlotId) {
        metrics.totalUtilizedHours += log.durationMinutes / 60;
      }
    });

    // Calculate derived metrics
    freelancerMetrics.forEach(metrics => {
      const totalSlots = metrics.availableSlots + metrics.purchasedSlots + metrics.completedSlots;
      metrics.utilizationRate = metrics.totalAllocatedHours > 0
        ? (metrics.totalUtilizedHours / metrics.totalAllocatedHours) * 100
        : 0;

      metrics.averageSlotUtilization = totalSlots > 0
        ? (metrics.totalUtilizedHours / totalSlots) * 100
        : 0;

      // Calculate revenue from purchases
      const freelancerPurchases = purchases.filter(p => p.freelancerId === metrics.freelancerId);
      metrics.revenueGenerated = freelancerPurchases.reduce((sum, p) => sum + p.amount, 0);

      // Efficiency score based on utilization and completion rate
      const completionRate = totalSlots > 0 ? (metrics.completedSlots / totalSlots) * 100 : 0;
      metrics.efficiencyScore = (metrics.utilizationRate + completionRate) / 2;

      // Cost efficiency (revenue per allocated hour)
      metrics.costEfficiency = metrics.totalAllocatedHours > 0
        ? metrics.revenueGenerated / metrics.totalAllocatedHours
        : 0;
    });

    return Array.from(freelancerMetrics.values());
  }

  /**
   * Calculate project profitability metrics
   */
  static calculateProjectProfitability(
    allocations: TimeAllocation[],
    purchases: TimePurchase[],
    timeLogs: TimeLog[],
    projects: Project[],
    period: DateRange
  ): ProjectProfitabilityMetrics[] {
    const projectMetrics = new Map<string, ProjectProfitabilityMetrics>();

    // Initialize metrics for all projects with allocations
    allocations.forEach(allocation => {
      if (!projectMetrics.has(allocation.projectId)) {
        const project = projects.find(p => p.id === allocation.projectId);
        projectMetrics.set(allocation.projectId, {
          projectId: allocation.projectId,
          projectTitle: project?.title || 'Unknown Project',
          totalAllocatedBudget: 0,
          totalSpent: 0,
          totalRevenue: 0,
          profitMargin: 0,
          allocationUtilization: 0,
          freelancerCount: 0,
          averageHourlyRate: 0,
          timeSlotEfficiency: 0,
          returnOnInvestment: 0
        });
      }

      const metrics = projectMetrics.get(allocation.projectId)!;
      metrics.totalAllocatedBudget += allocation.allocatedHours * allocation.hourlyRate;
      metrics.freelancerCount++;
    });

    // Calculate revenue from purchases
    purchases.forEach(purchase => {
      const metrics = projectMetrics.get(purchase.projectId);
      if (metrics) {
        metrics.totalRevenue += purchase.amount;
      }
    });

    // Calculate actual time spent and costs
    timeLogs.forEach(log => {
      const metrics = projectMetrics.get(log.projectId);
      if (metrics && log.timeSlotId) {
        metrics.totalSpent += (log.durationMinutes / 60) * (log.hourlyRate || 0);
      }
    });

    // Calculate derived metrics
    projectMetrics.forEach(metrics => {
      metrics.profitMargin = metrics.totalRevenue > 0
        ? ((metrics.totalRevenue - metrics.totalSpent) / metrics.totalRevenue) * 100
        : 0;

      metrics.allocationUtilization = metrics.totalAllocatedBudget > 0
        ? (metrics.totalSpent / metrics.totalAllocatedBudget) * 100
        : 0;

      const projectAllocations = allocations.filter(a => a.projectId === metrics.projectId);
      const totalHours = projectAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
      const totalRate = projectAllocations.reduce((sum, a) => sum + a.hourlyRate, 0);
      metrics.averageHourlyRate = projectAllocations.length > 0
        ? totalRate / projectAllocations.length
        : 0;

      // Time slot efficiency (revenue vs allocated budget)
      metrics.timeSlotEfficiency = metrics.totalAllocatedBudget > 0
        ? (metrics.totalRevenue / metrics.totalAllocatedBudget) * 100
        : 0;

      // ROI calculation
      metrics.returnOnInvestment = metrics.totalSpent > 0
        ? ((metrics.totalRevenue - metrics.totalSpent) / metrics.totalSpent) * 100
        : 0;
    });

    return Array.from(projectMetrics.values());
  }

  /**
   * Generate allocation utilization comparison report
   */
  static generateAllocationUtilizationComparison(
    allocations: TimeAllocation[],
    slots: TimeSlot[],
    purchases: TimePurchase[],
    timeLogs: TimeLog[],
    period: DateRange
  ): AllocationUtilizationComparison {
    const filteredAllocations = allocations.filter(a =>
      a.createdAt.toDate() >= period.startDate && a.createdAt.toDate() <= period.endDate
    );

    const filteredPurchases = purchases.filter(p =>
      p.purchasedAt.toDate() >= period.startDate && p.purchasedAt.toDate() <= period.endDate
    );

    const filteredSlots = slots.filter(s =>
      s.createdAt.toDate() >= period.startDate && s.createdAt.toDate() <= period.endDate
    );

    const totalAllocatedHours = filteredAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
    const totalUtilizedHours = timeLogs
      .filter(log => log.timeSlotId && log.startTime.toDate() >= period.startDate && log.startTime.toDate() <= period.endDate)
      .reduce((sum, log) => sum + log.durationMinutes / 60, 0);

    const overallUtilizationRate = totalAllocatedHours > 0
      ? (totalUtilizedHours / totalAllocatedHours) * 100
      : 0;

    // Calculate time slot performance
    const slotPerformance = {
      available: filteredSlots.filter(s => s.status === 'AVAILABLE').length,
      purchased: filteredSlots.filter(s => s.status === 'PURCHASED').length,
      inProgress: filteredSlots.filter(s => s.status === 'IN_PROGRESS').length,
      completed: filteredSlots.filter(s => s.status === 'COMPLETED').length,
      expired: filteredSlots.filter(s => s.status === 'EXPIRED').length
    };

    // Calculate allocation efficiency (purchased vs available)
    const totalSlots = filteredSlots.length;
    const allocationEfficiency = totalSlots > 0
      ? ((slotPerformance.purchased + slotPerformance.inProgress + slotPerformance.completed) / totalSlots) * 100
      : 0;

    // Calculate revenue efficiency
    const totalRevenue = filteredPurchases.reduce((sum, p) => sum + p.amount, 0);
    const totalAllocatedValue = filteredAllocations.reduce((sum, a) => sum + (a.allocatedHours * a.hourlyRate), 0);
    const revenueEfficiency = totalAllocatedValue > 0
      ? (totalRevenue / totalAllocatedValue) * 100
      : 0;

    // Generate trends
    const trends = this.calculateAllocationTrends(filteredAllocations, filteredPurchases, filteredSlots, period);

    // Generate recommendations
    const recommendations = this.generateAllocationRecommendations(
      overallUtilizationRate,
      allocationEfficiency,
      revenueEfficiency,
      slotPerformance
    );

    return {
      period,
      totalAllocations: filteredAllocations.length,
      totalAllocatedHours,
      totalUtilizedHours,
      overallUtilizationRate,
      allocationEfficiency,
      revenueEfficiency,
      timeSlotPerformance: slotPerformance,
      trends,
      recommendations
    };
  }

  /**
   * Generate comprehensive time management analytics report
   */
  static generateTimeManagementAnalyticsReport(
    allocations: TimeAllocation[],
    slots: TimeSlot[],
    purchases: TimePurchase[],
    timeLogs: TimeLog[],
    projects: Project[],
    period: DateRange
  ): TimeManagementAnalyticsReport {
    const freelancerUtilization = this.calculateFreelancerUtilization(
      allocations, slots, purchases, timeLogs, period
    );

    const projectProfitability = this.calculateProjectProfitability(
      allocations, purchases, timeLogs, projects, period
    );

    const allocationComparison = this.generateAllocationUtilizationComparison(
      allocations, slots, purchases, timeLogs, period
    );

    return {
      period,
      freelancerUtilization,
      projectProfitability,
      allocationComparison,
      generatedAt: new Date()
    };
  }

  // Helper methods for allocation analytics

  private static calculateAllocationTrends(
    allocations: TimeAllocation[],
    purchases: TimePurchase[],
    slots: TimeSlot[],
    period: DateRange
  ): AllocationTrend[] {
    const dateMap = new Map<string, {
      allocations: number;
      utilizedHours: number;
      revenue: number;
    }>();

    // Initialize date range
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, { allocations: 0, utilizedHours: 0, revenue: 0 });
    }

    // Count allocations by date
    allocations.forEach(allocation => {
      const date = allocation.createdAt.toDate().toISOString().split('T')[0];
      const existing = dateMap.get(date);
      if (existing) {
        existing.allocations++;
      }
    });

    // Count utilized hours by date (from time logs)
    // Note: This is a simplified calculation - in practice you'd need to correlate time logs with slots
    purchases.forEach(purchase => {
      const date = purchase.purchasedAt.toDate().toISOString().split('T')[0];
      const existing = dateMap.get(date);
      if (existing) {
        existing.revenue += purchase.amount;
        // Estimate utilized hours based on purchase amount and rate
        // This is approximate - real implementation would need better correlation
        existing.utilizedHours += purchase.amount / 50; // Assuming $50/hr average
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        allocations: data.allocations,
        utilizedHours: data.utilizedHours,
        utilizationRate: data.allocations > 0 ? (data.utilizedHours / (data.allocations * 4)) * 100 : 0, // Assuming 4 hours per allocation
        revenue: data.revenue
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static generateAllocationRecommendations(
    utilizationRate: number,
    allocationEfficiency: number,
    revenueEfficiency: number,
    slotPerformance: any
  ): string[] {
    const recommendations: string[] = [];

    if (utilizationRate < 60) {
      recommendations.push('Low utilization rate detected. Consider adjusting freelancer allocations or improving project assignments.');
    }

    if (allocationEfficiency < 70) {
      recommendations.push('Many allocated slots remain unpurchased. Review pricing strategy or project demand.');
    }

    if (revenueEfficiency < 80) {
      recommendations.push('Revenue efficiency is below optimal. Consider optimizing hourly rates or allocation strategies.');
    }

    if (slotPerformance.expired > slotPerformance.completed) {
      recommendations.push('High number of expired slots. Review allocation timing and freelancer availability.');
    }

    if (slotPerformance.available > slotPerformance.purchased * 2) {
      recommendations.push('Excess available slots. Consider reducing allocations or increasing marketing efforts.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Allocation utilization is performing well. Continue monitoring and optimizing.');
    }

    return recommendations;
  }

  /**
   * Export analytics report to JSON
   */
  static exportToJSON(report: TimerAnalyticsReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Format time management analytics report for display
   */
  static formatTimeManagementReportForDisplay(report: TimeManagementAnalyticsReport): string {
    const { freelancerUtilization, projectProfitability, allocationComparison } = report;

    return `
Time Management Analytics Report
Period: ${report.period.startDate.toLocaleDateString()} - ${report.period.endDate.toLocaleDateString()}
Generated: ${report.generatedAt.toLocaleString()}

=== ALLOCATION UTILIZATION OVERVIEW ===
Total Allocations: ${allocationComparison.totalAllocations}
Total Allocated Hours: ${allocationComparison.totalAllocatedHours.toFixed(1)}
Total Utilized Hours: ${allocationComparison.totalUtilizedHours.toFixed(1)}
Overall Utilization Rate: ${allocationComparison.overallUtilizationRate.toFixed(1)}%
Allocation Efficiency: ${allocationComparison.allocationEfficiency.toFixed(1)}%
Revenue Efficiency: ${allocationComparison.revenueEfficiency.toFixed(1)}%

Time Slot Performance:
- Available: ${allocationComparison.timeSlotPerformance.available}
- Purchased: ${allocationComparison.timeSlotPerformance.purchased}
- In Progress: ${allocationComparison.timeSlotPerformance.inProgress}
- Completed: ${allocationComparison.timeSlotPerformance.completed}
- Expired: ${allocationComparison.timeSlotPerformance.expired}

=== FREELANCER UTILIZATION ===
${freelancerUtilization.map(f => `
${f.freelancerName}:
  - Allocated Hours: ${f.totalAllocatedHours.toFixed(1)}
  - Utilized Hours: ${f.totalUtilizedHours.toFixed(1)}
  - Utilization Rate: ${f.utilizationRate.toFixed(1)}%
  - Revenue Generated: $${f.revenueGenerated.toLocaleString()}
  - Efficiency Score: ${f.efficiencyScore.toFixed(1)}/100
`).join('')}

=== PROJECT PROFITABILITY ===
${projectProfitability.map(p => `
${p.projectTitle}:
  - Allocated Budget: $${p.totalAllocatedBudget.toLocaleString()}
  - Total Revenue: $${p.totalRevenue.toLocaleString()}
  - Total Spent: $${p.totalSpent.toLocaleString()}
  - Profit Margin: ${p.profitMargin.toFixed(1)}%
  - ROI: ${p.returnOnInvestment.toFixed(1)}%
  - Allocation Utilization: ${p.allocationUtilization.toFixed(1)}%
`).join('')}

=== RECOMMENDATIONS ===
${allocationComparison.recommendations.map(r => `- ${r}`).join('\n')}
    `.trim();
  }

  /**
   * Compare allocation utilization (alias for generateAllocationUtilizationComparison)
   */
  static compareAllocationUtilization(
    allocations: TimeAllocation[],
    slots: TimeSlot[],
    purchases: TimePurchase[],
    timeLogs: TimeLog[],
    period: DateRange
  ): AllocationUtilizationComparison {
    return this.generateAllocationUtilizationComparison(
      allocations,
      slots,
      purchases,
      timeLogs,
      period
    );
  }

  /**
   * Format analytics report for display
   */
  static formatReportForDisplay(report: TimerAnalyticsReport): string {
    const { statistics, insights, patterns, performance } = report;

    return `
Timer Analytics Report
User: ${report.userName}
Period: ${report.period.startDate.toLocaleDateString()} - ${report.period.endDate.toLocaleDateString()}
Generated: ${report.generatedAt.toLocaleString()}

=== USAGE STATISTICS ===
Total Sessions: ${statistics.totalSessions}
Total Time: ${this.formatMinutes(statistics.totalTimeMinutes)}
Average Session: ${this.formatMinutes(statistics.averageSessionMinutes)}
Longest Session: ${this.formatMinutes(statistics.longestSessionMinutes)}
Shortest Session: ${this.formatMinutes(statistics.shortestSessionMinutes)}
Total Pauses: ${statistics.totalPauses}
Manual Entries: ${statistics.manualEntries}
Timer Entries: ${statistics.timerEntries}

=== PRODUCTIVITY INSIGHTS ===
Peak Hours: ${insights.peakProductivityHours.join(', ')}
Peak Days: ${insights.peakProductivityDays.join(', ')}
Average Focus Time: ${this.formatMinutes(insights.averageFocusTime)}
Distraction Rate: ${insights.distractionRate.toFixed(1)}%
Consistency Score: ${insights.consistencyScore.toFixed(1)}/100
Efficiency Score: ${insights.efficiencyScore.toFixed(1)}/100

Recommendations:
${insights.recommendations.map((r) => `- ${r}`).join('\n')}

=== TIME TRACKING PATTERNS ===
Pattern Type: ${patterns.patternType}
Top Working Hours:
${patterns.workingHoursDistribution
        .slice(0, 5)
        .map((h) => `  ${h.hour}:00 - ${this.formatMinutes(h.minutes)} (${h.percentage.toFixed(1)}%)`)
        .join('\n')}

Top Projects:
${patterns.projectTimeDistribution
        .slice(0, 5)
        .map((p) => `  ${p.projectTitle} - ${this.formatMinutes(p.minutes)} (${p.percentage.toFixed(1)}%)`)
        .join('\n')}

=== PERFORMANCE METRICS ===
Accuracy: ${performance.accuracy.toFixed(1)}%
Reliability: ${performance.reliability.toFixed(1)}%
User Engagement: ${performance.userEngagement.toFixed(1)}%
System Health: ${performance.systemHealth.toFixed(1)}%
Error Rate: ${performance.errorRate.toFixed(2)}%
    `.trim();
  }

  private static formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
}
