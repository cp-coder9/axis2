import { Project, User } from '../types';

// Interfaces for analytics data
export interface KPI {
  label: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  changeLabel?: string;
}

export interface ProjectPrediction {
  projectId: string;
  projectTitle: string;
  completionProbability: number;
  estimatedCompletionDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
  delayRisk: number; // days
}

export interface ResourceUtilization {
  userId: string;
  userName: string;
  role: string;
  utilizationPercent: number;
  hoursLogged: number;
  efficiency: number;
  projectCount: number;
}

export interface ClientSatisfaction {
  clientId: string;
  clientName: string;
  satisfactionScore: number;
  projectsCompleted: number;
  averageProjectDuration: number;
  onTimeDeliveryRate: number;
  budgetAdherence: number;
}

export interface PerformanceMetrics {
  averageProjectDuration: number;
  onTimeDeliveryRate: number;
  budgetVariance: number;
  teamEfficiency: number;
  clientRetentionRate: number;
  profitMargin: number;
}

export interface TrendData {
  projectCompletionTrend: { date: string; completed: number; started: number }[];
  revenueProjection: { month: string; actual: number; projected: number }[];
  teamProductivityTrend: { date: string; hoursLogged: number; tasksCompleted: number }[];
  clientAcquisitionTrend: { month: string; newClients: number; totalClients: number }[];
}

export interface BusinessIntelligenceData {
  kpis: KPI[];
  projectPredictions: ProjectPrediction[];
  resourceUtilization: ResourceUtilization[];
  clientSatisfaction: ClientSatisfaction[];
  performanceMetrics: PerformanceMetrics;
  trendData: TrendData;
}

/**
 * Generate analytics data for the dashboard
 * Simplified version for shadcn migration
 */
export function generateAnalytics(projects: Project[] = [], users: User[] = []): BusinessIntelligenceData {
  // Generate mock KPIs
  const kpis: KPI[] = [
    {
      label: 'Active Projects',
      value: projects.length || 3,
      trend: 'up',
      change: 2,
      changeLabel: 'this month'
    },
    {
      label: 'Total Users',
      value: users.length || 12,
      trend: 'up',
      change: 3,
      changeLabel: 'new this month'
    },
    {
      label: 'Hours Logged',
      value: 1240,
      unit: 'hrs',
      trend: 'up',
      change: 15,
      changeLabel: '% increase'
    },
    {
      label: 'Revenue',
      value: 85000,
      unit: '$',
      trend: 'up',
      change: 12,
      changeLabel: '% this quarter'
    },
    {
      label: 'Completed',
      value: 18,
      trend: 'up',
      change: 4,
      changeLabel: 'this month'
    },
    {
      label: 'Team Efficiency',
      value: 94,
      unit: '%',
      trend: 'up',
      change: 8,
      changeLabel: '% improvement'
    }
  ];

  // Generate mock project predictions
  const projectPredictions: ProjectPrediction[] = projects.slice(0, 3).map((project, index) => ({
    projectId: project.id,
    projectTitle: project.title,
    completionProbability: 0.85 - (index * 0.1),
    estimatedCompletionDate: new Date(Date.now() + (30 + index * 15) * 24 * 60 * 60 * 1000),
    riskLevel: index === 0 ? 'low' : index === 1 ? 'medium' : 'high',
    delayRisk: index * 5
  }));

  // Generate mock resource utilization
  const resourceUtilization: ResourceUtilization[] = users.map((user, index) => ({
    userId: user.id,
    userName: user.name,
    role: user.role,
    utilizationPercent: 75 + (index * 10) % 30,
    hoursLogged: 160 + (index * 20) % 60,
    efficiency: 0.8 + (index * 0.05) % 0.2,
    projectCount: 2 + index % 3
  }));

  // Generate mock client satisfaction
  const clientSatisfaction: ClientSatisfaction[] = [
    {
      clientId: 'client-1',
      clientName: 'Modern Architecture Co.',
      satisfactionScore: 92,
      projectsCompleted: 8,
      averageProjectDuration: 45,
      onTimeDeliveryRate: 0.95,
      budgetAdherence: 0.98
    },
    {
      clientId: 'client-2',
      clientName: 'Urban Planning Ltd.',
      satisfactionScore: 88,
      projectsCompleted: 5,
      averageProjectDuration: 38,
      onTimeDeliveryRate: 0.90,
      budgetAdherence: 0.92
    }
  ];

  // Generate mock performance metrics
  const performanceMetrics: PerformanceMetrics = {
    averageProjectDuration: 42,
    onTimeDeliveryRate: 0.92,
    budgetVariance: 3.5,
    teamEfficiency: 2.3,
    clientRetentionRate: 0.89,
    profitMargin: 24.8
  };

  // Generate mock trend data
  const trendData: TrendData = {
    projectCompletionTrend: [
      { date: '2025-07', completed: 12, started: 15 },
      { date: '2025-08', completed: 18, started: 12 },
      { date: '2025-09', completed: 14, started: 18 },
    ],
    revenueProjection: [
      { month: 'Jul 2025', actual: 75000, projected: 78000 },
      { month: 'Aug 2025', actual: 85000, projected: 82000 },
      { month: 'Sep 2025', actual: 0, projected: 88000 },
    ],
    teamProductivityTrend: [
      { date: '2025-07', hoursLogged: 1150, tasksCompleted: 45 },
      { date: '2025-08', hoursLogged: 1240, tasksCompleted: 52 },
      { date: '2025-09', hoursLogged: 980, tasksCompleted: 38 },
    ],
    clientAcquisitionTrend: [
      { month: 'Jul 2025', newClients: 2, totalClients: 28 },
      { month: 'Aug 2025', newClients: 3, totalClients: 31 },
      { month: 'Sep 2025', newClients: 1, totalClients: 32 },
    ]
  };

  return {
    kpis,
    projectPredictions,
    resourceUtilization,
    clientSatisfaction,
    performanceMetrics,
    trendData
  };
}

/**
 * Generate business intelligence data (alias for generateAnalytics)
 */
export function generateBusinessIntelligence(projects: Project[] = [], users: User[] = []): BusinessIntelligenceData {
  return generateAnalytics(projects, users);
}