// Mock React hooks
import * as React from 'react';

// Export the actual React implementation 
export default React;

// But also export specific mock implementations of hooks when needed
export const useRef = React.useRef;
export const useState = React.useState;
export const useEffect = React.useEffect;
export const useCallback = React.useCallback;
export const useMemo = React.useMemo;
