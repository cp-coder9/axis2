/**
 * Real-time Communication Service
 * Handles WebSocket connections, presence tracking, and typing indicators
 */

import { 
  WebSocketMessage, 
  WebSocketMessageType, 
  TypingIndicator, 
  UserPresence, 
  PresenceStatus,
  ConnectionConfig,
  ConnectionStatus,
  MessageCallback,
  TypingCallback,
  PresenceCallback,
  ConnectionCallback,
  ErrorCallback
} from '../types/messaging';

export class RealtimeService {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private connectionStatus: ConnectionStatus;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Event callbacks
  private messageCallbacks: Set<MessageCallback> = new Set();
  private typingCallbacks: Set<TypingCallback> = new Set();
  private presenceCallbacks: Set<PresenceCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  
  // State tracking
  private currentUserId: string | null = null;
  private currentPresence: PresenceStatus = PresenceStatus.OFFLINE;
  private typingUsers: Map<string, TypingIndicator> = new Map();
  private userPresences: Map<string, UserPresence> = new Map();

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = {
      url: config.url || 'ws://localhost:8080/ws',
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      timeout: config.timeout || 10000,
      ...config
    };

    this.connectionStatus = {
      connected: false,
      reconnecting: false,
      attemptCount: 0
    };

    // Handle page visibility changes for presence
    this.setupVisibilityHandlers();
  }

  /**
   * Initialize connection with user ID
   */
  async connect(userId: string): Promise<void> {
    this.currentUserId = userId;
    return this.establishConnection();
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    this.updateConnectionStatus({ connected: false, reconnecting: false, attemptCount: 0 });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(channelId: string, isTyping: boolean): void {
    if (!this.isConnected() || !this.currentUserId) return;

    const message: WebSocketMessage = {
      type: isTyping ? WebSocketMessageType.TYPING_START : WebSocketMessageType.TYPING_STOP,
      payload: {
        userId: this.currentUserId,
        channelId,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      messageId: this.generateMessageId()
    };

    this.send(message);

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      const existingTimer = this.typingTimers.get(channelId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.sendTypingIndicator(channelId, false);
        this.typingTimers.delete(channelId);
      }, 3000);

      this.typingTimers.set(channelId, timer);
    }
  }

  /**
   * Update user presence status
   */
  updatePresence(status: PresenceStatus): void {
    if (!this.isConnected() || !this.currentUserId) return;

    this.currentPresence = status;

    const message: WebSocketMessage = {
      type: WebSocketMessageType.PRESENCE_UPDATE,
      payload: {
        userId: this.currentUserId,
        status,
        timestamp: Date.now(),
        deviceId: this.getDeviceId()
      },
      timestamp: Date.now(),
      messageId: this.generateMessageId()
    };

    this.send(message);
  }

  /**
   * Get typing users for a channel
   */
  getTypingUsers(channelId: string): TypingIndicator[] {
    return Array.from(this.typingUsers.values())
      .filter(indicator => 
        indicator.channelId === channelId && 
        indicator.isTyping &&
        indicator.userId !== this.currentUserId
      );
  }

  /**
   * Get user presence
   */
  getUserPresence(userId: string): UserPresence | null {
    return this.userPresences.get(userId) || null;
  }

  /**
   * Get all user presences
   */
  getAllPresences(): UserPresence[] {
    return Array.from(this.userPresences.values());
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Event subscription methods
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.add(callback);
    return () => this.typingCallbacks.delete(callback);
  }

  onPresence(callback: PresenceCallback): () => void {
    this.presenceCallbacks.add(callback);
    return () => this.presenceCallbacks.delete(callback);
  }

  onConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  // Private methods
  private async establishConnection(): Promise<void> {
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupWebSocketHandlers();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.config.timeout);

        this.ws!.onopen = () => {
          clearTimeout(timeout);
          this.onConnectionOpen();
          resolve();
        };

        this.ws!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });
    } catch (error) {
      this.handleConnectionError(error as Error);
      throw error;
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => this.onConnectionOpen();
    this.ws.onmessage = (event) => this.handleWebSocketMessage(event);
    this.ws.onclose = (event) => this.onConnectionClose(event);
    this.ws.onerror = (error) => this.handleConnectionError(error as any);
  }

  private onConnectionOpen(): void {
    console.log('WebSocket connected');
    this.updateConnectionStatus({ connected: true, reconnecting: false, attemptCount: 0 });
    this.startHeartbeat();
    
    // Send initial presence
    if (this.currentUserId) {
      this.updatePresence(PresenceStatus.ONLINE);
    }
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.handleIncomingMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.notifyError(new Error('Invalid message format'));
    }
  }

  private onConnectionClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.cleanup();
    this.updateConnectionStatus({ connected: false, reconnecting: false, attemptCount: 0 });
    
    // Attempt reconnection if not a normal closure
    if (event.code !== 1000 && this.connectionStatus.attemptCount < this.config.maxReconnectAttempts) {
      this.attemptReconnection();
    }
  }

  private handleConnectionError(error: Error): void {
    console.error('WebSocket error:', error);
    this.notifyError(error);
    this.updateConnectionStatus({ 
      ...this.connectionStatus, 
      lastError: error.message 
    });
  }

  private handleIncomingMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case WebSocketMessageType.MESSAGE_RECEIVED:
        this.messageCallbacks.forEach(callback => callback(message.payload));
        break;

      case WebSocketMessageType.TYPING_START:
        this.handleTypingUpdate(message.payload, true);
        break;

      case WebSocketMessageType.TYPING_STOP:
        this.handleTypingUpdate(message.payload, false);
        break;

      case WebSocketMessageType.PRESENCE_UPDATE:
        this.handlePresenceUpdate(message.payload);
        break;

      case WebSocketMessageType.HEARTBEAT:
        // Respond to heartbeat
        this.send({
          type: WebSocketMessageType.HEARTBEAT,
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
          messageId: this.generateMessageId()
        });
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleTypingUpdate(payload: any, isTyping: boolean): void {
    const indicator: TypingIndicator = {
      userId: payload.userId,
      userName: payload.userName || 'Unknown User',
      channelId: payload.channelId,
      timestamp: new Date(payload.timestamp) as any,
      isTyping
    };

    const key = `${payload.userId}-${payload.channelId}`;
    
    if (isTyping) {
      this.typingUsers.set(key, indicator);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        this.typingUsers.delete(key);
        this.notifyTypingUpdate({ ...indicator, isTyping: false });
      }, 5000);
    } else {
      this.typingUsers.delete(key);
    }

    this.notifyTypingUpdate(indicator);
  }

  private handlePresenceUpdate(payload: any): void {
    const presence: UserPresence = {
      userId: payload.userId,
      status: payload.status,
      lastSeen: new Date(payload.timestamp) as any,
      deviceId: payload.deviceId
    };

    this.userPresences.set(payload.userId, presence);
    this.notifyPresenceUpdate(presence);
  }

  private send(message: WebSocketMessage): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: WebSocketMessageType.HEARTBEAT,
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
          messageId: this.generateMessageId()
        });
      }
    }, this.config.heartbeatInterval);
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Clear typing timers
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();
  }

  private attemptReconnection(): void {
    if (this.connectionStatus.reconnecting) return;

    this.updateConnectionStatus({ 
      ...this.connectionStatus, 
      reconnecting: true, 
      attemptCount: this.connectionStatus.attemptCount + 1 
    });

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.establishConnection();
      } catch (error) {
        console.error('Reconnection failed:', error);
        if (this.connectionStatus.attemptCount < this.config.maxReconnectAttempts) {
          this.attemptReconnection();
        } else {
          this.updateConnectionStatus({ 
            ...this.connectionStatus, 
            reconnecting: false 
          });
        }
      }
    }, this.config.reconnectInterval);
  }

  private setupVisibilityHandlers(): void {
    document.addEventListener('visibilitychange', () => {
      if (this.currentUserId && this.isConnected()) {
        const status = document.hidden ? PresenceStatus.AWAY : PresenceStatus.ONLINE;
        this.updatePresence(status);
      }
    });

    // Handle beforeunload to set offline status
    window.addEventListener('beforeunload', () => {
      if (this.currentUserId && this.isConnected()) {
        this.updatePresence(PresenceStatus.OFFLINE);
      }
    });
  }

  private updateConnectionStatus(status: Partial<ConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...status };
    this.connectionCallbacks.forEach(callback => callback(this.connectionStatus));
  }

  private notifyTypingUpdate(indicator: TypingIndicator): void {
    this.typingCallbacks.forEach(callback => callback(indicator));
  }

  private notifyPresenceUpdate(presence: UserPresence): void {
    this.presenceCallbacks.forEach(callback => callback(presence));
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => callback(error));
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceId(): string {
    // Simple device ID generation - in production, use a more robust method
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();