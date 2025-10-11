import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type TransitionType = 'fade' | 'slide' | 'scale' | 'spring';

interface PageTransitionOptions {
  type?: TransitionType;
  duration?: number;
  enabled?: boolean;
}

export function usePageTransition(options: PageTransitionOptions = {}) {
  const {
    type = 'spring',
    duration = 300,
    enabled = true
  } = options;

  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (!enabled) {
      setDisplayLocation(location);
      return;
    }

    if (location !== displayLocation) {
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation, duration, enabled]);

  const getTransitionClass = () => {
    if (!enabled) return '';
    
    const baseClass = isTransitioning ? 'page-exit' : 'page-enter';
    return `${baseClass} ${baseClass}-${type}`;
  };

  return {
    isTransitioning,
    displayLocation,
    transitionClass: getTransitionClass(),
    type
  };
}
