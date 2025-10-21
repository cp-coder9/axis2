/**
 * Automated Alerts Service
 * Handles automated notifications for time management analytics
 * Supports email, SMS, and in-app notifications
 */

import { Timestamp } from 'firebase/firestore';
import { AnalyticsAlert } from './realTimeAnalyticsService';

export interface AlertRule {
    id: string;
    name: string;
    type: 'LOW_UTILIZATION' | 'HIGH_UTILIZATION' | 'CONFLICT' | 'OVER_ALLOCATION' | 'UNDER_PERFORMANCE' | 'SLOT_EXPIRY' | 'REVENUE_DROP';
    condition: {
        metric: string;
        operator: 'LESS_THAN' | 'GREATER_THAN' | 'EQUALS' | 'NOT_EQUALS';
        threshold: number;
        duration?: number; // minutes for sustained conditions
    };
    targets: AlertTarget[];
    enabled: boolean;
    cooldownPeriod: number; // minutes between alerts
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    lastTriggered?: Timestamp;
}

export interface AlertTarget {
    type: 'EMAIL' | 'SMS' | 'IN_APP' | 'WEBHOOK';
    destination: string; // email address, phone number, user ID, or webhook URL
    template: string; // template ID for message formatting
}

export interface AlertTemplate {
    id: string;
    name: string;
    type: 'EMAIL' | 'SMS' | 'IN_APP';
    subject?: string; // for email
    body: string;
    variables: string[]; // available template variables
}

export interface AlertHistory {
    id: string;
    alertId: string;
    ruleId: string;
    triggeredAt: Timestamp;
    resolvedAt?: Timestamp;
    status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
    details: {
        metric: string;
        value: number;
        threshold: number;
        entityId: string;
        entityName: string;
    };
    notifications: AlertNotification[];
}

export interface AlertNotification {
    id: string;
    target: AlertTarget;
    sentAt: Timestamp;
    status: 'SENT' | 'DELIVERED' | 'FAILED';
    error?: string;
    retryCount: number;
}

export class AutomatedAlertsService {
    private static readonly DEFAULT_COOLDOWN = 60; // 1 hour default cooldown
    private static readonly MAX_RETRY_ATTEMPTS = 3;

    private alertRules: Map<string, AlertRule> = new Map();
    private alertTemplates: Map<string, AlertTemplate> = new Map();
    private activeAlerts: Map<string, AlertHistory> = new Map();

    constructor() {
        this.initializeDefaultRules();
        this.initializeDefaultTemplates();
    }

    /**
     * Initialize default alert rules
     */
    private initializeDefaultRules(): void {
        const defaultRules: AlertRule[] = [
            {
                id: 'low_utilization',
                name: 'Low Freelancer Utilization',
                type: 'LOW_UTILIZATION',
                condition: {
                    metric: 'utilization_rate',
                    operator: 'LESS_THAN',
                    threshold: 30,
                    duration: 1440 // 24 hours
                },
                targets: [
                    {
                        type: 'EMAIL',
                        destination: 'admin@company.com',
                        template: 'low_utilization_email'
                    },
                    {
                        type: 'IN_APP',
                        destination: 'admin_user_id',
                        template: 'low_utilization_inapp'
                    }
                ],
                enabled: true,
                cooldownPeriod: 1440, // 24 hours
                severity: 'MEDIUM'
            },
            {
                id: 'high_utilization',
                name: 'High Freelancer Utilization',
                type: 'HIGH_UTILIZATION',
                condition: {
                    metric: 'utilization_rate',
                    operator: 'GREATER_THAN',
                    threshold: 95,
                    duration: 60 // 1 hour
                },
                targets: [
                    {
                        type: 'EMAIL',
                        destination: 'admin@company.com',
                        template: 'high_utilization_email'
                    }
                ],
                enabled: true,
                cooldownPeriod: 360, // 6 hours
                severity: 'MEDIUM'
            },
            {
                id: 'slot_expiry_warning',
                name: 'Slot Expiry Warning',
                type: 'SLOT_EXPIRY',
                condition: {
                    metric: 'hours_until_expiry',
                    operator: 'LESS_THAN',
                    threshold: 24,
                    duration: 60 // 1 hour
                },
                targets: [
                    {
                        type: 'SMS',
                        destination: '+1234567890',
                        template: 'slot_expiry_sms'
                    },
                    {
                        type: 'IN_APP',
                        destination: 'freelancer_user_id',
                        template: 'slot_expiry_inapp'
                    }
                ],
                enabled: true,
                cooldownPeriod: 720, // 12 hours
                severity: 'HIGH'
            },
            {
                id: 'revenue_drop',
                name: 'Revenue Drop Alert',
                type: 'REVENUE_DROP',
                condition: {
                    metric: 'revenue_change_percent',
                    operator: 'LESS_THAN',
                    threshold: -20, // 20% drop
                    duration: 1440 // 24 hours
                },
                targets: [
                    {
                        type: 'EMAIL',
                        destination: 'admin@company.com',
                        template: 'revenue_drop_email'
                    }
                ],
                enabled: true,
                cooldownPeriod: 1440, // 24 hours
                severity: 'HIGH'
            }
        ];

        defaultRules.forEach(rule => this.alertRules.set(rule.id, rule));
    }

