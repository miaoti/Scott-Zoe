import { useState, useEffect } from 'react';

interface UseProgressiveImageProps {
  src: string;
  placeholderSrc?: string;
}

interface UseProgressiveImageReturn {
  src: string;
  blur: boolean;
  loading: boolean;
}

export const useProgressiveImage = ({ 
  src, 
  placeholderSrc 
}: UseProgressiveImageProps): UseProgressiveImageReturn => {
  const [sourceLoaded, setSourceLoaded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setSourceLoaded(src);
      setLoading(false);
    };
    img.onerror = () => {
      setLoading(false);
    };
    img.src = src;
  }, [src]);

  return {
    src: sourceLoaded || placeholderSrc || src,
    blur: !sourceLoaded && !!placeholderSrc,
    loading
  };
};