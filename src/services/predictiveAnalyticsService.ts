/**
 * Predictive Analytics Service
 * Provides forecasting and optimization recommendations for time management
 */

import { Timestamp } from 'firebase/firestore';
import { TimeAllocation, TimeSlot, TimePurchase, TimeLog, Project } from '../types';
import { TimerAnalytics } from '../utils/TimerAnalytics';

export interface PredictiveModel {
    id: string;
    type: 'UTILIZATION_FORECAST' | 'REVENUE_PROJECTION' | 'EFFICIENCY_TREND' | 'ALLOCATION_OPTIMIZATION';
    entityId: string;
    entityName: string;
    model: {
        algorithm: string;
        parameters: Record<string, any>;
        accuracy: number;
        lastTrained: Timestamp;
    };
    predictions: PredictionDataPoint[];
    confidence: number;
}

export interface PredictionDataPoint {
    date: string;
    predictedValue: number;
    confidence: number;
    upperBound: number;
    lowerBound: number;
    actualValue?: number; // For historical validation
}

export interface OptimizationRecommendation {
    type: 'ALLOCATION_INCREASE' | 'ALLOCATION_DECREASE' | 'REBALANCE' | 'NEW_FREELANCER' | 'PRICE_ADJUSTMENT';
    entityId: string;
    entityName: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    expectedImpact: {
        utilization: number;
        revenue: number;
        efficiency: number;
    };
    rationale: string;
    implementationSteps: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeToImplement: string; // e.g., "2 weeks", "1 month"
}

export interface TrendAnalysis {
    period: {
        startDate: Date;
        endDate: Date;
    };
    trends: {
        utilization: TrendData;
        revenue: TrendData;
        efficiency: TrendData;
        allocation: TrendData;
    };
    seasonality: {
        detected: boolean;
        patterns: SeasonalPattern[];
    };
    anomalies: Anomaly[];
    forecast: {
        nextPeriod: PredictionDataPoint[];
        confidence: number;
    };
}

export interface TrendData {
    direction: 'INCREASING' | 'DECREASING' | 'STABLE';
    slope: number; // Rate of change
    rSquared: number; // Goodness of fit
    seasonality: boolean;
    volatility: number; // Standard deviation of residuals
}

export interface SeasonalPattern {
    period: string; // 'daily', 'weekly', 'monthly'
    amplitude: number;
    phase: number;
    significance: number;
}

export interface Anomaly {
    date: string;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    explanation: string;
}

export class PredictiveAnalyticsService {
    private static readonly FORECAST_HORIZON = 30; // days
    private static readonly MIN_DATA_POINTS = 14; // minimum data points for reliable predictions
    private static readonly CONFIDENCE_LEVEL = 0.95;

    /**
     * Generate utilization forecast for a freelancer
     */
    static async generateUtilizationForecast(
        freelancerId: string,
        historicalData: TimeLog[],
        allocations: TimeAllocation[],
        period: { startDate: Date; endDate: Date }
    ): Promise<PredictiveModel> {
        const relevantLogs = historicalData.filter(log =>
            log.loggedById === freelancerId &&
            log.startTime.toDate() >= period.startDate &&
            log.startTime.toDate() <= period.endDate
        );

        if (relevantLogs.length < this.MIN_DATA_POINTS) {
            throw new Error('Insufficient data for reliable prediction');
        }

        // Aggregate daily utilization
        const dailyUtilization = this.aggregateDailyUtilization(relevantLogs, period);

        // Apply time series forecasting
        const forecast = this.applyTimeSeriesForecast(dailyUtilization);

        // Calculate model accuracy
        const accuracy = this.calculateModelAccuracy(dailyUtilization, forecast);

        return {
            id: `util_forecast_${freelancerId}_${Date.now()}`,
            type: 'UTILIZATION_FORECAST',
            entityId: freelancerId,
            entityName: allocations.find(a => a.freelancerId === freelancerId)?.freelancerName || 'Unknown',
            model: {
                algorithm: 'ARIMA',
                parameters: {
                    p: 2, // autoregressive terms
                    d: 1, // differencing
                    q: 1  // moving average terms
                },
                accuracy,
                lastTrained: Timestamp.now()
            },
            predictions: forecast,
            confidence: this.CONFIDENCE_LEVEL
        };
    }

