// Mock for react hooks to use in tests
import { vi } from 'vitest';

// Create a simple mock implementation of React hooks
const ReactMock = {
  useState: (initialState) => [initialState, vi.fn()],
  useEffect: vi.fn(),
  useLayoutEffect: vi.fn(),
  useRef: (initialValue) => ({ current: initialValue }),
  useCallback: (cb) => cb,
  useMemo: (cb) => cb(),
  useContext: () => ({}),
  createContext: () => ({
    Provider: ({ children }) => children,
    Consumer: ({ children }) => children,
  }),
};

// Export the mock implementation
export default ReactMock;
