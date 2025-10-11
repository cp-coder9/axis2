import React from 'react';
import { vi } from 'vitest';

// Mock timer functions
export const useRef = vi.fn().mockImplementation((initialValue) => ({ current: initialValue }));
export const useState = vi.fn().mockImplementation((initialValue) => [initialValue, vi.fn()]);
export const useEffect = vi.fn().mockImplementation((callback, deps) => {});
export const useCallback = vi.fn().mockImplementation((callback) => callback);
export const useMemo = vi.fn().mockImplementation((factory) => factory());
