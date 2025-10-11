/**
 * Demo Component for Presence and Typing Indicators
 * Showcases all the implemented real-time communication features
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Users, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { PresenceStatus, TypingIndicator as TypingIndicatorType } from '../types/messaging';
import PresenceIndicator from './PresenceIndicator';
import TypingIndicator from './TypingIndicator';
import PresenceSelector from './PresenceSelector';
import { useMessageNotifications } from './MessageNotification';

export const PresenceAndTypingDemo: React.FC = () => {
  const {
    user,
    users,
    isRealtimeConnected,
    userPresence,
    updatePresence,
    getUserPresence,
    getAllPresences,
    sendTypingIndicator,
    getTypingUsers
  } = useAppContext();

  const [demoChannelId] = useState('demo-channel');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicatorType[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; content: string; sender: string; timestamp: Date }>>([]);

  // Message notifications
  const { showNotification } = useMessageNotifications({
    enabled: true,
    onNotificationClick: (message) => {
      console.log('Notification clicked:', message);
    }
  });

  // Simulate typing updates
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTypingUsers = getTypingUsers(demoChannelId);
      setTypingUsers(currentTypingUsers);
    }, 1000);

    return () => clearInterval(interval);
  }, [getTypingUsers, demoChannelId]);

  // Handle typing in message input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(demoChannelId, true);
      
      // Auto-stop typing after 3 seconds
      setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(demoChannelId, false);
      }, 3000);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      sendTypingIndicator(demoChannelId, false);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (messageInput.trim() && user) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        content: messageInput.trim(),
        sender: user.name,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
      setIsTyping(false);
      sendTypingIndicator(demoChannelId, false);

      // Show notification for demo
      showNotification({
        id: newMessage.id,
        content: newMessage.content,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        channelId: demoChannelId,
        channelType: 'PROJECT_GENERAL' as any,
        timestamp: newMessage.timestamp as any,
        status: 'SENT' as any,
        readBy: []
      });
    }
  };

  // Simulate other users
  const simulateOtherUserTyping = () => {
    const mockUser = {
      userId: 'mock-user-2',
      userName: 'Jane Smith',
      channelId: demoChannelId,
      timestamp: new Date() as any,
      isTyping: true
    };

    setTypingUsers(prev => [...prev.filter(u => u.userId !== mockUser.userId), mockUser]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setTypingUsers(prev => prev.filter(u => u.userId !== mockUser.userId));
    }, 3000);
  };

  const allPresences = getAllPresences();
  const onlineCount = allPresences.filter(p => p.status === PresenceStatus.ONLINE).length;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Presence & Typing Indicators Demo</h1>
        <p className="text-muted-foreground">
          Real-time communication features with shadcn/ui components
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isRealtimeConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isRealtimeConnected ? 'default' : 'destructive'}>
                {isRealtimeConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Real-time communication is {isRealtimeConnected ? 'active' : 'inactive'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">{onlineCount} online</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Presence */}
      <Card>
        <CardHeader>
          <CardTitle>Your Presence Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PresenceIndicator
                status={userPresence}
                userName={user?.name}
                size="lg"
                showLabel={true}
              />
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.title}</p>
              </div>
            </div>
            <PresenceSelector
              currentStatus={userPresence}
              onStatusChange={updatePresence}
              disabled={!isRealtimeConnected}
            />
          </div>
        </CardContent>
      </Card>

      {/* Online Users */}
      <Card>
        <CardHeader>
          <CardTitle>Team Presence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map(teamUser => {
              const presence = getUserPresence(teamUser.id);
              return (
                <div key={teamUser.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <span className="font-medium">
                          {teamUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        <PresenceIndicator
                          status={presence?.status || PresenceStatus.OFFLINE}
                          size="sm"
                          showTooltip={false}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{teamUser.name}</p>
                      <p className="text-sm text-muted-foreground">{teamUser.title}</p>
                    </div>
                  </div>
                  <PresenceIndicator
                    status={presence?.status || PresenceStatus.OFFLINE}
                    userName={teamUser.name}
                    lastSeen={presence?.lastSeen?.toDate()}
                    showLabel={true}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Typing Indicators Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Typing Indicators Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current typing users */}
          <div className="min-h-[40px] flex items-center">
            <TypingIndicator
              typingUsers={typingUsers}
              showAvatars={true}
              size="md"
            />
          </div>

          <Separator />

          {/* Message input */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={handleInputChange}
                placeholder="Type a message to see typing indicators..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                Send
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={simulateOtherUserTyping}
              >
                Simulate Other User Typing
              </Button>
            </div>
          </div>

          <Separator />

          {/* Messages */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {messages.map(message => (
              <div key={message.id} className="p-2 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{message.sender}</span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{message.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Implemented Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Presence Indicators</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Online/Away/Busy/Offline status</li>
                <li>• Real-time status updates</li>
                <li>• Visual indicators with tooltips</li>
                <li>• Manual status selection</li>
                <li>• Automatic away detection</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Typing Indicators</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time typing detection</li>
                <li>• Animated typing dots</li>
                <li>• Multiple user support</li>
                <li>• Auto-timeout after 3 seconds</li>
                <li>• Channel-specific indicators</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Notifications</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Toast notifications for new messages</li>
                <li>• Clickable notifications</li>
                <li>• Auto-hide with custom duration</li>
                <li>• Rich message previews</li>
                <li>• Attachment indicators</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Real-time Communication</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• WebSocket connection management</li>
                <li>• Automatic reconnection</li>
                <li>• Connection status indicators</li>
                <li>• Heartbeat monitoring</li>
                <li>• Error handling and recovery</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PresenceAndTypingDemo;