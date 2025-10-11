/**
 * Accessibility utilities for timer components
 * Provides WCAG 2.1 AA compliance features and screen reader support
 */

// Announcement priorities for screen readers
export enum AnnouncementPriority {
  LOW = 'polite',
  HIGH = 'assertive',
  URGENT = 'off' // Changed from duplicate 'assertive' to 'off' for immediate announcements
}

// Timer status announcements
export interface TimerAnnouncement {
  message: string;
  priority: AnnouncementPriority;
  type: 'status' | 'warning' | 'error' | 'info';
}

/**
 * Creates accessible announcements for timer state changes
 */
export class TimerAnnouncer {
  private static instance: TimerAnnouncer;
  private liveRegion: HTMLElement | null = null;
  private lastAnnouncement: string = '';
  private announcementQueue: TimerAnnouncement[] = [];
  private isProcessing = false;

  private constructor() {
    this.initializeLiveRegion();
  }

  public static getInstance(): TimerAnnouncer {
    if (!TimerAnnouncer.instance) {
      TimerAnnouncer.instance = new TimerAnnouncer();
    }
    return TimerAnnouncer.instance;
  }

  /**
   * Initialize ARIA live region for announcements
   */
  private initializeLiveRegion(): void {
    if (typeof window === 'undefined') return;

    this.liveRegion = document.getElementById('timer-live-region');
    
    if (!this.liveRegion) {
      this.liveRegion = document.createElement('div');
      this.liveRegion.id = 'timer-live-region';
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.setAttribute('aria-relevant', 'additions text');
      this.liveRegion.style.position = 'absolute';
      this.liveRegion.style.left = '-10000px';
      this.liveRegion.style.width = '1px';
      this.liveRegion.style.height = '1px';
      this.liveRegion.style.overflow = 'hidden';
      document.body.appendChild(this.liveRegion);
    }
  }

  /**
   * Announce message to screen readers
   */
  public announce(announcement: TimerAnnouncement): void {
    this.announcementQueue.push(announcement);
    this.processQueue();
  }

  /**
   * Process announcement queue with proper timing
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.announcementQueue.length === 0) return;

    this.isProcessing = true;

    while (this.announcementQueue.length > 0) {
      const announcement = this.announcementQueue.shift()!;
      await this.makeAnnouncement(announcement);
      // Wait between announcements to prevent overwhelming screen readers
      await this.delay(500);
    }

    this.isProcessing = false;
  }

  /**
   * Make individual announcement
   */
  private async makeAnnouncement(announcement: TimerAnnouncement): Promise<void> {
    if (!this.liveRegion || announcement.message === this.lastAnnouncement) return;

    // Update live region priority
    this.liveRegion.setAttribute('aria-live', announcement.priority);
    
    // Clear and set new message
    this.liveRegion.textContent = '';
    await this.delay(50); // Small delay to ensure screen reader notices change
    this.liveRegion.textContent = announcement.message;
    
    this.lastAnnouncement = announcement.message;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all pending announcements
   */
  public clearQueue(): void {
    this.announcementQueue = [];
  }

  /**
   * Cleanup live region
   */
  public cleanup(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
      this.liveRegion = null;
    }
    this.clearQueue();
  }
}

/**
 * Timer state announcement messages
 */