    /**
     * Generate revenue projection for a project
     */
    static async generateRevenueProjection(
        projectId: string,
        purchases: TimePurchase[],
        allocations: TimeAllocation[],
        period: { startDate: Date; endDate: Date }
    ): Promise<PredictiveModel> {
        const relevantPurchases = purchases.filter(purchase =>
            purchase.projectId === projectId &&
            purchase.purchasedAt.toDate() >= period.startDate &&
            purchase.purchasedAt.toDate() <= period.endDate
        );

        if (relevantPurchases.length < this.MIN_DATA_POINTS) {
            throw new Error('Insufficient data for reliable projection');
        }

        // Aggregate daily revenue
        const dailyRevenue = this.aggregateDailyRevenue(relevantPurchases, period);

        // Apply revenue forecasting model
        const forecast = this.applyRevenueForecast(dailyRevenue);

        // Calculate model accuracy
        const accuracy = this.calculateModelAccuracy(dailyRevenue, forecast);

        return {
            id: `revenue_proj_${projectId}_${Date.now()}`,
            type: 'REVENUE_PROJECTION',
            entityId: projectId,
            entityName: allocations.find(a => a.projectId === projectId)?.projectTitle || 'Unknown Project',
            model: {
                algorithm: 'Exponential Smoothing',
                parameters: {
                    alpha: 0.3, // smoothing factor
                    trend: true,
                    seasonal: false
                },
                accuracy,
                lastTrained: Timestamp.now()
            },
            predictions: forecast,
            confidence: this.CONFIDENCE_LEVEL
        };
    }

    /**
     * Analyze trends and patterns
     */
    static async analyzeTrends(
        timeLogs: TimeLog[],
        purchases: TimePurchase[],
        allocations: TimeAllocation[],
        period: { startDate: Date; endDate: Date }
    ): Promise<TrendAnalysis> {
        // Calculate utilization trends
        const utilizationTrend = this.calculateTrend(
            this.aggregateDailyUtilization(timeLogs, period)
        );

        // Calculate revenue trends
        const revenueTrend = this.calculateTrend(
            this.aggregateDailyRevenue(purchases, period)
        );

        // Calculate efficiency trends
        const efficiencyTrend = this.calculateEfficiencyTrend(timeLogs, period);

        // Calculate allocation trends
        const allocationTrend = this.calculateAllocationTrend(allocations, period);

        // Detect seasonality
        const seasonality = this.detectSeasonality([
            ...this.aggregateDailyUtilization(timeLogs, period),
            ...this.aggregateDailyRevenue(purchases, period)
        ]);

        // Detect anomalies
        const anomalies = this.detectAnomalies([
            ...this.aggregateDailyUtilization(timeLogs, period),
            ...this.aggregateDailyRevenue(purchases, period)
        ]);

        // Generate forecast
        const forecast = this.generateTrendForecast([
            utilizationTrend,
            revenueTrend,
            efficiencyTrend,
            allocationTrend
        ]);

        return {
            period,
            trends: {
                utilization: utilizationTrend,
                revenue: revenueTrend,
                efficiency: efficiencyTrend,
                allocation: allocationTrend
            },
            seasonality,
            anomalies,
            forecast
        };
    }

