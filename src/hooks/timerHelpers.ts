import { useRef, useEffect } from 'react';

// Light-weight stubs for missing timer helper hooks used in CountdownTimer
export const usePerformanceMonitor = (name: string) => {
    return {
        getStats: () => ({})
    };
};

export const useTimerCalculations = (...args: any[]) => {
    return {
        percentage: 0,
        elapsed: 0,
        remaining: 0
    };
};

export const useThrottledValue = (value: any, ms: number) => {
    // Very small throttle: return the value directly
    return value;
};

export const useCircularProgress = (...args: any[]) => {
    return { value: 0 };
};

export const useVisibilityHandler = (handler: () => void) => {
    useEffect(() => {
        // no-op
        return () => { };
    }, [handler]);
};

export const useTimerInterval = (cb: () => void, active: boolean) => {
    useEffect(() => {
        if (!active) return;
        const id = setInterval(cb, 1000);
        return () => clearInterval(id);
    }, [cb, active]);
};

export const useTimerHandlers = (...args: any[]) => {
    return {} as any;
};

export const useTimerCleanup = (...args: any[]) => {
    // no-op
};

export default {};
