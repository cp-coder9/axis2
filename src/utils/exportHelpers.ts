import { BusinessIntelligenceData, TrendData } from './analyticsEngine';

/**
 * Export report data to PDF format (placeholder for shadcn migration)
 */
export async function exportReportToPDF(data: BusinessIntelligenceData, reportType: string): Promise<void> {
  console.log('PDF Export requested:', { reportType, dataKpis: data.kpis.length });
  
  // Create a simple download trigger for now
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportType}-analytics-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export chart data to PDF (placeholder)
 */
export async function exportChartToPDF(chartData: any, chartTitle: string): Promise<void> {
  console.log('Chart PDF Export requested:', { chartTitle });
  
  // For now, just download as JSON
  const dataStr = JSON.stringify(chartData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${chartTitle}-chart-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export trend data to CSV format
 */
export function exportTrendDataToCSV(trendData: TrendData, trendType: string): void {
  let csvContent = '';
  let data: any[] = [];
  
  switch (trendType) {
    case 'project-completion':
      data = trendData.projectCompletionTrend;
      csvContent = 'Date,Completed,Started\n';
      data.forEach(item => {
        csvContent += `${item.date},${item.completed},${item.started}\n`;
      });
      break;
      
    case 'revenue-projection':
      data = trendData.revenueProjection;
      csvContent = 'Month,Actual,Projected\n';
      data.forEach(item => {
        csvContent += `${item.month},${item.actual},${item.projected}\n`;
      });
      break;
      
    case 'team-productivity':
      data = trendData.teamProductivityTrend;
      csvContent = 'Date,Hours Logged,Tasks Completed\n';
      data.forEach(item => {
        csvContent += `${item.date},${item.hoursLogged},${item.tasksCompleted}\n`;
      });
      break;
      
    case 'client-acquisition':
      data = trendData.clientAcquisitionTrend;
      csvContent = 'Month,New Clients,Total Clients\n';
      data.forEach(item => {
        csvContent += `${item.month},${item.newClients},${item.totalClients}\n`;
      });
      break;
      
    default:
      console.warn('Unknown trend type for CSV export:', trendType);
      return;
  }
  
  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${trendType}-trend-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
