import { 
  WebSocketMessage, 
  WebSocketMessageType, 
  ConnectionConfig, 
  ConnectionStatus,
  ConnectionCallback,
  ErrorCallback
} from '../../types/messaging';

/**
 * WebSocket connection manager with automatic reconnection and heartbeat
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private status: ConnectionStatus = {
    connected: false,
    reconnecting: false,
    attemptCount: 0
  };
  
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionCallbacks: ConnectionCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private messageHandlers: Map<WebSocketMessageType, ((payload: any) => void)[]> = new Map();
  
  constructor(config: ConnectionConfig) {
    this.config = config;
    this.initializeMessageHandlers();
  }

  /**
   * Initialize message type handlers map
   */
  private initializeMessageHandlers(): void {
    Object.values(WebSocketMessageType).forEach(type => {
      this.messageHandlers.set(type, []);
    });
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventListeners();
      
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
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.updateStatus({
      connected: false,
      reconnecting: false,
      attemptCount: 0
    });
  }

  /**
   * Send message through WebSocket
   */
  public send(type: WebSocketMessageType, payload: any): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      messageId: this.generateMessageId()
    };

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection status
   */
  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Subscribe to connection status changes
   */
  public onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to errors
   */
  public onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to specific message types
   */
  public onMessage(type: WebSocketMessageType, handler: (payload: any) => void): () => void {
    const handlers = this.messageHandlers.get(type) || [];
    handlers.push(handler);
    this.messageHandlers.set(type, handlers);
    
    return () => {
      const currentHandlers = this.messageHandlers.get(type) || [];
      const index = currentHandlers.indexOf(handler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        this.messageHandlers.set(type, currentHandlers);
      }
    };
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => this.onConnectionOpen();
    this.ws.onclose = (event) => this.onConnectionClose(event);
    this.ws.onerror = (error) => this.onConnectionError(error);
    this.ws.onmessage = (event) => this.handleIncomingMessage(event);
  }

  /**
   * Handle connection open
   */
  private onConnectionOpen(): void {
    console.log('WebSocket connected');
    
    this.updateStatus({
      connected: true,
      reconnecting: false,
      attemptCount: 0
    });
    
    this.startHeartbeat();
  }

  /**
   * Handle connection close
   */
  private onConnectionClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    
    this.clearTimers();
    
    this.updateStatus({
      connected: false,
      reconnecting: false,
      attemptCount: this.status.attemptCount
    });

    // Attempt reconnection if not a clean close
    if (event.code !== 1000 && this.status.attemptCount < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection error
   */
  private onConnectionError(error: Event): void {
    console.error('WebSocket error:', error);
    this.handleError(new Error('WebSocket connection error'));
  }

  /**
   * Handle incoming messages
   */
  private handleIncomingMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle heartbeat response
      if (message.type === WebSocketMessageType.HEARTBEAT) {
        return;
      }
      
      // Dispatch to registered handlers
      const handlers = this.messageHandlers.get(message.type) || [];
      handlers.forEach(handler => {
        try {
          handler(message.payload);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.status.reconnecting) return;
    
    this.updateStatus({
      ...this.status,
      reconnecting: true,
      attemptCount: this.status.attemptCount + 1
    });

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.status.attemptCount - 1),
      30000 // Max 30 seconds
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.status.attemptCount})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        
        if (this.status.attemptCount < this.config.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          this.updateStatus({
            ...this.status,
            reconnecting: false,
            lastError: 'Max reconnection attempts reached'
          });
        }
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send(WebSocketMessageType.HEARTBEAT, { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Update connection status and notify callbacks
   */
  private updateStatus(newStatus: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...newStatus };
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(this.status);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  /**
   * Handle errors and notify callbacks
   */
  private handleError(error: Error): void {
    console.error('WebSocket error:', error);
    
    this.updateStatus({
      ...this.status,
      lastError: error.message
    });
    
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}