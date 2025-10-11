/**
 * Performance Utilities Index
 * Exports all performance optimization utilities
 */

// Performance monitoring and optimization
export {
  PERFORMANCE_CONFIG,
  performanceTracker,
  usePerformanceMonitor,
  useThrottledValue,
  useDebouncedValue,
  useVisibilityHandler,
  useTimerCalculations,
  formatDuration,
  useMemoryCleanup,
  analyzeBundleSize,
  analyzeNetworkPerformance,
  trackRolePerformance,
  getRolePerformanceMetrics,
  clearRolePerformanceMetrics,
  type PerformanceMetrics,
  type RolePerformanceMetrics,
} from './performanceOptimizer';

// Cloudinary optimization
export {
  CLOUDINARY_CONFIG,
  imageCacheManager,
  generateCloudinaryUrl,
  generateResponsiveUrls,
  useProgressiveImage,
  useLazyImage,
  preloadImages,
  clearImageCache,
  getImageCacheStats,
  optimizeFileForUpload,
} from './cloudinaryOptimizer';

// Re-export for backward compatibility
export * from './performanceOptimizer';
export * from './cloudinaryOptimizer';
