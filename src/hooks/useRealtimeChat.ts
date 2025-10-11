import { useState, useEffect, useCallback, useRef } from 'react';
import { PresenceStatus, TypingIndicator, UserPresence, Message, ConnectionStatus } from '../types/messaging';

interface RealtimeChatConfig {
  userId: string;
  autoConnect?: boolean;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
}

interface RealtimeChatHook {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  userPresence: PresenceStatus;
  updatePresence: (status: PresenceStatus) => void;
  getUserPresence: (userId: string) => UserPresence | null;
  getAllPresences: () => UserPresence[];
  sendTypingIndicator: (channelId: string, isTyping: boolean) => void;
  getTypingUsers: (channelId: string) => TypingIndicator[];
  onTypingUpdate: (callback: (indicator: TypingIndicator) => void) => () => void;
  onPresenceUpdate: (callback: (presence: UserPresence) => void) => () => void;
}

export const useRealtimeChat = (config: RealtimeChatConfig): RealtimeChatHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    attemptCount: 0
  });
  const [userPresence, setUserPresence] = useState<PresenceStatus>(PresenceStatus.ONLINE);
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());
  const [typingIndicators, setTypingIndicators] = useState<Map<string, TypingIndicator[]>>(new Map());
  
  const typingCallbacks = useRef<Set<(indicator: TypingIndicator) => void>>(new Set());
  const presenceCallbacks = useRef<Set<(presence: UserPresence) => void>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  const updatePresence = useCallback((status: PresenceStatus) => {
    setUserPresence(status);
    
    const presence: UserPresence = {
      userId: config.userId,
      status,
      lastSeen: new Date() as any, // Convert to Timestamp in real implementation
      deviceId: 'web-' + Math.random().toString(36).substr(2, 9)
    };
    
    setPresences(prev => new Map(prev.set(config.userId, presence)));
    
    // Notify presence callbacks
    presenceCallbacks.current.forEach(callback => {
      callback(presence);
    });
  }, [config.userId]);

  // Simulate WebSocket connection
  const connect = useCallback(() => {
    setConnectionStatus(prev => ({ ...prev, reconnecting: true }));
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus({
        connected: true,
        reconnecting: false,
        attemptCount: 0
      });
      
      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        // Simulate heartbeat - in real implementation this would ping the server
        console.log('Heartbeat sent');
      }, 30000);
      
      // Set initial presence
      updatePresence(PresenceStatus.ONLINE);
    }, 1000);
  }, [updatePresence]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setConnectionStatus(prev => ({ ...prev, connected: false }));
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    setConnectionStatus(prev => ({
      ...prev,
      reconnecting: true,
      attemptCount: prev.attemptCount + 1
    }));
    
    const delay = Math.min(1000 * Math.pow(2, connectionStatus.attemptCount), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, connectionStatus.attemptCount]);

  // Auto-connect on mount
  useEffect(() => {
    if (config.autoConnect && config.userId) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [config.autoConnect, config.userId, connect, disconnect]);

  // Simulate network disconnection/reconnection
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected) {
        reconnect();
      }
    };
    
    const handleOffline = () => {
      disconnect();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, reconnect, disconnect]);

  const getUserPresence = useCallback((userId: string): UserPresence | null => {
    return presences.get(userId) || null;
  }, [presences]);

  const getAllPresences = useCallback((): UserPresence[] => {
    return Array.from(presences.values());
  }, [presences]);

  const sendTypingIndicator = useCallback((channelId: string, isTyping: boolean) => {
    if (!isConnected) return;
    
    const indicator: TypingIndicator = {
      userId: config.userId,
      userName: 'Current User', // In real implementation, get from user context
      channelId,
      timestamp: new Date() as any, // Convert to Timestamp in real implementation
      isTyping
    };
    
    // Update local typing indicators
    setTypingIndicators(prev => {
      const newMap = new Map(prev);
      const channelIndicators = newMap.get(channelId) || [];
      
      if (isTyping) {
        const filtered = channelIndicators.filter(t => t.userId !== config.userId);
        newMap.set(channelId, [...filtered, indicator]);
      } else {
        const filtered = channelIndicators.filter(t => t.userId !== config.userId);
        newMap.set(channelId, filtered);
      }
      
      return newMap;
    });
    
    // Notify typing callbacks
    typingCallbacks.current.forEach(callback => {
      callback(indicator);
    });
  }, [isConnected, config.userId]);

  const getTypingUsers = useCallback((channelId: string): TypingIndicator[] => {
    return typingIndicators.get(channelId) || [];
  }, [typingIndicators]);

  const onTypingUpdate = useCallback((callback: (indicator: TypingIndicator) => void) => {
    typingCallbacks.current.add(callback);
    
    return () => {
      typingCallbacks.current.delete(callback);
    };
  }, []);

  const onPresenceUpdate = useCallback((callback: (presence: UserPresence) => void) => {
    presenceCallbacks.current.add(callback);
    
    return () => {
      presenceCallbacks.current.delete(callback);
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    userPresence,
    updatePresence,
    getUserPresence,
    getAllPresences,
    sendTypingIndicator,
    getTypingUsers,
    onTypingUpdate,
    onPresenceUpdate
  };
};