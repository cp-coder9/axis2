import { Timestamp } from 'firebase/firestore';

// Message types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  channelId: string;
  channelType: ChannelType;
  timestamp: Timestamp;
  status: MessageStatus;
  readBy: MessageReadStatus[];
  attachments?: MessageAttachment[];
  replyTo?: string;
  edited?: boolean;
  editedAt?: Timestamp;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface MessageReadStatus {
  userId: string;
  readAt: Timestamp;
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum ChannelType {
  PROJECT_GENERAL = 'PROJECT_GENERAL',
  PROJECT_TEAM = 'PROJECT_TEAM',
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
  SYSTEM = 'SYSTEM'
}

// Channel types
export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  projectId?: string;
  participants: string[];
  createdAt: Timestamp;
  lastMessageAt?: Timestamp;
  lastMessage?: string;
  unreadCount: Record<string, number>;
}

// Typing indicator types
export interface TypingIndicator {
  userId: string;
  userName: string;
  channelId: string;
  timestamp: Timestamp;
  isTyping: boolean;
}

// Presence types
export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Timestamp;
  deviceId: string;
}

export enum PresenceStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE'
}

// WebSocket message types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: number;
  messageId: string;
}

export enum WebSocketMessageType {
  MESSAGE_SENT = 'MESSAGE_SENT',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  MESSAGE_STATUS_UPDATE = 'MESSAGE_STATUS_UPDATE',
  TYPING_START = 'TYPING_START',
  TYPING_STOP = 'TYPING_STOP',
  PRESENCE_UPDATE = 'PRESENCE_UPDATE',
  CHANNEL_UPDATE = 'CHANNEL_UPDATE',
  CONNECTION_STATUS = 'CONNECTION_STATUS',
  HEARTBEAT = 'HEARTBEAT',
  ERROR = 'ERROR'
}

// Connection types
export interface ConnectionConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  timeout: number;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  attemptCount: number;
  lastError?: string;
}

// Pagination types
export interface MessagePagination {
  limit: number;
  cursor?: string;
  direction: 'before' | 'after';
}

export interface PaginatedMessages {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// Event callback types
export type MessageCallback = (message: Message) => void;
export type TypingCallback = (typing: TypingIndicator) => void;
export type PresenceCallback = (presence: UserPresence) => void;
export type ConnectionCallback = (status: ConnectionStatus) => void;
export type ErrorCallback = (error: Error) => void;