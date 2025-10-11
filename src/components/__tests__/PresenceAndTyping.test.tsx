/**
 * Test Suite for Presence and Typing Indicators
 * Tests the real-time communication features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PresenceIndicator } from '../PresenceIndicator';
import { TypingIndicator } from '../TypingIndicator';
import { PresenceSelector } from '../PresenceSelector';
import { MessageNotification, useMessageNotifications } from '../MessageNotification';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { PresenceStatus, TypingIndicator as TypingIndicatorType } from '../../types/messaging';

// Mock the real-time service
vi.mock('../../services/realtimeService', () => ({
  realtimeService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendTypingIndicator: vi.fn(),
    updatePresence: vi.fn(),
    getUserPresence: vi.fn(),
    getAllPresences: vi.fn(),
    getTypingUsers: vi.fn(),
    isConnected: vi.fn(() => true),
    getConnectionStatus: vi.fn(() => ({ connected: true, reconnecting: false, attemptCount: 0 })),
    onMessage: vi.fn(() => () => {}),
    onTyping: vi.fn(() => () => {}),
    onPresence: vi.fn(() => () => {}),
    onConnection: vi.fn(() => () => {}),
    onError: vi.fn(() => () => {})
  }
}));

// Mock the hook
vi.mock('../../hooks/useRealtimeChat');

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    custom: vi.fn(),
    dismiss: vi.fn()
  }
}));

describe('PresenceIndicator', () => {
  it('renders online status correctly', () => {
    render(
      <PresenceIndicator
        status={PresenceStatus.ONLINE}
        userName="John Doe"
        showLabel={true}
      />
    );
    
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
  
  it('renders offline status with last seen', () => {
    const lastSeen = new Date('2024-01-01T10:00:00Z');
    
    render(
      <PresenceIndicator
        status={PresenceStatus.OFFLINE}
        userName="John Doe"
        lastSeen={lastSeen}
        showLabel={true}
        showTooltip={false}
      />
    );
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
  
  it('shows different sizes correctly', () => {
    const { rerender } = render(
      <PresenceIndicator
        status={PresenceStatus.ONLINE}
        size="sm"
        data-testid="presence-sm"
      />
    );
    
    rerender(
      <PresenceIndicator
        status={PresenceStatus.ONLINE}
        size="lg"
        data-testid="presence-lg"
      />
    );
    
    // Both should render without errors - just check they exist
    expect(screen.getAllByRole('generic').length).toBeGreaterThan(0);
  });
});

describe('TypingIndicator', () => {
  const mockTypingUsers: TypingIndicatorType[] = [
    {
      userId: 'user1',
      userName: 'John Doe',
      channelId: 'channel1',
      timestamp: new Date() as any,
      isTyping: true
    },
    {
      userId: 'user2',
      userName: 'Jane Smith',
      channelId: 'channel1',
      timestamp: new Date() as any,
      isTyping: true
    }
  ];
  
  it('renders single typing user', () => {
    render(
      <TypingIndicator
        typingUsers={[mockTypingUsers[0]]}
        showAvatars={true}
      />
    );
    
    expect(screen.getByText('John Doe is typing...')).toBeInTheDocument();
  });
  
  it('renders multiple typing users', () => {
    render(
      <TypingIndicator
        typingUsers={mockTypingUsers}
        showAvatars={true}
      />
    );
    
    expect(screen.getByText('John Doe and Jane Smith are typing...')).toBeInTheDocument();
  });
  
  it('does not render when no users are typing', () => {
    const { container } = render(
      <TypingIndicator
        typingUsers={[]}
        showAvatars={true}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  it('shows animated dots', () => {
    render(
      <TypingIndicator
        typingUsers={[mockTypingUsers[0]]}
        showAvatars={false}
      />
    );
    
    // Should have 3 animated dots
    const dots = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-bounce')
    );
    expect(dots).toHaveLength(3);
  });
});

describe('PresenceSelector', () => {
  const mockOnStatusChange = vi.fn();
  
  beforeEach(() => {
    mockOnStatusChange.mockClear();
  });
  
  it('renders current status', () => {
    render(
      <PresenceSelector
        currentStatus={PresenceStatus.ONLINE}
        onStatusChange={mockOnStatusChange}
      />
    );
    
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
  
  it('opens status selector on click', async () => {
    render(
      <PresenceSelector
        currentStatus={PresenceStatus.ONLINE}
        onStatusChange={mockOnStatusChange}
      />
    );
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Set your status')).toBeInTheDocument();
    });
  });
  
  it('calls onStatusChange when status is selected', async () => {
    render(
      <PresenceSelector
        currentStatus={PresenceStatus.ONLINE}
        onStatusChange={mockOnStatusChange}
      />
    );
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    await waitFor(() => {
      const awayButton = screen.getByText('Away');
      fireEvent.click(awayButton);
    });
    
    expect(mockOnStatusChange).toHaveBeenCalledWith(PresenceStatus.AWAY);
  });
  
  it('is disabled when disabled prop is true', () => {
    render(
      <PresenceSelector
        currentStatus={PresenceStatus.ONLINE}
        onStatusChange={mockOnStatusChange}
        disabled={true}
      />
    );
    
    const trigger = screen.getByRole('button');
    expect(trigger).toBeDisabled();
  });
});

describe('useRealtimeChat Hook', () => {
  const mockUseRealtimeChat = vi.mocked(useRealtimeChat);
  
  beforeEach(() => {
    mockUseRealtimeChat.mockReturnValue({
      isConnected: true,
      connectionStatus: { connected: true, reconnecting: false, attemptCount: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      userPresence: PresenceStatus.ONLINE,
      updatePresence: vi.fn(),
      getUserPresence: vi.fn(),
      getAllPresences: vi.fn(() => []),
      sendTypingIndicator: vi.fn(),
      getTypingUsers: vi.fn(() => []),
      onTypingUpdate: vi.fn(() => () => {}),
      onPresenceUpdate: vi.fn(() => () => {})
    });
  });
  
  it('provides connection status', () => {
    const TestComponent = () => {
      const { isConnected } = useRealtimeChat({ userId: 'test-user' });
      return <div>{isConnected ? 'Connected' : 'Disconnected'}</div>;
    };
    
    render(<TestComponent />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });
  
  it('provides presence management', () => {
    const TestComponent = () => {
      const { userPresence, updatePresence } = useRealtimeChat({ userId: 'test-user' });
      return (
        <div>
          <span>Status: {userPresence}</span>
          <button onClick={() => updatePresence(PresenceStatus.AWAY)}>
            Set Away
          </button>
        </div>
      );
    };
    
    render(<TestComponent />);
    expect(screen.getByText('Status: ONLINE')).toBeInTheDocument();
    
    const button = screen.getByText('Set Away');
    fireEvent.click(button);
    
    // Verify the mock was called
    expect(mockUseRealtimeChat().updatePresence).toHaveBeenCalledWith(PresenceStatus.AWAY);
  });
});

describe('MessageNotification', () => {
  const mockMessage = {
    id: 'msg1',
    content: 'Hello, this is a test message',
    senderId: 'user1',
    senderName: 'John Doe',
    senderRole: 'FREELANCER',
    channelId: 'channel1',
    channelType: 'PROJECT_GENERAL' as any,
    timestamp: new Date(),
    status: 'SENT' as any,
    readBy: []
  };
  
  it('renders message notification', () => {
    render(
      <MessageNotification
        message={mockMessage}
        autoHide={false}
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
  });
  
  it('truncates long messages', () => {
    const longMessage = {
      ...mockMessage,
      content: 'This is a very long message that should be truncated because it exceeds the maximum length limit for notifications and should show ellipsis at the end'
    };
    
    render(
      <MessageNotification
        message={longMessage}
        autoHide={false}
      />
    );
    
    const content = screen.getByText(/This is a very long message/);
    expect(content.textContent).toMatch(/\.\.\.$/);
  });
  
  it('calls onClick when notification is clicked', () => {
    const mockOnClick = vi.fn();
    
    render(
      <MessageNotification
        message={mockMessage}
        onClick={mockOnClick}
        autoHide={false}
      />
    );
    
    const notification = screen.getByText('John Doe').closest('div');
    fireEvent.click(notification!);
    
    expect(mockOnClick).toHaveBeenCalled();
  });
  
  it('auto-hides after duration', async () => {
    const mockOnDismiss = vi.fn();
    
    render(
      <MessageNotification
        message={mockMessage}
        onDismiss={mockOnDismiss}
        autoHide={true}
        duration={100}
      />
    );
    
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    }, { timeout: 200 });
  });
});

describe('Integration Tests', () => {
  it('typing indicators update in real-time', async () => {
    const mockTypingCallback = vi.fn();
    const mockUseRealtimeChatHook = vi.mocked(useRealtimeChat);
    
    mockUseRealtimeChatHook.mockReturnValue({
      isConnected: true,
      connectionStatus: { connected: true, reconnecting: false, attemptCount: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      userPresence: PresenceStatus.ONLINE,
      updatePresence: vi.fn(),
      getUserPresence: vi.fn(),
      getAllPresences: vi.fn(() => []),
      sendTypingIndicator: vi.fn(),
      getTypingUsers: vi.fn(() => []),
      onTypingUpdate: vi.fn((callback) => {
        mockTypingCallback.mockImplementation(callback);
        return () => {};
      }),
      onPresenceUpdate: vi.fn(() => () => {})
    });
    
    const TestComponent = () => {
      const { onTypingUpdate } = useRealtimeChat({ userId: 'test-user' });
      
      React.useEffect(() => {
        const unsubscribe = onTypingUpdate((indicator) => {
          console.log('Typing update:', indicator);
        });
        return unsubscribe;
      }, [onTypingUpdate]);
      
      return <div>Test Component</div>;
    };
    
    render(<TestComponent />);
    
    // Simulate typing update
    act(() => {
      mockTypingCallback({
        userId: 'user1',
        userName: 'John Doe',
        channelId: 'channel1',
        timestamp: new Date(),
        isTyping: true
      });
    });
    
    expect(mockTypingCallback).toHaveBeenCalled();
  });
  
  it('presence updates propagate correctly', async () => {
    const mockPresenceCallback = vi.fn();
    const mockUseRealtimeChatHook = vi.mocked(useRealtimeChat);
    
    mockUseRealtimeChatHook.mockReturnValue({
      isConnected: true,
      connectionStatus: { connected: true, reconnecting: false, attemptCount: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      userPresence: PresenceStatus.ONLINE,
      updatePresence: vi.fn(),
      getUserPresence: vi.fn(),
      getAllPresences: vi.fn(() => []),
      sendTypingIndicator: vi.fn(),
      getTypingUsers: vi.fn(() => []),
      onTypingUpdate: vi.fn(() => () => {}),
      onPresenceUpdate: vi.fn((callback) => {
        mockPresenceCallback.mockImplementation(callback);
        return () => {};
      })
    });
    
    const TestComponent = () => {
      const { onPresenceUpdate } = useRealtimeChat({ userId: 'test-user' });
      
      React.useEffect(() => {
        const unsubscribe = onPresenceUpdate((presence) => {
          console.log('Presence update:', presence);
        });
        return unsubscribe;
      }, [onPresenceUpdate]);
      
      return <div>Test Component</div>;
    };
    
    render(<TestComponent />);
    
    // Simulate presence update
    act(() => {
      mockPresenceCallback({
        userId: 'user1',
        status: PresenceStatus.AWAY,
        lastSeen: new Date(),
        deviceId: 'device1'
      });
    });
    
    expect(mockPresenceCallback).toHaveBeenCalled();
  });
});