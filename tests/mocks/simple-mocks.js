// Simple mock implementations for our tests
import { vi } from 'vitest';

// Export mock functions for tests to use
export const mockToast = vi.fn();
export const mockDismiss = vi.fn();

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
    dismiss: mockDismiss,
  }),
}));

// Mock React hooks to prevent errors
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useRef: (initialValue) => ({ current: initialValue }),
    useEffect: vi.fn(),
    useState: (initial) => [initial, vi.fn()],
  };
});

// Mock UI components with simple implementations
vi.mock('@/components/ui/button', () => ({
  Button: (props) => props.children,
}));

vi.mock('@/components/ui/card', () => ({
  Card: (props) => props.children,
  CardHeader: (props) => props.children,
  CardTitle: (props) => props.children,
  CardContent: (props) => props.children,
  CardFooter: (props) => props.children,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: (props) => `Progress: ${props.value}%`,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: (props) => props.children,
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: (props) => props.children,
  AlertDescription: (props) => props.children,
}));

vi.mock('lucide-react', () => ({
  Play: () => 'Play Icon',
  Pause: () => 'Pause Icon',
  RotateCcw: () => 'Reset Icon',
  Stop: () => 'Stop Icon',
  Check: () => 'Check Icon',
}));
