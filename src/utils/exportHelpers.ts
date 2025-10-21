import { BusinessIntelligenceData, TrendData } from './analyticsEngine';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export project schedule to PDF format
 */
export async function exportProjectScheduleToPDF(
  projectName: string,
  tasks: any[],
  dependencies: any[],
  resourceAssignments: any[],
  startDate: Date,
  endDate: Date
): Promise<void> {
  try {
    const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Title
    pdf.setFontSize(20);
    pdf.text(`Project Schedule: ${projectName}`, margin, yPosition);
    yPosition += 15;

    // Date range
    pdf.setFontSize(12);
    pdf.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;

    // Summary stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const criticalTasks = tasks.filter(t => t.isCritical).length;

    pdf.text(`Total Tasks: ${totalTasks} | Completed: ${completedTasks} | In Progress: ${inProgressTasks} | Critical Path: ${criticalTasks}`, margin, yPosition);
    yPosition += 15;

    // Task Summary Table
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.text('Task Summary', margin, yPosition);
    yPosition += 10;

    // Table headers
    pdf.setFontSize(10);
    const colWidths = [60, 40, 30, 30, 40, 30];
    const headers = ['Task Name', 'Assignee', 'Status', 'Progress', 'Start Date', 'End Date'];

    headers.forEach((header, index) => {
      let xPos = margin;
      for (let i = 0; i < index; i++) {
        xPos += colWidths[i];
      }
      pdf.text(header, xPos, yPosition);
    });
    yPosition += 8;

    // Draw header line
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Task rows
    tasks.forEach((task, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }

      const rowData = [
        task.title?.substring(0, 20) || 'Untitled',
        task.assignedToId || 'Unassigned',
        task.status || 'TODO',
        `${task.progress || 0}%`,
        task.startDate?.toDate().toLocaleDateString() || 'TBD',
        task.endDate?.toDate().toLocaleDateString() || 'TBD'
      ];

      rowData.forEach((data, colIndex) => {
        let xPos = margin;
        for (let i = 0; i < colIndex; i++) {
          xPos += colWidths[i];
        }
        pdf.text(data.toString(), xPos, yPosition);
      });
      yPosition += 6;
    });

    // Dependencies section
    if (dependencies.length > 0) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      yPosition += 10;
      pdf.setFontSize(14);
      pdf.text('Task Dependencies', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      dependencies.forEach((dep, index) => {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = margin;
        }

        const predecessor = tasks.find(t => t.id === dep.predecessorId);
        const successor = tasks.find(t => t.id === dep.successorId);

        const depText = `${predecessor?.title || 'Unknown'} → ${successor?.title || 'Unknown'} (${dep.type})`;
        pdf.text(depText, margin, yPosition);
        yPosition += 6;
      });
    }

    // Resource assignments section
    if (resourceAssignments.length > 0) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      yPosition += 10;
      pdf.setFontSize(14);
      pdf.text('Resource Assignments', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      resourceAssignments.forEach((assignment, index) => {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = margin;
        }

        const task = tasks.find(t => t.id === assignment.taskId);
        const resourceText = `${task?.title || 'Unknown Task'}: ${assignment.allocationPercentage}% allocation`;
        pdf.text(resourceText, margin, yPosition);
        yPosition += 6;
      });
    }

    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(`Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`, margin, pageHeight - 10);
    }

    // Download the PDF
    pdf.save(`${projectName}-schedule-${new Date().toISOString().split('T')[0]}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

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
