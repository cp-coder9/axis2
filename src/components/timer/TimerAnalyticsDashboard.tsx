/**
 * Timer Analytics Dashboard Component
 * Visualizes timer usage statistics, productivity insights, and patterns
 */

import React, { useState, useEffect, useMemo } from 'react';
import './TimerAnalyticsDashboard.css';
import {
  TimerAnalytics,
  TimerAnalyticsReport,
  DateRange,
} from '../../utils/TimerAnalytics';
import { TimeLog, Project, User } from '../../types';

interface TimerAnalyticsDashboardProps {
  userId: string;
  userName: string;
  timeLogs: TimeLog[];
  projects: Project[];
  className?: string;
}

type PeriodOption = '7days' | '30days' | '90days' | 'custom';

export const TimerAnalyticsDashboard: React.FC<TimerAnalyticsDashboardProps> = ({
  userId,
  userName,
  timeLogs,
  projects,
  className = '',
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'patterns' | 'performance'>('overview');

  const dateRange = useMemo((): DateRange => {
    const endDate = new Date();
    let startDate = new Date();

    switch (selectedPeriod) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate.setTime(new Date(customEndDate).getTime());
        }
        break;
    }

    return { startDate, endDate };
  }, [selectedPeriod, customStartDate, customEndDate]);

  const report = useMemo((): TimerAnalyticsReport => {
    return TimerAnalytics.generateAnalyticsReport(
      userId,
      userName,
      timeLogs,
      projects,
      dateRange
    );
  }, [userId, userName, timeLogs, projects, dateRange]);

  const handleExportJSON = () => {
    const json = TimerAnalytics.exportToJSON(report);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timer-analytics-${userId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    const text = TimerAnalytics.formatReportForDisplay(report);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timer-analytics-${userId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`timer-analytics-dashboard ${className}`}>
      {/* Header */}
      <div className="analytics-header">
        <h2>Timer Analytics</h2>
        <div className="analytics-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as PeriodOption)}
            className="period-select"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {selectedPeriod === 'custom' && (
            <div className="custom-date-range">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="date-input"
              />
              <span>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="date-input"
              />
            </div>
          )}

          <button onClick={handleExportJSON} className="export-btn">
            Export JSON
          </button>
          <button onClick={handleExportText} className="export-btn">
            Export Text
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        <button
          className={`tab ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          Patterns
        </button>
        <button
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
      </div>

      {/* Content */}
      <div className="analytics-content">
        {activeTab === 'overview' && <OverviewTab report={report} />}
        {activeTab === 'insights' && <InsightsTab report={report} />}
        {activeTab === 'patterns' && <PatternsTab report={report} />}
        {activeTab === 'performance' && <PerformanceTab report={report} />}
      </div>
    </div>
  );
};

const OverviewTab: React.FC<{ report: TimerAnalyticsReport }> = ({ report }) => {
  const { statistics } = report;

  return (
    <div className="overview-tab">
      <div className="stats-grid">
        <StatCard
          title="Total Sessions"
          value={statistics.totalSessions}
          icon="📊"
        />
        <StatCard
          title="Total Time"
          value={formatMinutes(statistics.totalTimeMinutes)}
          icon="⏱️"
        />
        <StatCard
          title="Average Session"
          value={formatMinutes(statistics.averageSessionMinutes)}
          icon="📈"
        />
        <StatCard
          title="Longest Session"
          value={formatMinutes(statistics.longestSessionMinutes)}
          icon="🏆"
        />
        <StatCard
          title="Total Pauses"
          value={statistics.totalPauses}
          icon="⏸️"
        />
        <StatCard
          title="Timer Entries"
          value={`${statistics.timerEntries} / ${statistics.totalSessions}`}
          icon="⏲️"
        />
      </div>

      <div className="quick-insights">
        <h3>Quick Insights</h3>
        <div className="insight-cards">
          <InsightCard
            title="Consistency"
            value={`${report.insights.consistencyScore.toFixed(0)}%`}
            status={getScoreStatus(report.insights.consistencyScore)}
          />
          <InsightCard
            title="Efficiency"
            value={`${report.insights.efficiencyScore.toFixed(0)}%`}
            status={getScoreStatus(report.insights.efficiencyScore)}
          />
          <InsightCard
            title="Focus Time"
            value={formatMinutes(report.insights.averageFocusTime)}
            status={getFocusTimeStatus(report.insights.averageFocusTime)}
          />
        </div>
      </div>
    </div>
  );
};

const InsightsTab: React.FC<{ report: TimerAnalyticsReport }> = ({ report }) => {
  const { insights } = report;

  return (
    <div className="insights-tab">
      <div className="insights-section">
        <h3>Peak Productivity</h3>
        <div className="peak-info">
          <div className="peak-item">
            <strong>Peak Hours:</strong>
            <div className="peak-values">
              {insights.peakProductivityHours.map((hour) => (
                <span key={hour} className="peak-badge">
                  {hour}:00
                </span>
              ))}
            </div>
          </div>
          <div className="peak-item">
            <strong>Peak Days:</strong>
            <div className="peak-values">
              {insights.peakProductivityDays.map((day) => (
                <span key={day} className="peak-badge">
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h3>Productivity Metrics</h3>
        <div className="metrics-list">
          <MetricBar
            label="Consistency Score"
            value={insights.consistencyScore}
            max={100}
          />
          <MetricBar
            label="Efficiency Score"
            value={insights.efficiencyScore}
            max={100}
          />
          <MetricBar
            label="Distraction Rate"
            value={insights.distractionRate}
            max={100}
            inverse
          />
        </div>
      </div>

      <div className="insights-section">
        <h3>Recommendations</h3>
        <ul className="recommendations-list">
          {insights.recommendations.map((rec, index) => (
            <li key={index} className="recommendation-item">
              💡 {rec}
            </li>
          ))}
        </ul>
      </div>

      {insights.trends.length > 0 && (
        <div className="insights-section">
          <h3>Productivity Trends</h3>
          <div className="trends-chart">
            {insights.trends.slice(-14).map((trend) => (
              <div key={trend.date} className="trend-bar">
                <div
                  className="trend-fill"
                  style={{
                    height: `${(trend.focusScore / 100) * 100}%`,
                    backgroundColor: getTrendColor(trend.focusScore),
                  }}
                  title={`${trend.date}: ${formatMinutes(trend.totalMinutes)}`}
                />
                <span className="trend-label">
                  {new Date(trend.date).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PatternsTab: React.FC<{ report: TimerAnalyticsReport }> = ({ report }) => {
  const { patterns } = report;

  return (
    <div className="patterns-tab">
      <div className="pattern-section">
        <h3>Pattern Type: <span className="pattern-badge">{patterns.patternType}</span></h3>
      </div>

      <div className="pattern-section">
        <h3>Working Hours Distribution</h3>
        <div className="distribution-chart">
          {patterns.workingHoursDistribution.slice(0, 10).map((hour) => (
            <div key={hour.hour} className="distribution-item">
              <span className="distribution-label">{hour.hour}:00</span>
              <div className="distribution-bar-container">
                <div
                  className="distribution-bar"
                  style={{ width: `${hour.percentage}%` }}
                />
              </div>
              <span className="distribution-value">
                {formatMinutes(hour.minutes)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pattern-section">
        <h3>Day of Week Distribution</h3>
        <div className="day-distribution">
          {patterns.dayOfWeekDistribution.map((day) => (
            <div key={day.day} className="day-item">
              <div className="day-name">{day.day.slice(0, 3)}</div>
              <div
                className="day-bar"
                style={{ height: `${day.percentage}%` }}
                title={formatMinutes(day.minutes)}
              />
              <div className="day-value">{day.sessions}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pattern-section">
        <h3>Project Time Distribution</h3>
        <div className="project-distribution">
          {patterns.projectTimeDistribution.slice(0, 5).map((project) => (
            <div key={project.projectId} className="project-item">
              <div className="project-info">
                <span className="project-title">{project.projectTitle}</span>
                <span className="project-stats">
                  {formatMinutes(project.minutes)} • {project.sessions} sessions
                </span>
              </div>
              <div className="project-bar-container">
                <div
                  className="project-bar"
                  style={{ width: `${project.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pattern-section">
        <h3>Session Length Distribution</h3>
        <div className="session-distribution">
          <SessionLengthBar
            label="Short (< 30 min)"
            count={patterns.sessionLengthDistribution.short}
            color="#3b82f6"
          />
          <SessionLengthBar
            label="Medium (30-90 min)"
            count={patterns.sessionLengthDistribution.medium}
            color="#10b981"
          />
          <SessionLengthBar
            label="Long (90-180 min)"
            count={patterns.sessionLengthDistribution.long}
            color="#f59e0b"
          />
          <SessionLengthBar
            label="Very Long (> 180 min)"
            count={patterns.sessionLengthDistribution.veryLong}
            color="#ef4444"
          />
        </div>
      </div>
    </div>
  );
};

const PerformanceTab: React.FC<{ report: TimerAnalyticsReport }> = ({ report }) => {
  const { performance } = report;

  return (
    <div className="performance-tab">
      <div className="performance-grid">
        <PerformanceCard
          title="Accuracy"
          value={performance.accuracy}
          unit="%"
          description="Timer usage vs manual entries"
          status={getPerformanceStatus(performance.accuracy)}
        />
        <PerformanceCard
          title="Reliability"
          value={performance.reliability}
          unit="%"
          description="System stability and error rate"
          status={getPerformanceStatus(performance.reliability)}
        />
        <PerformanceCard
          title="User Engagement"
          value={performance.userEngagement}
          unit="%"
          description="Active usage frequency"
          status={getPerformanceStatus(performance.userEngagement)}
        />
        <PerformanceCard
          title="System Health"
          value={performance.systemHealth}
          unit="%"
          description="Overall system performance"
          status={getPerformanceStatus(performance.systemHealth)}
        />
      </div>

      <div className="performance-details">
        <h3>Detailed Metrics</h3>
        <div className="metrics-table">
          <div className="metric-row">
            <span className="metric-label">Error Rate</span>
            <span className="metric-value">{performance.errorRate.toFixed(2)}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Recovery Rate</span>
            <span className="metric-value">{performance.recoveryRate.toFixed(1)}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Average Response Time</span>
            <span className="metric-value">{performance.averageResponseTime}ms</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">System Uptime</span>
            <span className="metric-value">{performance.uptime.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components

const StatCard: React.FC<{ title: string; value: string | number; icon: string }> = ({
  title,
  value,
  icon,
}) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  </div>
);

const InsightCard: React.FC<{
  title: string;
  value: string;
  status: 'good' | 'warning' | 'poor';
}> = ({ title, value, status }) => (
  <div className={`insight-card insight-${status}`}>
    <div className="insight-title">{title}</div>
    <div className="insight-value">{value}</div>
  </div>
);

const MetricBar: React.FC<{
  label: string;
  value: number;
  max: number;
  inverse?: boolean;
}> = ({ label, value, max, inverse = false }) => {
  const percentage = (value / max) * 100;
  const status = inverse
    ? percentage > 70 ? 'poor' : percentage > 40 ? 'warning' : 'good'
    : percentage > 70 ? 'good' : percentage > 40 ? 'warning' : 'poor';

  return (
    <div className="metric-bar">
      <div className="metric-bar-header">
        <span className="metric-bar-label">{label}</span>
        <span className="metric-bar-value">{value.toFixed(1)}</span>
      </div>
      <div className="metric-bar-container">
        <div
          className={`metric-bar-fill metric-bar-${status}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const SessionLengthBar: React.FC<{ label: string; count: number; color: string }> = ({
  label,
  count,
  color,
}) => (
  <div className="session-length-item">
    <span className="session-length-label">{label}</span>
    <div className="session-length-bar-container">
      <div
        className="session-length-bar"
        style={{ width: `${count * 10}%`, backgroundColor: color }}
      />
    </div>
    <span className="session-length-count">{count}</span>
  </div>
);

const PerformanceCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  description: string;
  status: 'good' | 'warning' | 'poor';
}> = ({ title, value, unit, description, status }) => (
  <div className={`performance-card performance-${status}`}>
    <h4>{title}</h4>
    <div className="performance-value">
      {value.toFixed(1)}
      <span className="performance-unit">{unit}</span>
    </div>
    <p className="performance-description">{description}</p>
  </div>
);

// Helper Functions

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function getScoreStatus(score: number): 'good' | 'warning' | 'poor' {
  if (score >= 70) return 'good';
  if (score >= 40) return 'warning';
  return 'poor';
}

function getFocusTimeStatus(minutes: number): 'good' | 'warning' | 'poor' {
  if (minutes >= 45 && minutes <= 90) return 'good';
  if (minutes >= 30 && minutes <= 120) return 'warning';
  return 'poor';
}

function getPerformanceStatus(value: number): 'good' | 'warning' | 'poor' {
  if (value >= 80) return 'good';
  if (value >= 60) return 'warning';
  return 'poor';
}

function getTrendColor(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

export default TimerAnalyticsDashboard;
