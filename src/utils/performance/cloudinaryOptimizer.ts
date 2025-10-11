/**
 * Cloudinary Performance Optimization Utilities
 * Provides progressive loading, caching, and optimization for Cloudinary files
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Cloudinary optimization configuration
export const CLOUDINARY_CONFIG = {
  // Image quality settings
  THUMBNAIL_QUALITY: 60,
  PREVIEW_QUALITY: 75,
  FULL_QUALITY: 85,
  
  // Image dimensions
  THUMBNAIL_WIDTH: 150,
  PREVIEW_WIDTH: 800,
  FULL_WIDTH: 1920,
  
  // Caching
  CACHE_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Progressive loading
  ENABLE_PROGRESSIVE: true,
  BLUR_PLACEHOLDER: true,
  LAZY_LOAD_THRESHOLD: 200, // pixels
  
  // Format optimization
  AUTO_FORMAT: true,
  PREFER_WEBP: true,
};

// Image cache interface
interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
}

// Image cache manager
class ImageCacheManager {
  private cache: Map<string, CachedImage> = new Map();
  private totalSize: number = 0;

  async get(url: string): Promise<Blob | null> {
    const cached = this.cache.get(url);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > CLOUDINARY_CONFIG.CACHE_DURATION) {
      this.delete(url);
      return null;
    }

    return cached.blob;
  }

  async set(url: string, blob: Blob): Promise<void> {
    const size = blob.size;

    // Check if adding this would exceed cache size
    if (this.totalSize + size > CLOUDINARY_CONFIG.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(url, {
      url,
      blob,
      timestamp: Date.now(),
      size,
    });

    this.totalSize += size;
  }

  delete(url: string): void {
    const cached = this.cache.get(url);
    if (cached) {
      this.totalSize -= cached.size;
      this.cache.delete(url);
    }
  }

  private evictOldest(): void {
    let oldest: { url: string; timestamp: number } | null = null;

    for (const [url, cached] of this.cache.entries()) {
      if (!oldest || cached.timestamp < oldest.timestamp) {
        oldest = { url, timestamp: cached.timestamp };
      }
    }

    if (oldest) {
      this.delete(oldest.url);
    }
  }

  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  getStats() {
    return {
      count: this.cache.size,
      totalSize: this.totalSize,
      maxSize: CLOUDINARY_CONFIG.MAX_CACHE_SIZE,
      usage: (this.totalSize / CLOUDINARY_CONFIG.MAX_CACHE_SIZE) * 100,
    };
  }
}

export const imageCacheManager = new ImageCacheManager();

/**
 * Generate optimized Cloudinary URL with transformations
 */
export function generateCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    gravity?: 'auto' | 'face' | 'center';
    blur?: number;
    progressive?: boolean;
  } = {}
): string {
  const {
    width,
    height,
    quality = CLOUDINARY_CONFIG.PREVIEW_QUALITY,
    format = CLOUDINARY_CONFIG.AUTO_FORMAT ? 'auto' : undefined,
    crop = 'fill',
    gravity = 'auto',
    blur,
    progressive = CLOUDINARY_CONFIG.ENABLE_PROGRESSIVE,
  } = options;

  const transformations: string[] = [];

  // Add dimensions
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);

  // Add crop and gravity
  if (width || height) {
    transformations.push(`c_${crop}`);
    if (gravity) transformations.push(`g_${gravity}`);
  }

  // Add quality
  transformations.push(`q_${quality}`);

  // Add format
  if (format) transformations.push(`f_${format}`);

  // Add blur for placeholder
  if (blur) transformations.push(`e_blur:${blur}`);

  // Add progressive flag
  if (progressive) transformations.push('fl_progressive');

  const transformString = transformations.join(',');
  
  // Assuming Cloudinary cloud name is in environment variable
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
}

/**
 * Generate multiple image sizes for responsive loading
 */
