/**
 * Historical Trends Analysis Component
 * Advanced analytics with trend analysis, forecasting, and historical data visualization
 */

import React, { useState, useEffect, useMemo } from 'react';
import { realTimeAnalyticsService, LiveAnalyticsDashboard } from '../../services/realTimeAnalyticsService';
import { PredictiveAnalyticsService } from '../../services/predictiveAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendingUp, TrendingDown, Calendar, BarChart3, LineChart, PieChart, Activity } from 'lucide-react';

interface HistoricalDataPoint {
    date: Date;
    utilization: number;
    revenue: number;
    activeSlots: number;
    completedSlots: number;
    alertsTriggered: number;
}

interface TrendAnalysis {
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    confidence: number;
    period: string;
    description: string;
}

interface HistoricalTrendsAnalysisProps {
    className?: string;
}

export const HistoricalTrendsAnalysis: React.FC<HistoricalTrendsAnalysisProps> = ({
    className = ''
}) => {
    const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const [selectedMetric, setSelectedMetric] = useState<'utilization' | 'revenue' | 'activeSlots' | 'alertsTriggered'>('utilization');
    const [isLoading, setIsLoading] = useState(true);

    // Load historical data
    useEffect(() => {
        const loadHistoricalData = async () => {
            setIsLoading(true);
            try {
                const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
                const data = await realTimeAnalyticsService.getHistoricalAnalytics(days);
                setHistoricalData(data);
            } catch (error) {
                console.error('Error loading historical data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadHistoricalData();
    }, [selectedPeriod]);

    // Calculate trend analysis
    const trendAnalysis = useMemo(() => {
        if (historicalData.length < 2) return null;

        const recent = historicalData.slice(-7); // Last 7 days
        const previous = historicalData.slice(-14, -7); // Previous 7 days

        const calculateTrend = (data: HistoricalDataPoint[], metric: keyof HistoricalDataPoint): TrendAnalysis => {
            const recentAvg = data.reduce((sum, d) => sum + (d[metric] as number), 0) / data.length;
            const previousAvg = previous.reduce((sum, d) => sum + (d[metric] as number), 0) / previous.length;

            const change = recentAvg - previousAvg;
            const magnitude = Math.abs(change / previousAvg) * 100;
            const direction = change > 1 ? 'up' : change < -1 ? 'down' : 'stable';

            let confidence = 0.7; // Base confidence
            if (magnitude > 20) confidence += 0.1;
            if (magnitude > 50) confidence += 0.1;
            if (historicalData.length > 30) confidence += 0.1;

            const descriptions = {
                utilization: {
                    up: `Utilization rate increased by ${magnitude.toFixed(1)}%`,
                    down: `Utilization rate decreased by ${magnitude.toFixed(1)}%`,
                    stable: 'Utilization rate remained stable'
                },
                revenue: {
                    up: `Revenue increased by ${magnitude.toFixed(1)}%`,
                    down: `Revenue decreased by ${magnitude.toFixed(1)}%`,
                    stable: 'Revenue remained stable'
                },
                activeSlots: {
                    up: `Active slots increased by ${magnitude.toFixed(1)}%`,
                    down: `Active slots decreased by ${magnitude.toFixed(1)}%`,
                    stable: 'Active slots remained stable'
                },
                alertsTriggered: {
                    up: `Alerts increased by ${magnitude.toFixed(1)}%`,
                    down: `Alerts decreased by ${magnitude.toFixed(1)}%`,
                    stable: 'Alerts remained stable'
                }
            };

            return {
                direction,
                magnitude,
                confidence,
                period: 'last 7 days vs previous 7 days',
                description: descriptions[metric][direction]
            };
        };

        return calculateTrend(recent, selectedMetric);
    }, [historicalData, selectedMetric]);

    // Calculate forecast data
    const forecastData = useMemo(() => {
        if (historicalData.length < 7) return [];

        const values = historicalData.map(d => d[selectedMetric] as number);
        const forecast = PredictiveAnalyticsService.generateSimpleForecast(values, 7); // 7-day forecast

        return forecast.map((value, index) => ({
            date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
            value: Math.max(0, value), // Ensure non-negative values
            isForecast: true
        }));
    }, [historicalData, selectedMetric]);

    // Calculate statistics
    const statistics = useMemo(() => {
        if (historicalData.length === 0) return null;

        const values = historicalData.map(d => d[selectedMetric] as number);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const volatility = values.length > 1 ?
            Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (values.length - 1)) : 0;

        return {
            average: avg,
            maximum: max,
            minimum: min,
            volatility: volatility,
            range: max - min,
            total: values.reduce((sum, val) => sum + val, 0)
        };
    }, [historicalData, selectedMetric]);

    const formatValue = (value: number): string => {
        switch (selectedMetric) {
            case 'utilization':
            case 'alertsTriggered':
                return value.toFixed(1);
            case 'revenue':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(value);
            case 'activeSlots':
                return value.toFixed(0);
            default:
                return value.toFixed(2);
        }
    };

    const getMetricLabel = (): string => {
        switch (selectedMetric) {
            case 'utilization': return 'Utilization Rate (%)';
            case 'revenue': return 'Revenue ($)';
            case 'activeSlots': return 'Active Slots';
            case 'alertsTriggered': return 'Alerts Triggered';
            default: return 'Value';
        }
    };

    const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
        switch (direction) {
            case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
            default: return <Activity className="h-4 w-4 text-gray-600" />;
        }
    };

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center h-64 ${className}`}>
                <div className="text-center">
                    <Activity className="h-8 w-8 animate-pulse mx-auto mb-4" />
                    <p>Loading historical trends...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Historical Trends Analysis</h2>
                    <p className="text-sm text-gray-600">
                        Analyze patterns and forecast future performance
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">7 Days</SelectItem>
                                <SelectItem value="30d">30 Days</SelectItem>
                                <SelectItem value="90d">90 Days</SelectItem>
                                <SelectItem value="1y">1 Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <Select value={selectedMetric} onValueChange={(value: 'utilization' | 'revenue' | 'activeSlots' | 'alertsTriggered') => setSelectedMetric(value)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="utilization">Utilization</SelectItem>
                                <SelectItem value="revenue">Revenue</SelectItem>
                                <SelectItem value="activeSlots">Active Slots</SelectItem>
                                <SelectItem value="alertsTriggered">Alerts</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatValue(statistics.average)}</div>
                            <p className="text-xs text-muted-foreground">Over selected period</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Peak</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatValue(statistics.maximum)}</div>
                            <p className="text-xs text-muted-foreground">Highest value</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Volatility</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatValue(statistics.volatility)}</div>
                            <p className="text-xs text-muted-foreground">Standard deviation</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Range</CardTitle>
                            <LineChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatValue(statistics.range)}</div>
                            <p className="text-xs text-muted-foreground">Max - Min</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Trend Analysis */}
            {trendAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            {getTrendIcon(trendAnalysis.direction)}
                            <span>Trend Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-medium">{trendAnalysis.description}</p>
                                    <p className="text-sm text-gray-600">Compared to {trendAnalysis.period}</p>
                                </div>
                                <Badge variant={
                                    trendAnalysis.direction === 'up' ? 'default' :
                                        trendAnalysis.direction === 'down' ? 'destructive' : 'secondary'
                                }>
                                    {trendAnalysis.confidence.toFixed(0)}% confidence
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Direction</p>
                                    <p className="font-medium capitalize">{trendAnalysis.direction}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Magnitude</p>
                                    <p className="font-medium">{trendAnalysis.magnitude.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Confidence</p>
                                    <p className="font-medium">{(trendAnalysis.confidence * 100).toFixed(0)}%</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Period</p>
                                    <p className="font-medium">{trendAnalysis.period}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Chart Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <LineChart className="h-5 w-5" />
                        <span>{getMetricLabel()} Over Time</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-center">
                            <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 mb-2">Interactive Chart</p>
                            <p className="text-sm text-gray-400">
                                Chart component would be integrated here showing historical data and forecasts
                            </p>
                            <div className="mt-4 text-xs text-gray-400">
                                <p>Data points: {historicalData.length}</p>
                                <p>Forecast points: {forecastData.length}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Forecast Insights */}
            {forecastData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5" />
                            <span>7-Day Forecast</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                                {forecastData.map((point, index) => (
                                    <div key={index} className="text-center p-3 border rounded-lg bg-blue-50">
                                        <p className="text-sm font-medium">
                                            {point.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {formatValue(point.value)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="text-sm text-gray-600">
                                <p>
                                    <strong>Forecast Method:</strong> Simple exponential smoothing with trend analysis
                                </p>
                                <p>
                                    <strong>Based on:</strong> {historicalData.length} days of historical data
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Seasonal Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <PieChart className="h-5 w-5" />
                        <span>Pattern Recognition</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium mb-3">Weekly Patterns</h4>
                                <div className="space-y-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                                        const dayData = historicalData.filter(d => d.date.getDay() === index);
                                        const avg = dayData.length > 0 ?
                                            dayData.reduce((sum, d) => sum + (d[selectedMetric] as number), 0) / dayData.length : 0;

                                        return (
                                            <div key={day} className="flex items-center justify-between">
                                                <span className="text-sm">{day}</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${Math.min(100, (avg / (statistics?.maximum || 1)) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium w-16 text-right">
                                                        {formatValue(avg)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-3">Performance Insights</h4>
                                <div className="space-y-3">
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm font-medium text-green-800">Best Performing Day</p>
                                        <p className="text-lg font-bold text-green-600">
                                            {statistics ? formatValue(statistics.maximum) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm font-medium text-blue-800">Average Performance</p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {statistics ? formatValue(statistics.average) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-orange-50 rounded-lg">
                                        <p className="text-sm font-medium text-orange-800">Volatility Level</p>
                                        <p className="text-lg font-bold text-orange-600">
                                            {statistics ? (statistics.volatility > statistics.average * 0.3 ? 'High' :
                                                statistics.volatility > statistics.average * 0.15 ? 'Medium' : 'Low') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};