import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, FileImage, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface ChartExportData {
  title: string;
  data: any[];
  config: Record<string, any>;
  chartType: string;
}

export interface ChartExportOptions {
  formats: ('png' | 'svg' | 'pdf' | 'csv' | 'json')[];
  filename?: string;
  onExport?: (format: string, data: any) => void;
}

// Export chart data as CSV
export const exportAsCSV = (data: ChartExportData): void => {
  try {
    const { title, data: chartData, config } = data;
    
    if (!chartData || chartData.length === 0) {
      toast({
        title: "Export Error",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    // Get all data keys from config
    const dataKeys = Object.keys(config);
    const headers = ['Name', ...dataKeys.map(key => config[key].label || key)];
    
    // Create CSV content
    const csvRows = [
      headers.join(','),
      ...chartData.map(item => [
        `"${item.name || ''}"`,
        ...dataKeys.map(key => item[key] || 0)
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_data.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Chart data exported as CSV",
    });
  } catch (error) {
    console.error('CSV export error:', error);
    toast({
      title: "Export Error",
      description: "Failed to export chart data as CSV",
      variant: "destructive",
    });
  }
};

// Export chart data as JSON
export const exportAsJSON = (data: ChartExportData): void => {
  try {
    const { title, data: chartData, config, chartType } = data;
    
    const exportData = {
      title,
      chartType,
      config,
      data: chartData,
      exportedAt: new Date().toISOString(),
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_chart.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Chart configuration exported as JSON",
    });
  } catch (error) {
    console.error('JSON export error:', error);
    toast({
      title: "Export Error",
      description: "Failed to export chart as JSON",
      variant: "destructive",
    });
  }
};

// Export chart as PNG (requires html2canvas)
export const exportAsPNG = async (
  chartElement: HTMLElement, 
  filename: string,
  options: { scale?: number; quality?: number; backgroundColor?: string } = {}
): Promise<void> => {
  try {
    // Dynamic import to avoid bundle bloat
    const html2canvas = await import('html2canvas');
    
    const canvas = await html2canvas.default(chartElement, {
      backgroundColor: options.backgroundColor || 'white',
      scale: options.scale || 2, // Higher resolution
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: true,
    });
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: "Chart exported as PNG image",
        });
      }
    }, 'image/png', options.quality || 0.95);
  } catch (error) {
    console.error('PNG export error:', error);
    toast({
      title: "Export Error",
      description: "Failed to export chart as PNG. Please try again.",
      variant: "destructive",
    });
  }
};

