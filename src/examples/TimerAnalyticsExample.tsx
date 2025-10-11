/**
 * Timer Analytics Usage Example
 * Demonstrates how to use the TimerAnalytics system
 */

import React from 'react';
import { TimerAnalytics, DateRange } from '../utils/TimerAnalytics';
import { TimerAnalyticsDashboard } from '../components/timer/TimerAnalyticsDashboard';
import { TimeLog, Project } from '../types';
import { Timestamp } from 'firebase/firestore';

/**
 * Example 1: Generate usage statistics
 */
export function generateUsageStatisticsExample(timeLogs: TimeLog[]) {
  const period: DateRange = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  };

  const statistics = TimerAnalytics.generateUsageStatistics(timeLogs, period);

  console.log('Usage Statistics:', {
    totalSessions: statistics.totalSessions,
    totalTime: `${Math.floor(statistics.totalTimeMinutes / 60)}h ${statistics.totalTimeMinutes % 60}m`,
    averageSession: `${Math.floor(statistics.averageSessionMinutes)}m`,
    timerVsManual: `${statistics.timerEntries} / ${statistics.manualEntries}`,
  });

  return statistics;
}

/**
 * Example 2: Generate productivity insights
 */
export function generateProductivityInsightsExample(timeLogs: TimeLog[]) {
  const period: DateRange = {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date(),
  };

  const insights = TimerAnalytics.generateProductivityInsights(timeLogs, period);

  console.log('Productivity Insights:', {
    peakHours: insights.peakProductivityHours,
    peakDays: insights.peakProductivityDays,
    consistencyScore: `${insights.consistencyScore.toFixed(1)}/100`,
    efficiencyScore: `${insights.efficiencyScore.toFixed(1)}/100`,
    recommendations: insights.recommendations,
  });

  return insights;
}

/**
 * Example 3: Analyze time tracking patterns
 */
export function analyzeTimeTrackingPatternsExample(
  timeLogs: TimeLog[],
  projects: Project[]
) {
  const patterns = TimerAnalytics.analyzeTimeTrackingPatterns(timeLogs, projects);

  console.log('Time Tracking Patterns:', {
    patternType: patterns.patternType,
    topWorkingHours: patterns.workingHoursDistribution.slice(0, 3),
    topProjects: patterns.projectTimeDistribution.slice(0, 3),
    sessionDistribution: patterns.sessionLengthDistribution,
  });

  return patterns;
}

/**
 * Example 4: Calculate performance metrics
 */
export function calculatePerformanceMetricsExample(timeLogs: TimeLog[]) {
  const performance = TimerAnalytics.calculatePerformanceMetrics(timeLogs);

  console.log('Performance Metrics:', {
    accuracy: `${performance.accuracy.toFixed(1)}%`,
    reliability: `${performance.reliability.toFixed(1)}%`,
    userEngagement: `${performance.userEngagement.toFixed(1)}%`,
    systemHealth: `${performance.systemHealth.toFixed(1)}%`,
  });

  return performance;
}

/**
 * Example 5: Generate comprehensive analytics report
 */
export function generateComprehensiveReportExample(
  userId: string,
  userName: string,
  timeLogs: TimeLog[],
  projects: Project[]
) {
  const period: DateRange = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  };

  const report = TimerAnalytics.generateAnalyticsReport(
    userId,
    userName,
    timeLogs,
    projects,
    period
  );

  // Export to JSON
  const jsonReport = TimerAnalytics.exportToJSON(report);
  console.log('JSON Report:', jsonReport);

  // Format for display
  const textReport = TimerAnalytics.formatReportForDisplay(report);
  console.log('Text Report:', textReport);

  return report;
}

/**
 * Example 6: Using the TimerAnalyticsDashboard component
 */
