/**
 * Real-Time Analytics Service
 * Provides live updates for time management analytics dashboards
 * Implements real-time utilization tracking and live data broadcasting
 */

import { db } from '../lib/firebase';
import {
    collection,
    doc,
    addDoc,
    query,
    where,
    getDocs,
    onSnapshot,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { WebSocketManager } from './websocket/WebSocketManager';
import { WebSocketMessageType } from '../types/messaging';
import {
    TimeAllocation,
    TimeSlot,
    TimePurchase,
    TimeLog,
    Project,
    User
} from '../types';
import { TimerAnalytics } from '../utils/TimerAnalytics';
import { PredictiveAnalyticsService } from './predictiveAnalyticsService';
import { automatedAlertsService } from './automatedAlertsService';

// Extend WebSocket message types for analytics
export enum AnalyticsMessageType {
    UTILIZATION_UPDATE = 'UTILIZATION_UPDATE',
    ALERT_TRIGGERED = 'ALERT_TRIGGERED',
    PREDICTION_UPDATE = 'PREDICTION_UPDATE',
    TREND_UPDATE = 'TREND_UPDATE'
}

export interface LiveUtilizationData {
    freelancerId: string;
    freelancerName: string;
    currentUtilization: number;
    targetUtilization: number;
    activeSlots: number;
    completedSlots: number;
    revenueToday: number;
    efficiencyScore: number;
    lastUpdated: Timestamp;
}

export interface LiveProjectData {
    projectId: string;
    projectTitle: string;
    utilizationRate: number;
    budgetUtilization: number;
    activeFreelancers: number;
    completedSlots: number;
    revenueGenerated: number;
    profitMargin: number;
    lastUpdated: Timestamp;
}

export interface SystemOverview {
    totalActiveSlots: number;
    totalRevenueToday: number;
    averageUtilization: number;
    alertsTriggered: number;
    lastUpdated: Timestamp;
}

export interface LiveAnalyticsDashboard {
    utilizationData: LiveUtilizationData[];
    projectData: LiveProjectData[];
    systemOverview: SystemOverview;
}

export interface AnalyticsAlert {
    id: string;
    type: 'LOW_UTILIZATION' | 'HIGH_UTILIZATION' | 'OVER_ALLOCATION' | 'SLOT_EXPIRY_WARNING';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    affectedEntity: {
        type: 'FREELANCER' | 'PROJECT' | 'SYSTEM';
        id: string;
        name: string;
    };
    threshold: number;
    currentValue: number;
    recommendedAction: string;
    triggeredAt: Timestamp;
    acknowledged: boolean;
}

export interface PredictiveInsight {
    type: 'UTILIZATION_FORECAST' | 'REVENUE_PROJECTION' | 'EFFICIENCY_TREND';
    entityId: string;
    entityName: string;
    prediction: {
        value: number;
        confidence: number;
        timeframe: '1_DAY' | '1_WEEK' | '1_MONTH';
        trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    };
    factors: string[];
    recommendations: string[];
    generatedAt: Timestamp;
}

export interface HistoricalDataPoint {
    date: Date;
    utilization: number;
    revenue: number;
    activeSlots: number;
    completedSlots: number;
    alertsTriggered: number;
}

export class RealTimeAnalyticsService {
    private wsManager: WebSocketManager | null = null;
    private subscriptions: Map<string, () => void> = new Map();
    private alertThresholds: Map<string, number> = new Map();
    private dashboardSubscribers: Set<(data: LiveAnalyticsDashboard) => void> = new Set();
    private alertSubscribers: Set<(alert: AnalyticsAlert) => void> = new Set();
    private predictionSubscribers: Set<(insight: PredictiveInsight) => void> = new Set();

    constructor(wsManager?: WebSocketManager) {
        this.wsManager = wsManager || null;
        this.initializeDefaultThresholds();
    }

    /**
     * Initialize default alert thresholds
     */
    private initializeDefaultThresholds(): void {
        this.alertThresholds.set('LOW_UTILIZATION', 30); // Below 30% utilization
        this.alertThresholds.set('HIGH_UTILIZATION', 95); // Above 95% utilization
        this.alertThresholds.set('OVER_ALLOCATION', 120); // Above 120% allocation
        this.alertThresholds.set('SLOT_EXPIRY_WARNING', 24); // Hours before expiry
    }

    /**
     * Start real-time analytics monitoring
     */
    public async startMonitoring(): Promise<void> {
        console.log('Starting real-time analytics monitoring...');

        // Subscribe to time logs for live utilization updates
        this.subscribeToTimeLogs();

        // Subscribe to time slots for availability updates
        this.subscribeToTimeSlots();

        // Subscribe to purchases for revenue updates
        this.subscribeToPurchases();

        // Start periodic analytics calculation
        this.startPeriodicUpdates();

        // Start alert monitoring
        this.startAlertMonitoring();

        // Start predictive analytics
        this.startPredictiveAnalytics();

        console.log('Real-time analytics monitoring started');
    }

    /**
     * Stop real-time analytics monitoring
     */
    public stopMonitoring(): void {
        console.log('Stopping real-time analytics monitoring...');

        // Unsubscribe from all listeners
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions.clear();

        // Clear subscribers
        this.dashboardSubscribers.clear();
        this.alertSubscribers.clear();
        this.predictionSubscribers.clear();

        console.log('Real-time analytics monitoring stopped');
    }

    /**
     * Subscribe to live dashboard updates
     */
    public onDashboardUpdate(callback: (data: LiveAnalyticsDashboard) => void): () => void {
        this.dashboardSubscribers.add(callback);
        return () => this.dashboardSubscribers.delete(callback);
    }

    /**
     * Subscribe to alerts
     */
    public onAlert(callback: (alert: AnalyticsAlert) => void): () => void {
        this.alertSubscribers.add(callback);
        return () => this.alertSubscribers.delete(callback);
    }

    /**
     * Subscribe to predictive insights
     */
    public onPrediction(callback: (insight: PredictiveInsight) => void): () => void {
        this.predictionSubscribers.add(callback);
        return () => this.predictionSubscribers.delete(callback);
    }

    /**
     * Get current live analytics data
     */
    public async getLiveAnalyticsData(): Promise<LiveAnalyticsDashboard> {
        try {
            // Get current allocations, slots, purchases, and logs
            const [allocations, slots, purchases, logs] = await Promise.all([
                this.getCurrentAllocations(),
                this.getCurrentSlots(),
                this.getRecentPurchases(),
                this.getRecentTimeLogs()
            ]);

            // Calculate live utilization data
            const utilizationData = await this.calculateLiveUtilizationData(allocations, slots, purchases, logs);
            const projectData = await this.calculateLiveProjectData(allocations, slots, purchases, logs);

            // Calculate system overview
            const systemOverview = this.calculateSystemOverview(utilizationData, projectData);

            return {
                utilizationData,
                projectData,
                systemOverview
            };
        } catch (error) {
            console.error('Error getting live analytics data:', error);
            throw error;
        }
    }

    /**
     * Subscribe to time logs for real-time updates
     */
    private subscribeToTimeLogs(): void {
        const logsQuery = query(
            collection(db, 'timeLogs'),
            orderBy('startTime', 'desc'),
            limit(1000)
        );

        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            console.log('Time logs updated, triggering analytics refresh');
            this.triggerAnalyticsUpdate();
        });

        this.subscriptions.set('timeLogs', unsubscribe);
    }

    /**
     * Subscribe to time slots for availability updates
     */
    private subscribeToTimeSlots(): void {
        const slotsQuery = query(
            collection(db, 'timeSlots'),
            where('status', 'in', ['AVAILABLE', 'PURCHASED', 'IN_PROGRESS', 'COMPLETED'])
        );

        const unsubscribe = onSnapshot(slotsQuery, (snapshot) => {
            console.log('Time slots updated, triggering analytics refresh');
            this.triggerAnalyticsUpdate();
        });

        this.subscriptions.set('timeSlots', unsubscribe);
    }

    /**
     * Subscribe to purchases for revenue updates
     */
    private subscribeToPurchases(): void {
        const purchasesQuery = query(
            collection(db, 'timePurchases'),
            orderBy('purchasedAt', 'desc'),
            limit(500)
        );

        const unsubscribe = onSnapshot(purchasesQuery, (snapshot) => {
            console.log('Purchases updated, triggering analytics refresh');
            this.triggerAnalyticsUpdate();
        });

        this.subscriptions.set('purchases', unsubscribe);
    }

    /**
     * Start periodic analytics updates (every 30 seconds)
     */
    private startPeriodicUpdates(): void {
        const interval = setInterval(() => {
            this.triggerAnalyticsUpdate();
        }, 30000); // 30 seconds

        this.subscriptions.set('periodic', () => clearInterval(interval));
    }

    /**
     * Start alert monitoring
     */
    private startAlertMonitoring(): void {
        const interval = setInterval(async () => {
            await this.checkForAlerts();
        }, 60000); // Check every minute

        this.subscriptions.set('alerts', () => clearInterval(interval));
    }

    /**
     * Start predictive analytics generation
     */
    private startPredictiveAnalytics(): void {
        const interval = setInterval(async () => {
            await this.generatePredictions();
        }, 300000); // Every 5 minutes

        this.subscriptions.set('predictions', () => clearInterval(interval));
    }

    /**
     * Trigger analytics update and broadcast to subscribers
     */
    private async triggerAnalyticsUpdate(): Promise<void> {
        try {
            const data = await this.getLiveAnalyticsData();

            // Notify dashboard subscribers
            this.dashboardSubscribers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in dashboard subscriber callback:', error);
                }
            });

            // Broadcast via WebSocket if available
            if (this.wsManager?.isConnected()) {
                this.wsManager.send(WebSocketMessageType.MESSAGE_SENT, {
                    type: AnalyticsMessageType.UTILIZATION_UPDATE,
                    data
                });
            }
        } catch (error) {
            console.error('Error triggering analytics update:', error);
        }
    }

    /**
     * Check for alerts and trigger them
     */
    private async checkForAlerts(): Promise<void> {
        try {
            const data = await this.getLiveAnalyticsData();
            const alerts: AnalyticsAlert[] = [];

            // Check freelancer utilization alerts
            data.utilizationData.forEach(freelancer => {
                if (freelancer.currentUtilization < this.alertThresholds.get('LOW_UTILIZATION')!) {
                    alerts.push({
                        id: `low_util_${freelancer.freelancerId}_${Date.now()}`,
                        type: 'LOW_UTILIZATION',
                        severity: freelancer.currentUtilization < 10 ? 'CRITICAL' : 'MEDIUM',
                        title: 'Low Freelancer Utilization',
                        message: `${freelancer.freelancerName} has ${freelancer.currentUtilization.toFixed(1)}% utilization`,
                        affectedEntity: {
                            type: 'FREELANCER',
                            id: freelancer.freelancerId,
                            name: freelancer.freelancerName
                        },
                        threshold: this.alertThresholds.get('LOW_UTILIZATION')!,
                        currentValue: freelancer.currentUtilization,
                        recommendedAction: 'Consider reallocating tasks or adjusting workload',
                        triggeredAt: Timestamp.now(),
                        acknowledged: false
                    });
                }

                if (freelancer.currentUtilization > this.alertThresholds.get('HIGH_UTILIZATION')!) {
                    alerts.push({
                        id: `high_util_${freelancer.freelancerId}_${Date.now()}`,
                        type: 'HIGH_UTILIZATION',
                        severity: 'MEDIUM',
                        title: 'High Freelancer Utilization',
                        message: `${freelancer.freelancerName} has ${freelancer.currentUtilization.toFixed(1)}% utilization`,
                        affectedEntity: {
                            type: 'FREELANCER',
                            id: freelancer.freelancerId,
                            name: freelancer.freelancerName
                        },
                        threshold: this.alertThresholds.get('HIGH_UTILIZATION')!,
                        currentValue: freelancer.currentUtilization,
                        recommendedAction: 'Monitor for burnout and consider workload distribution',
                        triggeredAt: Timestamp.now(),
                        acknowledged: false
                    });
                }
            });

            // Trigger alerts
            alerts.forEach(async (alert) => {
                this.alertSubscribers.forEach(callback => {
                    try {
                        callback(alert);
                    } catch (error) {
                        console.error('Error in alert subscriber callback:', error);
                    }
                });

                // Send to automated alerts service
                await automatedAlertsService.processAlert(alert);

                // Broadcast via WebSocket
                if (this.wsManager?.isConnected()) {
                    this.wsManager.send(WebSocketMessageType.MESSAGE_SENT, {
                        type: AnalyticsMessageType.ALERT_TRIGGERED,
                        data: alert
                    });
                }
            });
        } catch (error) {
            console.error('Error checking for alerts:', error);
        }
    }

    /**
     * Generate predictive insights
     */
    private async generatePredictions(): Promise<void> {
        try {
            // Get historical data for predictions
            const historicalData = await this.getHistoricalAnalyticsData(30); // Last 30 days

            // Generate utilization forecasts
            const predictions = await this.generateUtilizationPredictions(historicalData);

            // Send predictions to subscribers
            predictions.forEach(prediction => {
                this.predictionSubscribers.forEach(callback => {
                    try {
                        callback(prediction);
                    } catch (error) {
                        console.error('Error in prediction subscriber callback:', error);
                    }
                });

                // Broadcast via WebSocket
                if (this.wsManager?.isConnected()) {
                    this.wsManager.send(WebSocketMessageType.MESSAGE_SENT, {
                        type: AnalyticsMessageType.PREDICTION_UPDATE,
                        data: prediction
                    });
                }
            });

        } catch (error) {
            console.error('Error generating predictions:', error);
        }
    }

    // Helper methods for data retrieval and calculation

    private async getCurrentAllocations(): Promise<TimeAllocation[]> {
        try {
            const allocationsQuery = query(
                collection(db, 'timeAllocations'),
                where('status', '==', 'ACTIVE')
            );

            const snapshot = await getDocs(allocationsQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TimeAllocation));
        } catch (error) {
            console.error('Error getting current allocations:', error);
            return [];
        }
    }

    private async getCurrentSlots(): Promise<TimeSlot[]> {
        try {
            const slotsQuery = query(
                collection(db, 'timeSlots'),
                where('status', 'in', ['AVAILABLE', 'PURCHASED', 'IN_PROGRESS', 'COMPLETED'])
            );

            const snapshot = await getDocs(slotsQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TimeSlot));
        } catch (error) {
            console.error('Error getting current slots:', error);
            return [];
        }
    }

    private async getRecentPurchases(): Promise<TimePurchase[]> {
        try {
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            const purchasesQuery = query(
                collection(db, 'timePurchases'),
                where('purchasedAt', '>=', Timestamp.fromDate(oneDayAgo)),
                orderBy('purchasedAt', 'desc')
            );

            const snapshot = await getDocs(purchasesQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TimePurchase));
        } catch (error) {
            console.error('Error getting recent purchases:', error);
            return [];
        }
    }

    private async getRecentTimeLogs(): Promise<TimeLog[]> {
        try {
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            const logsQuery = query(
                collection(db, 'timeLogs'),
                where('startTime', '>=', Timestamp.fromDate(oneDayAgo)),
                orderBy('startTime', 'desc')
            );

            const snapshot = await getDocs(logsQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TimeLog));
        } catch (error) {
            console.error('Error getting recent time logs:', error);
            return [];
        }
    }

    private async calculateLiveUtilizationData(
        allocations: TimeAllocation[],
        slots: TimeSlot[],
        purchases: TimePurchase[],
        logs: TimeLog[]
    ): Promise<LiveUtilizationData[]> {
        // Group data by freelancer
        const freelancerData = new Map<string, {
            allocations: TimeAllocation[];
            slots: TimeSlot[];
            purchases: TimePurchase[];
            logs: TimeLog[];
        }>();

        // Group allocations
        allocations.forEach(allocation => {
            if (!freelancerData.has(allocation.freelancerId)) {
                freelancerData.set(allocation.freelancerId, {
                    allocations: [],
                    slots: [],
                    purchases: [],
                    logs: []
                });
            }
            freelancerData.get(allocation.freelancerId)!.allocations.push(allocation);
        });

        // Group slots, purchases, and logs
        slots.forEach(slot => {
            const data = freelancerData.get(slot.freelancerId);
            if (data) data.slots.push(slot);
        });

        purchases.forEach(purchase => {
            const data = freelancerData.get(purchase.freelancerId);
            if (data) data.purchases.push(purchase);
        });

        logs.forEach(log => {
            const data = freelancerData.get(log.loggedById);
            if (data) data.logs.push(log);
        });

        // Calculate utilization data
        const utilizationData: LiveUtilizationData[] = [];

        freelancerData.forEach((data, freelancerId) => {
            const totalAllocated = data.allocations.reduce((sum, a) => sum + a.allocatedHours, 0);
            const utilizedHours = data.logs.reduce((sum, log) => sum + log.durationMinutes / 60, 0);
            const activeSlots = data.slots.filter(s => s.status === 'IN_PROGRESS').length;
            const completedSlots = data.slots.filter(s => s.status === 'COMPLETED').length;
            const revenueToday = data.purchases
                .filter(p => this.isToday(p.purchasedAt))
                .reduce((sum, p) => sum + p.amount, 0);

            const utilization = totalAllocated > 0 ? (utilizedHours / totalAllocated) * 100 : 0;
            const efficiencyScore = this.calculateEfficiencyScore(data.logs, data.slots);

            utilizationData.push({
                freelancerId,
                freelancerName: data.allocations[0]?.freelancerName || 'Unknown',
                currentUtilization: utilization,
                targetUtilization: 80, // Default target
                activeSlots,
                completedSlots,
                revenueToday,
                efficiencyScore,
                lastUpdated: Timestamp.now()
            });
        });

        return utilizationData;
    }

    private async calculateLiveProjectData(
        allocations: TimeAllocation[],
        slots: TimeSlot[],
        purchases: TimePurchase[],
        logs: TimeLog[]
    ): Promise<LiveProjectData[]> {
        // Group data by project
        const projectData = new Map<string, {
            allocations: TimeAllocation[];
            slots: TimeSlot[];
            purchases: TimePurchase[];
            logs: TimeLog[];
        }>();

        // Group by project
        allocations.forEach(allocation => {
            if (!projectData.has(allocation.projectId)) {
                projectData.set(allocation.projectId, {
                    allocations: [],
                    slots: [],
                    purchases: [],
                    logs: []
                });
            }
            projectData.get(allocation.projectId)!.allocations.push(allocation);
        });

        // Similar grouping for other data...

        // Calculate project data
        const liveProjectData: LiveProjectData[] = [];

        projectData.forEach((data, projectId) => {
            const totalBudget = data.allocations.reduce((sum, a) => sum + (a.allocatedHours * a.hourlyRate), 0);
            const spent = data.logs.reduce((sum, log) => sum + (log.durationMinutes / 60) * (log.hourlyRate || 0), 0);
            const revenue = data.purchases.reduce((sum, p) => sum + p.amount, 0);
            const activeFreelancers = new Set(data.slots.map(s => s.freelancerId)).size;
            const completedSlots = data.slots.filter(s => s.status === 'COMPLETED').length;

            const utilizationRate = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
            const profitMargin = revenue > 0 ? ((revenue - spent) / revenue) * 100 : 0;

            liveProjectData.push({
                projectId,
                projectTitle: `Project ${projectId}`, // TODO: Get actual project title from Project data
                utilizationRate,
                budgetUtilization: utilizationRate,
                activeFreelancers,
                completedSlots,
                revenueGenerated: revenue,
                profitMargin,
                lastUpdated: Timestamp.now()
            });
        });

        return liveProjectData;
    }

    private calculateSystemOverview(
        utilizationData: LiveUtilizationData[],
        projectData: LiveProjectData[]
    ) {
        const totalActiveSlots = utilizationData.reduce((sum, f) => sum + f.activeSlots, 0);
        const totalRevenueToday = utilizationData.reduce((sum, f) => sum + f.revenueToday, 0);
        const averageUtilization = utilizationData.length > 0
            ? utilizationData.reduce((sum, f) => sum + f.currentUtilization, 0) / utilizationData.length
            : 0;

        return {
            totalActiveSlots,
            totalRevenueToday,
            averageUtilization,
            alertsTriggered: 0, // TODO: Track actual alerts
            lastUpdated: Timestamp.now()
        };
    }

    private calculateEfficiencyScore(logs: TimeLog[], slots: TimeSlot[]): number {
        if (logs.length === 0) return 0;

        // Efficiency based on timer usage and slot completion
        const timerLogs = logs.filter(log => !log.manualEntry);
        const timerRatio = logs.length > 0 ? (timerLogs.length / logs.length) * 100 : 0;

        const completedSlots = slots.filter(s => s.status === 'COMPLETED').length;
        const completionRate = slots.length > 0 ? (completedSlots / slots.length) * 100 : 0;

        return (timerRatio + completionRate) / 2;
    }

    private isToday(timestamp: Timestamp): boolean {
        const today = new Date();
        const date = timestamp.toDate();
        return date.toDateString() === today.toDateString();
    }

    private async getHistoricalAnalyticsData(days: number): Promise<{ allocations: TimeAllocation[], slots: TimeSlot[], purchases: TimePurchase[], logs: TimeLog[] }> {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            // Get historical allocations, slots, purchases, and logs
            const [allocations, slots, purchases, logs] = await Promise.all([
                this.getHistoricalAllocations(startDate, endDate),
                this.getHistoricalSlots(startDate, endDate),
                this.getHistoricalPurchases(startDate, endDate),
                this.getHistoricalTimeLogs(startDate, endDate)
            ]);

            return { allocations, slots, purchases, logs };
        } catch (error) {
            console.error('Error getting historical analytics data:', error);
            return { allocations: [], slots: [], purchases: [], logs: [] };
        }
    } private async generateUtilizationPredictions(historicalData: any): Promise<PredictiveInsight[]> {
        const predictions: PredictiveInsight[] = [];

        try {
            // Get unique freelancer IDs
            const freelancerIds = new Set([
                ...historicalData.allocations.map((a: TimeAllocation) => a.freelancerId),
                ...historicalData.logs.map((l: TimeLog) => l.loggedById)
            ]);

            // Generate predictions for each freelancer
            for (const freelancerId of freelancerIds) {
                try {
                    const freelancerName = historicalData.allocations.find((a: TimeAllocation) => a.freelancerId === freelancerId)?.freelancerName || 'Unknown';

                    const period = {
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                        endDate: new Date()
                    };

                    const forecast = await PredictiveAnalyticsService.generateUtilizationForecast(
                        freelancerId,
                        historicalData.logs,
                        historicalData.allocations,
                        period
                    );

                    // Convert to PredictiveInsight format
                    const insight: PredictiveInsight = {
                        type: 'UTILIZATION_FORECAST',
                        entityId: freelancerId,
                        entityName: freelancerName,
                        prediction: {
                            value: forecast.predictions[0]?.predictedValue || 0,
                            confidence: forecast.confidence,
                            timeframe: '1_WEEK',
                            trend: forecast.predictions.length > 1 &&
                                forecast.predictions[1].predictedValue > forecast.predictions[0].predictedValue
                                ? 'INCREASING' : 'STABLE'
                        },
                        factors: [
                            'Historical utilization patterns',
                            'Current allocation levels',
                            'Project completion rates'
                        ],
                        recommendations: [
                            forecast.predictions[0]?.predictedValue < 70
                                ? 'Consider increasing allocations to improve utilization'
                                : 'Utilization forecast looks healthy'
                        ],
                        generatedAt: Timestamp.now()
                    };

                    predictions.push(insight);
                } catch (error) {
                    console.warn(`Could not generate prediction for freelancer ${freelancerId}:`, error);
                }
            }

            // Generate revenue projections
            try {
                const projectIds = new Set(historicalData.purchases.map((p: TimePurchase) => p.projectId));

                for (const projectId of projectIds) {
                    if (typeof projectId !== 'string') continue;
                    const period = {
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        endDate: new Date()
                    };

                    const projection = await PredictiveAnalyticsService.generateRevenueProjection(
                        projectId,
                        historicalData.purchases,
                        historicalData.allocations,
                        period
                    );

                    const insight: PredictiveInsight = {
                        type: 'REVENUE_PROJECTION',
                        entityId: projectId,
                        entityName: `Project ${projectId}`,
                        prediction: {
                            value: projection.predictions[0]?.predictedValue || 0,
                            confidence: projection.confidence,
                            timeframe: '1_WEEK',
                            trend: projection.predictions.length > 1 &&
                                projection.predictions[1].predictedValue > projection.predictions[0].predictedValue
                                ? 'INCREASING' : 'STABLE'
                        },
                        factors: [
                            'Historical purchase patterns',
                            'Seasonal trends',
                            'Market demand'
                        ],
                        recommendations: [
                            projection.predictions[0]?.predictedValue > 1000
                                ? 'Strong revenue projection - consider scaling up'
                                : 'Monitor revenue trends closely'
                        ],
                        generatedAt: Timestamp.now()
                    };

                    predictions.push(insight);
                }
            } catch (error) {
                console.warn('Could not generate revenue projections:', error);
            }

        } catch (error) {
            console.error('Error generating utilization predictions:', error);
        }

        return predictions;
    }

    /**
     * Set custom alert threshold
     */
    public setAlertThreshold(type: string, threshold: number): void {
        this.alertThresholds.set(type, threshold);
    }

    /**
     * Get current alert thresholds
     */
    public getAlertThresholds(): Map<string, number> {
        return new Map(this.alertThresholds);
    }

    private async getHistoricalAllocations(startDate: Date, endDate: Date): Promise<TimeAllocation[]> {
        try {
            const allocationsQuery = query(
                collection(db, 'timeAllocations'),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                where('createdAt', '<=', Timestamp.fromDate(endDate))
            );

            const snapshot = await getDocs(allocationsQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TimeAllocation));
        } catch (error) {
            console.error('Error getting historical allocations:', error);
            return [];
        }
    }

    private async getHistoricalSlots(startDate: Date, endDate: Date): Promise<TimeSlot[]> {
        try {
            const slotsQuery = query(
                collection(db, 'timeSlots'),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                where('createdAt', '<=', Timestamp.fromDate(endDate))
            );

            const snapshot = await getDocs(slotsQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TimeSlot));
        } catch (error) {
            console.error('Error getting historical slots:', error);
            return [];
        }
    }

    private async getHistoricalPurchases(startDate: Date, endDate: Date): Promise<TimePurchase[]> {
        try {
            const purchasesQuery = query(
                collection(db, 'timePurchases'),
                where('purchasedAt', '>=', Timestamp.fromDate(startDate)),
                where('purchasedAt', '<=', Timestamp.fromDate(endDate))
            );

            const snapshot = await getDocs(purchasesQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TimePurchase));
        } catch (error) {
            console.error('Error getting historical purchases:', error);
            return [];
        }
    }

    private async getHistoricalTimeLogs(startDate: Date, endDate: Date): Promise<TimeLog[]> {
        try {
            const logsQuery = query(
                collection(db, 'timeLogs'),
                where('startTime', '>=', Timestamp.fromDate(startDate)),
                where('startTime', '<=', Timestamp.fromDate(endDate))
            );

            const snapshot = await getDocs(logsQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TimeLog));
        } catch (error) {
            console.error('Error getting historical time logs:', error);
            return [];
        }
    }

    /**
     * Get historical analytics data for trend analysis
     */
    public async getHistoricalAnalytics(days: number): Promise<HistoricalDataPoint[]> {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            const historicalData: HistoricalDataPoint[] = [];

            // Get data for each day in the range
            for (let i = 0; i < days; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);

                const dayStart = new Date(currentDate);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(currentDate);
                dayEnd.setHours(23, 59, 59, 999);

                // Get data for this day
                const [allocations, slots, purchases, logs] = await Promise.all([
                    this.getHistoricalAllocations(dayStart, dayEnd),
                    this.getHistoricalSlots(dayStart, dayEnd),
                    this.getHistoricalPurchases(dayStart, dayEnd),
                    this.getHistoricalTimeLogs(dayStart, dayEnd)
                ]);

                // Calculate daily metrics
                const utilization = this.calculateDailyUtilization(logs, allocations);
                const revenue = purchases.reduce((sum, p) => sum + p.amount, 0);
                const activeSlots = slots.filter(s => s.status === 'IN_PROGRESS').length;
                const completedSlots = slots.filter(s => s.status === 'COMPLETED').length;
                const alertsTriggered = 0; // TODO: Track historical alerts

                historicalData.push({
                    date: currentDate,
                    utilization,
                    revenue,
                    activeSlots,
                    completedSlots,
                    alertsTriggered
                });
            }

            return historicalData;
        } catch (error) {
            console.error('Error getting historical analytics:', error);
            return [];
        }
    }

    private calculateDailyUtilization(logs: TimeLog[], allocations: TimeAllocation[]): number {
        if (allocations.length === 0) return 0;

        const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedHours, 0);
        const utilizedHours = logs.reduce((sum, log) => sum + log.durationMinutes / 60, 0);

        return totalAllocated > 0 ? (utilizedHours / totalAllocated) * 100 : 0;
    }
}// Singleton instance
export const realTimeAnalyticsService = new RealTimeAnalyticsService();