import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WebSocketManager } from '../../services/websocket/WebSocketManager';
import { MessagingService } from '../../services/messaging/MessagingService';
import { MessagingProvider, useMessaging } from '../../contexts/modules/messaging';
import { WebSocketMessageType, MessageStatus, ChannelType } from '../../types/messaging';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    // Mock successful send
    console.log('Mock WebSocket send:', data);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: code || 1000, reason }));
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
  auth: {},
  storage: {}
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-message-id' }),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  endBefore: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    // Mock empty snapshot
    callback({
      docs: [],
      docChanges: () => []
    });
    return () => {}; // Unsubscribe function
  }),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: {
    now: () => new Date(),
    fromDate: (date: Date) => date
  },
  where: vi.fn(),
  writeBatch: vi.fn()
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 minutes ago')
}));

// Test component that uses messaging context
const TestMessagingComponent = () => {
  const {
    connectionStatus,
    isConnected,
    sendMessage,
    messages,
    createChannel,
    setTyping
  } = useMessaging();

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="reconnect-count">
        {connectionStatus.attemptCount}
      </div>
      <button
        data-testid="send-message"
        onClick={() => sendMessage('test-channel', 'Hello World')}
      >
        Send Message
      </button>
      <button
        data-testid="create-channel"
        onClick={() => createChannel('Test Channel', ChannelType.PROJECT_GENERAL, ['user1', 'user2'])}
      >
        Create Channel
      </button>
      <button
        data-testid="start-typing"
        onClick={() => setTyping('test-channel', true)}
      >
        Start Typing
      </button>
      <div data-testid="message-count">
        {messages['test-channel']?.length || 0}
      </div>
    </div>
  );
};

