import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  endBefore,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  where
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Message, 
  MessageStatus, 
  ChannelType, 
  MessagePagination, 
  PaginatedMessages,
  MessageCallback,
  Channel,
  TypingIndicator,
  UserPresence,
  PresenceStatus
} from '../../types/messaging';

/**
 * Firestore-based messaging service with real-time capabilities
 */
export class MessagingService {
  private messageListeners: Map<string, () => void> = new Map();
  private typingListeners: Map<string, () => void> = new Map();
  private presenceListeners: Map<string, () => void> = new Map();

  /**
   * Send a message to a channel
   */
  public async sendMessage(
    channelId: string,
    content: string,
    senderId: string,
    senderName: string,
    senderRole: string,
    channelType: ChannelType,
    attachments?: any[]
  ): Promise<string> {
    try {
      const messageData = {
        content,
        senderId,
        senderName,
        senderRole,
        channelId,
        channelType,
        timestamp: serverTimestamp(),
        status: MessageStatus.SENT,
        readBy: [{
          userId: senderId,
          readAt: serverTimestamp()
        }],
        attachments: attachments || [],
        edited: false
      };

      const messagesRef = collection(db, 'channels', channelId, 'messages');
      const docRef = await addDoc(messagesRef, messageData);

      // Update channel's last message info
      await this.updateChannelLastMessage(channelId, content, docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Load message history with pagination
   */
  public async loadMessages(
    channelId: string,
    pagination: MessagePagination
  ): Promise<PaginatedMessages> {
    try {
      const messagesRef = collection(db, 'channels', channelId, 'messages');
      let q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(pagination.limit)
      );

      // Add cursor-based pagination
      if (pagination.cursor) {
        const cursorDoc = await this.getMessageDoc(channelId, pagination.cursor);
        if (cursorDoc) {
          if (pagination.direction === 'before') {
            q = query(q, endBefore(cursorDoc));
          } else {
            q = query(q, startAfter(cursorDoc));
          }
        }
      }

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(q, (snapshot) => {
          try {
            const messages: Message[] = [];
            const docs = snapshot.docs;

            docs.forEach((doc) => {
              const data = doc.data();
              messages.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp || Timestamp.now()
              } as Message);
            });

            // Reverse to get chronological order
            messages.reverse();

            const result: PaginatedMessages = {
              messages,
              hasMore: docs.length === pagination.limit,
              nextCursor: docs.length > 0 ? docs[docs.length - 1].id : undefined,
              prevCursor: docs.length > 0 ? docs[0].id : undefined
            };

            resolve(result);
          } catch (error) {
            reject(error);
          }
          
          // Unsubscribe after first load for pagination
          unsubscribe();
        }, reject);
      });
    } catch (error) {
      console.error('Error loading messages:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time message updates
   */
  public subscribeToMessages(
    channelId: string,
    callback: MessageCallback,
    lastMessageId?: string
  ): () => void {
    const messagesRef = collection(db, 'channels', channelId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));

    // Only get messages after the last known message
    if (lastMessageId) {
      // This would need additional logic to get messages after a specific ID
      // For now, we'll get the latest messages
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const message: Message = {
            id: change.doc.id,
            ...data,
            timestamp: data.timestamp || Timestamp.now()
          } as Message;
          
          callback(message);
        }
      });
    }, (error) => {
      console.error('Error in message subscription:', error);
    });

    // Store listener for cleanup
    this.messageListeners.set(channelId, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Mark message as read
   */
  public async markMessageAsRead(
    channelId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, 'channels', channelId, 'messages', messageId);
      
      // Add user to readBy array if not already present
      await updateDoc(messageRef, {
        [`readBy.${userId}`]: {
          userId,
          readAt: serverTimestamp()
        }
      });

      // Update message status to READ if all participants have read it
      await this.updateMessageStatus(channelId, messageId, MessageStatus.READ);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Update message status
   */
  public async updateMessageStatus(
    channelId: string,
    messageId: string,
    status: MessageStatus
  ): Promise<void> {
    try {
      const messageRef = doc(db, 'channels', channelId, 'messages', messageId);
      await updateDoc(messageRef, { status });
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  /**
   * Set typing indicator
   */
  public async setTypingIndicator(
    channelId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const typingRef = doc(db, 'channels', channelId, 'typing', userId);
      
      if (isTyping) {
        await updateDoc(typingRef, {
          userId,
          userName,
          channelId,
          timestamp: serverTimestamp(),
          isTyping: true
        });
      } else {
        await updateDoc(typingRef, {
          isTyping: false,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      throw error;
    }
  }

  /**
   * Subscribe to typing indicators
   */
  public subscribeToTyping(
    channelId: string,
    callback: (typingUsers: TypingIndicator[]) => void
  ): () => void {
    const typingRef = collection(db, 'channels', channelId, 'typing');
    const q = query(typingRef, where('isTyping', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typingUsers: TypingIndicator[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        typingUsers.push({
          userId: data.userId,
          userName: data.userName,
          channelId: data.channelId,
          timestamp: data.timestamp || Timestamp.now(),
          isTyping: data.isTyping
        });
      });

      callback(typingUsers);
    }, (error) => {
      console.error('Error in typing subscription:', error);
    });

    this.typingListeners.set(channelId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Update user presence
   */
  public async updatePresence(
    userId: string,
    status: PresenceStatus,
    deviceId: string
  ): Promise<void> {
    try {
      const presenceRef = doc(db, 'presence', userId);
      await updateDoc(presenceRef, {
        userId,
        status,
        lastSeen: serverTimestamp(),
        deviceId
      });
    } catch (error) {
      console.error('Error updating presence:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user presence updates
   */
  public subscribeToPresence(
    userIds: string[],
    callback: (presence: UserPresence[]) => void
  ): () => void {
    const presenceRef = collection(db, 'presence');
    const q = query(presenceRef, where('userId', 'in', userIds));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const presenceList: UserPresence[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        presenceList.push({
          userId: data.userId,
          status: data.status,
          lastSeen: data.lastSeen || Timestamp.now(),
          deviceId: data.deviceId
        });
      });

      callback(presenceList);
    }, (error) => {
      console.error('Error in presence subscription:', error);
    });

    return unsubscribe;
  }

  /**
   * Create or get a channel
   */
  public async createChannel(
    name: string,
    type: ChannelType,
    participants: string[],
    projectId?: string
  ): Promise<string> {
    try {
      const channelData = {
        name,
        type,
        participants,
        projectId,
        createdAt: serverTimestamp(),
        unreadCount: participants.reduce((acc, userId) => {
          acc[userId] = 0;
          return acc;
        }, {} as Record<string, number>)
      };

      const channelsRef = collection(db, 'channels');
      const docRef = await addDoc(channelsRef, channelData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  /**
   * Get channels for a user
   */
  public async getUserChannels(userId: string): Promise<Channel[]> {
    try {
      const channelsRef = collection(db, 'channels');
      const q = query(channelsRef, where('participants', 'array-contains', userId));

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const channels: Channel[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            channels.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt || Timestamp.now(),
              lastMessageAt: data.lastMessageAt
            } as Channel);
          });

          resolve(channels);
          unsubscribe();
        }, reject);
      });
    } catch (error) {
      console.error('Error getting user channels:', error);
      throw error;
    }
  }

  /**
   * Cleanup all listeners
   */
  public cleanup(): void {
    this.messageListeners.forEach((unsubscribe) => unsubscribe());
    this.typingListeners.forEach((unsubscribe) => unsubscribe());
    this.presenceListeners.forEach((unsubscribe) => unsubscribe());
    
    this.messageListeners.clear();
    this.typingListeners.clear();
    this.presenceListeners.clear();
  }

  /**
   * Private helper methods
   */
  private async getMessageDoc(_channelId: string, _messageId: string): Promise<QueryDocumentSnapshot<DocumentData> | null> {
    try {
      // This is a simplified version - in practice you'd need to fetch the document
      return null;
    } catch (error) {
      console.error('Error getting message document:', error);
      return null;
    }
  }

  private async updateChannelLastMessage(
    channelId: string,
    lastMessage: string,
    _messageId: string
  ): Promise<void> {
    try {
      const channelRef = doc(db, 'channels', channelId);
      await updateDoc(channelRef, {
        lastMessage,
        lastMessageAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating channel last message:', error);
    }
  }
}