    /**
     * Initialize default alert templates
     */
    private initializeDefaultTemplates(): void {
        const defaultTemplates: AlertTemplate[] = [
            {
                id: 'low_utilization_email',
                name: 'Low Utilization Email',
                type: 'EMAIL',
                subject: 'Low Utilization Alert: {{entityName}}',
                body: `
Dear Admin,

This is an automated alert regarding freelancer utilization.

Freelancer: {{entityName}}
Current Utilization: {{currentValue}}%
Threshold: {{threshold}}%
Alert Type: Low Utilization

The freelancer's utilization rate has fallen below the acceptable threshold.
This may indicate:
- Insufficient project allocations
- Scheduling conflicts
- Performance issues

Recommended Actions:
1. Review current project assignments
2. Check for scheduling conflicts
3. Consider reallocating tasks from over-utilized freelancers
4. Contact the freelancer to discuss availability

Please take appropriate action to optimize resource utilization.

Best regards,
Time Management System
        `,
                variables: ['entityName', 'currentValue', 'threshold', 'alertType']
            },
            {
                id: 'low_utilization_inapp',
                name: 'Low Utilization In-App',
                type: 'IN_APP',
                body: '{{entityName}} utilization is at {{currentValue}}% (below {{threshold}}% threshold). Review allocations.',
                variables: ['entityName', 'currentValue', 'threshold']
            },
            {
                id: 'high_utilization_email',
                name: 'High Utilization Email',
                type: 'EMAIL',
                subject: 'High Utilization Warning: {{entityName}}',
                body: `
Dear Admin,

This is an automated alert regarding high freelancer utilization.

Freelancer: {{entityName}}
Current Utilization: {{currentValue}}%
Threshold: {{threshold}}%

The freelancer is approaching maximum capacity. While high utilization is generally positive,
it may lead to:
- Burnout
- Quality issues
- Scheduling conflicts

Recommended Actions:
1. Monitor workload closely
2. Consider redistributing some tasks
3. Plan for adequate rest periods
4. Review project timelines

Best regards,
Time Management System
        `,
                variables: ['entityName', 'currentValue', 'threshold']
            },
            {
                id: 'slot_expiry_sms',
                name: 'Slot Expiry SMS',
                type: 'SMS',
                body: 'ALERT: Time slot expiring in {{hoursUntilExpiry}} hours. Project: {{projectName}}. Please complete work or request extension.',
                variables: ['hoursUntilExpiry', 'projectName']
            },
            {
                id: 'slot_expiry_inapp',
                name: 'Slot Expiry In-App',
                type: 'IN_APP',
                body: 'Time slot for {{projectName}} expires in {{hoursUntilExpiry}} hours. Take action now.',
                variables: ['hoursUntilExpiry', 'projectName']
            },
            {
                id: 'revenue_drop_email',
                name: 'Revenue Drop Email',
                type: 'EMAIL',
                subject: 'Revenue Drop Alert',
                body: `
Dear Admin,

This is an automated alert regarding revenue performance.

Revenue Change: {{changePercent}}%
Period: Last 24 hours

Revenue has dropped significantly below expected levels.

Possible Causes:
- Reduced client purchases
- Pricing issues
- Market conditions
- Technical problems

Recommended Actions:
1. Review recent purchase activity
2. Check for system issues
3. Contact key clients
4. Review pricing strategy

Please investigate and take corrective action.

Best regards,
Time Management System
        `,
                variables: ['changePercent']
            }
        ];

        defaultTemplates.forEach(template => this.alertTemplates.set(template.id, template));
    }

    /**
     * Process an alert from the real-time analytics service
     */
    public async processAlert(alert: AnalyticsAlert): Promise<void> {
        try {
            // Check if alert should be triggered based on rules
            const applicableRules = this.getApplicableRules(alert);

            for (const rule of applicableRules) {
                if (await this.shouldTriggerAlert(alert, rule)) {
                    await this.triggerAlert(alert, rule);
                }
            }
        } catch (error) {
            console.error('Error processing alert:', error);
        }
    }