export const TimerAnnouncementMessages = {
  TIMER_STARTED: (jobTitle?: string) => ({
    message: `Timer started${jobTitle ? ` for ${jobTitle}` : ''}`,
    priority: AnnouncementPriority.LOW,
    type: 'info' as const
  }),

  TIMER_PAUSED: (pauseCount: number, remainingPauseTime: string) => ({
    message: `Timer paused. Pause ${pauseCount}. ${remainingPauseTime} pause time remaining.`,
    priority: AnnouncementPriority.LOW,
    type: 'info' as const
  }),

  TIMER_RESUMED: () => ({
    message: 'Timer resumed',
    priority: AnnouncementPriority.LOW,
    type: 'info' as const
  }),

  TIMER_STOPPED: () => ({
    message: 'Timer stopped',
    priority: AnnouncementPriority.LOW,
    type: 'info' as const
  }),

  TIMER_COMPLETED: (jobTitle?: string) => ({
    message: `Timer completed${jobTitle ? ` for ${jobTitle}` : ''}`,
    priority: AnnouncementPriority.HIGH,
    type: 'info' as const
  }),

  PAUSE_WARNING: (remainingTime: string) => ({
    message: `Pause warning: Only ${remainingTime} pause time remaining`,
    priority: AnnouncementPriority.HIGH,
    type: 'warning' as const
  }),

  PAUSE_LIMIT_EXCEEDED: () => ({
    message: 'Pause time limit exceeded. Timer automatically stopped.',
    priority: AnnouncementPriority.URGENT,
    type: 'error' as const
  }),

  TIME_WARNING_5MIN: () => ({
    message: '5 minutes remaining on timer',
    priority: AnnouncementPriority.HIGH,
    type: 'warning' as const
  }),

  TIME_WARNING_1MIN: () => ({
    message: '1 minute remaining on timer',
    priority: AnnouncementPriority.HIGH,
    type: 'warning' as const
  }),

  TIME_EXCEEDED: () => ({
    message: 'Time allocation exceeded. Timer in overtime mode.',
    priority: AnnouncementPriority.URGENT,
    type: 'warning' as const
  }),

  ASSIGNMENT_ERROR: () => ({
    message: 'Cannot start timer. You are not assigned to this task.',
    priority: AnnouncementPriority.HIGH,
    type: 'error' as const
  }),

  ADMIN_OVERRIDE: () => ({
    message: 'Admin override activated',
    priority: AnnouncementPriority.LOW,
    type: 'info' as const
  })
};

/**
 * Focus management utilities
 */
export class FocusManager {
  private static instance: FocusManager;
  private focusStack: HTMLElement[] = [];
  private trapElement: HTMLElement | null = null;
  private focusableSelectors = [
    'button:not([disabled]):not([aria-hidden="true"])',
    'input:not([disabled]):not([aria-hidden="true"])',
    'select:not([disabled]):not([aria-hidden="true"])',
    'textarea:not([disabled]):not([aria-hidden="true"])',
    'a[href]:not([aria-hidden="true"])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
    '[contenteditable="true"]:not([aria-hidden="true"])'
  ].join(', ');

  private constructor() {}

