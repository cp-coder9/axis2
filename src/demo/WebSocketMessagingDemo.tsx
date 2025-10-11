import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { WebSocketManager } from '../services/websocket/WebSocketManager';
import { WebSocketMessageType, ConnectionStatus } from '../types/messaging';
import { Wifi, WifiOff, Send, Users, MessageCircle } from 'lucide-react';

interface DemoMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  type: 'sent' | 'received';
}

const WebSocketMessagingDemo: React.FC = () => {
  const [wsManager] = useState(() => new WebSocketManager({
    url: 'ws://echo.websocket.org', // Public WebSocket echo server for demo
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    timeout: 10000
  }));

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    attemptCount: 0
  });
  
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>(['Demo User']);

  // Initialize WebSocket connection
  useEffect(() => {
    const initConnection = async () => {
      try {
        // Set up connection status listener
        wsManager.onConnectionChange(setConnectionStatus);
        
        // Set up message handlers
        wsManager.onMessage(WebSocketMessageType.MESSAGE_RECEIVED, (payload) => {
          const newMessage: DemoMessage = {
            id: `msg-${Date.now()}`,
            content: payload.content || 'Echo: ' + payload.originalContent,
            sender: 'Echo Server',
            timestamp: new Date(),
            type: 'received'
          };
          setMessages(prev => [...prev, newMessage]);
        });

        wsManager.onMessage(WebSocketMessageType.TYPING_START, (payload) => {
          console.log('User started typing:', payload);
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        });

        // Handle user presence updates
        wsManager.onMessage(WebSocketMessageType.PRESENCE_UPDATE, (payload) => {
          if (payload.users) {
            setConnectedUsers(payload.users);
          }
        });

        // Connect to WebSocket
        await wsManager.connect();
        
        // Add welcome message
        setMessages([{
          id: 'welcome',
          content: 'Connected to WebSocket demo! Messages will be echoed back.',
          sender: 'System',
          timestamp: new Date(),
          type: 'received'
        }]);

      } catch (error) {
        console.error('Failed to connect:', error);
        setMessages([{
          id: 'error',
          content: 'Failed to connect to WebSocket server. This is a demo using a public echo server.',
          sender: 'System',
          timestamp: new Date(),
          type: 'received'
        }]);
      }
    };

    initConnection();

    return () => {
      wsManager.disconnect();
    };
  }, [wsManager]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const content = messageInput.trim();
    if (!content || !connectionStatus.connected) return;

    // Add sent message to UI
    const sentMessage: DemoMessage = {
      id: `msg-${Date.now()}`,
      content,
      sender: 'You',
      timestamp: new Date(),
      type: 'sent'
    };
    
    setMessages(prev => [...prev, sentMessage]);
    setMessageInput('');

    try {
      // Send via WebSocket (echo server will send it back)
      wsManager.send(WebSocketMessageType.MESSAGE_SENT, {
        content,
        originalContent: content,
        sender: 'Demo User',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReconnect = async () => {
    try {
      await wsManager.connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  };

  const getConnectionIcon = () => {
    if (connectionStatus.connected) {
      return <Wifi className="w-4 h-4 text-green-500" />;
    }
    return <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const getConnectionBadge = () => {
    if (connectionStatus.connected) {
      return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    }
    if (connectionStatus.reconnecting) {
      return <Badge variant="secondary">Reconnecting... ({connectionStatus.attemptCount})</Badge>;
    }
    return <Badge variant="destructive">Disconnected</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">WebSocket Messaging Demo</h1>
        <p className="text-muted-foreground">
          Real-time messaging system with WebSocket connection management, 
          reconnection logic, and message status tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getConnectionIcon()}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {getConnectionBadge()}
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Attempts:</span>
                <span>{connectionStatus.attemptCount}</span>
              </div>
              {connectionStatus.lastError && (
                <div className="text-red-500 text-xs">
                  Error: {connectionStatus.lastError}
                </div>
              )}
            </div>

            {!connectionStatus.connected && (
              <Button 
                onClick={handleReconnect} 
                disabled={connectionStatus.reconnecting}
                className="w-full"
              >
                {connectionStatus.reconnecting ? 'Reconnecting...' : 'Reconnect'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connectedUsers.map((user, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">{user}</span>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-xs">Someone is typing...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Message Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Messages:</span>
              <span>{messages.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Sent:</span>
              <span>{messages.filter(m => m.type === 'sent').length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Received:</span>
              <span>{messages.filter(m => m.type === 'received').length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <Card className="h-96">
        <CardHeader>
          <CardTitle>Real-time Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      message.type === 'sent'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{message.sender}</span>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={connectionStatus.connected ? "Type a message..." : "Connecting..."}
                disabled={!connectionStatus.connected}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!messageInput.trim() || !connectionStatus.connected}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">WebSocket Features:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Automatic reconnection with exponential backoff</li>
                <li>✓ Connection status monitoring</li>
                <li>✓ Heartbeat/ping-pong for keep-alive</li>
                <li>✓ Message queuing during disconnection</li>
                <li>✓ Error handling and recovery</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Messaging Features:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Real-time message delivery</li>
                <li>✓ Message status tracking (sent, delivered, read)</li>
                <li>✓ Typing indicators</li>
                <li>✓ User presence status</li>
                <li>✓ Message history with pagination</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebSocketMessagingDemo;