/**
 * Real-Time Analytics Dashboard Component
 * Displays live utilization metrics, alerts, and predictive insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import { realTimeAnalyticsService, LiveAnalyticsDashboard, AnalyticsAlert, PredictiveInsight } from '../../services/realTimeAnalyticsService';
import { AdvancedExportService, ExportOptions, exportUtils } from '../../services/advancedExportService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { RefreshCw, AlertTriangle, TrendingUp, Users, DollarSign, Clock, Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';

interface RealTimeAnalyticsDashboardProps {
    className?: string;
}

export const RealTimeAnalyticsDashboard: React.FC<RealTimeAnalyticsDashboardProps> = ({
    className = ''
}) => {
    const [liveData, setLiveData] = useState<LiveAnalyticsDashboard | null>(null);
    const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
    const [predictions, setPredictions] = useState<PredictiveInsight[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isExporting, setIsExporting] = useState(false);

    // Subscribe to live updates
    useEffect(() => {
        const unsubscribeDashboard = realTimeAnalyticsService.onDashboardUpdate((data) => {
            setLiveData(data);
            setLastUpdate(new Date());
        });

        const unsubscribeAlerts = realTimeAnalyticsService.onAlert((alert) => {
            setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
        });

        const unsubscribePredictions = realTimeAnalyticsService.onPrediction((prediction) => {
            setPredictions(prev => [prediction, ...prev.slice(0, 4)]); // Keep last 5 predictions
        });

        // Initial data load
        const loadInitialData = async () => {
            try {
                const data = await realTimeAnalyticsService.getLiveAnalyticsData();
                setLiveData(data);
                setLastUpdate(new Date());
            } catch (error) {
                console.error('Error loading initial analytics data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();

        // Start monitoring
        realTimeAnalyticsService.startMonitoring();

        return () => {
            realTimeAnalyticsService.stopMonitoring();
            unsubscribeDashboard();
            unsubscribeAlerts();
            unsubscribePredictions();
        };
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await realTimeAnalyticsService.getLiveAnalyticsData();
            setLiveData(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error refreshing analytics data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleExport = useCallback(async (format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON') => {
        if (!liveData) return;

        setIsExporting(true);
        try {
            const exportOptions: ExportOptions = {
                format,
                includeCharts: true,
                includeRawData: true,
                dateRange: {
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    endDate: new Date()
                },
                sections: {
                    utilization: true,
                    projects: true,
                    alerts: true,
                    predictions: true,
                    trends: true
                },
                filters: {}
            };

            const result = await AdvancedExportService.exportAnalyticsDashboard(
                liveData,
                alerts,
                predictions,
                exportOptions
            );

            // Download the file
            if (result.content instanceof Blob) {
                exportUtils.downloadBlob(result);
            } else {
                exportUtils.downloadString(result);
            }
        } catch (error) {
            console.error('Error exporting analytics data:', error);
            // TODO: Show error toast/notification
        } finally {
            setIsExporting(false);
        }
    }, [liveData, alerts, predictions]);

    const getUtilizationColor = (utilization: number): string => {
        if (utilization >= 80) return 'text-green-600';
        if (utilization >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getUtilizationBgColor = (utilization: number): string => {
        if (utilization >= 80) return 'bg-green-100';
        if (utilization >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatPercentage = (value: number): string => {
        return `${value.toFixed(1)}%`;
    };

    if (isLoading && !liveData) {
        return (
            <div className={`flex items-center justify-center h-64 ${className}`}>
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading real-time analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Real-Time Analytics Dashboard</h2>
                    <p className="text-sm text-gray-600">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <div className="flex items-center space-x-1">
                        <Button
                            onClick={() => handleExport('PDF')}
                            disabled={isExporting || !liveData}
                            variant="outline"
                            size="sm"
                            title="Export as PDF"
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => handleExport('EXCEL')}
                            disabled={isExporting || !liveData}
                            variant="outline"
                            size="sm"
                            title="Export as Excel"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => handleExport('CSV')}
                            disabled={isExporting || !liveData}
                            variant="outline"
                            size="sm"
                            title="Export as CSV"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => handleExport('JSON')}
                            disabled={isExporting || !liveData}
                            variant="outline"
                            size="sm"
                            title="Export as JSON"
                        >
                            <FileJson className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* System Overview Cards */}
            {liveData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Slots</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{liveData.systemOverview.totalActiveSlots}</div>
                            <p className="text-xs text-muted-foreground">Currently in progress</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(liveData.systemOverview.totalRevenueToday)}</div>
                            <p className="text-xs text-muted-foreground">Today's earnings</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${getUtilizationColor(liveData.systemOverview.averageUtilization)}`}>
                                {formatPercentage(liveData.systemOverview.averageUtilization)}
                            </div>
                            <p className="text-xs text-muted-foreground">Across all freelancers</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{alerts.filter(a => !a.acknowledged).length}</div>
                            <p className="text-xs text-muted-foreground">Require attention</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content Tabs */}
            <Tabs defaultValue="utilization" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="utilization">Freelancer Utilization</TabsTrigger>
                    <TabsTrigger value="projects">Project Performance</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
                    <TabsTrigger value="predictions">Predictions</TabsTrigger>
                </TabsList>

                {/* Freelancer Utilization Tab */}
                <TabsContent value="utilization" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Freelancer Utilization</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {liveData?.utilizationData.length ? (
                                <div className="space-y-4">
                                    {liveData.utilizationData.map((freelancer) => (
                                        <div key={freelancer.freelancerId} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Users className="h-4 w-4" />
                                                    <span className="font-medium">{freelancer.freelancerName}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant={freelancer.currentUtilization >= 80 ? 'default' : 'secondary'}>
                                                        {formatPercentage(freelancer.currentUtilization)}
                                                    </Badge>
                                                    <span className="text-sm text-gray-600">
                                                        Target: {formatPercentage(freelancer.targetUtilization)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Progress
                                                value={freelancer.currentUtilization}
                                                className="h-2"
                                            />
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Active Slots: {freelancer.activeSlots}</span>
                                                <span>Completed: {freelancer.completedSlots}</span>
                                                <span>Revenue: {formatCurrency(freelancer.revenueToday)}</span>
                                                <span>Efficiency: {formatPercentage(freelancer.efficiencyScore)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">No freelancer data available</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Project Performance Tab */}
                <TabsContent value="projects" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {liveData?.projectData.length ? (
                                <div className="space-y-4">
                                    {liveData.projectData.map((project) => (
                                        <div key={project.projectId} className="border rounded-lg p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium">{project.projectTitle}</h3>
                                                <Badge variant={project.utilizationRate >= 80 ? 'default' : 'secondary'}>
                                                    {formatPercentage(project.utilizationRate)} Utilized
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Budget Utilization</p>
                                                    <p className="font-medium">{formatPercentage(project.budgetUtilization)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Active Freelancers</p>
                                                    <p className="font-medium">{project.activeFreelancers}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Completed Slots</p>
                                                    <p className="font-medium">{project.completedSlots}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Profit Margin</p>
                                                    <p className={`font-medium ${project.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatPercentage(project.profitMargin)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Revenue Generated: {formatCurrency(project.revenueGenerated)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">No project data available</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {alerts.length > 0 ? (
                                <div className="space-y-4">
                                    {alerts.map((alert) => (
                                        <Alert key={alert.id} className={
                                            alert.severity === 'CRITICAL' ? 'border-red-500' :
                                                alert.severity === 'HIGH' ? 'border-orange-500' :
                                                    alert.severity === 'MEDIUM' ? 'border-yellow-500' : 'border-blue-500'
                                        }>
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>{alert.title}</AlertTitle>
                                            <AlertDescription>
                                                <div className="space-y-2">
                                                    <p>{alert.message}</p>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Current: {alert.currentValue.toFixed(1)}, Threshold: {alert.threshold}</span>
                                                        <span>{alert.affectedEntity.name}</span>
                                                    </div>
                                                    <p className="text-sm font-medium">Recommendation: {alert.recommendedAction}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {alert.triggeredAt.toDate().toLocaleString()}
                                                    </p>
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">No active alerts</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Predictions Tab */}
                <TabsContent value="predictions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Predictive Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {predictions.length > 0 ? (
                                <div className="space-y-4">
                                    {predictions.map((prediction, index) => (
                                        <div key={index} className="border rounded-lg p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium">{prediction.type.replace('_', ' ')}</h3>
                                                <Badge variant="outline">
                                                    {prediction.prediction.confidence.toFixed(0)}% confidence
                                                </Badge>
                                            </div>
                                            <p className="text-sm">{prediction.entityName}</p>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Predicted Value</p>
                                                    <p className="font-medium">
                                                        {prediction.type.includes('UTILIZATION') || prediction.type.includes('EFFICIENCY')
                                                            ? formatPercentage(prediction.prediction.value)
                                                            : formatCurrency(prediction.prediction.value)
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Timeframe</p>
                                                    <p className="font-medium">{prediction.prediction.timeframe.replace('_', ' ').toLowerCase()}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-sm">Factors:</p>
                                                <ul className="text-sm list-disc list-inside">
                                                    {prediction.factors.map((factor, i) => (
                                                        <li key={i}>{factor}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-sm">Recommendations:</p>
                                                <ul className="text-sm list-disc list-inside">
                                                    {prediction.recommendations.map((rec, i) => (
                                                        <li key={i}>{rec}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">No predictions available</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};