// Export chart as SVG
export const exportAsSVG = async (
  chartElement: HTMLElement,
  filename: string
): Promise<void> => {
  try {
    // Clone the element to avoid modifying the original
    const clonedElement = chartElement.cloneNode(true) as HTMLElement;
    
    // Get computed styles and inline them
    const inlineStyles = (element: HTMLElement) => {
      const computedStyle = window.getComputedStyle(element);
      const styleString = Array.from(computedStyle).reduce((str, property) => {
        return `${str}${property}:${computedStyle.getPropertyValue(property)};`;
      }, '');
      element.setAttribute('style', styleString);
      
      // Recursively apply to children
      Array.from(element.children).forEach(child => {
        if (child instanceof HTMLElement) {
          inlineStyles(child);
        }
      });
    };
    
    inlineStyles(clonedElement);
    
    // Create SVG wrapper
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${chartElement.offsetWidth}" height="${chartElement.offsetHeight}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${clonedElement.outerHTML}
          </div>
        </foreignObject>
      </svg>
    `;
    
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Chart exported as SVG",
    });
  } catch (error) {
    console.error('SVG export error:', error);
    toast({
      title: "Export Error",
      description: "Failed to export chart as SVG. Please try again.",
      variant: "destructive",
    });
  }
};

// Export chart as PDF (requires jsPDF)
export const exportAsPDF = async (
  chartElement: HTMLElement,
  data: ChartExportData
): Promise<void> => {
  try {
    // Dynamic imports to avoid bundle bloat
    const [jsPDF, html2canvas] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);
    
    const canvas = await html2canvas.default(chartElement, {
      backgroundColor: 'white',
      scale: 2,
      logging: false,
      useCORS: true,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF.jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    pdf.setFontSize(16);
    pdf.text(data.title, 20, 20);
    
    // Add chart image
    const imgWidth = 250;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
    
    // Add data table if space allows
    if (imgHeight < 150 && data.data.length > 0) {
      const tableY = 40 + imgHeight;
      pdf.setFontSize(12);
      pdf.text('Data Summary:', 20, tableY);
      
      // Simple table
      const dataKeys = Object.keys(data.config);
      let currentY = tableY + 10;
      
      // Headers
      pdf.setFontSize(10);
      pdf.text('Name', 20, currentY);
      dataKeys.forEach((key, index) => {
        pdf.text(data.config[key].label || key, 60 + (index * 40), currentY);
      });
      
      currentY += 5;
      
      // Data rows (limited to fit page)
      data.data.slice(0, 10).forEach((item) => {
        currentY += 5;
        pdf.text(String(item.name || ''), 20, currentY);
        dataKeys.forEach((key, index) => {
          pdf.text(String(item[key] || 0), 60 + (index * 40), currentY);
        });
      });
    }
    
    pdf.save(`${data.title.replace(/\s+/g, '_')}_chart.pdf`);
    
    toast({
      title: "Export Successful",
      description: "Chart exported as PDF",
    });
  } catch (error) {
    console.error('PDF export error:', error);
    toast({
      title: "Export Error",
      description: "Failed to export chart as PDF. Please try again.",
      variant: "destructive",
    });
  }
};

// Chart Export Button Component
interface ChartExportButtonProps {
  data: ChartExportData;
  chartElementRef: React.RefObject<HTMLElement>;
  options?: ChartExportOptions;
  className?: string;
}

export const ChartExportButton: React.FC<ChartExportButtonProps> = ({
  data,
  chartElementRef,
  options = { formats: ['csv', 'png', 'pdf'] },
  className = '',
}) => {
  const handleExport = async (format: string) => {
    if (options.onExport) {
      options.onExport(format, data);
      return;
    }

    switch (format) {
      case 'csv':
        exportAsCSV(data);
        break;
      case 'json':
        exportAsJSON(data);
        break;
      case 'png':
        if (chartElementRef.current) {
          await exportAsPNG(chartElementRef.current, data.title);
        }
        break;
      case 'svg':
        if (chartElementRef.current) {
          await exportAsSVG(chartElementRef.current, data.title);
        }
        break;
      case 'pdf':
        if (chartElementRef.current) {
          await exportAsPDF(chartElementRef.current, data);
        }
        break;
      default:
        toast({
          title: "Export Error",
          description: `Unsupported export format: ${format}`,
          variant: "destructive",
        });
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'png':
      case 'svg':
        return <FileImage className="w-4 h-4 mr-2" />;
      case 'pdf':
        return <FileText className="w-4 h-4 mr-2" />;
      case 'csv':
      case 'json':
        return <FileSpreadsheet className="w-4 h-4 mr-2" />;
      default:
        return <Download className="w-4 h-4 mr-2" />;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'png':
        return 'Export as PNG';
      case 'svg':
        return 'Export as SVG';
      case 'pdf':
        return 'Export as PDF';
      case 'csv':
        return 'Export as CSV';
      case 'json':
        return 'Export as JSON';
      default:
        return `Export as ${format.toUpperCase()}`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.formats.map((format, index) => (
          <React.Fragment key={format}>
            <DropdownMenuItem onClick={() => handleExport(format)}>
              {getFormatIcon(format)}
              {getFormatLabel(format)}
            </DropdownMenuItem>
            {index < options.formats.length - 1 && format === 'json' && (
              <DropdownMenuSeparator />
            )}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};