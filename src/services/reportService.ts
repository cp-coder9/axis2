import {
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProjectCostReport, FreelancerPerformanceReport, Project, ProjectStatus, TimeLog } from '../types';

const TIME_LOGS_COLLECTION = 'timeLogs';
const PROJECTS_COLLECTION = 'projects';

/**
 * Generate a project cost report.
 * Calculates total cost and hours for a specific project with team breakdown.
 */
export const generateProjectCostReport = async (
    projectId: string,
    projects: Project[]
): Promise<ProjectCostReport | null> => {
    try {
        // Find the project
        const project = projects.find(p => p.id === projectId);
        if (!project) {
            console.warn(`Project ${projectId} not found`);
            return null;
        }

        // Get all time logs for this project
        const timeLogsRef = collection(db, TIME_LOGS_COLLECTION);
        const q = query(timeLogsRef, where('projectId', '==', projectId));
        const querySnapshot = await getDocs(q);
        const timeLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeLog));

        // Calculate team breakdown
        const teamBreakdown: Record<string, { userId: string; userName: string; hours: number; cost: number; hourlyRate: number }> = {};

        timeLogs.forEach(log => {
            const userId = log.loggedById;
            const userName = log.loggedByName || 'Unknown User';
            const hours = log.durationMinutes / 60;
            const hourlyRate = log.hourlyRate || 0;
            const cost = hours * hourlyRate;

            if (!teamBreakdown[userId]) {
                teamBreakdown[userId] = {
                    userId,
                    userName,
                    hours: 0,
                    cost: 0,
                    hourlyRate
                };
            }

            teamBreakdown[userId].hours += hours;
            teamBreakdown[userId].cost += cost;
        });

        // Convert to array and calculate totals
        const teamBreakdownArray = Object.values(teamBreakdown);
        const totalHours = teamBreakdownArray.reduce((sum, member) => sum + member.hours, 0);
        const totalCost = teamBreakdownArray.reduce((sum, member) => sum + member.cost, 0);

        return {
            projectId,
            projectTitle: project.title,
            totalCost,
            totalHours,
            teamBreakdown: teamBreakdownArray.map(({ hourlyRate, ...rest }) => rest)
        };
    } catch (error) {
        console.error('Error generating project cost report:', error);
        throw new Error('Failed to generate project cost report');
    }
};

/**
 * Generate a freelancer performance report.
 * Provides statistics on a freelancer's work across all projects.
 */
export const generateFreelancerPerformanceReport = async (
    freelancerId: string,
    projects: Project[]
): Promise<FreelancerPerformanceReport | null> => {
    try {
        // Get all time logs for this freelancer
        const timeLogsRef = collection(db, TIME_LOGS_COLLECTION);
        const q = query(timeLogsRef, where('loggedById', '==', freelancerId));
        const querySnapshot = await getDocs(q);
        const timeLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeLog));

        if (timeLogs.length === 0) {
            console.warn(`No time logs found for freelancer ${freelancerId}`);
            return null;
        }

        // Get freelancer name from first time log
        const freelancerName = timeLogs[0]?.loggedByName || 'Unknown Freelancer';

        // Calculate total hours
        const totalHours = timeLogs.reduce((sum, log) => sum + (log.durationMinutes / 60), 0);

        // Calculate average hourly rate
        const totalEarnings = timeLogs.reduce((sum, log) => {
            const hours = log.durationMinutes / 60;
            const rate = log.hourlyRate || 0;
            return sum + (hours * rate);
        }, 0);
        const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

        // Find unique projects this freelancer has worked on
        const uniqueProjectIds = [...new Set(timeLogs.map(log => log.projectId))];
        const freelancerProjects = projects.filter(p => uniqueProjectIds.includes(p.id));

        // Count completed vs in-progress projects
        const projectsCompleted = freelancerProjects.filter(p => p.status === ProjectStatus.COMPLETED).length;
        const projectsInProgress = freelancerProjects.filter(p => 
            p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.PLANNING
        ).length;

        return {
            freelancerId,
            freelancerName,
            totalProjects: freelancerProjects.length,
            totalHours,
            averageHourlyRate,
            projectsCompleted,
            projectsInProgress
        };
    } catch (error) {
        console.error('Error generating freelancer performance report:', error);
        throw new Error('Failed to generate freelancer performance report');
    }
};

/**
 * Export data to CSV format
 */
export const exportToCSV = async (data: any[], filename: string): Promise<void> => {
    try {
        if (!data || data.length === 0) {
            throw new Error('No data to export');
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);
        
        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Handle values that contain commas or quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? '';
                }).join(',')
            )
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        throw new Error('Failed to export to CSV');
    }
};

/**
 * Export data to PDF format
 * Uses a simple text-based approach for now
 */
export const exportToPDF = async (title: string, data: any): Promise<void> => {
    try {
        // Create a simple formatted text representation
        const content = `
${title}
Generated: ${new Date().toLocaleString()}
${'='.repeat(50)}

${JSON.stringify(data, null, 2)}
        `.trim();

        // For now, download as a text file that can be converted to PDF
        // In a full implementation, you would use a library like jspdf
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${Date.now()}.txt`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        console.log('PDF export completed (as text file). Consider using jspdf for true PDF generation.');
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        throw new Error('Failed to export to PDF');
    }
};
