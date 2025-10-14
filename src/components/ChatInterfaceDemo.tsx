import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { EnhancedChatInterface } from './EnhancedChatInterface';
import { Message, MessageStatus, ChannelType } from '../types/messaging';
import { ChatType, User, UserRole } from '../types';

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'John Architect',
    email: 'john@example.com',
    role: UserRole.FREELANCER,
    title: 'Senior Architect',
    hourlyRate: 75,
    phone: '+1234567890',
    company: 'Design Studio',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    createdAt: Timestamp.now(),
    lastActive: Timestamp.now()
  },
  {
    id: 'user2',
    name: 'Sarah Client',
    email: 'sarah@example.com',
    role: UserRole.CLIENT,
    title: 'Project Manager',
    hourlyRate: 0,
    phone: '+1234567891',
    company: 'Tech Corp',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    createdAt: Timestamp.now(),
    lastActive: Timestamp.now()
  },
  {
    id: 'user3',
    name: 'Mike Admin',
    email: 'mike@example.com',
    role: UserRole.ADMIN,
    title: 'Lead Architect',
    hourlyRate: 100,
    phone: '+1234567892',
    company: 'Architex',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    createdAt: Timestamp.now(),
    lastActive: Timestamp.now()
  }
];

const mockMessages: Message[] = [
  {
    id: 'msg1',
    content: 'Hi everyone! I wanted to discuss the latest design revisions for the office building project.',
    senderId: 'user2',
    senderName: 'Sarah Client',
    senderRole: 'CLIENT',
    channelId: 'demo-project-general',
    channelType: ChannelType.PROJECT_GENERAL,
    timestamp: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
    status: MessageStatus.SENT,
    readBy: []
  },
  {
    id: 'msg2',
    content: 'Hello Sarah! I\'ve been working on the revisions you requested. The structural changes are looking good.',
    senderId: 'user1',
    senderName: 'John Architect',
    senderRole: 'FREELANCER',
    channelId: 'demo-project-general',
    channelType: ChannelType.PROJECT_GENERAL,
    timestamp: Timestamp.fromDate(new Date(Date.now() - 3500000)), // 58 minutes ago
    status: MessageStatus.SENT,
    readBy: []
  },
  {
    id: 'msg3',
    content: 'Great work team! The client feedback has been very positive. Let\'s make sure we address all the accessibility requirements in the next iteration.',
    senderId: 'user3',
    senderName: 'Mike Admin',
    senderRole: 'ADMIN',
    channelId: 'demo-project-general',
    channelType: ChannelType.PROJECT_GENERAL,
    timestamp: Timestamp.fromDate(new Date(Date.now() - 3400000)), // 56 minutes ago
    status: MessageStatus.SENT,
    readBy: []
  },
  {
    id: 'msg4',
    content: 'Absolutely! I\'ve already started incorporating the ADA compliance updates. Should have the updated drawings ready by tomorrow.',
    senderId: 'user1',
    senderName: 'John Architect',
    senderRole: 'FREELANCER',
    channelId: 'demo-project-general',
    channelType: ChannelType.PROJECT_GENERAL,
    timestamp: Timestamp.fromDate(new Date(Date.now() - 3300000)), // 55 minutes ago
    status: MessageStatus.SENT,
    readBy: []
  },
  {
    id: 'msg5',
    content: 'Perfect! That timeline works well with our construction schedule. Thank you both for the excellent work! 🏗️',
    senderId: 'user2',
    senderName: 'Sarah Client',
    senderRole: 'CLIENT',
    channelId: 'demo-project-general',
    channelType: ChannelType.PROJECT_GENERAL,
    timestamp: Timestamp.fromDate(new Date(Date.now() - 300000)), // 5 minutes ago
    status: MessageStatus.SENT,
    readBy: []
  },
  {
    id: 'msg6',
    content: 'You\'re welcome! Let me know if you need anything else. We\'re here to help make this project a success.',
    senderId: 'user3',
    senderName: 'Mike Admin',
    senderRole: 'ADMIN',
    channelId: 'demo-project-general',
    channelType: ChannelType.PROJECT_GENERAL,
    timestamp: Timestamp.fromDate(new Date(Date.now() - 60000)), // 1 minute ago
    status: MessageStatus.SENT,
    readBy: []
  }
];

export const ChatInterfaceDemo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [currentUser] = useState<User>(mockUsers[0]); // John Architect

  // Simulate typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly show typing indicators
      if (Math.random() > 0.8) {
        const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        if (randomUser.id !== currentUser.id) {
          setTypingUsers([randomUser.name]);
          setTimeout(() => setTypingUsers([]), 3000);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser.id]);

  const handleSendMessage = (content: string, recipientIds?: string[]) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      content,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      channelId: 'demo-project-general',
      channelType: ChannelType.PROJECT_GENERAL,
      timestamp: Timestamp.now(),
      status: MessageStatus.SENT,
      readBy: []
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const handleTypingStatusChange = (isTyping: boolean) => {
    // In a real implementation, this would send typing status to the server
    console.log('Typing status changed:', isTyping);
  };

  return (
    <div className="h-[600px] max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Enhanced Chat Interface Demo</h2>
        <p className="text-muted-foreground">
          This demo showcases the new shadcn/ui-based chat interface with emoji picker,
          responsive design, and modern message bubbles.
        </p>
      </div>

      <EnhancedChatInterface
        projectId="demo-project"
        chatType={ChatType.GENERAL}
        messages={messages}
        onSendMessage={handleSendMessage}
        onTypingStatusChange={handleTypingStatusChange}
        typingUsers={typingUsers}
        className="shadow-lg"
      />
    </div>
  );
};

export default ChatInterfaceDemo;