    /**
     * Get rules applicable to an alert
     */
    private getApplicableRules(alert: AnalyticsAlert): AlertRule[] {
        return Array.from(this.alertRules.values()).filter(rule =>
            rule.enabled &&
            rule.type === alert.type &&
            this.checkCooldownPeriod(rule)
        );
    }

    /**
     * Check if alert should be triggered based on rule conditions
     */
    private async shouldTriggerAlert(alert: AnalyticsAlert, rule: AlertRule): Promise<boolean> {
        // Check metric condition
        const metricValue = this.extractMetricValue(alert, rule.condition.metric);
        const conditionMet = this.evaluateCondition(metricValue, rule.condition);

        if (!conditionMet) return false;

        // Check duration condition if specified
        if (rule.condition.duration) {
            const sustainedCondition = await this.checkSustainedCondition(alert, rule);
            if (!sustainedCondition) return false;
        }

        return true;
    }

    /**
     * Trigger an alert and send notifications
     */
    private async triggerAlert(alert: AnalyticsAlert, rule: AlertRule): Promise<void> {
        // Create alert history record
        const alertHistory: AlertHistory = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            alertId: alert.id,
            ruleId: rule.id,
            triggeredAt: Timestamp.now(),
            status: 'ACTIVE',
            details: {
                metric: rule.condition.metric,
                value: alert.currentValue,
                threshold: alert.threshold,
                entityId: alert.affectedEntity.id,
                entityName: alert.affectedEntity.name
            },
            notifications: []
        };

        // Send notifications to all targets
        for (const target of rule.targets) {
            try {
                const notification = await this.sendNotification(alert, target);
                alertHistory.notifications.push(notification);
            } catch (error) {
                console.error(`Failed to send notification to ${target.destination}:`, error);
                alertHistory.notifications.push({
                    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    target,
                    sentAt: Timestamp.now(),
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    retryCount: 0
                });
            }
        }

        // Store alert history
        this.activeAlerts.set(alertHistory.id, alertHistory);

        // Update rule's last triggered timestamp
        rule.lastTriggered = Timestamp.now();
        this.alertRules.set(rule.id, rule);

