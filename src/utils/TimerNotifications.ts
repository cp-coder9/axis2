/**
 * Timer Notification System
 * Task 5.3: Browser notifications and alerts for timer events
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface TimerNotificationPreferences {
  browserNotifications: boolean;
  audioAlerts: boolean;
  visualIndicators: boolean;
  notifyOnStart: boolean;
  notifyOnPause: boolean;
  notifyOnResume: boolean;
  notifyOnStop: boolean;
  notifyOnTimeWarning: boolean;
  notifyOnTimeExceeded: boolean;
  warningThresholdMinutes: number;
}

export class TimerNotifications {
  private static audioContext: AudioContext | null = null;
  private static notificationPermission: NotificationPermission = 'default';
  private static preferences: TimerNotificationPreferences = {
    browserNotifications: true,
    audioAlerts: true,
    visualIndicators: true,
    notifyOnStart: true,
    notifyOnPause: true,
    notifyOnResume: true,
    notifyOnStop: true,
    notifyOnTimeWarning: true,
    notifyOnTimeExceeded: true,
    warningThresholdMinutes: 15,
  };

  /**
   * Initialize notification system
   */
  static async initialize(): Promise<void> {
    // Check notification permission
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }

    // Initialize audio context
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Load preferences
    this.loadPreferences();
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (this.notificationPermission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Show browser notification
   */
  static async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.preferences.browserNotifications) return;

    if (this.notificationPermission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo.png',
        badge: options.badge || '/logo.png',
        tag: options.tag || 'timer-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Play audio alert
   */
  static playAudioAlert(type: 'start' | 'pause' | 'resume' | 'stop' | 'warning' | 'exceeded'): void {
    if (!this.preferences.audioAlerts || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different frequencies for different events
      const frequencies: Record<typeof type, number> = {
        start: 523.25, // C5
        pause: 440.00, // A4
        resume: 523.25, // C5
        stop: 349.23, // F4
        warning: 587.33, // D5
        exceeded: 659.25, // E5
      };

      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';

      // Fade in and out
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Failed to play audio alert:', error);
    }
  }

  /**
   * Show visual indicator
   */
  static showVisualIndicator(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.preferences.visualIndicators) return;

    // Create toast notification element
    const toast = document.createElement('div');
    toast.className = `timer-toast timer-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      font-size: 14px;
      font-weight: 500;
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Notify timer started
   */
  static notifyTimerStarted(jobCardTitle: string): void {
    if (!this.preferences.notifyOnStart) return;

    this.showNotification({
      title: 'Timer Started',
      body: `Timer started for: ${jobCardTitle}`,
      tag: 'timer-start',
    });

    this.playAudioAlert('start');
    this.showVisualIndicator(`Timer started: ${jobCardTitle}`, 'info');
  }

  /**
   * Notify timer paused
   */
  static notifyTimerPaused(jobCardTitle: string, pauseCount: number): void {
    if (!this.preferences.notifyOnPause) return;

    this.showNotification({
      title: 'Timer Paused',
      body: `Timer paused for: ${jobCardTitle} (Pause ${pauseCount})`,
      tag: 'timer-pause',
    });

    this.playAudioAlert('pause');
    this.showVisualIndicator(`Timer paused: ${jobCardTitle}`, 'info');
  }

  /**
   * Notify timer resumed
   */
  static notifyTimerResumed(jobCardTitle: string): void {
    if (!this.preferences.notifyOnResume) return;

    this.showNotification({
      title: 'Timer Resumed',
      body: `Timer resumed for: ${jobCardTitle}`,
      tag: 'timer-resume',
    });

    this.playAudioAlert('resume');
    this.showVisualIndicator(`Timer resumed: ${jobCardTitle}`, 'info');
  }

  /**
   * Notify timer stopped
   */
  static notifyTimerStopped(jobCardTitle: string, duration: string): void {
    if (!this.preferences.notifyOnStop) return;

    this.showNotification({
      title: 'Timer Stopped',
      body: `Timer stopped for: ${jobCardTitle}\nDuration: ${duration}`,
      tag: 'timer-stop',
      requireInteraction: true,
    });

    this.playAudioAlert('stop');
    this.showVisualIndicator(`Timer stopped: ${jobCardTitle} (${duration})`, 'info');
  }

  /**
   * Notify time warning
   */
  static notifyTimeWarning(jobCardTitle: string, remainingMinutes: number): void {
    if (!this.preferences.notifyOnTimeWarning) return;

    this.showNotification({
      title: 'Time Warning',
      body: `Only ${remainingMinutes} minutes remaining for: ${jobCardTitle}`,
      tag: 'timer-warning',
      requireInteraction: true,
    });

    this.playAudioAlert('warning');
    this.showVisualIndicator(`Warning: ${remainingMinutes} minutes remaining`, 'warning');
  }

  /**
   * Notify time exceeded
   */
  static notifyTimeExceeded(jobCardTitle: string, overtimeMinutes: number): void {
    if (!this.preferences.notifyOnTimeExceeded) return;

    this.showNotification({
      title: 'Time Exceeded',
      body: `Allocated time exceeded for: ${jobCardTitle}\nOvertime: ${overtimeMinutes} minutes`,
      tag: 'timer-exceeded',
      requireInteraction: true,
    });

    this.playAudioAlert('exceeded');
    this.showVisualIndicator(`Time exceeded: ${overtimeMinutes} minutes overtime`, 'error');
  }

  /**
   * Update notification preferences
   */
  static updatePreferences(preferences: Partial<TimerNotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();
  }

  /**
   * Get current preferences
   */
  static getPreferences(): TimerNotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Save preferences to localStorage
   */
  private static savePreferences(): void {
    try {
      localStorage.setItem('timer_notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  /**
   * Load preferences from localStorage
   */
  private static loadPreferences(): void {
    try {
      const stored = localStorage.getItem('timer_notification_preferences');
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Get notification permission status
   */
  static getPermissionStatus(): NotificationPermission {
    return this.notificationPermission;
  }
}

// Add CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
