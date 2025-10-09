import React from 'react';
import { useProgressiveImage } from '../hooks/useProgressiveImage';

interface ProgressiveImageProps {
  src: string;
  placeholderSrc?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholderSrc,
  alt,
  className = '',
  onClick,
  loading = 'lazy',
  style,
  onLoad
}) => {
  const { src: imageSrc, blur, loading: imageLoading } = useProgressiveImage({
    src,
    placeholderSrc
  });

  return (
    <div className="relative overflow-hidden">
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${blur ? 'filter blur-sm' : ''} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-all duration-500`}
        onClick={onClick}
        loading={loading}
        style={style}
        onLoad={(e) => {
          if (onLoad) onLoad(e);
        }}
      />
      
      {/* Loading skeleton */}
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;