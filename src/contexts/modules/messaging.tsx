import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WebSocketManager } from '../../services/websocket/WebSocketManager';
import { MessagingService } from '../../services/messaging/MessagingService';
import { 
  Message, 
  Channel, 
  ChannelType, 
  MessageStatus, 
  TypingIndicator, 
  UserPresence, 
  PresenceStatus,
  ConnectionStatus,
  WebSocketMessageType,
  MessagePagination,
  PaginatedMessages
} from '../../types/messaging';

interface MessagingContextType {
  // Connection state
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  
  // Messages
  messages: Record<string, Message[]>;
  sendMessage: (channelId: string, content: string, attachments?: any[]) => Promise<void>;
  loadMessageHistory: (channelId: string, pagination: MessagePagination) => Promise<PaginatedMessages>;
  markMessageAsRead: (channelId: string, messageId: string) => Promise<void>;
  
  // Channels
  channels: Channel[];
  createChannel: (name: string, type: ChannelType, participants: string[], projectId?: string) => Promise<string>;
  subscribeToChannel: (channelId: string) => void;
  unsubscribeFromChannel: (channelId: string) => void;
  
  // Typing indicators
  typingUsers: Record<string, TypingIndicator[]>;
  setTyping: (channelId: string, isTyping: boolean) => Promise<void>;
  
  // Presence
  userPresence: Record<string, UserPresence>;
  updatePresence: (status: PresenceStatus) => Promise<void>;
  
