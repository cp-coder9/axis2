import { ReactNode } from 'react';

// Supported chart visualization types across the dashboard
export type ChartPrimitiveType =
    | 'line'
    | 'bar'
    | 'area'
    | 'scatter'
    | 'pie'
    | 'radar'
    | 'radialBar'
    | 'composed';

// Configuration for individual chart series definitions
export interface ChartSeriesConfig<TDatum = any> {
    id: string;
    name: string;
    type: ChartPrimitiveType;
    dataKey: keyof TDatum | string;
    color?: string;
    strokeWidth?: number;
    fillOpacity?: number;
    strokeDasharray?: string;
    stackId?: string;
    formatter?: (value: number | string, datum: TDatum) => number | string;
    active?: boolean;
}

// Axis configuration metadata for charts
export interface ChartAxisConfig<TDatum = any> {
    key: keyof TDatum | string;
    label?: string;
    unit?: string;
    formatter?: (value: number | string, datum?: TDatum) => string;
    tickFormatter?: (value: any) => string;
}

// Tooltip customization hooks for chart wrappers
export interface ChartTooltipConfig<TDatum = any> {
    labelFormatter?: (label: string | number) => string;
    valueFormatter?: (value: number, name: string, datum: TDatum) => ReactNode;
    footer?: (data: TDatum[]) => ReactNode;
}

// Legend configuration shared across chart components
export interface ChartLegendConfig {
    visible?: boolean;
    layout?: 'horizontal' | 'vertical';
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    formatter?: (value: string) => string;
}

// Additional grid and guideline controls
export interface ChartGridConfig {
    horizontal?: boolean;
    vertical?: boolean;
    strokeDasharray?: string;
    stroke?: string;
}

export interface ChartReferenceLine {
    id: string;
    type: 'horizontal' | 'vertical';
    value: number | string;
    label?: string;
    color?: string;
    strokeDasharray?: string;
}

// Interaction capabilities toggled per chart instance
export interface ChartInteractionConfig {
    zoom?: boolean;
    pan?: boolean;
    brush?: boolean;
    selection?: boolean;
    syncWithTheme?: boolean;
}

// Wrapper configuration combining all chart options
export interface ChartWrapperConfig<TDatum = any> {
    type: ChartPrimitiveType;
    series: ChartSeriesConfig<TDatum>[];
    xAxis: ChartAxisConfig<TDatum>;
    yAxis?: ChartAxisConfig<TDatum>;
    secondaryYAxis?: ChartAxisConfig<TDatum>;
    tooltip?: ChartTooltipConfig<TDatum>;
    legend?: ChartLegendConfig;
    grid?: ChartGridConfig;
    referenceLines?: ChartReferenceLine[];
    interactions?: ChartInteractionConfig;
    annotations?: Array<{
        id: string;
        content: ReactNode;
        x: number | string;
        y?: number | string;
    }>;
}

// Selection metadata emitted by interactive charts
export interface ChartSelection<TDatum = any> {
    type: 'point' | 'range' | 'area';
    active: boolean;
    startIndex?: number;
    endIndex?: number;
    items?: TDatum[];
    bounds?: {
        x: [number, number];
        y?: [number, number];
    };
}

// Runtime props shared by chart wrapper-components
export interface ChartWrapperProps<TDatum = any> {
    id?: string;
    title?: string;
    description?: string;
    data: TDatum[];
    config: ChartWrapperConfig<TDatum>;
    height?: number;
    className?: string;
    loading?: boolean;
    emptyState?: ReactNode;
    errorState?: ReactNode;
    onDataPointClick?: (payload: {
        datum: TDatum;
        index: number;
        seriesId: string;
    }) => void;
    onSelectionChange?: (selection: ChartSelection<TDatum> | null) => void;
    onExport?: (format: 'png' | 'csv' | 'pdf') => void;
}

// Theme tokens consumed by chart theming utilities
export interface ChartThemeTokens {
    background: string;
    surface: string;
    grid: string;
    axis: string;
    text: string;
    palette: string[];
    positive: string;
    negative: string;
    neutral: string;
}

// Formatter signature for transforming raw analytics data
export type ChartDataFormatter<TDatum = any> = (raw: unknown) => {
    data: TDatum[];
    config: ChartWrapperConfig<TDatum>;
};
