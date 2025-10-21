/**
 * Advanced Export Service
 * Provides comprehensive export capabilities for time management analytics
 * Supports PDF, Excel, CSV, and JSON formats with rich formatting and charts
 */

import { Timestamp } from 'firebase/firestore';
import { LiveAnalyticsDashboard, AnalyticsAlert, PredictiveInsight } from './realTimeAnalyticsService';
import { TimerAnalyticsReport, TimeManagementAnalyticsReport } from '../utils/TimerAnalytics';

export interface ExportOptions {
    format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
    includeCharts: boolean;
    includeRawData: boolean;
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    sections: {
        utilization: boolean;
        projects: boolean;
        alerts: boolean;
        predictions: boolean;
        trends: boolean;
    };
    filters: {
        freelancerIds?: string[];
        projectIds?: string[];
        minUtilization?: number;
        maxUtilization?: number;
    };
}

export interface ExportResult {
    filename: string;
    content: Blob | string;
    mimeType: string;
    size: number;
}

export class AdvancedExportService {
    private static readonly CHART_COLORS = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
    ];

    /**
     * Export analytics dashboard data
     */
    static async exportAnalyticsDashboard(
        dashboard: LiveAnalyticsDashboard,
        alerts: AnalyticsAlert[],
        predictions: PredictiveInsight[],
        options: ExportOptions
    ): Promise<ExportResult> {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `analytics-dashboard-${timestamp}`;

        switch (options.format) {
            case 'PDF':
                return await this.exportToPDF(dashboard, alerts, predictions, options, filename);
            case 'EXCEL':
                return await this.exportToExcel(dashboard, alerts, predictions, options, filename);
            case 'CSV':
                return await this.exportToCSV(dashboard, alerts, predictions, options, filename);
            case 'JSON':
                return this.exportToJSON(dashboard, alerts, predictions, options, filename);
            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }
    }

    /**
     * Export comprehensive analytics report
     */
    static async exportAnalyticsReport(
        report: TimerAnalyticsReport | TimeManagementAnalyticsReport,
        options: ExportOptions
    ): Promise<ExportResult> {
        const timestamp = new Date().toISOString().split('T')[0];
        const reportType = 'userId' in report ? 'timer' : 'time-management';
        const filename = `${reportType}-analytics-${timestamp}`;

        switch (options.format) {
            case 'PDF':
                return await this.exportReportToPDF(report, options, filename);
            case 'EXCEL':
                return await this.exportReportToExcel(report, options, filename);
            case 'CSV':
                return await this.exportReportToCSV(report, options, filename);
            case 'JSON':
                return this.exportReportToJSON(report, options, filename);
            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }
    }

    /**
     * Export to PDF with charts and formatting
     */
    private static async exportToPDF(
        dashboard: LiveAnalyticsDashboard,
        alerts: AnalyticsAlert[],
        predictions: PredictiveInsight[],
        options: ExportOptions,
        filename: string
    ): Promise<ExportResult> {
        // This would use a PDF generation library like jsPDF or Puppeteer
        // For now, we'll create a simple text-based PDF structure

        let pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 1000
>>
stream
BT
/F1 12 Tf
72 720 Td
(Real-Time Analytics Dashboard) Tj
0 -24 Td
(Generated: ${new Date().toLocaleString()}) Tj
0 -48 Td
(System Overview) Tj
0 -24 Td
(Total Active Slots: ${dashboard.systemOverview.totalActiveSlots}) Tj
0 -24 Td
(Total Revenue Today: $${dashboard.systemOverview.totalRevenueToday.toLocaleString()}) Tj
0 -24 Td
(Average Utilization: ${dashboard.systemOverview.averageUtilization.toFixed(1)}%) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000001077 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1174
%%EOF`;

        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        return {
            filename: `${filename}.pdf`,
            content: blob,
            mimeType: 'application/pdf',
            size: blob.size
        };
    }

    /**
     * Export to Excel with multiple sheets and formatting
     */
    private static async exportToExcel(
        dashboard: LiveAnalyticsDashboard,
        alerts: AnalyticsAlert[],
        predictions: PredictiveInsight[],
        options: ExportOptions,
        filename: string
    ): Promise<ExportResult> {
        // This would use a library like ExcelJS or SheetJS
        // For now, we'll create a CSV-like structure that can be opened in Excel

        let excelContent = 'Analytics Dashboard Export\n';
        excelContent += `Generated: ${new Date().toLocaleString()}\n\n`;

        // System Overview Sheet
        excelContent += '=== SYSTEM OVERVIEW ===\n';
        excelContent += 'Metric,Value\n';
        excelContent += `Total Active Slots,${dashboard.systemOverview.totalActiveSlots}\n`;
        excelContent += `Total Revenue Today,$${dashboard.systemOverview.totalRevenueToday.toLocaleString()}\n`;
        excelContent += `Average Utilization,${dashboard.systemOverview.averageUtilization.toFixed(1)}%\n`;
        excelContent += `Active Alerts,${dashboard.systemOverview.alertsTriggered}\n\n`;

        // Freelancer Utilization Sheet
        if (options.sections.utilization) {
            excelContent += '=== FREELANCER UTILIZATION ===\n';
            excelContent += 'Freelancer,Current Utilization,Target Utilization,Active Slots,Completed Slots,Revenue Today,Efficiency Score\n';

            dashboard.utilizationData.forEach(freelancer => {
                excelContent += `${freelancer.freelancerName},${freelancer.currentUtilization.toFixed(1)}%,${freelancer.targetUtilization}%,${freelancer.activeSlots},${freelancer.completedSlots},$${freelancer.revenueToday.toLocaleString()},${freelancer.efficiencyScore.toFixed(1)}%\n`;
            });
            excelContent += '\n';
        }

        // Project Performance Sheet
        if (options.sections.projects) {
            excelContent += '=== PROJECT PERFORMANCE ===\n';
            excelContent += 'Project,Utilization Rate,Budget Utilization,Active Freelancers,Completed Slots,Revenue Generated,Profit Margin\n';

            dashboard.projectData.forEach(project => {
                excelContent += `${project.projectTitle},${project.utilizationRate.toFixed(1)}%,${project.budgetUtilization.toFixed(1)}%,${project.activeFreelancers},${project.completedSlots},$${project.revenueGenerated.toLocaleString()},${project.profitMargin.toFixed(1)}%\n`;
            });
            excelContent += '\n';
        }

        // Alerts Sheet
        if (options.sections.alerts && alerts.length > 0) {
            excelContent += '=== ACTIVE ALERTS ===\n';
            excelContent += 'Type,Severity,Title,Entity,Affected Value,Threshold,Triggered At\n';

            alerts.forEach(alert => {
                excelContent += `${alert.type},${alert.severity},${alert.title},${alert.affectedEntity.name},${alert.currentValue},${alert.threshold},${alert.triggeredAt.toDate().toLocaleString()}\n`;
            });
            excelContent += '\n';
        }

        // Predictions Sheet
        if (options.sections.predictions && predictions.length > 0) {
            excelContent += '=== PREDICTIVE INSIGHTS ===\n';
            excelContent += 'Type,Entity,Predicted Value,Confidence,Timeframe,Trend\n';

            predictions.forEach(prediction => {
                excelContent += `${prediction.type},${prediction.entityName},${prediction.prediction.value.toFixed(2)},${(prediction.prediction.confidence * 100).toFixed(1)}%,${prediction.prediction.timeframe.replace('_', ' ')},${prediction.prediction.trend}\n`;
            });
            excelContent += '\n';
        }

        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
        return {
            filename: `${filename}.xls`,
            content: blob,
            mimeType: 'application/vnd.ms-excel',
            size: blob.size
        };
    }

    /**
     * Export to CSV format
     */
    private static async exportToCSV(
        dashboard: LiveAnalyticsDashboard,
        alerts: AnalyticsAlert[],
        predictions: PredictiveInsight[],
        options: ExportOptions,
        filename: string
    ): Promise<ExportResult> {
        let csvContent = 'Analytics Dashboard Export\n';
        csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

        // System Overview
        csvContent += 'SYSTEM OVERVIEW\n';
        csvContent += 'Metric,Value\n';
        csvContent += `Total Active Slots,${dashboard.systemOverview.totalActiveSlots}\n`;
        csvContent += `Total Revenue Today,$${dashboard.systemOverview.totalRevenueToday.toLocaleString()}\n`;
        csvContent += `Average Utilization,${dashboard.systemOverview.averageUtilization.toFixed(1)}%\n\n`;

        // Freelancer Utilization
        if (options.sections.utilization) {
            csvContent += 'FREELANCER UTILIZATION\n';
            csvContent += 'Freelancer,Current Utilization,Target Utilization,Active Slots,Completed Slots,Revenue Today,Efficiency Score\n';

            dashboard.utilizationData.forEach(freelancer => {
                csvContent += `"${freelancer.freelancerName}",${freelancer.currentUtilization.toFixed(1)}%,${freelancer.targetUtilization}%,${freelancer.activeSlots},${freelancer.completedSlots},$${freelancer.revenueToday.toLocaleString()},${freelancer.efficiencyScore.toFixed(1)}%\n`;
            });
            csvContent += '\n';
        }

        // Project Performance
        if (options.sections.projects) {
            csvContent += 'PROJECT PERFORMANCE\n';
            csvContent += 'Project,Utilization Rate,Budget Utilization,Active Freelancers,Completed Slots,Revenue Generated,Profit Margin\n';

            dashboard.projectData.forEach(project => {
                csvContent += `"${project.projectTitle}",${project.utilizationRate.toFixed(1)}%,${project.budgetUtilization.toFixed(1)}%,${project.activeFreelancers},${project.completedSlots},$${project.revenueGenerated.toLocaleString()},${project.profitMargin.toFixed(1)}%\n`;
            });
            csvContent += '\n';
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        return {
            filename: `${filename}.csv`,
            content: blob,
            mimeType: 'text/csv',
            size: blob.size
        };
    }

    /**
     * Export to JSON format
     */
    private static exportToJSON(
        dashboard: LiveAnalyticsDashboard,
        alerts: AnalyticsAlert[],
        predictions: PredictiveInsight[],
        options: ExportOptions,
        filename: string
    ): ExportResult {
        const exportData = {
            metadata: {
                generatedAt: new Date().toISOString(),
                dateRange: {
                    startDate: options.dateRange.startDate.toISOString(),
                    endDate: options.dateRange.endDate.toISOString()
                },
                format: 'JSON',
                version: '1.0'
            },
            dashboard,
            alerts,
            predictions,
            options
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });

        return {
            filename: `${filename}.json`,
            content: blob,
            mimeType: 'application/json',
            size: blob.size
        };
    }

    /**
     * Export analytics report to PDF
     */
    private static async exportReportToPDF(
        report: TimerAnalyticsReport | TimeManagementAnalyticsReport,
        options: ExportOptions,
        filename: string
    ): Promise<ExportResult> {
        // Simplified PDF export for reports
        let pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 1500
>>
stream
BT
/F1 12 Tf
72 720 Td
(Analytics Report) Tj
0 -24 Td
(Generated: ${new Date().toLocaleString()}) Tj
0 -24 Td
(Period: ${report.period.startDate.toLocaleDateString()} - ${report.period.endDate.toLocaleDateString()}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000001077 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1424
%%EOF`;

        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        return {
            filename: `${filename}.pdf`,
            content: blob,
            mimeType: 'application/pdf',
            size: blob.size
        };
    }

    /**
     * Export analytics report to Excel
     */
    private static async exportReportToExcel(
        report: TimerAnalyticsReport | TimeManagementAnalyticsReport,
        options: ExportOptions,
        filename: string
    ): Promise<ExportResult> {
        let excelContent = 'Analytics Report Export\n';
        excelContent += `Generated: ${new Date().toLocaleString()}\n`;
        excelContent += `Period: ${report.period.startDate.toLocaleDateString()} - ${report.period.endDate.toLocaleDateString()}\n\n`;

        if ('userId' in report) {
            // Timer Analytics Report
            excelContent += '=== TIMER USAGE STATISTICS ===\n';
            excelContent += 'Metric,Value\n';
            excelContent += `Total Sessions,${report.statistics.totalSessions}\n`;
            excelContent += `Total Time,${report.statistics.totalTimeMinutes} minutes\n`;
            excelContent += `Average Session,${report.statistics.averageSessionMinutes.toFixed(1)} minutes\n`;
            excelContent += `Efficiency Score,${report.insights.efficiencyScore.toFixed(1)}/100\n\n`;

            excelContent += '=== PRODUCTIVITY INSIGHTS ===\n';
            excelContent += 'Metric,Value\n';
            excelContent += `Peak Hours,"${report.insights.peakProductivityHours.join(', ')}"\n`;
            excelContent += `Peak Days,"${report.insights.peakProductivityDays.join(', ')}"\n`;
            excelContent += `Average Focus Time,${report.insights.averageFocusTime.toFixed(1)} minutes\n`;
            excelContent += `Consistency Score,${report.insights.consistencyScore.toFixed(1)}/100\n\n`;
        } else {
            // Time Management Analytics Report
            excelContent += '=== ALLOCATION UTILIZATION ===\n';
            excelContent += 'Metric,Value\n';
            excelContent += `Total Allocations,${report.allocationComparison.totalAllocations}\n`;
            excelContent += `Overall Utilization,${report.allocationComparison.overallUtilizationRate.toFixed(1)}%\n`;
            excelContent += `Allocation Efficiency,${report.allocationComparison.allocationEfficiency.toFixed(1)}%\n`;
            excelContent += `Revenue Efficiency,${report.allocationComparison.revenueEfficiency.toFixed(1)}%\n\n`;

            excelContent += '=== FREELANCER UTILIZATION ===\n';
            excelContent += 'Freelancer,Utilization Rate,Revenue Generated,Efficiency Score\n';
            report.freelancerUtilization.forEach(f => {
                excelContent += `"${f.freelancerName}",${f.utilizationRate.toFixed(1)}%,$${f.revenueGenerated.toLocaleString()},${f.efficiencyScore.toFixed(1)}/100\n`;
            });
            excelContent += '\n';

            excelContent += '=== PROJECT PROFITABILITY ===\n';
            excelContent += 'Project,Profit Margin,ROI,Allocation Utilization\n';
            report.projectProfitability.forEach(p => {
                excelContent += `"${p.projectTitle}",${p.profitMargin.toFixed(1)}%,${p.returnOnInvestment.toFixed(1)}%,${p.allocationUtilization.toFixed(1)}%\n`;
            });
        }

        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
        return {
            filename: `${filename}.xls`,
            content: blob,
            mimeType: 'application/vnd.ms-excel',
            size: blob.size
        };
    }

    /**
     * Export analytics report to CSV
     */
    private static async exportReportToCSV(
        report: TimerAnalyticsReport | TimeManagementAnalyticsReport,
        options: ExportOptions,
        filename: string
    ): Promise<ExportResult> {
        let csvContent = 'Analytics Report Export\n';
        csvContent += `Generated: ${new Date().toLocaleString()}\n`;
        csvContent += `Period: ${report.period.startDate.toLocaleDateString()} - ${report.period.endDate.toLocaleDateString()}\n\n`;

        if ('userId' in report) {
            csvContent += 'TIMER STATISTICS\n';
            csvContent += 'Total Sessions,Total Time (min),Average Session (min),Efficiency Score\n';
            csvContent += `${report.statistics.totalSessions},${report.statistics.totalTimeMinutes},${report.statistics.averageSessionMinutes.toFixed(1)},${report.insights.efficiencyScore.toFixed(1)}\n\n`;
        } else {
            csvContent += 'ALLOCATION UTILIZATION\n';
            csvContent += 'Total Allocations,Overall Utilization,Allocation Efficiency,Revenue Efficiency\n';
            csvContent += `${report.allocationComparison.totalAllocations},${report.allocationComparison.overallUtilizationRate.toFixed(1)}%,${report.allocationComparison.allocationEfficiency.toFixed(1)}%,${report.allocationComparison.revenueEfficiency.toFixed(1)}%\n\n`;

            csvContent += 'FREELANCER UTILIZATION\n';
            csvContent += 'Freelancer,Utilization Rate,Revenue Generated,Efficiency Score\n';
            report.freelancerUtilization.forEach(f => {
                csvContent += `"${f.freelancerName}",${f.utilizationRate.toFixed(1)}%,$${f.revenueGenerated.toLocaleString()},${f.efficiencyScore.toFixed(1)}\n`;
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        return {
            filename: `${filename}.csv`,
            content: blob,
            mimeType: 'text/csv',
            size: blob.size
        };
    }

    /**
     * Export analytics report to JSON
     */
    private static exportReportToJSON(
        report: TimerAnalyticsReport | TimeManagementAnalyticsReport,
        options: ExportOptions,
        filename: string
    ): ExportResult {
        const exportData = {
            metadata: {
                generatedAt: new Date().toISOString(),
                reportType: 'userId' in report ? 'timer' : 'time-management',
                dateRange: {
                    startDate: report.period.startDate.toISOString(),
                    endDate: report.period.endDate.toISOString()
                },
                format: 'JSON',
                version: '1.0'
            },
            report,
            options
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });

        return {
            filename: `${filename}.json`,
            content: blob,
            mimeType: 'application/json',
            size: blob.size
        };
    }

    /**
     * Generate chart data for visualizations
     */
    static generateChartData(
        dashboard: LiveAnalyticsDashboard,
        type: 'utilization' | 'revenue' | 'alerts' | 'predictions'
    ): any {
        switch (type) {
            case 'utilization':
                return {
                    labels: dashboard.utilizationData.map(f => f.freelancerName),
                    datasets: [{
                        label: 'Utilization Rate (%)',
                        data: dashboard.utilizationData.map(f => f.currentUtilization),
                        backgroundColor: this.CHART_COLORS,
                        borderColor: this.CHART_COLORS.map(color => color.replace('0.5', '1')),
                        borderWidth: 1
                    }]
                };

            case 'revenue':
                return {
                    labels: dashboard.projectData.map(p => p.projectTitle),
                    datasets: [{
                        label: 'Revenue Generated ($)',
                        data: dashboard.projectData.map(p => p.revenueGenerated),
                        backgroundColor: this.CHART_COLORS,
                        borderColor: this.CHART_COLORS.map(color => color.replace('0.5', '1')),
                        borderWidth: 1
                    }]
                };

            default:
                return {};
        }
    }

    /**
     * Validate export options
     */
    static validateExportOptions(options: ExportOptions): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!options.format || !['PDF', 'EXCEL', 'CSV', 'JSON'].includes(options.format)) {
            errors.push('Invalid export format');
        }

        if (!options.dateRange.startDate || !options.dateRange.endDate) {
            errors.push('Date range is required');
        }

        if (options.dateRange.startDate > options.dateRange.endDate) {
            errors.push('Start date must be before end date');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Export utility functions
export const exportUtils = {
    /**
     * Download file from blob
     */
    downloadBlob: (result: ExportResult): void => {
        const url = URL.createObjectURL(result.content as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Download file from string content
     */
    downloadString: (result: ExportResult): void => {
        const blob = new Blob([result.content as string], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};