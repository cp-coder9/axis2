/**
 * Optimized Image Component
 * Progressive loading with caching and lazy loading support
 */

import React, { useState, useEffect } from 'react';
import { useProgressiveImage, useLazyImage, CLOUDINARY_CONFIG } from '@/utils/performance';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface OptimizedImageProps {
  publicId: string;
  alt: string;
  className?: string;
  lazy?: boolean;
  lazyThreshold?: number;
  showPlaceholder?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  aspectRatio?: string;
}

/**
 * Optimized Image Component with Progressive Loading
 * 
 * Features:
 * - Progressive loading (placeholder -> thumbnail -> preview -> full)
 * - Lazy loading with Intersection Observer
 * - Automatic caching
 * - Responsive image sizes
 * - Error handling with fallback
 * - Loading skeleton
 */
export function OptimizedImage({
  publicId,
  alt,
  className = '',
  lazy = true,
  lazyThreshold = CLOUDINARY_CONFIG.LAZY_LOAD_THRESHOLD,
  showPlaceholder = CLOUDINARY_CONFIG.BLUR_PLACEHOLDER,
  onLoad,
  onError,
  aspectRatio = '16/9',
}: OptimizedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use lazy loading if enabled
  const lazyImage = useLazyImage(publicId, lazyThreshold);
  const progressiveImage = useProgressiveImage(publicId);

  const { src, isLoading, error, urls, shouldLoad, elementRef } = lazy ? lazyImage : { ...progressiveImage, shouldLoad: true, elementRef: null };

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (!isLoading && src && onLoad) {
      onLoad();
    }
  }, [isLoading, src, onLoad]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Error state
  if (error) {
    return (
      <div
        ref={elementRef as React.RefObject<HTMLDivElement>}
        className={`flex items-center justify-center bg-muted rounded-lg ${className}`}
        style={{ aspectRatio }}
      >
        <div className="text-center text-muted-foreground p-4">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Failed to load image</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!shouldLoad || isLoading || !src) {
    return (
      <div
        ref={elementRef as React.RefObject<HTMLDivElement>}
        className={className}
        style={{ aspectRatio }}
      >
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      {/* Blur placeholder */}
      {showPlaceholder && urls?.placeholder && !imageLoaded && (
        <img
          src={urls.placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        loading={lazy ? 'lazy' : 'eager'}
      />

      {/* Loading overlay */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;
