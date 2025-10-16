/**
 * CSS Performance Optimization Utilities
 * 
 * This module provides utilities for optimizing CSS performance including:
 * - CSS containment helpers
 * - Critical CSS detection
 * - Performance monitoring
 * - CSS custom property optimization
 */

/**
 * CSS Containment Types
 * 
 * CSS containment improves performance by limiting the scope of layout,
 * style, paint, and size calculations.
 */
export type ContainmentType = 'layout' | 'paint' | 'size' | 'style' | 'content' | 'strict' | 'none' | 'layout paint' | 'layout style' | 'paint style' | 'layout paint style';

/**
 * Apply CSS containment to an element
 * 
 * @param element - The DOM element to apply containment to
 * @param type - The type of containment to apply
 */
export function applyContainment(element: HTMLElement, type: ContainmentType): void {
  if (!element) return;

  element.style.contain = type;
}

/**
 * Apply CSS containment to multiple elements by selector
 * 
 * @param selector - CSS selector for elements
 * @param type - The type of containment to apply
 */
export function applyContainmentToSelector(selector: string, type: ContainmentType): void {
  const elements = document.querySelectorAll<HTMLElement>(selector);
  elements.forEach(element => applyContainment(element, type));
}

/**
 * Containment configuration for common component types
 */
export const CONTAINMENT_CONFIG = {
  // Dashboard cards benefit from layout and paint containment
  dashboardCard: 'layout' as const,

  // Modals benefit from layout containment
  modal: 'layout' as const,

  // Forms benefit from layout containment
  form: 'layout' as const,

  // Lists benefit from content containment
  list: 'content' as const,

  // Tables benefit from strict containment
  table: 'strict' as const,

  // Charts benefit from layout and paint containment
  chart: 'layout' as const,

  // Sidebar benefits from layout containment
  sidebar: 'layout' as const,
} as const;

/**
 * Initialize CSS containment for all configured components
 */
export function initializeCSSContainment(): void {
  // Dashboard cards
  applyContainmentToSelector('[data-component="dashboard-card"]', CONTAINMENT_CONFIG.dashboardCard);
  applyContainmentToSelector('.dashboard-card', CONTAINMENT_CONFIG.dashboardCard);

  // Modals
  applyContainmentToSelector('[role="dialog"]', CONTAINMENT_CONFIG.modal);
  applyContainmentToSelector('.modal-content', CONTAINMENT_CONFIG.modal);

  // Forms
  applyContainmentToSelector('form', CONTAINMENT_CONFIG.form);

  // Lists
  applyContainmentToSelector('[role="list"]', CONTAINMENT_CONFIG.list);
  applyContainmentToSelector('.list-container', CONTAINMENT_CONFIG.list);

  // Tables
  applyContainmentToSelector('table', CONTAINMENT_CONFIG.table);
  applyContainmentToSelector('[role="table"]', CONTAINMENT_CONFIG.table);

  // Charts
  applyContainmentToSelector('[data-component="chart"]', CONTAINMENT_CONFIG.chart);
  applyContainmentToSelector('.chart-container', CONTAINMENT_CONFIG.chart);

  // Sidebar
  applyContainmentToSelector('[data-component="sidebar"]', CONTAINMENT_CONFIG.sidebar);
  applyContainmentToSelector('.sidebar', CONTAINMENT_CONFIG.sidebar);
}

/**
 * Critical CSS Detection
 * 
 * Identifies CSS rules that are critical for above-the-fold content
 */
export interface CriticalCSSOptions {
  viewportHeight?: number;
  viewportWidth?: number;
  includeSelectors?: string[];
  excludeSelectors?: string[];
}

/**
 * Detect critical CSS rules for above-the-fold content
 * 
 * @param options - Configuration options
 * @returns Array of critical CSS rules
 */
export function detectCriticalCSS(options: CriticalCSSOptions = {}): string[] {
  const {
    viewportHeight = window.innerHeight,
    viewportWidth = window.innerWidth,
    includeSelectors = [],
    excludeSelectors = [],
  } = options;

  const criticalRules: string[] = [];
  const styleSheets = Array.from(document.styleSheets);

  styleSheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || []);

      rules.forEach(rule => {
        if (rule instanceof CSSStyleRule) {
          const selector = rule.selectorText;

          // Skip excluded selectors
          if (excludeSelectors.some(excluded => selector.includes(excluded))) {
            return;
          }

          // Include specified selectors
          if (includeSelectors.some(included => selector.includes(included))) {
            criticalRules.push(rule.cssText);
            return;
          }

          // Check if elements matching this selector are in viewport
          const elements = document.querySelectorAll(selector);
          const isInViewport = Array.from(elements).some(element => {
            const rect = element.getBoundingClientRect();
            return (
              rect.top < viewportHeight &&
              rect.bottom > 0 &&
              rect.left < viewportWidth &&
              rect.right > 0
            );
          });

          if (isInViewport) {
            criticalRules.push(rule.cssText);
          }
        }
      });
    } catch (e) {
      // Skip stylesheets that can't be accessed (CORS)
      console.warn('Could not access stylesheet:', e);
    }
  });

  return criticalRules;
}

/**
 * Generate critical CSS string
 * 
 * @param options - Configuration options
 * @returns Critical CSS as a string
 */
