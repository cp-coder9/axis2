import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useMessaging } from '../../contexts/modules/messaging';
import { Message, ChannelType, MessageStatus, TypingIndicator } from '../../types/messaging';
import { formatDistanceToNow } from 'date-fns';
import { Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatInterfaceProps {
  channelId: string;
  channelName: string;
  channelType: ChannelType;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  channelId,
  channelName,
  channelType,
  className
}) => {
  const {
    messages,
    sendMessage,
    loadMessageHistory,
    markMessageAsRead,
    typingUsers,
    setTyping,
    connectionStatus,
    isConnected,
    subscribeToChannel,
    unsubscribeFromChannel
  } = useMessaging();

  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const channelMessages = messages[channelId] || [];
  const channelTypingUsers = typingUsers[channelId] || [];

  // Subscribe to channel on mount
  useEffect(() => {
    subscribeToChannel(channelId);
    
    return () => {
      unsubscribeFromChannel(channelId);
    };
  }, [channelId, subscribeToChannel, unsubscribeFromChannel]);

  // Load message history
  useEffect(() => {
    const loadHistory = async () => {
      if (hasLoadedHistory) return;
      
      setIsLoading(true);
      try {
        await loadMessageHistory(channelId, {
          limit: 50,
          direction: 'before'
        });
        setHasLoadedHistory(true);
      } catch (error) {
        console.error('Error loading message history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [channelId, loadMessageHistory, hasLoadedHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  // Mark messages as read when they come into view
  useEffect(() => {
    const unreadMessages = channelMessages.filter(msg => 
      msg.status !== MessageStatus.READ && msg.senderId !== 'current-user-id' // Replace with actual user ID
    );
    
    unreadMessages.forEach(msg => {
      markMessageAsRead(channelId, msg.id);
    });
  }, [channelMessages, channelId, markMessageAsRead]);

  // Handle typing indicator
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      setTyping(channelId, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTyping(channelId, false);
    }, 3000);
  }, [channelId, isTyping, setTyping]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping) {
      setIsTyping(false);
      setTyping(channelId, false);
    }
  }, [channelId, isTyping, setTyping]);

  // Handle message input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (e.target.value.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const content = messageInput.trim();
    if (!content || !isConnected) return;
    
    try {
      setMessageInput('');
      handleTypingStop();
      
      await sendMessage(channelId, content);
      
      // Focus back to input
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message input on error
      setMessageInput(content);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Render message status indicator
  const renderMessageStatus = (message: Message) => {
    switch (message.status) {
      case MessageStatus.SENDING:
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />;
      case MessageStatus.SENT:
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case MessageStatus.DELIVERED:
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case MessageStatus.READ:
        return <div className="w-2 h-2 bg-green-600 rounded-full" />;
      case MessageStatus.FAILED:
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return null;
    }
  };

  // Render typing indicators
  const renderTypingIndicators = () => {
    if (channelTypingUsers.length === 0) return null;
    
    const typingNames = channelTypingUsers.map(t => t.userName).join(', ');
    const isMultiple = channelTypingUsers.length > 1;
    
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        <span>
          {typingNames} {isMultiple ? 'are' : 'is'} typing...
        </span>
      </div>
    );
  };

  // Render message bubble
  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === 'current-user-id'; // Replace with actual user ID
    const showAvatar = index === 0 || channelMessages[index - 1]?.senderId !== message.senderId;
    const showTimestamp = index === channelMessages.length - 1 || 
      channelMessages[index + 1]?.senderId !== message.senderId;

    return (
      <div
        key={message.id}
        className={cn(
          'flex gap-3 px-4 py-2 hover:bg-muted/50 transition-colors',
          isOwnMessage && 'flex-row-reverse'
        )}
      >
        {showAvatar && (
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={`/avatars/${message.senderId}.jpg`} />
            <AvatarFallback>
              {message.senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        
        {!showAvatar && <div className="w-8" />}
        
        <div className={cn('flex-1 space-y-1', isOwnMessage && 'text-right')}>
          {showAvatar && (
            <div className={cn('flex items-center gap-2', isOwnMessage && 'flex-row-reverse')}>
              <span className="font-medium text-sm">{message.senderName}</span>
              <Badge variant="secondary" className="text-xs">
                {message.senderRole}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })}
              </span>
            </div>
          )}
          
          <div className={cn(
            'inline-block max-w-[70%] rounded-lg px-3 py-2 text-sm',
            isOwnMessage 
              ? 'bg-primary text-primary-foreground ml-auto' 
              : 'bg-muted'
          )}>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-xs truncate">{attachment.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {showTimestamp && isOwnMessage && (
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toDate().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
              {renderMessageStatus(message)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{channelName}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {channelType.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          </div>
          
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="min-h-full flex flex-col justify-end">
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            )}
            
            {channelMessages.map((message, index) => renderMessage(message, index))}
            
            {renderTypingIndicators()}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 border rounded-md px-3 py-2">
              <Input
                ref={inputRef}
                value={messageInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                disabled={!isConnected}
                className="border-0 shadow-none focus-visible:ring-0 p-0"
              />
              
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={!messageInput.trim() || !isConnected}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};