import { useState, useCallback, useEffect, useRef } from 'react';

interface UseImageReturn {
  loaded: boolean;
  error: boolean;
  isLoading: boolean;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  handleLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  handleError: () => void;
  reset: () => void;
}

interface UseImageOptions {
  src?: string;
  onLoad?: (img: HTMLImageElement) => void;
  onError?: () => void;
}

/**
 * Hook personnalisé pour gérer les états de chargement des images
 * Avec détection des dimensions et aspect ratio
 */
export const useImage = (options: UseImageOptions = {}): UseImageReturn => {
  const { src, onLoad, onError } = options;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalWidth(img.naturalWidth);
    setNaturalHeight(img.naturalHeight);
    setAspectRatio(img.naturalWidth / img.naturalHeight);
    setLoaded(true);
    setError(false);
    setIsLoading(false);
    onLoad?.(img);
  }, [onLoad]);

  const handleError = useCallback(() => {
    setLoaded(false);
    setError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  const reset = useCallback(() => {
    setLoaded(false);
    setError(false);
    setIsLoading(false);
    setNaturalWidth(0);
    setNaturalHeight(0);
    setAspectRatio(1);
  }, []);

  // Démarrer le chargement quand src change
  useEffect(() => {
    if (src) {
      reset();
      setIsLoading(true);
    }
  }, [src, reset]);

  return {
    loaded,
    error,
    isLoading,
    naturalWidth,
    naturalHeight,
    aspectRatio,
    handleLoad,
    handleError,
    reset,
  };
};