        console.log(`Alert triggered: ${alert.title} for ${alert.affectedEntity.name}`);
    }

    /**
     * Send notification to a target
     */
    private async sendNotification(alert: AnalyticsAlert, target: AlertTarget): Promise<AlertNotification> {
        const template = this.alertTemplates.get(target.template);
        if (!template) {
            throw new Error(`Template ${target.template} not found`);
        }

        const message = this.renderTemplate(template, alert);
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            switch (target.type) {
                case 'EMAIL':
                    await this.sendEmail(target.destination, template.subject || 'Alert', message);
                    break;
                case 'SMS':
                    await this.sendSMS(target.destination, message);
                    break;
                case 'IN_APP':
                    await this.sendInAppNotification(target.destination, message);
                    break;
                case 'WEBHOOK':
                    await this.sendWebhook(target.destination, alert);
                    break;
            }

            return {
                id: notificationId,
                target,
                sentAt: Timestamp.now(),
                status: 'SENT',
                retryCount: 0
            };
        } catch (error) {
            // Retry logic
            let retryCount = 0;
            while (retryCount < AutomatedAlertsService.MAX_RETRY_ATTEMPTS) {
                try {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000)); // Exponential backoff
                    // Retry sending
                    switch (target.type) {
                        case 'EMAIL':
                            await this.sendEmail(target.destination, template.subject || 'Alert', message);
                            break;
                        case 'SMS':
                            await this.sendSMS(target.destination, message);
                            break;
                        case 'IN_APP':
                            await this.sendInAppNotification(target.destination, message);
                            break;
                        case 'WEBHOOK':
                            await this.sendWebhook(target.destination, alert);
                            break;
                    }

                    return {
                        id: notificationId,
                        target,
                        sentAt: Timestamp.now(),
                        status: 'SENT',
                        retryCount: retryCount + 1
                    };
                } catch (retryError) {
                    retryCount++;
                }
            }

            throw error; // All retries failed
        }
    }

    /**
     * Render template with alert data
     */
    private renderTemplate(template: AlertTemplate, alert: AnalyticsAlert): string {
        let content = template.body;

        // Replace template variables
        const replacements = {
            entityName: alert.affectedEntity.name,
            currentValue: alert.currentValue.toString(),
            threshold: alert.threshold.toString(),
            alertType: alert.type.replace('_', ' ').toLowerCase(),
            hoursUntilExpiry: alert.type === 'SLOT_EXPIRY_WARNING' ? Math.floor(alert.currentValue).toString() : 'N/A',
            projectName: alert.affectedEntity.name,
            changePercent: alert.currentValue.toFixed(1) + '%'
        };

        Object.entries(replacements).forEach(([key, value]) => {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });

        return content;
    }

    /**
     * Send email notification
     */
    private async sendEmail(to: string, subject: string, body: string): Promise<void> {
        // Implementation would integrate with email service (e.g., SendGrid, AWS SES)
        console.log(`Sending email to ${to}: ${subject}`);

        // Placeholder implementation
        if (!to.includes('@')) {
            throw new Error('Invalid email address');
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Send SMS notification
     */
    private async sendSMS(to: string, message: string): Promise<void> {
        // Implementation would integrate with SMS service (e.g., Twilio, AWS SNS)
        console.log(`Sending SMS to ${to}: ${message.substring(0, 50)}...`);

        // Placeholder implementation
        if (!to.startsWith('+')) {
            throw new Error('Invalid phone number');
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Send in-app notification
     */
    private async sendInAppNotification(userId: string, message: string): Promise<void> {
        // Implementation would integrate with in-app notification system
        console.log(`Sending in-app notification to ${userId}: ${message}`);

        // Placeholder implementation
        if (!userId) {
            throw new Error('Invalid user ID');
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    /**
     * Send webhook notification
     */
    private async sendWebhook(url: string, alert: AnalyticsAlert): Promise<void> {
        console.log(`Sending webhook to ${url} for alert: ${alert.title}`);

        // Placeholder implementation
        if (!url.startsWith('http')) {
            throw new Error('Invalid webhook URL');
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    /**
     * Extract metric value from alert
     */
    private extractMetricValue(alert: AnalyticsAlert, metric: string): number {
        switch (metric) {
            case 'utilization_rate':
                return alert.currentValue;
            case 'hours_until_expiry':
                return alert.currentValue;
            case 'revenue_change_percent':
                return alert.currentValue;
            default:
                return alert.currentValue;
        }
    }

    /**
     * Evaluate condition against metric value
     */
    private evaluateCondition(value: number, condition: AlertRule['condition']): boolean {
        switch (condition.operator) {
            case 'LESS_THAN':
                return value < condition.threshold;
            case 'GREATER_THAN':
                return value > condition.threshold;
            case 'EQUALS':
                return value === condition.threshold;
            case 'NOT_EQUALS':
                return value !== condition.threshold;
            default:
                return false;
        }
    }

    /**
     * Check if condition has been sustained for required duration
     */
    private async checkSustainedCondition(alert: AnalyticsAlert, rule: AlertRule): Promise<boolean> {
        // This would check historical data to see if the condition has been true for the specified duration
        // For now, return true (simplified implementation)
        return true;
    }

    /**
     * Check if rule is within cooldown period
     */
    private checkCooldownPeriod(rule: AlertRule): boolean {
        if (!rule.lastTriggered) return true;

        const now = Timestamp.now();
        const timeSinceLastTrigger = now.toMillis() - rule.lastTriggered.toMillis();
        const cooldownMs = rule.cooldownPeriod * 60 * 1000; // Convert minutes to milliseconds

        return timeSinceLastTrigger >= cooldownMs;
    }

    /**
     * Resolve an active alert
     */
    public async resolveAlert(alertId: string): Promise<void> {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.status = 'RESOLVED';
            alert.resolvedAt = Timestamp.now();
            this.activeAlerts.set(alertId, alert);
        }
    }

    /**
     * Acknowledge an alert
     */
    public async acknowledgeAlert(alertId: string): Promise<void> {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.status = 'ACKNOWLEDGED';
            this.activeAlerts.set(alertId, alert);
        }
    }

    /**
     * Get active alerts
     */
    public getActiveAlerts(): AlertHistory[] {
        return Array.from(this.activeAlerts.values()).filter(alert => alert.status === 'ACTIVE');
    }

    /**
     * Add or update an alert rule
     */
    public setAlertRule(rule: AlertRule): void {
        this.alertRules.set(rule.id, rule);
    }

    /**
     * Remove an alert rule
     */
    public removeAlertRule(ruleId: string): void {
        this.alertRules.delete(ruleId);
    }

    /**
     * Get all alert rules
     */
    public getAlertRules(): AlertRule[] {
        return Array.from(this.alertRules.values());
    }

    /**
     * Add or update an alert template
     */
    public setAlertTemplate(template: AlertTemplate): void {
        this.alertTemplates.set(template.id, template);
    }

    /**
     * Get alert template
     */
    public getAlertTemplate(templateId: string): AlertTemplate | undefined {
        return this.alertTemplates.get(templateId);
    }
}

// Singleton instance
export const automatedAlertsService = new AutomatedAlertsService();