export function generateCriticalCSS(options: CriticalCSSOptions = {}): string {
  const rules = detectCriticalCSS(options);
  return rules.join('\n');
}

/**
 * Inline critical CSS into the document head
 * 
 * @param css - Critical CSS string
 */
export function inlineCriticalCSS(css: string): void {
  const style = document.createElement('style');
  style.id = 'critical-css';
  style.textContent = css;
  document.head.insertBefore(style, document.head.firstChild);
}

/**
 * CSS Custom Property Optimization
 * 
 * Optimizes CSS custom properties for theme switching performance
 */
export interface CSSPropertyOptimization {
  property: string;
  value: string;
  priority?: string;
}

/**
 * Batch update CSS custom properties for better performance
 * 
 * @param properties - Array of property updates
 * @param element - Target element (defaults to document.documentElement)
 */
export function batchUpdateCSSProperties(
  properties: CSSPropertyOptimization[],
  element: HTMLElement = document.documentElement
): void {
  // Use requestAnimationFrame to batch updates
  requestAnimationFrame(() => {
    properties.forEach(({ property, value, priority }) => {
      element.style.setProperty(property, value, priority);
    });
  });
}

/**
 * Optimize CSS custom properties by removing unused ones
 * 
 * @param element - Target element (defaults to document.documentElement)
 * @returns Array of removed properties
 */
export function removeUnusedCSSProperties(element: HTMLElement = document.documentElement): string[] {
  const computedStyle = getComputedStyle(element);
  const declaredProperties = Array.from(element.style);
  const removedProperties: string[] = [];

  declaredProperties.forEach(property => {
    if (property.startsWith('--')) {
      const value = computedStyle.getPropertyValue(property);

      // Check if property is actually used
      const isUsed = document.body.innerHTML.includes(`var(${property})`);

      if (!isUsed && !value) {
        element.style.removeProperty(property);
        removedProperties.push(property);
      }
    }
  });

  return removedProperties;
}

/**
 * Performance Monitoring
 */
export interface CSSPerformanceMetrics {
  stylesheetCount: number;
  ruleCount: number;
  customPropertyCount: number;
  unusedRules: number;
  loadTime: number;
}

/**
 * Measure CSS performance metrics
 * 
 * @returns Performance metrics object
 */
export function measureCSSPerformance(): CSSPerformanceMetrics {
  const startTime = performance.now();

  const styleSheets = Array.from(document.styleSheets);
  let ruleCount = 0;
  let customPropertyCount = 0;

  styleSheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      ruleCount += rules.length;

      rules.forEach(rule => {
        if (rule instanceof CSSStyleRule) {
          const text = rule.cssText;
          const matches = text.match(/--[\w-]+/g);
          if (matches) {
            customPropertyCount += matches.length;
          }
        }
      });
    } catch (e) {
      // Skip inaccessible stylesheets
    }
  });

  const loadTime = performance.now() - startTime;

  return {
    stylesheetCount: styleSheets.length,
    ruleCount,
    customPropertyCount,
    unusedRules: 0, // Would require more complex analysis
    loadTime,
  };
}

/**
 * Log CSS performance metrics to console
 */
export function logCSSPerformance(): void {
  const metrics = measureCSSPerformance();

  console.group('CSS Performance Metrics');
  console.log(`Stylesheets: ${metrics.stylesheetCount}`);
  console.log(`CSS Rules: ${metrics.ruleCount}`);
  console.log(`Custom Properties: ${metrics.customPropertyCount}`);
  console.log(`Analysis Time: ${metrics.loadTime.toFixed(2)}ms`);
  console.groupEnd();
}

/**
 * Will-change optimization
 * 
 * Manages will-change property for better animation performance
 */
export class WillChangeManager {
  private elements = new Map<HTMLElement, string[]>();

  /**
   * Add will-change property to an element
   * 
   * @param element - Target element
   * @param properties - CSS properties that will change
   */
  add(element: HTMLElement, properties: string[]): void {
    this.elements.set(element, properties);
    element.style.willChange = properties.join(', ');
  }

  /**
   * Remove will-change property from an element
   * 
   * @param element - Target element
   */
  remove(element: HTMLElement): void {
    this.elements.delete(element);
    element.style.willChange = 'auto';
  }

  /**
   * Temporarily add will-change for an animation
   * 
   * @param element - Target element
   * @param properties - CSS properties that will change
   * @param duration - Duration in milliseconds
   */
  temporary(element: HTMLElement, properties: string[], duration: number = 1000): void {
    this.add(element, properties);

    setTimeout(() => {
      this.remove(element);
    }, duration);
  }

  /**
   * Clear all will-change properties
   */
  clear(): void {
    this.elements.forEach((_, element) => {
      element.style.willChange = 'auto';
    });
    this.elements.clear();
  }
}

/**
 * Global will-change manager instance
 */
export const willChangeManager = new WillChangeManager();

/**
 * Initialize all CSS performance optimizations
 */
export function initializeCSSOptimizations(): void {
  // Apply CSS containment
  initializeCSSContainment();

  // Log performance metrics in development
  if (import.meta.env.DEV) {
    logCSSPerformance();
  }

  console.log('CSS performance optimizations initialized');
}
