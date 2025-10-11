/**
 * Mock Implementations for WebSocket and Real-time Services
 * Provides comprehensive mocks for WebSocket connections and real-time synchronization
 */

import { vi } from 'vitest'

// Mock WebSocket Connection
export const mockWebSocket = {
  readyState: WebSocket.OPEN,
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
  url: 'ws://localhost:3000/timer-sync',
  protocol: '',
  extensions: '',
  bufferedAmount: 0,
  binaryType: 'blob' as BinaryType,
  CONNECTING: WebSocket.CONNECTING,
  OPEN: WebSocket.OPEN,
  CLOSING: WebSocket.CLOSING,
  CLOSED: WebSocket.CLOSED,
}

// Mock WebSocket Constructor
export const MockWebSocketConstructor = vi.fn().mockImplementation(() => mockWebSocket)
global.WebSocket = MockWebSocketConstructor as any

// Mock WebSocket Message Event
export const createMockMessageEvent = (data: any) => ({
  type: 'message',
  data: JSON.stringify(data),
  origin: 'ws://localhost:3000',
  lastEventId: '',
  source: null,
  ports: [],
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  stopImmediatePropagation: vi.fn(),
  initMessageEvent: vi.fn(),
})

// Mock WebSocket Close Event
export const createMockCloseEvent = (code = 1000, reason = 'Normal closure') => ({
  type: 'close',
  code,
  reason,
  wasClean: true,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  stopImmediatePropagation: vi.fn(),
})

// Mock WebSocket Error Event
export const createMockErrorEvent = (error = new Error('WebSocket error')) => ({
  type: 'error',
  error,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  stopImmediatePropagation: vi.fn(),
})

// Mock Real-time Timer Sync Hook
export const mockRealtimeTimerSync = {
  isConnected: true,
  connectionStatus: 'CONNECTED' as const,
  lastSyncTime: new Date().toISOString(),
  conflictCount: 0,
  
  // Connection management
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  reconnect: vi.fn().mockResolvedValue(undefined),
  
  // Timer synchronization
  syncTimerState: vi.fn().mockResolvedValue(undefined),
  broadcastTimerUpdate: vi.fn().mockResolvedValue(undefined),
  resolveTimerConflict: vi.fn().mockResolvedValue(undefined),
  
  // Event handlers
  onTimerSync: vi.fn(),
  onConflictDetected: vi.fn(),
  onConnectionChange: vi.fn(),
  
  // Status checks
  isTimerInSync: vi.fn().mockReturnValue(true),
  hasConflicts: vi.fn().mockReturnValue(false),
  getLastSyncStatus: vi.fn().mockReturnValue({ success: true, timestamp: new Date().toISOString() }),
}

// Mock useRealtimeTimerSync Hook
export const mockUseRealtimeTimerSync = vi.fn().mockReturnValue(mockRealtimeTimerSync)

// Mock EventSource Constructor first
export const MockEventSourceConstructor = vi.fn().mockImplementation((url: string) => ({
  readyState: 1, // OPEN
  url,
  withCredentials: false,
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
}))

// Define EventSource globally for tests
global.EventSource = MockEventSourceConstructor as any

// Now create mock with constants
export const mockEventSource = {
  readyState: 1, // OPEN
  url: 'http://localhost:3000/timer-events',
  withCredentials: false,
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
}

// Mock Heartbeat Service
export const mockHeartbeatService = {
  isActive: true,
  interval: 30000, // 30 seconds
  lastHeartbeat: new Date().toISOString(),
  
  start: vi.fn(),
  stop: vi.fn(),
  sendHeartbeat: vi.fn().mockResolvedValue(true),
  onHeartbeatMissed: vi.fn(),
  
  // Status checks
  isConnected: vi.fn().mockReturnValue(true),
  getLastHeartbeatTime: vi.fn().mockReturnValue(new Date().toISOString()),
  getMissedHeartbeatCount: vi.fn().mockReturnValue(0),
}