  public static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager();
    }
    return FocusManager.instance;
  }

  /**
   * Save current focus for restoration later
   */
  public saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }

  /**
   * Restore previously saved focus
   */
  public restoreFocus(): void {
    const elementToFocus = this.focusStack.pop();
    if (elementToFocus && typeof elementToFocus.focus === 'function') {
      elementToFocus.focus();
    }
  }

  /**
   * Set focus trap within an element (for modals)
   */
  public setFocusTrap(element: HTMLElement): void {
    this.trapElement = element;
    this.saveFocus();
    
    // Focus first focusable element
    const firstFocusable = this.getFirstFocusableElement(element);
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Add keyboard listeners
    element.addEventListener('keydown', this.handleTrapKeydown);
  }

  /**
   * Remove focus trap
   */
  public removeFocusTrap(): void {
    if (this.trapElement) {
      this.trapElement.removeEventListener('keydown', this.handleTrapKeydown);
      this.trapElement = null;
    }
    this.restoreFocus();
  }

  /**
   * Handle keyboard navigation within focus trap
   */
  private handleTrapKeydown = (event: KeyboardEvent): void => {
    if (!this.trapElement || event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements(this.trapElement);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  /**
   * Get all focusable elements within container
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors)) as HTMLElement[];
  }

  /**
   * Get first focusable element within container
   */
  private getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements.length > 0 ? focusableElements[0] : null;
  }

  /**
   * Clear focus stack
   */
  public clearFocusStack(): void {
    this.focusStack = [];
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle timer control keyboard events
   */
  public static handleTimerControlKeys(
    event: KeyboardEvent,
    actions: {
      onStart?: () => void;
      onPause?: () => void;
      onResume?: () => void;
      onStop?: () => void;
      onReset?: () => void;
    }
  ): void {
    // Only handle if focus is on timer controls
    const target = event.target as HTMLElement;
    if (!target.closest('[role="timer"]') && !target.closest('[data-timer-controls]')) {
      return;
    }

    switch (event.code) {
      case 'Space':
      case 'Enter':
        // Prevent default to avoid scrolling or form submission
        event.preventDefault();
        
        // Trigger appropriate action based on current state
        if (target.getAttribute('data-action') === 'start') {
          actions.onStart?.();
        } else if (target.getAttribute('data-action') === 'pause') {
          actions.onPause?.();
        } else if (target.getAttribute('data-action') === 'resume') {
          actions.onResume?.();
        } else if (target.getAttribute('data-action') === 'stop') {
          actions.onStop?.();
        } else if (target.getAttribute('data-action') === 'reset') {
          actions.onReset?.();
        }
        break;

      case 'Escape':
        // Stop timer on escape (if applicable)
        if (actions.onStop) {
          event.preventDefault();
          actions.onStop();
        }
        break;
    }
  }

  /**
   * Setup ARIA attributes for timer controls
   */
  public static setupTimerControlAria(
    element: HTMLElement,
    action: 'start' | 'pause' | 'resume' | 'stop' | 'reset',
    options: {
      disabled?: boolean;
      timeRemaining?: string;
      pauseTimeRemaining?: string;
      isRunning?: boolean;
    } = {}
  ): void {
    element.setAttribute('data-action', action);
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', options.disabled ? '-1' : '0');
    
    if (options.disabled) {
      element.setAttribute('aria-disabled', 'true');
    } else {
      element.removeAttribute('aria-disabled');
    }

    // Set appropriate aria-label based on action and state
    let ariaLabel = '';
    switch (action) {
      case 'start':
        ariaLabel = 'Start timer';
        break;
      case 'pause':
        ariaLabel = `Pause timer${options.pauseTimeRemaining ? `. ${options.pauseTimeRemaining} pause time remaining` : ''}`;
        break;
      case 'resume':
        ariaLabel = 'Resume timer';
        break;
      case 'stop':
        ariaLabel = 'Stop timer and log time';
        break;
      case 'reset':
        ariaLabel = 'Reset timer to initial state';
        break;
    }

    element.setAttribute('aria-label', ariaLabel);

    // Add live region for dynamic state updates
    if (options.timeRemaining && options.isRunning) {
      element.setAttribute('aria-describedby', 'timer-time-remaining');
    }
  }
}

/**
 * High contrast mode utilities
 */
export class HighContrastSupport {
  /**
   * Check if high contrast mode is active
   */
  public static isHighContrastMode(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check Windows high contrast mode
    return window.matchMedia('(prefers-contrast: high)').matches ||
           window.matchMedia('(-ms-high-contrast: active)').matches ||
           window.matchMedia('(-ms-high-contrast: black-on-white)').matches ||
           window.matchMedia('(-ms-high-contrast: white-on-black)').matches;
  }

  /**
   * Apply high contrast styles to timer components
   */
  public static applyHighContrastStyles(element: HTMLElement): void {
    if (!this.isHighContrastMode()) return;

    element.classList.add('high-contrast-mode');
    
    // Force border visibility for buttons and interactive elements
    const interactiveElements = element.querySelectorAll('button, input, select, textarea, [role="button"]');
    interactiveElements.forEach(el => {
      (el as HTMLElement).style.border = '2px solid';
      (el as HTMLElement).style.borderColor = 'ButtonText';
    });

    // Ensure focus indicators are visible
    const focusableElements = element.querySelectorAll('[tabindex]:not([tabindex="-1"]), button, input, select, textarea, a[href]');
    focusableElements.forEach(el => {
      (el as HTMLElement).addEventListener('focus', () => {
        (el as HTMLElement).style.outline = '3px solid ButtonText';
        (el as HTMLElement).style.outlineOffset = '2px';
      });
    });
  }

  /**
   * Get high contrast safe colors for timer status
   */
  public static getHighContrastColors(status: 'running' | 'paused' | 'exceeded' | 'idle'): {
    color: string;
    backgroundColor: string;
    borderColor: string;
  } {
    if (!this.isHighContrastMode()) {
      // Return default colors for normal mode
      switch (status) {
        case 'running':
          return { color: '#10b981', backgroundColor: 'transparent', borderColor: '#10b981' };
        case 'paused':
          return { color: '#f59e0b', backgroundColor: 'transparent', borderColor: '#f59e0b' };
        case 'exceeded':
          return { color: '#ef4444', backgroundColor: 'transparent', borderColor: '#ef4444' };
        default:
          return { color: '#6b7280', backgroundColor: 'transparent', borderColor: '#6b7280' };
      }
    }

    // High contrast mode colors
    return {
      color: 'ButtonText',
      backgroundColor: 'ButtonFace',
      borderColor: 'ButtonText'
    };
  }
}

/**
 * Reduced motion utilities
 */
export class ReducedMotionSupport {
  /**
   * Check if user prefers reduced motion
   */
  public static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Apply reduced motion styles to timer animations
   */
  public static applyReducedMotionStyles(element: HTMLElement): void {
    if (!this.prefersReducedMotion()) return;

    element.classList.add('reduced-motion');
    
    // Disable animations and transitions
    const animatedElements = element.querySelectorAll('*');
    animatedElements.forEach(el => {
      (el as HTMLElement).style.animationDuration = '0.01ms';
      (el as HTMLElement).style.animationIterationCount = '1';
      (el as HTMLElement).style.transitionDuration = '0.01ms';
      (el as HTMLElement).style.scrollBehavior = 'auto';
    });

    // Replace progress animations with instant updates
    const progressElements = element.querySelectorAll('[role="progressbar"]');
    progressElements.forEach(el => {
      (el as HTMLElement).style.transition = 'none';
    });
  }

  /**
   * Get reduced motion safe animation classes
   */
  public static getAnimationClasses(baseClasses: string): string {
    if (this.prefersReducedMotion()) {
      return baseClasses.replace(/animate-\w+/g, '').replace(/transition-\w+/g, '');
    }
    return baseClasses;
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderSupport {
  /**
   * Format time for screen readers
   */
  public static formatTimeForScreenReader(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    
    if (hours > 0) {
      parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    }

    return parts.join(', ');
  }

  /**
   * Format timer status for screen readers
   */
  public static formatStatusForScreenReader(
    status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped',
    timeRemaining?: number,
    isOvertime?: boolean
  ): string {
    let statusText = '';
    
    switch (status) {
      case 'idle':
        statusText = 'Timer is idle and ready to start';
        break;
      case 'running':
        if (isOvertime) {
          statusText = 'Timer is running in overtime mode';
        } else {
          statusText = 'Timer is actively running';
        }
        break;
      case 'paused':
        statusText = 'Timer is paused';
        break;
      case 'completed':
        statusText = 'Timer has completed successfully';
        break;
      case 'stopped':
        statusText = 'Timer has been stopped';
        break;
    }

    if (timeRemaining !== undefined && status === 'running') {
      statusText += `. Time remaining: ${this.formatTimeForScreenReader(timeRemaining)}`;
    }

    return statusText;
  }

  /**
   * Create descriptive text for progress indicators
   */
  public static formatProgressForScreenReader(
    current: number,
    total: number,
    unit: string = 'percent'
  ): string {
    const percentage = Math.round((current / total) * 100);
    return `Progress: ${percentage} ${unit} complete. ${current} of ${total} ${unit === 'percent' ? 'units' : unit}.`;
  }
}

/**
 * Initialize all accessibility features for timer components
 */
export function initializeTimerAccessibility(): void {
  // Initialize announcer
  TimerAnnouncer.getInstance();
  
  // Add CSS for high contrast and reduced motion
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      .high-contrast-mode button,
      .high-contrast-mode input,
      .high-contrast-mode select,
      .high-contrast-mode textarea {
        border: 2px solid ButtonText !important;
        background-color: ButtonFace !important;
        color: ButtonText !important;
      }
      
      .high-contrast-mode [role="progressbar"] {
        border: 2px solid ButtonText !important;
        background-color: ButtonFace !important;
      }
      
      .reduced-motion *,
      .reduced-motion *::before,
      .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Cleanup accessibility features
 */
export function cleanupTimerAccessibility(): void {
  TimerAnnouncer.getInstance().cleanup();
  FocusManager.getInstance().clearFocusStack();
}