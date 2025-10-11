import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Smile, MoreVertical, Phone, Video, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { useAppContext } from '../contexts/AppContext';
import { ChatType, User } from '../types';
import { Message, ChannelType, PresenceStatus } from '../types/messaging';
import { formatTimestamp } from '../utils/formatters';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { useMessageNotifications } from './MessageNotification';
import PresenceIndicator from './PresenceIndicator';
import TypingIndicator from './TypingIndicator';
import PresenceSelector from './PresenceSelector';
import FileUploadHandler from './FileUploadHandler';
import MessageComposer from './MessageComposer';
import MessageRenderer from './MessageRenderer';
import { cn } from '../lib/utils';

interface EnhancedChatInterfaceProps {
  projectId: string;
  chatType?: ChatType;
  recipientId?: string; // For private chats
  messages: Message[];
  onSendMessage: (content: string, recipientIds?: string[]) => void;
  onTypingStatusChange: (isTyping: boolean) => void;
  typingUsers: string[];
  className?: string;
}

// Emoji picker data - simplified for demo
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖'],
  'Objects': ['💼', '📁', '📂', '🗂️', '📅', '📆', '🗓️', '📇', '🗃️', '🗄️', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️']
};

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  projectId,
  chatType = ChatType.GENERAL,
  recipientId,
  messages,
  onSendMessage,
  onTypingStatusChange,
  typingUsers: _typingUsers,
  className = ''
}) => {
  const { user, users } = useAppContext();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPresenceList, setShowPresenceList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Get recipient user for private chats
  const recipient = recipientId ? users.find(u => u.id === recipientId) : null;
  
  // Real-time chat functionality
  const channelId = recipientId ? `dm_${[user?.id, recipientId].sort().join('_')}` : `project_${projectId}_${chatType}`;
  
  const {
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
  } = useRealtimeChat({
    userId: user?.id || '',
    autoConnect: true,
    onMessage: (message: Message) => {
      // Handle incoming real-time messages
      console.log('Received real-time message:', message);
    },
    onError: (error: Error) => {
      console.error('Real-time chat error:', error);
    }
  });
  
  // Message notifications
  const { showNotification: _showNotification } = useMessageNotifications({
    enabled: true,
    onNotificationClick: (message) => {
      // Navigate to the message or channel
      console.log('Notification clicked:', message);
    }
  });

  // Use typing users for display
  const currentTypingUsers = getTypingUsers(channelId);
  
  // Use user presences for status display
  const userPresences = getAllPresences();
  
  // Real-time typing indicators
  const [_realtimeTypingUsers, setRealtimeTypingUsers] = useState<any[]>([]);
  
  // Subscribe to typing updates
  useEffect(() => {
    const unsubscribe = onTypingUpdate((indicator) => {
      if (indicator.channelId === channelId) {
        setRealtimeTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== indicator.userId);
          if (indicator.isTyping) {
            return [...filtered, indicator];
          }
          return filtered;
        });
      }
    });
    
    return unsubscribe;
  }, [channelId, onTypingUpdate]);
  
  // Subscribe to presence updates
  const [_userPresences, setUserPresences] = useState<Map<string, any>>(new Map());
  
  useEffect(() => {
    const unsubscribe = onPresenceUpdate((presence) => {
      setUserPresences(prev => new Map(prev.set(presence.userId, presence)));
    });
    
    return unsubscribe;
  }, [onPresenceUpdate]);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStatusChange(true);
      sendTypingIndicator(channelId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStatusChange(false);
      sendTypingIndicator(channelId, false);
    }, 3000);
  }, [isTyping, onTypingStatusChange, sendTypingIndicator, channelId]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    onTypingStatusChange(false);
    sendTypingIndicator(channelId, false);
  }, [onTypingStatusChange, sendTypingIndicator, channelId]);

  // Handle input changes
  const _handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  // Handle message submission
  const _handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const recipientIds = recipientId ? [recipientId] : undefined;
      onSendMessage(newMessage.trim(), recipientIds);
      setNewMessage('');
      handleTypingStop();
      inputRef.current?.focus();
    }
  };

  const handleFileSelect = (files: File[]) => {
    // Handle file selection - in a real app, this would upload files and send as messages
    console.log('Files selected:', files);
    
    // For demo purposes, send a message about the files
    const fileNames = files.map(f => f.name).join(', ');
    const recipientIds = recipientId ? [recipientId] : undefined;
    onSendMessage(`📎 Shared ${files.length} file(s): ${fileNames}`, recipientIds);
  };

  const handleFileUpload = async (file: File, _progress: number): Promise<string> => {
    // Simulate file upload
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://example.com/files/${file.name}`);
      }, 2000);
    });
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Format message groups by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    let currentGroup: Message[] = [];

    messages.forEach(message => {
      const messageDate = message.timestamp.toDate().toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  // Check if messages are consecutive (same sender, within 5 minutes)
  const isConsecutiveMessage = (current: Message, previous: Message | null): boolean => {
    if (!previous) return false;
    
    const timeDiff = current.timestamp.toMillis() - previous.timestamp.toMillis();
    const fiveMinutes = 5 * 60 * 1000;
    
    return current.senderId === previous.senderId && timeDiff < fiveMinutes;
  };

  // Format date for display
  const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {recipient ? (
            <>
              <div className="relative">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={recipient.avatarUrl} alt={recipient.name} />
                  <AvatarFallback>{recipient.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {/* Presence indicator for recipient */}
                <div className="absolute -bottom-1 -right-1">
                  <PresenceIndicator
                    status={getUserPresence(recipient.id)?.status || PresenceStatus.OFFLINE}
                    size="sm"
                    showTooltip={false}
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{recipient.name}</h3>
                  <PresenceIndicator
                    status={getUserPresence(recipient.id)?.status || PresenceStatus.OFFLINE}
                    userName={recipient.name}
                    lastSeen={getUserPresence(recipient.id)?.lastSeen?.toDate()}
                    size="sm"
                    showLabel={true}
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate">{recipient.title}</p>
              </div>
            </>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Project Chat</h3>
                <Badge variant="outline" className="text-xs">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {chatType === ChatType.FREELANCER ? 'Team Discussion' : 'General Discussion'}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1 shrink-0">
          {/* Online users indicator for group chats */}
          {!recipient && (
            <Popover open={showPresenceList} onOpenChange={setShowPresenceList}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Users className="h-4 w-4" />
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {getAllPresences().filter(p => p.status === PresenceStatus.ONLINE).length}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Online Users</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {getAllPresences()
                      .filter(presence => presence.status !== PresenceStatus.OFFLINE)
                      .map(presence => {
                        const presenceUser = users.find(u => u.id === presence.userId);
                        if (!presenceUser) return null;
                        
                        return (
                          <div key={presence.userId} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={presenceUser.avatarUrl} alt={presenceUser.name} />
                              <AvatarFallback className="text-xs">
                                {presenceUser.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{presenceUser.name}</p>
                            </div>
                            <PresenceIndicator
                              status={presence.status}
                              size="sm"
                              showLabel={true}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {recipient && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:inline-flex">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:inline-flex">
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4 py-2">
          <div className="space-y-4">
            {messageGroups.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">
                    {recipient ? `Start a conversation with ${recipient.name}` : 'No messages yet'}
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">
                    Send a message to get started
                  </div>
                </div>
              </div>
            ) : (
              messageGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-2">
                  {/* Date Header */}
                  <div className="flex justify-center">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {formatDateHeader(group.date)}
                    </div>
                  </div>
                  
                  {/* Messages */}
                  {group.messages.map((message, messageIndex) => {
                    const isOwn = message.senderId === user?.id;
                    const previousMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null;
                    const isConsecutive = isConsecutiveMessage(message, previousMessage);
                    const sender = users.find(u => u.id === message.senderId);

                    return (
                      <div
                        key={message.id}
                        className={`flex items-end space-x-2 ${isOwn ? 'justify-end' : 'justify-start'} ${
                          isConsecutive ? 'mt-1' : 'mt-4'
                        }`}
                      >
                        {/* Avatar for others */}
                        {!isOwn && (
                          <div className={`relative ${isConsecutive ? 'invisible' : ''}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={sender?.avatarUrl} alt={sender?.name} />
                              <AvatarFallback>
                                {sender?.name?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            {/* Presence indicator for message sender */}
                            <div className="absolute -bottom-0.5 -right-0.5">
                              <PresenceIndicator
                                status={getUserPresence(message.senderId)?.status || PresenceStatus.OFFLINE}
                                size="sm"
                                showTooltip={false}
                              />
                            </div>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`max-w-[85%] sm:max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
                          {/* Sender name for non-consecutive messages */}
                          {!isOwn && !isConsecutive && (
                            <div className="text-xs text-muted-foreground mb-1 px-3">
                              {sender?.name || 'Unknown User'}
                            </div>
                          )}
                          
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm sm:text-sm ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted rounded-bl-md'
                            }`}
                          >
                            <MessageRenderer 
                              content={message.content}
                              onMentionClick={(userId) => {
                                // Handle mention click - could open user profile or start DM
                                console.log('Mention clicked:', userId);
                              }}
                              onLinkClick={(url) => {
                                // Handle link click - open in new tab with safety checks
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                            />
                            
                            {/* Timestamp */}
                            <div className={`text-xs mt-1 ${
                              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatTimestamp(message.timestamp, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Avatar for own messages */}
                        {isOwn && (
                          <div className={`relative order-2 ${isConsecutive ? 'invisible' : ''}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                              <AvatarFallback>
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {/* Current user presence indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5">
                              <PresenceIndicator
                                status={userPresence}
                                size="sm"
                                showTooltip={false}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}

            {/* Typing Indicators */}
            <TypingIndicator
              typingUsers={currentTypingUsers}
              showAvatars={true}
              size="sm"
              className="px-3 py-2"
            />

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-3 sm:p-4">
        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300">
                {connectionStatus.reconnecting ? 'Reconnecting...' : 'Disconnected - Messages may not be delivered'}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex items-start space-x-2">
          {/* Emoji Picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" type="button" className="h-10 w-10 shrink-0 touch-manipulation mt-3">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start" side="top">
              <div className="p-4 max-h-80 overflow-y-auto">
                <div className="text-sm font-medium mb-3">Choose an emoji</div>
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                  <div key={category} className="mb-4">
                    <div className="text-xs text-muted-foreground mb-2">{category}</div>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                      {emojis.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 hover:bg-muted touch-manipulation text-lg"
                          onClick={() => handleEmojiSelect(emoji)}
                          type="button"
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* File Attachment */}
          <div className="mt-3">
            <FileUploadHandler
              onFileSelect={handleFileSelect}
              onFileUpload={handleFileUpload}
              maxFileSize={10}
              allowedTypes={['image/*', 'video/*', 'application/pdf', '.doc', '.docx', '.txt']}
              multiple={true}
              disabled={!isConnected}
            />
          </div>

          {/* Message Composer */}
          <div className="flex-1 min-w-0">
            <MessageComposer
              value={newMessage}
              onChange={setNewMessage}
              onSubmit={(content) => {
                const recipientIds = recipientId ? [recipientId] : undefined;
                onSendMessage(content, recipientIds);
                handleTypingStop();
              }}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              placeholder={recipient ? `Message ${recipient.name}...` : "Type a message..."}
              disabled={!isConnected}
              maxLength={1000}
              showFormatting={true}
              showMentions={true}
              mentionUsers={users.map(u => ({
                id: u.id,
                name: u.name,
                avatar: u.avatarUrl
              }))}
            />
          </div>
        </div>
        
        {/* Presence Selector */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t">
          <PresenceSelector
            currentStatus={userPresence}
            onStatusChange={updatePresence}
            disabled={!isConnected}
            size="sm"
          />
          
          {/* Connection indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EnhancedChatInterface;