export const TimerAnalyticsExampleComponent: React.FC<{
  userId: string;
  userName: string;
  timeLogs: TimeLog[];
  projects: Project[];
}> = ({ userId, userName, timeLogs, projects }) => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Timer Analytics Dashboard</h1>
      <TimerAnalyticsDashboard
        userId={userId}
        userName={userName}
        timeLogs={timeLogs}
        projects={projects}
      />
    </div>
  );
};

/**
 * Example 7: Create sample data for testing
 */
export function createSampleTimeLogs(): TimeLog[] {
  const now = Date.now();
  const sampleLogs: TimeLog[] = [];

  // Generate 30 days of sample data
  for (let day = 0; day < 30; day++) {
    const sessionsPerDay = Math.floor(Math.random() * 5) + 2; // 2-6 sessions per day

    for (let session = 0; session < sessionsPerDay; session++) {
      const startTime = now - (day * 24 * 60 * 60 * 1000) + (session * 2 * 60 * 60 * 1000);
      const duration = Math.floor(Math.random() * 120) + 30; // 30-150 minutes

      sampleLogs.push({
        id: `log_${day}_${session}`,
        startTime: Timestamp.fromMillis(startTime),
        endTime: Timestamp.fromMillis(startTime + duration * 60 * 1000),
        durationMinutes: duration,
        notes: `Sample session ${session + 1} on day ${day + 1}`,
        manualEntry: Math.random() > 0.8, // 20% manual entries
        projectId: `project_${Math.floor(Math.random() * 3) + 1}`,
        jobCardId: `job_${Math.floor(Math.random() * 5) + 1}`,
        loggedById: 'user_123',
        loggedByName: 'Sample User',
        hourlyRate: 50,
        earnings: (duration / 60) * 50,
        pausedTime: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
      });
    }
  }

  return sampleLogs;
}

/**
 * Example 8: Integration with AppContext
 */
export function integrateWithAppContext(appContext: any) {
  // Assuming appContext has user, projects, and time logs
  const { user, projects } = appContext;

  // Get all time logs for the current user
  const userTimeLogs = projects
    .flatMap((project: Project) =>
      project.jobCards?.flatMap((jobCard) => jobCard.timeLogs || []) || []
    )
    .filter((log: TimeLog) => log.loggedById === user?.id);

  // Generate analytics report
  const report = TimerAnalytics.generateAnalyticsReport(
    user.id,
    user.name,
    userTimeLogs,
    projects,
    {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    }
  );

  return report;
}

/**
 * Example 9: Scheduled analytics generation
 */
export function scheduleWeeklyAnalytics(
  userId: string,
  userName: string,
  getTimeLogs: () => TimeLog[],
  getProjects: () => Project[],
  onReportGenerated: (report: any) => void
) {
  // Generate weekly analytics every Monday at 9 AM
  const generateWeeklyReport = () => {
    const timeLogs = getTimeLogs();
    const projects = getProjects();

    const report = TimerAnalytics.generateAnalyticsReport(
      userId,
      userName,
      timeLogs,
      projects,
      {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      }
    );

    onReportGenerated(report);
  };

  // Check if it's Monday and 9 AM
  const checkSchedule = () => {
    const now = new Date();
    if (now.getDay() === 1 && now.getHours() === 9) {
      generateWeeklyReport();
    }
  };

  // Check every hour
  const intervalId = setInterval(checkSchedule, 60 * 60 * 1000);

  return () => clearInterval(intervalId);
}

/**
 * Example 10: Export analytics to different formats
 */
export function exportAnalyticsExample(report: any) {
  // Export to JSON
  const jsonBlob = new Blob([TimerAnalytics.exportToJSON(report)], {
    type: 'application/json',
  });

  // Export to text
  const textBlob = new Blob([TimerAnalytics.formatReportForDisplay(report)], {
    type: 'text/plain',
  });

  // Create download links
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const textUrl = URL.createObjectURL(textBlob);

  console.log('Download JSON:', jsonUrl);
  console.log('Download Text:', textUrl);

  return { jsonUrl, textUrl };
}

export default TimerAnalyticsExampleComponent;