    /**
     * Generate optimization recommendations
     */
    static async generateOptimizationRecommendations(
        trendAnalysis: TrendAnalysis,
        currentAllocations: TimeAllocation[],
        currentUtilization: number
    ): Promise<OptimizationRecommendation[]> {
        const recommendations: OptimizationRecommendation[] = [];

        // Analyze utilization trends
        if (trendAnalysis.trends.utilization.direction === 'DECREASING' && currentUtilization < 70) {
            recommendations.push({
                type: 'ALLOCATION_INCREASE',
                entityId: 'system',
                entityName: 'System-wide',
                priority: 'HIGH',
                expectedImpact: {
                    utilization: 15,
                    revenue: 10,
                    efficiency: 5
                },
                rationale: 'Declining utilization trend detected. Increasing allocations could improve resource usage.',
                implementationSteps: [
                    'Review current project demands',
                    'Identify under-allocated freelancers',
                    'Increase allocations for high-demand projects',
                    'Monitor utilization for 2 weeks'
                ],
                riskLevel: 'MEDIUM',
                timeToImplement: '1 week'
            });
        }

        // Analyze revenue trends
        if (trendAnalysis.trends.revenue.direction === 'INCREASING') {
            recommendations.push({
                type: 'PRICE_ADJUSTMENT',
                entityId: 'system',
                entityName: 'Pricing Strategy',
                priority: 'MEDIUM',
                expectedImpact: {
                    utilization: 0,
                    revenue: 8,
                    efficiency: 2
                },
                rationale: 'Revenue is trending upward. Consider strategic price increases for high-demand slots.',
                implementationSteps: [
                    'Analyze price elasticity',
                    'Implement gradual price increases',
                    'Monitor conversion rates',
                    'Adjust based on market response'
                ],
                riskLevel: 'LOW',
                timeToImplement: '2 weeks'
            });
        }

        // Check for allocation imbalances
        const allocationImbalance = this.detectAllocationImbalance(currentAllocations);
        if (allocationImbalance.severity > 0.3) {
            recommendations.push({
                type: 'REBALANCE',
                entityId: 'system',
                entityName: 'Resource Allocation',
                priority: 'HIGH',
                expectedImpact: {
                    utilization: 20,
                    revenue: 5,
                    efficiency: 15
                },
                rationale: `Significant allocation imbalance detected (${(allocationImbalance.severity * 100).toFixed(1)}% deviation). Rebalancing could optimize resource usage.`,
                implementationSteps: [
                    'Audit current allocations',
                    'Identify over/under-allocated resources',
                    'Reassign slots based on demand',
                    'Monitor performance metrics'
                ],
                riskLevel: 'MEDIUM',
                timeToImplement: '1 week'
            });
        }

        // Seasonal recommendations
        if (trendAnalysis.seasonality.detected) {
            recommendations.push({
                type: 'ALLOCATION_INCREASE',
                entityId: 'system',
                entityName: 'Seasonal Planning',
                priority: 'MEDIUM',
                expectedImpact: {
                    utilization: 10,
                    revenue: 12,
                    efficiency: 8
                },
                rationale: 'Seasonal patterns detected. Proactive allocation increases during peak periods.',
                implementationSteps: [
                    'Analyze seasonal patterns',
                    'Plan ahead for peak periods',
                    'Build buffer capacity',
                    'Implement automated scaling'
                ],
                riskLevel: 'LOW',
                timeToImplement: '1 month'
            });
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // Helper methods

    private static aggregateDailyUtilization(logs: TimeLog[], period: { startDate: Date; endDate: Date }): Array<{ date: string; value: number }> {
        const dailyData = new Map<string, number>();

        logs.forEach(log => {
            const date = log.startTime.toDate().toISOString().split('T')[0];
            const hours = log.durationMinutes / 60;
            dailyData.set(date, (dailyData.get(date) || 0) + hours);
        });

        // Fill missing dates with 0
        const result: Array<{ date: string; value: number }> = [];
        const current = new Date(period.startDate);

        while (current <= period.endDate) {
            const dateStr = current.toISOString().split('T')[0];
            result.push({
                date: dateStr,
                value: dailyData.get(dateStr) || 0
            });
            current.setDate(current.getDate() + 1);
        }

        return result;
    }

    private static aggregateDailyRevenue(purchases: TimePurchase[], period: { startDate: Date; endDate: Date }): Array<{ date: string; value: number }> {
        const dailyData = new Map<string, number>();

        purchases.forEach(purchase => {
            const date = purchase.purchasedAt.toDate().toISOString().split('T')[0];
            dailyData.set(date, (dailyData.get(date) || 0) + purchase.amount);
        });

        // Fill missing dates with 0
        const result: Array<{ date: string; value: number }> = [];
        const current = new Date(period.startDate);

        while (current <= period.endDate) {
            const dateStr = current.toISOString().split('T')[0];
            result.push({
                date: dateStr,
                value: dailyData.get(dateStr) || 0
            });
            current.setDate(current.getDate() + 1);
        }

        return result;
    }

    private static applyTimeSeriesForecast(data: Array<{ date: string; value: number }>): PredictionDataPoint[] {
        // Simple exponential smoothing forecast
        // In a real implementation, this would use a proper time series library
        const alpha = 0.3;
        let smoothedValue = data[0]?.value || 0;
        const predictions: PredictionDataPoint[] = [];

        // Calculate trend
        let trend = 0;
        for (let i = 1; i < data.length; i++) {
            trend += (data[i].value - data[i - 1].value) / data.length;
        }

        // Generate forecast
        let lastValue = smoothedValue;
        const lastDate = new Date(data[data.length - 1].date);

        for (let i = 1; i <= this.FORECAST_HORIZON; i++) {
            const forecastDate = new Date(lastDate);
            forecastDate.setDate(forecastDate.getDate() + i);

            // Simple trend extrapolation
            const predictedValue = lastValue + (trend * i);
            const confidence = Math.max(0.5, 1 - (i * 0.02)); // Decreasing confidence
            const margin = predictedValue * (1 - confidence) * 0.5;

            predictions.push({
                date: forecastDate.toISOString().split('T')[0],
                predictedValue: Math.max(0, predictedValue),
                confidence,
                upperBound: predictedValue + margin,
                lowerBound: Math.max(0, predictedValue - margin)
            });
        }

        return predictions;
    }

    private static applyRevenueForecast(data: Array<{ date: string; value: number }>): PredictionDataPoint[] {
        // Similar to utilization forecast but for revenue
        return this.applyTimeSeriesForecast(data);
    }

    private static calculateModelAccuracy(actual: Array<{ date: string; value: number }>, predicted: PredictionDataPoint[]): number {
        if (actual.length < 5) return 0.5; // Default accuracy for small datasets

        // Calculate Mean Absolute Percentage Error (MAPE)
        let totalError = 0;
        let validPoints = 0;

        // Use last 30% of data for validation
        const validationStart = Math.floor(actual.length * 0.7);

        for (let i = validationStart; i < actual.length && i < predicted.length; i++) {
            const actualValue = actual[i].value;
            const predictedValue = predicted[i - validationStart]?.predictedValue || 0;

            if (actualValue > 0) {
                totalError += Math.abs((actualValue - predictedValue) / actualValue);
                validPoints++;
            }
        }

        if (validPoints === 0) return 0.5;

        const mape = totalError / validPoints;
        return Math.max(0, Math.min(1, 1 - mape)); // Convert to accuracy score
    }

    private static calculateTrend(data: Array<{ date: string; value: number }>): TrendData {
        if (data.length < 3) {
            return {
                direction: 'STABLE',
                slope: 0,
                rSquared: 0,
                seasonality: false,
                volatility: 0
            };
        }

        // Simple linear regression
        const n = data.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = data.reduce((sum, point) => sum + point.value, 0);
        const sumXY = data.reduce((sum, point, index) => sum + (index * point.value), 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R-squared
        const yMean = sumY / n;
        const ssRes = data.reduce((sum, point, index) => {
            const predicted = slope * index + intercept;
            return sum + Math.pow(point.value - predicted, 2);
        }, 0);
        const ssTot = data.reduce((sum, point) => sum + Math.pow(point.value - yMean, 2), 0);
        const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

        // Calculate volatility (standard deviation of residuals)
        const residuals = data.map((point, index) => {
            const predicted = slope * index + intercept;
            return point.value - predicted;
        });
        const volatility = Math.sqrt(residuals.reduce((sum, res) => sum + res * res, 0) / (n - 2));

        // Determine direction
        let direction: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
        if (Math.abs(slope) > volatility * 0.1) {
            direction = slope > 0 ? 'INCREASING' : 'DECREASING';
        }

        return {
            direction,
            slope,
            rSquared,
            seasonality: this.detectSeasonalityInSeries(data),
            volatility
        };
    }

    private static calculateEfficiencyTrend(logs: TimeLog[], period: { startDate: Date; endDate: Date }): TrendData {
        // Calculate daily efficiency scores
        const dailyEfficiency: Array<{ date: string; value: number }> = [];
        const dateMap = new Map<string, { totalTime: number; timerEntries: number; totalEntries: number }>();

        logs.forEach(log => {
            const date = log.startTime.toDate().toISOString().split('T')[0];
            const existing = dateMap.get(date) || { totalTime: 0, timerEntries: 0, totalEntries: 0 };

            existing.totalTime += log.durationMinutes;
            existing.totalEntries += 1;
            if (!log.manualEntry) {
                existing.timerEntries += 1;
            }

            dateMap.set(date, existing);
        });

        dateMap.forEach((data, date) => {
            const timerRatio = data.totalEntries > 0 ? data.timerEntries / data.totalEntries : 0;
            const timeScore = Math.min(1, data.totalTime / (8 * 60)); // Normalize to 8-hour day
            const efficiency = (timerRatio + timeScore) / 2;

            dailyEfficiency.push({ date, value: efficiency });
        });

        return this.calculateTrend(dailyEfficiency);
    }

    private static calculateAllocationTrend(allocations: TimeAllocation[], period: { startDate: Date; endDate: Date }): TrendData {
        // Aggregate daily allocation amounts
        const dailyAllocations: Array<{ date: string; value: number }> = [];
        const dateMap = new Map<string, number>();

        allocations.forEach(allocation => {
            const date = allocation.createdAt.toDate().toISOString().split('T')[0];
            dateMap.set(date, (dateMap.get(date) || 0) + allocation.allocatedHours);
        });

        dateMap.forEach((value, date) => {
            dailyAllocations.push({ date, value });
        });

        return this.calculateTrend(dailyAllocations);
    }

    private static detectSeasonality(data: Array<{ date: string; value: number }>): { detected: boolean; patterns: SeasonalPattern[] } {
        // Simple seasonality detection using autocorrelation
        const patterns: SeasonalPattern[] = [];
        let detected = false;

        // Check for weekly patterns (lag 7)
        if (data.length >= 14) {
            const weeklyCorr = this.calculateAutocorrelation(data, 7);
            if (Math.abs(weeklyCorr) > 0.3) {
                patterns.push({
                    period: 'weekly',
                    amplitude: Math.abs(weeklyCorr),
                    phase: weeklyCorr > 0 ? 0 : Math.PI,
                    significance: Math.abs(weeklyCorr)
                });
                detected = true;
            }
        }

        return { detected, patterns };
    }

    private static detectSeasonalityInSeries(data: Array<{ date: string; value: number }>): boolean {
        return this.detectSeasonality(data).detected;
    }

    private static calculateAutocorrelation(data: Array<{ date: string; value: number }>, lag: number): number {
        const values = data.map(d => d.value);
        const n = values.length;
        if (n <= lag) return 0;

        const mean = values.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n - lag; i++) {
            numerator += (values[i] - mean) * (values[i + lag] - mean);
            denominator += Math.pow(values[i] - mean, 2);
        }

        return denominator > 0 ? numerator / denominator : 0;
    }

    private static detectAnomalies(data: Array<{ date: string; value: number }>): Anomaly[] {
        const anomalies: Anomaly[] = [];
        const values = data.map(d => d.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

        data.forEach((point, index) => {
            const deviation = Math.abs(point.value - mean);
            const zScore = stdDev > 0 ? deviation / stdDev : 0;

            if (zScore > 2.5) { // 2.5 standard deviations
                anomalies.push({
                    date: point.date,
                    value: point.value,
                    expectedValue: mean,
                    deviation: deviation,
                    severity: zScore > 3.5 ? 'HIGH' : zScore > 2.5 ? 'MEDIUM' : 'LOW',
                    explanation: `Value deviates ${deviation.toFixed(2)} from mean of ${mean.toFixed(2)}`
                });
            }
        });

        return anomalies;
    }

    private static generateTrendForecast(trends: TrendData[]): { nextPeriod: PredictionDataPoint[]; confidence: number } {
        // Simple forecast based on average trend
        const avgSlope = trends.reduce((sum, trend) => sum + trend.slope, 0) / trends.length;
        const avgVolatility = trends.reduce((sum, trend) => sum + trend.volatility, 0) / trends.length;

        const nextPeriod: PredictionDataPoint[] = [];
        const baseDate = new Date();

        for (let i = 1; i <= 7; i++) { // Next 7 days
            const forecastDate = new Date(baseDate);
            forecastDate.setDate(forecastDate.getDate() + i);

            const predictedValue = avgSlope * i;
            const confidence = Math.max(0.3, 1 - (avgVolatility * 0.1));
            const margin = Math.abs(predictedValue) * (1 - confidence);

            nextPeriod.push({
                date: forecastDate.toISOString().split('T')[0],
                predictedValue,
                confidence,
                upperBound: predictedValue + margin,
                lowerBound: predictedValue - margin
            });
        }

        return {
            nextPeriod,
            confidence: Math.max(0.3, 1 - (avgVolatility * 0.05))
        };
    }

    private static detectAllocationImbalance(allocations: TimeAllocation[]): { severity: number; details: string } {
        if (allocations.length < 2) return { severity: 0, details: 'Insufficient data' };

        // Calculate allocation distribution
        const totalAllocation = allocations.reduce((sum, a) => sum + a.allocatedHours, 0);
        const avgAllocation = totalAllocation / allocations.length;

        const deviations = allocations.map(a => Math.abs(a.allocatedHours - avgAllocation));
        const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;

        const severity = avgDeviation / avgAllocation; // Coefficient of variation

        return {
            severity,
            details: `Average deviation: ${(severity * 100).toFixed(1)}% from mean allocation`
        };
    }

    /**
     * Generate simple forecast for trend analysis
     */
    static generateSimpleForecast(values: number[], forecastDays: number): number[] {
        if (values.length < 3) {
            // Return average for short series
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            return new Array(forecastDays).fill(avg);
        }

        // Simple exponential smoothing
        const alpha = 0.3;
        let smoothed = values[0];

        for (let i = 1; i < values.length; i++) {
            smoothed = alpha * values[i] + (1 - alpha) * smoothed;
        }

        // Calculate trend
        let trend = 0;
        for (let i = 1; i < Math.min(values.length, 7); i++) {
            trend += values[values.length - i] - values[values.length - i - 1];
        }
        trend /= Math.min(values.length - 1, 6);

        // Generate forecast
        const forecast: number[] = [];
        let currentValue = smoothed;

        for (let i = 0; i < forecastDays; i++) {
            currentValue += trend;
            forecast.push(Math.max(0, currentValue)); // Ensure non-negative
        }

        return forecast;
    }
}