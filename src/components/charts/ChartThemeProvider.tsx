import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';

// Chart color configuration based on shadcn/ui tokens
export interface ChartThemeConfig {
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  grid: {
    stroke: string;
    strokeDasharray: string;
  };
  axis: {
    stroke: string;
    fontSize: number;
    fontFamily: string;
  };
  tooltip: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    shadow: string;
  };
  legend: {
    textColor: string;
    fontSize: number;
  };
}

// Default light theme configuration
const lightThemeConfig: ChartThemeConfig = {
  colors: {
    primary: [
      'hsl(var(--chart-1))', // 12 76% 61%
      'hsl(var(--chart-2))', // 173 58% 39%
      'hsl(var(--chart-3))', // 197 37% 24%
      'hsl(var(--chart-4))', // 43 74% 66%
      'hsl(var(--chart-5))', // 27 87% 67%
    ],
    secondary: [
      'hsl(var(--muted))',
      'hsl(var(--muted-foreground))',
      'hsl(var(--accent))',
      'hsl(var(--secondary))',
    ],
    accent: [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
    ],
    semantic: {
      success: 'hsl(142 76% 36%)', // Green
      warning: 'hsl(38 92% 50%)', // Orange
      error: 'hsl(0 84% 60%)', // Red
      info: 'hsl(221 83% 53%)', // Blue
    },
  },
  grid: {
    stroke: 'hsl(var(--border))',
    strokeDasharray: '3 3',
  },
  axis: {
    stroke: 'hsl(var(--muted-foreground))',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
  },
  tooltip: {
    backgroundColor: 'hsl(var(--popover))',
    borderColor: 'hsl(var(--border))',
    textColor: 'hsl(var(--popover-foreground))',
    shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  legend: {
    textColor: 'hsl(var(--foreground))',
    fontSize: 12,
  },
};

// Dark theme configuration
const darkThemeConfig: ChartThemeConfig = {
  colors: {
    primary: [
      'hsl(var(--chart-1))', // 220 70% 50%
      'hsl(var(--chart-2))', // 160 60% 45%
      'hsl(var(--chart-3))', // 30 80% 55%
      'hsl(var(--chart-4))', // 280 65% 60%
      'hsl(var(--chart-5))', // 340 75% 55%
    ],
    secondary: [
      'hsl(var(--muted))',
      'hsl(var(--muted-foreground))',
      'hsl(var(--accent))',
      'hsl(var(--secondary))',
    ],
    accent: [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
    ],
    semantic: {
      success: 'hsl(142 71% 45%)', // Brighter green for dark mode
      warning: 'hsl(38 92% 58%)', // Brighter orange for dark mode
      error: 'hsl(0 91% 71%)', // Brighter red for dark mode
      info: 'hsl(221 83% 63%)', // Brighter blue for dark mode
    },
  },
  grid: {
    stroke: 'hsl(var(--border))',
    strokeDasharray: '3 3',
  },
  axis: {
    stroke: 'hsl(var(--muted-foreground))',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
  },
  tooltip: {
    backgroundColor: 'hsl(var(--popover))',
    borderColor: 'hsl(var(--border))',
    textColor: 'hsl(var(--popover-foreground))',
    shadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
  },
  legend: {
    textColor: 'hsl(var(--foreground))',
    fontSize: 12,
  },
};

interface ChartThemeContextType {
  config: ChartThemeConfig;
  getColor: (index: number, type?: 'primary' | 'secondary' | 'accent') => string;
  getSemanticColor: (type: 'success' | 'warning' | 'error' | 'info') => string;
  isDark: boolean;
}

const ChartThemeContext = createContext<ChartThemeContextType | undefined>(undefined);

export const useChartTheme = () => {
  const context = useContext(ChartThemeContext);
  if (!context) {
    throw new Error('useChartTheme must be used within a ChartThemeProvider');
  }
  return context;
};

interface ChartThemeProviderProps {
  children: React.ReactNode;
}

export const ChartThemeProvider: React.FC<ChartThemeProviderProps> = ({ children }) => {
  const { actualTheme } = useTheme();
  const [config, setConfig] = useState<ChartThemeConfig>(lightThemeConfig);
  const isDark = actualTheme === 'dark';

  useEffect(() => {
    setConfig(isDark ? darkThemeConfig : lightThemeConfig);
  }, [isDark]);

  const getColor = (index: number, type: 'primary' | 'secondary' | 'accent' = 'primary'): string => {
    const colors = config.colors[type];
    return colors[index % colors.length];
  };

  const getSemanticColor = (type: 'success' | 'warning' | 'error' | 'info'): string => {
    return config.colors.semantic[type];
  };

  const value: ChartThemeContextType = {
    config,
    getColor,
    getSemanticColor,
    isDark,
  };

  return (
    <ChartThemeContext.Provider value={value}>
      {children}
    </ChartThemeContext.Provider>
  );
};

// Utility function to generate chart config from data
export const generateChartConfig = (
  datasets: Array<{ label: string; type?: 'success' | 'warning' | 'error' | 'info' }>,
  chartTheme: ChartThemeContextType
) => {
  const config: Record<string, { label: string; color: string }> = {};
  
  datasets.forEach((dataset, index) => {
    const key = dataset.label.replace(/\s+/g, '').toLowerCase();
    config[key] = {
      label: dataset.label,
      color: dataset.type 
        ? chartTheme.getSemanticColor(dataset.type)
        : chartTheme.getColor(index),
    };
  });
  
  return config;
};

// Utility function to transform legacy chart data with proper theming
export const transformChartDataWithTheme = (
  data: any,
  chartTheme: ChartThemeContextType
) => {
  if (!data?.labels || !data?.datasets) {
    return { chartData: [], config: {} };
  }

  const chartData = data.labels.map((label: string, index: number) => {
    const item: Record<string, any> = { name: label };
    
    data.datasets.forEach((dataset: any) => {
      const key = dataset.label.replace(/\s+/g, '').toLowerCase();
      item[key] = dataset.data[index] || 0;
    });
    
    return item;
  });

  const config = generateChartConfig(data.datasets, chartTheme);
  
  return { chartData, config };
};