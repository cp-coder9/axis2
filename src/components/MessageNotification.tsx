import { useEffect, useCallback } from 'react';
import { Message } from '../types/messaging';

interface MessageNotificationConfig {
  enabled: boolean;
  onNotificationClick?: (message: Message) => void;
}

interface MessageNotificationHook {
  showNotification: (message: Message) => void;
}

export const useMessageNotifications = (config: MessageNotificationConfig): MessageNotificationHook => {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  useEffect(() => {
    if (config.enabled) {
      requestPermission();
    }
  }, [config.enabled, requestPermission]);

  const showNotification = useCallback((message: Message) => {
    if (!config.enabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    // Don't show notifications for the current user's messages
    const currentUserId = 'current-user'; // In real implementation, get from context
    if (message.senderId === currentUserId) {
      return;
    }
    
    const notification = new Notification(`New message from ${message.senderName}`, {
      body: message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content,
      icon: '/favicon.ico', // Use app icon
      tag: `message-${message.id}`, // Prevent duplicate notifications
      requireInteraction: false,
      silent: false
    });
    
    notification.onclick = () => {
      window.focus();
      if (config.onNotificationClick) {
        config.onNotificationClick(message);
      }
      notification.close();
    };
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }, [config]);

  return {
    showNotification
  };
};