export function generateResponsiveUrls(publicId: string) {
  return {
    thumbnail: generateCloudinaryUrl(publicId, {
      width: CLOUDINARY_CONFIG.THUMBNAIL_WIDTH,
      quality: CLOUDINARY_CONFIG.THUMBNAIL_QUALITY,
    }),
    preview: generateCloudinaryUrl(publicId, {
      width: CLOUDINARY_CONFIG.PREVIEW_WIDTH,
      quality: CLOUDINARY_CONFIG.PREVIEW_QUALITY,
    }),
    full: generateCloudinaryUrl(publicId, {
      width: CLOUDINARY_CONFIG.FULL_WIDTH,
      quality: CLOUDINARY_CONFIG.FULL_QUALITY,
    }),
    placeholder: CLOUDINARY_CONFIG.BLUR_PLACEHOLDER
      ? generateCloudinaryUrl(publicId, {
          width: 50,
          quality: 30,
          blur: 1000,
        })
      : undefined,
  };
}

/**
 * Hook for progressive image loading with caching
 */
export function useProgressiveImage(publicId: string) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadedSizes = useRef<Set<string>>(new Set());

  const urls = generateResponsiveUrls(publicId);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async (url: string, size: string) => {
      try {
        // Check cache first
        const cached = await imageCacheManager.get(url);
        
        if (cached) {
          const objectUrl = URL.createObjectURL(cached);
          if (isMounted) {
            setCurrentSrc(objectUrl);
            loadedSizes.current.add(size);
          }
          return;
        }

        // Load image
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load image');

        const blob = await response.blob();
        
        // Cache the image
        await imageCacheManager.set(url, blob);

        // Create object URL
        const objectUrl = URL.createObjectURL(blob);
        
        if (isMounted) {
          setCurrentSrc(objectUrl);
          loadedSizes.current.add(size);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      }
    };

    const loadProgressive = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load placeholder first if enabled
        if (urls.placeholder && CLOUDINARY_CONFIG.BLUR_PLACEHOLDER) {
          await loadImage(urls.placeholder, 'placeholder');
        }

        // Load thumbnail
        await loadImage(urls.thumbnail, 'thumbnail');

        // Load preview
        await loadImage(urls.preview, 'preview');

        // Load full size
        await loadImage(urls.full, 'full');
      } catch (err) {
        console.error('Progressive image loading error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProgressive();

    return () => {
      isMounted = false;
      // Cleanup object URLs
      if (currentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc);
      }
    };
  }, [publicId]);

  return {
    src: currentSrc,
    isLoading,
    error,
    urls,
    loadedSizes: Array.from(loadedSizes.current),
  };
}

/**
 * Hook for lazy loading images with Intersection Observer
 */
export function useLazyImage(publicId: string, threshold = CLOUDINARY_CONFIG.LAZY_LOAD_THRESHOLD) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const progressiveImage = useProgressiveImage(shouldLoad ? publicId : '');

  return {
    ...progressiveImage,
    elementRef,
    shouldLoad,
  };
}

/**
 * Preload critical images
 */
export function preloadImages(publicIds: string[], size: 'thumbnail' | 'preview' | 'full' = 'preview') {
  const promises = publicIds.map(async (publicId) => {
    const urls = generateResponsiveUrls(publicId);
    const url = urls[size];

    try {
      // Check if already cached
      const cached = await imageCacheManager.get(url);
      if (cached) return;

      // Preload image
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to preload image');

      const blob = await response.blob();
      await imageCacheManager.set(url, blob);
    } catch (error) {
      console.error(`Failed to preload image ${publicId}:`, error);
    }
  });

  return Promise.allSettled(promises);
}

/**
 * Clear image cache
 */
export function clearImageCache() {
  imageCacheManager.clear();
}

/**
 * Get cache statistics
 */
export function getImageCacheStats() {
  return imageCacheManager.getStats();
}

/**
 * Optimize file upload before sending to Cloudinary
 */
export async function optimizeFileForUpload(file: File): Promise<File> {
  // Only optimize images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(file);
          return;
        }

        // Calculate new dimensions (max 1920px)
        let width = img.width;
        let height = img.height;
        const maxDimension = CLOUDINARY_CONFIG.FULL_WIDTH;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          CLOUDINARY_CONFIG.FULL_QUALITY / 100
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