  // Error handling
  lastError: string | null;
  clearError: () => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

interface MessagingProviderProps {
  children: ReactNode;
  userId: string;
  userName: string;
  userRole: string;
  websocketUrl?: string;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({
  children,
  userId,
  userName,
  userRole,
  websocketUrl = process.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080'
}) => {
  // State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    attemptCount: 0
  });
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [channels, setChannels] = useState<Channel[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingIndicator[]>>({});
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Services
  const [wsManager] = useState(() => new WebSocketManager({
    url: websocketUrl,
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    timeout: 10000
  }));
  
  const [messagingService] = useState(() => new MessagingService());
  
  // Subscriptions tracking
  const [activeSubscriptions] = useState<Set<string>>(new Set());

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        // Set up connection status listener
        wsManager.onConnectionChange(setConnectionStatus);
        
        // Set up error listener
        wsManager.onError((error) => {
          setLastError(error.message);
        });
        
        // Set up message handlers
        setupMessageHandlers();
        
        // Connect to WebSocket
        await wsManager.connect();
        
        // Update presence to online
        await updatePresence(PresenceStatus.ONLINE);
        
        // Load user channels
        await loadUserChannels();
        
      } catch (error) {
        console.error('Failed to initialize messaging:', error);
        setLastError('Failed to connect to messaging service');
      }
    };

    initializeConnection();

    // Cleanup on unmount
    return () => {
      wsManager.disconnect();
      messagingService.cleanup();
    };
  }, [userId, messagingService, wsManager]);

  // Setup WebSocket message handlers
  const setupMessageHandlers = useCallback(() => {
    // Handle incoming messages
    wsManager.onMessage(WebSocketMessageType.MESSAGE_RECEIVED, (payload) => {
      const message: Message = payload;
      setMessages(prev => ({
        ...prev,
        [message.channelId]: [...(prev[message.channelId] || []), message]
      }));
    });

    // Handle message status updates
    wsManager.onMessage(WebSocketMessageType.MESSAGE_STATUS_UPDATE, (payload) => {
      const { channelId, messageId, status } = payload;
      setMessages(prev => ({
        ...prev,
        [channelId]: prev[channelId]?.map(msg => 
          msg.id === messageId ? { ...msg, status } : msg
        ) || []
      }));
    });

    // Handle typing indicators
    wsManager.onMessage(WebSocketMessageType.TYPING_START, (payload) => {
      const typing: TypingIndicator = payload;
      setTypingUsers(prev => ({
        ...prev,
        [typing.channelId]: [
          ...(prev[typing.channelId] || []).filter(t => t.userId !== typing.userId),
          typing
        ]
      }));
    });

    wsManager.onMessage(WebSocketMessageType.TYPING_STOP, (payload) => {
      const { channelId, userId: typingUserId } = payload;
      setTypingUsers(prev => ({
        ...prev,
        [channelId]: (prev[channelId] || []).filter(t => t.userId !== typingUserId)
      }));
    });

    // Handle presence updates
    wsManager.onMessage(WebSocketMessageType.PRESENCE_UPDATE, (payload) => {
      const presence: UserPresence = payload;
      setUserPresence(prev => ({
        ...prev,
        [presence.userId]: presence
      }));
    });
  }, [wsManager]);

  // Load user channels
  const loadUserChannels = useCallback(async () => {
    try {
      const userChannels = await messagingService.getUserChannels(userId);
      setChannels(userChannels);
    } catch (error) {
      console.error('Error loading user channels:', error);
      setLastError('Failed to load channels');
    }
  }, [userId, messagingService]);

  // Send message
  const sendMessage = useCallback(async (
    channelId: string, 
    content: string, 
    attachments?: any[]
  ) => {
    try {
      // Send via Firestore
      const messageId = await messagingService.sendMessage(
        channelId,
        content,
        userId,
        userName,
        userRole,
        ChannelType.PROJECT_GENERAL, // This should be determined by channel
        attachments
      );

      // Notify via WebSocket
      if (wsManager.isConnected()) {
        wsManager.send(WebSocketMessageType.MESSAGE_SENT, {
          channelId,
          messageId,
          content,
          senderId: userId,
          senderName: userName,
          attachments
        });
      }

      // Update local state optimistically
      const optimisticMessage: Message = {
        id: messageId,
        content,
        senderId: userId,
        senderName: userName,
        senderRole: userRole,
        channelId,
        channelType: ChannelType.PROJECT_GENERAL,
        timestamp: new Date() as any,
        status: MessageStatus.SENDING,
        readBy: [],
        attachments
      };

      setMessages(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), optimisticMessage]
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      setLastError('Failed to send message');
      throw error;
    }
  }, [userId, userName, userRole, messagingService, wsManager]);

  // Load message history
  const loadMessageHistory = useCallback(async (
    channelId: string, 
    pagination: MessagePagination
  ): Promise<PaginatedMessages> => {
    try {
      return await messagingService.loadMessages(channelId, pagination);
    } catch (error) {
      console.error('Error loading message history:', error);
      setLastError('Failed to load message history');
      throw error;
    }
  }, [messagingService]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (channelId: string, messageId: string) => {
    try {
      await messagingService.markMessageAsRead(channelId, messageId, userId);
      
      // Notify via WebSocket
      if (wsManager.isConnected()) {
        wsManager.send(WebSocketMessageType.MESSAGE_STATUS_UPDATE, {
          channelId,
          messageId,
          status: MessageStatus.READ,
          userId
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      setLastError('Failed to mark message as read');
    }
  }, [userId, messagingService, wsManager]);

  // Create channel
  const createChannel = useCallback(async (
    name: string,
    type: ChannelType,
    participants: string[],
    projectId?: string
  ): Promise<string> => {
    try {
      const channelId = await messagingService.createChannel(name, type, participants, projectId);
      
      // Reload channels
      await loadUserChannels();
      
      return channelId;
    } catch (error) {
      console.error('Error creating channel:', error);
      setLastError('Failed to create channel');
      throw error;
    }
  }, [messagingService, loadUserChannels]);

  // Subscribe to channel
  const subscribeToChannel = useCallback((channelId: string) => {
    if (activeSubscriptions.has(channelId)) {
      return;
    }

    // Subscribe to messages
    const messageUnsubscribe = messagingService.subscribeToMessages(
      channelId,
      (message) => {
        setMessages(prev => ({
          ...prev,
          [channelId]: [...(prev[channelId] || []), message]
        }));
      }
    );

    // Subscribe to typing indicators
    const typingUnsubscribe = messagingService.subscribeToTyping(
      channelId,
      (typingList) => {
        setTypingUsers(prev => ({
          ...prev,
          [channelId]: typingList
        }));
      }
    );

    activeSubscriptions.add(channelId);

    // Store cleanup function
    const cleanup = () => {
      messageUnsubscribe();
      typingUnsubscribe();
      activeSubscriptions.delete(channelId);
    };

    // Return cleanup function
    return cleanup;
  }, [messagingService, activeSubscriptions]);

  // Unsubscribe from channel
  const unsubscribeFromChannel = useCallback((channelId: string) => {
    activeSubscriptions.delete(channelId);
    // Note: Individual unsubscribe functions would need to be stored and called here
  }, [activeSubscriptions]);

  // Set typing indicator
  const setTyping = useCallback(async (channelId: string, isTyping: boolean) => {
    try {
      await messagingService.setTypingIndicator(channelId, userId, userName, isTyping);
      
      // Notify via WebSocket
      if (wsManager.isConnected()) {
        const messageType = isTyping ? WebSocketMessageType.TYPING_START : WebSocketMessageType.TYPING_STOP;
        wsManager.send(messageType, {
          channelId,
          userId,
          userName,
          isTyping
        });
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  }, [userId, userName, messagingService, wsManager]);

  // Update presence
  const updatePresence = useCallback(async (status: PresenceStatus) => {
    try {
      const deviceId = `${navigator.userAgent}-${Date.now()}`;
      await messagingService.updatePresence(userId, status, deviceId);
      
      // Notify via WebSocket
      if (wsManager.isConnected()) {
        wsManager.send(WebSocketMessageType.PRESENCE_UPDATE, {
          userId,
          status,
          deviceId
        });
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [userId, messagingService, wsManager]);

  // Clear error
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const contextValue: MessagingContextType = {
    connectionStatus,
    isConnected: connectionStatus.connected,
    messages,
    sendMessage,
    loadMessageHistory,
    markMessageAsRead,
    channels,
    createChannel,
    subscribeToChannel,
    unsubscribeFromChannel,
    typingUsers,
    setTyping,
    userPresence,
    updatePresence,
    lastError,
    clearError
  };

  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = (): MessagingContextType => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};