// Mock Connection Manager
export const mockConnectionManager = {
  isOnline: true,
  connectionType: 'wifi' as const,
  effectiveType: '4g' as const,
  
  // Connection monitoring
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
  checkConnection: vi.fn().mockResolvedValue(true),
  
  // Event handlers
  onOnline: vi.fn(),
  onOffline: vi.fn(),
  onConnectionChange: vi.fn(),
  
  // Connection utils
  isConnected: vi.fn().mockReturnValue(true),
  getConnectionInfo: vi.fn().mockReturnValue({
    isOnline: true,
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  }),
}

// Mock Sync Queue Service
export const mockSyncQueue = {
  queue: [],
  isProcessing: false,
  
  // Queue operations
  add: vi.fn().mockResolvedValue('queue-item-id'),
  remove: vi.fn().mockResolvedValue(true),
  clear: vi.fn().mockResolvedValue(undefined),
  process: vi.fn().mockResolvedValue(undefined),
  
  // Queue queries
  getQueueSize: vi.fn().mockReturnValue(0),
  getPendingItems: vi.fn().mockReturnValue([]),
  getFailedItems: vi.fn().mockReturnValue([]),
  
  // Queue status
  isQueueEmpty: vi.fn().mockReturnValue(true),
  hasFailedItems: vi.fn().mockReturnValue(false),
  getProcessingStatus: vi.fn().mockReturnValue('idle'),
}

// Mock Conflict Resolution Service
export const mockConflictResolution = {
  conflictCount: 0,
  lastConflictTime: null,
  resolutionStrategy: 'server-wins' as const,
  
  // Conflict detection
  detectConflict: vi.fn().mockReturnValue(false),
  resolveConflict: vi.fn().mockResolvedValue({ resolved: true, strategy: 'server-wins' }),
  
  // Conflict handlers
  onConflictDetected: vi.fn(),
  onConflictResolved: vi.fn(),
  
  // Conflict queries
  hasActiveConflicts: vi.fn().mockReturnValue(false),
  getConflictHistory: vi.fn().mockReturnValue([]),
  getResolutionStats: vi.fn().mockReturnValue({ total: 0, resolved: 0, failed: 0 }),
}

// Reset all WebSocket mocks
export const resetWebSocketMocks = () => {
  MockWebSocketConstructor.mockClear()
  MockEventSourceConstructor.mockClear()
  
  Object.values(mockRealtimeTimerSync).forEach(mock => {
    if (vi.isMockFunction(mock)) mock.mockClear()
  })
  
  Object.values(mockHeartbeatService).forEach(mock => {
    if (vi.isMockFunction(mock)) mock.mockClear()
  })
  
  Object.values(mockConnectionManager).forEach(mock => {
    if (vi.isMockFunction(mock)) mock.mockClear()
  })
  
  Object.values(mockSyncQueue).forEach(mock => {
    if (vi.isMockFunction(mock)) mock.mockClear()
  })
  
  Object.values(mockConflictResolution).forEach(mock => {
    if (vi.isMockFunction(mock)) mock.mockClear()
  })
}

// Simulate WebSocket events for testing
export const simulateWebSocketEvents = {
  open: () => {
    if (mockWebSocket.onopen) mockWebSocket.onopen({} as Event)
  },
  message: (data: any) => {
    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage(createMockMessageEvent(data))
    }
  },
  close: (code = 1000, reason = 'Normal closure') => {
    if (mockWebSocket.onclose) {
      mockWebSocket.onclose(createMockCloseEvent(code, reason))
    }
  },
  error: (error = new Error('WebSocket error')) => {
    if (mockWebSocket.onerror) {
      mockWebSocket.onerror(createMockErrorEvent(error))
    }
  },
}

// Export all WebSocket mocks
export default {
  mockWebSocket,
  MockWebSocketConstructor,
  mockEventSource,
  MockEventSourceConstructor,
  mockRealtimeTimerSync,
  mockUseRealtimeTimerSync,
  mockHeartbeatService,
  mockConnectionManager,
  mockSyncQueue,
  mockConflictResolution,
  createMockMessageEvent,
  createMockCloseEvent,
  createMockErrorEvent,
  resetWebSocketMocks,
  simulateWebSocketEvents,
}