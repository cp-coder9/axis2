/**
 * Focus Management Utility for Architex Axis
 * Provides keyboard navigation and focus management for complex components
 */

export interface FocusableElement {
  element: HTMLElement;
  priority: number;
  group?: string;
}

export class FocusManager {
  private static instance: FocusManager;
  private focusableElements: Map<string, FocusableElement[]> = new Map();
  private currentFocusGroup: string | null = null;
  private trapStack: HTMLElement[] = [];

  private constructor() {
    this.setupGlobalKeyboardHandlers();
  }

  static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager();
    }
    return FocusManager.instance;
  }

  /**
   * Set the current active focus group
   */
  setCurrentFocusGroup(groupId: string | null): void {
    this.currentFocusGroup = groupId;
  }

  /**
   * Get the current active focus group
   */
  getCurrentFocusGroup(): string | null {
    return this.currentFocusGroup;
  }

  /**
   * Handle keyboard navigation within a container
   */
  handleKeyboardNavigation(event: KeyboardEvent, containerRef: React.RefObject<HTMLElement>): void {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Check if container belongs to current focus group
    const groupId = container.getAttribute('data-focus-group');
    if (groupId && this.currentFocusGroup && groupId !== this.currentFocusGroup) {
      this.setCurrentFocusGroup(groupId);
    }

    const focusableElements = this.getFocusableElementsInContainer(container);

    if (focusableElements.length === 0) return;

    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this.focusNext(focusableElements, currentIndex);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        this.focusPrevious(focusableElements, currentIndex);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirst(focusableElements);
        break;
      case 'End':
        event.preventDefault();
        this.focusLast(focusableElements);
        break;
      case 'Escape':
        event.preventDefault();
        this.releaseFocusTrap();
        break;
    }
  }

  /**
   * Get all focusable elements within a container
   */
  private getFocusableElementsInContainer(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="tab"]:not([disabled])',
      '[role="menuitem"]:not([disabled])'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => this.isElementVisible(el as HTMLElement)) as HTMLElement[];
  }

  /**
   * Check if element is visible and focusable
   */
  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           !element.hasAttribute('aria-hidden');
  }

  /**
   * Focus the next element in the list
   */
  private focusNext(elements: HTMLElement[], currentIndex: number): void {
    const nextIndex = currentIndex + 1 >= elements.length ? 0 : currentIndex + 1;
    elements[nextIndex]?.focus();
  }

  /**
   * Focus the previous element in the list
   */
  private focusPrevious(elements: HTMLElement[], currentIndex: number): void {
    const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    elements[prevIndex]?.focus();
  }

  /**
   * Focus the first element
   */
  private focusFirst(elements: HTMLElement[]): void {
    elements[0]?.focus();
  }

  /**
   * Focus the last element
   */
  private focusLast(elements: HTMLElement[]): void {
    elements[elements.length - 1]?.focus();
  }

  /**
   * Register focusable elements for a group
   */
  registerFocusGroup(groupId: string, elements: FocusableElement[]): void {
    this.focusableElements.set(groupId, elements.sort((a, b) => a.priority - b.priority));
    
    // Set as current group if it's the first one or no current group is set
    if (!this.currentFocusGroup || this.focusableElements.size === 1) {
      this.setCurrentFocusGroup(groupId);
    }
  }

  /**
   * Unregister a focus group
   */
  unregisterFocusGroup(groupId: string): void {
    this.focusableElements.delete(groupId);
    
    // Clear current group if it was the one being removed
    if (this.currentFocusGroup === groupId) {
      const remainingGroups = Array.from(this.focusableElements.keys());
      this.setCurrentFocusGroup(remainingGroups.length > 0 ? remainingGroups[0] : null);
    }
  }

  /**
   * Focus the first element in the current focus group
   */
  focusCurrentGroup(): void {
    if (!this.currentFocusGroup) return;
    
    const elements = this.focusableElements.get(this.currentFocusGroup);
    if (elements && elements.length > 0) {
      elements[0].element.focus();
    }
  }

  /**
   * Switch to next focus group
   */
  switchToNextGroup(): void {
    const groups = Array.from(this.focusableElements.keys());
    if (groups.length <= 1) return;
    
    const currentIndex = this.currentFocusGroup ? groups.indexOf(this.currentFocusGroup) : -1;
    const nextIndex = (currentIndex + 1) % groups.length;
    
    this.setCurrentFocusGroup(groups[nextIndex]);
    this.focusCurrentGroup();
  }

  /**
   * Switch to previous focus group
   */
  switchToPreviousGroup(): void {
    const groups = Array.from(this.focusableElements.keys());
    if (groups.length <= 1) return;
    
    const currentIndex = this.currentFocusGroup ? groups.indexOf(this.currentFocusGroup) : -1;
    const prevIndex = currentIndex <= 0 ? groups.length - 1 : currentIndex - 1;
    
    this.setCurrentFocusGroup(groups[prevIndex]);
    this.focusCurrentGroup();
  }

  /**
   * Set up focus trap for modal or dialog
   */
  trapFocus(container: HTMLElement): void {
    if (this.trapStack.includes(container)) return;
    
    this.trapStack.push(container);
    
    // Set current focus group based on trap container
    const groupId = container.getAttribute('data-focus-group');
    if (groupId) {
      this.setCurrentFocusGroup(groupId);
    }
    
    this.setupFocusTrap(container);
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap(): void {
    const container = this.trapStack.pop();
    if (container) {
      this.removeFocusTrap(container);
    }
  }

  /**
   * Set up focus trap event listeners
   */
  private setupFocusTrap(container: HTMLElement): void {
    const handleTrapKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        this.handleTabTrap(event, container);
      }
    };

    container.addEventListener('keydown', handleTrapKeyDown);
    container.setAttribute('data-focus-trap', 'true');
  }

  /**
   * Remove focus trap
   */
  private removeFocusTrap(container: HTMLElement): void {
    container.removeAttribute('data-focus-trap');
    // Event listeners are automatically removed when element is removed from DOM
  }

  /**
   * Handle tab key within focus trap
   */
  private handleTabTrap(event: KeyboardEvent, container: HTMLElement): void {
    const focusableElements = this.getFocusableElementsInContainer(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Set up global keyboard handlers
   */
  private setupGlobalKeyboardHandlers(): void {
    document.addEventListener('keydown', (event) => {
      // Global escape handler
      if (event.key === 'Escape' && this.trapStack.length > 0) {
        this.releaseFocusTrap();
      }
      
      // Ctrl/Cmd + Arrow keys for switching focus groups
      if ((event.ctrlKey || event.metaKey) && this.focusableElements.size > 1) {
        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            event.preventDefault();
            this.switchToNextGroup();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            event.preventDefault();
            this.switchToPreviousGroup();
            break;
        }
      }
    });
  }

  /**
   * Focus management for timer controls
   */
  focusTimerControl(container: HTMLElement, action: 'start' | 'pause' | 'resume' | 'stop' | 'reset'): void {
    const button = container.querySelector(`[data-action="${action}"]`) as HTMLElement;
    if (button && !button.hasAttribute('disabled')) {
      button.focus();
    }
  }

  /**
   * Announce focus changes to screen readers
   */
  announceFocusChange(element: HTMLElement, context?: string): void {
    const announcement = context ? 
      `${context}: ${element.getAttribute('aria-label') || element.textContent || 'Interactive element'}` :
      `Focused: ${element.getAttribute('aria-label') || element.textContent || 'Interactive element'}`;
    
    this.announceToScreenReader(announcement);
  }

  /**
   * Create announcement for screen readers
   */
  private announceToScreenReader(message: string): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * Save current focus for restoration
   */
  saveFocus(): HTMLElement | null {
    return document.activeElement as HTMLElement;
  }

  /**
   * Restore previously saved focus
   */
  restoreFocus(element: HTMLElement | null): void {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }

  /**
   * Clear all focus management state
   */
  cleanup(): void {
    this.focusableElements.clear();
    this.currentFocusGroup = null;
    this.trapStack.length = 0;
  }
}

// Export singleton instance for convenience
export const focusManager = FocusManager.getInstance();