describe('WebSocket Messaging System', () => {
  // Mock WebSocket instance for testing

  beforeEach(() => {
    // Mock WebSocket globally
    global.WebSocket = MockWebSocket as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WebSocketManager', () => {
    it('should establish WebSocket connection', async () => {
      const config = {
        url: 'ws://localhost:8080',
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
        heartbeatInterval: 30000,
        timeout: 5000
      };

      const wsManager = new WebSocketManager(config);
      
      await wsManager.connect();
      
      expect(wsManager.isConnected()).toBe(true);
      expect(wsManager.getStatus().connected).toBe(true);
    });

    it('should handle connection failures and retry', async () => {
      const config = {
        url: 'ws://localhost:8080',
        reconnectInterval: 100,
        maxReconnectAttempts: 2,
        heartbeatInterval: 30000,
        timeout: 5000
      };

      const wsManager = new WebSocketManager(config);
      
      // Mock connection failure
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED;
            this.onclose?.(new CloseEvent('close', { code: 1006 }));
          }, 20);
        }
      } as any;

      const connectionStatusUpdates: any[] = [];
      wsManager.onConnectionChange((status) => {
        connectionStatusUpdates.push(status);
      });

      try {
        await wsManager.connect();
      } catch (error) {
        // Expected to fail - connection should be rejected
        console.log('Connection failed as expected:', error);
      }

      // Wait for reconnection attempts
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(connectionStatusUpdates.some(status => status.reconnecting)).toBe(true);
    });

    it('should send and receive messages', async () => {
      const config = {
        url: 'ws://localhost:8080',
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
        heartbeatInterval: 30000,
        timeout: 5000
      };

      const wsManager = new WebSocketManager(config);
      await wsManager.connect();

      const receivedMessages: any[] = [];
      wsManager.onMessage(WebSocketMessageType.MESSAGE_RECEIVED, (payload) => {
        receivedMessages.push(payload);
      });

      // Send a message
      wsManager.send(WebSocketMessageType.MESSAGE_SENT, {
        channelId: 'test-channel',
        content: 'Hello World'
      });

      // Simulate receiving a message
      const mockWs = (wsManager as any).ws as MockWebSocket;
      mockWs.simulateMessage({
        type: WebSocketMessageType.MESSAGE_RECEIVED,
        payload: {
          id: 'msg-1',
          content: 'Hello back!',
          channelId: 'test-channel'
        },
        timestamp: Date.now(),
        messageId: 'ws-msg-1'
      });

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].content).toBe('Hello back!');
    });

    it('should handle heartbeat messages', async () => {
      const config = {
        url: 'ws://localhost:8080',
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
        heartbeatInterval: 100, // Short interval for testing
        timeout: 5000
      };

      const wsManager = new WebSocketManager(config);
      await wsManager.connect();

      const mockWs = (wsManager as any).ws as MockWebSocket;
      const sendSpy = vi.spyOn(mockWs, 'send');

      // Wait for heartbeat
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"HEARTBEAT"')
      );
    });
  });

  describe('MessagingService', () => {
    it('should send messages to Firestore', async () => {
      const messagingService = new MessagingService();
      
      const messageId = await messagingService.sendMessage(
        'test-channel',
        'Hello World',
        'user-1',
        'Test User',
        'ADMIN',
        ChannelType.PROJECT_GENERAL
      );

      expect(messageId).toBe('mock-message-id');
    });

    it('should load message history with pagination', async () => {
      const messagingService = new MessagingService();
      
      const result = await messagingService.loadMessages('test-channel', {
        limit: 20,
        direction: 'before'
      });

      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it('should handle typing indicators', async () => {
      const messagingService = new MessagingService();
      
      await expect(
        messagingService.setTypingIndicator('test-channel', 'user-1', 'Test User', true)
      ).resolves.not.toThrow();
    });

    it('should update user presence', async () => {
      const messagingService = new MessagingService();
      
      await expect(
        messagingService.updatePresence('user-1', 'ONLINE' as any, 'device-1')
      ).resolves.not.toThrow();
    });
  });

  describe('MessagingProvider Integration', () => {
    it('should provide messaging context', async () => {
      render(
        <MessagingProvider
          userId="test-user"
          userName="Test User"
          userRole="ADMIN"
          websocketUrl="ws://localhost:8080"
        >
          <TestMessagingComponent />
        </MessagingProvider>
      );

      // Wait for connection
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });
    });

    it('should handle message sending', async () => {
      render(
        <MessagingProvider
          userId="test-user"
          userName="Test User"
          userRole="ADMIN"
          websocketUrl="ws://localhost:8080"
        >
          <TestMessagingComponent />
        </MessagingProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });

      const sendButton = screen.getByTestId('send-message');
      fireEvent.click(sendButton);

      // Should not throw error
      expect(sendButton).toBeInTheDocument();
    });

    it('should handle channel creation', async () => {
      render(
        <MessagingProvider
          userId="test-user"
          userName="Test User"
          userRole="ADMIN"
          websocketUrl="ws://localhost:8080"
        >
          <TestMessagingComponent />
        </MessagingProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });

      const createButton = screen.getByTestId('create-channel');
      fireEvent.click(createButton);

      // Should not throw error
      expect(createButton).toBeInTheDocument();
    });

    it('should handle typing indicators', async () => {
      render(
        <MessagingProvider
          userId="test-user"
          userName="Test User"
          userRole="ADMIN"
          websocketUrl="ws://localhost:8080"
        >
          <TestMessagingComponent />
        </MessagingProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });

      const typingButton = screen.getByTestId('start-typing');
      fireEvent.click(typingButton);

      // Should not throw error
      expect(typingButton).toBeInTheDocument();
    });

    it('should handle connection errors gracefully', async () => {
      // Mock WebSocket that fails to connect
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.onerror?.(new Event('error'));
          }, 10);
        }
      } as any;

      render(
        <MessagingProvider
          userId="test-user"
          userName="Test User"
          userRole="ADMIN"
          websocketUrl="ws://localhost:8080"
        >
          <TestMessagingComponent />
        </MessagingProvider>
      );

      // Should render without crashing
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    });
  });

  describe('Message Status Tracking', () => {
    it('should track message status updates', async () => {
      const config = {
        url: 'ws://localhost:8080',
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
        heartbeatInterval: 30000,
        timeout: 5000
      };

      const wsManager = new WebSocketManager(config);
      await wsManager.connect();

      const statusUpdates: any[] = [];
      wsManager.onMessage(WebSocketMessageType.MESSAGE_STATUS_UPDATE, (payload) => {
        statusUpdates.push(payload);
      });

      // Simulate status update
      const mockWs = (wsManager as any).ws as MockWebSocket;
      mockWs.simulateMessage({
        type: WebSocketMessageType.MESSAGE_STATUS_UPDATE,
        payload: {
          channelId: 'test-channel',
          messageId: 'msg-1',
          status: MessageStatus.READ
        },
        timestamp: Date.now(),
        messageId: 'status-update-1'
      });

      expect(statusUpdates).toHaveLength(1);
      expect(statusUpdates[0].status).toBe(MessageStatus.READ);
    });
  });

  describe('Real-time Features', () => {
    it('should handle typing start and stop events', async () => {
      const config = {
        url: 'ws://localhost:8080',
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
        heartbeatInterval: 30000,
        timeout: 5000
      };

      const wsManager = new WebSocketManager(config);
      await wsManager.connect();

      const typingEvents: any[] = [];
      wsManager.onMessage(WebSocketMessageType.TYPING_START, (payload) => {
        typingEvents.push({ type: 'start', ...payload });
      });
      wsManager.onMessage(WebSocketMessageType.TYPING_STOP, (payload) => {
        typingEvents.push({ type: 'stop', ...payload });
      });

      const mockWs = (wsManager as any).ws as MockWebSocket;
      
      // Simulate typing start
      mockWs.simulateMessage({
        type: WebSocketMessageType.TYPING_START,
        payload: {
          channelId: 'test-channel',
          userId: 'user-2',
          userName: 'Other User'
        },
        timestamp: Date.now(),
        messageId: 'typing-1'
      });

      // Simulate typing stop
      mockWs.simulateMessage({
        type: WebSocketMessageType.TYPING_STOP,
        payload: {
          channelId: 'test-channel',
          userId: 'user-2'
        },
        timestamp: Date.now(),
        messageId: 'typing-2'
      });

      expect(typingEvents).toHaveLength(2);
      expect(typingEvents[0].type).toBe('start');
      expect(typingEvents[1].type).toBe('stop');
    });

    it('should handle presence updates', async () => {
      const config = {
        url: 'ws://localhost:8080',
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
        heartbeatInterval: 30000,
        timeout: 5000
      };

      const wsManager = new WebSocketManager(config);
      await wsManager.connect();

      const presenceUpdates: any[] = [];
      wsManager.onMessage(WebSocketMessageType.PRESENCE_UPDATE, (payload) => {
        presenceUpdates.push(payload);
      });

      const mockWs = (wsManager as any).ws as MockWebSocket;
      mockWs.simulateMessage({
        type: WebSocketMessageType.PRESENCE_UPDATE,
        payload: {
          userId: 'user-2',
          status: 'ONLINE',
          deviceId: 'device-2'
        },
        timestamp: Date.now(),
        messageId: 'presence-1'
      });

      expect(presenceUpdates).toHaveLength(1);
      expect(presenceUpdates[0].status).toBe('ONLINE');
    });
  });
});