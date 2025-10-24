import React, { memo, useState } from 'react';
import { Category, CategoryThumbnailProps } from '../types';
import { API_BASE_URL } from '../utils/api';

const CategoryThumbnail: React.FC<CategoryThumbnailProps> = memo(({ category }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get the latest photo from the category
  const latestPhoto = category.photos && category.photos.length > 0 
    ? category.photos[0] // Assuming photos are sorted by date desc
    : null;

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // Empty state for categories with no photos
  if (!latestPhoto || category.photoCount === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div 
            className="w-8 h-8 rounded-full mx-auto mb-2 opacity-60"
            style={{ backgroundColor: category.color }}
          />
          <svg 
            className="w-6 h-6 text-gray-300 mx-auto" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
      )}

      {/* Image */}
      {!imageError ? (
        <img
          src={`${API_BASE_URL}/api/photos/image/${latestPhoto.filename}?size=thumbnail`}
          alt={latestPhoto.originalName || category.name}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        // Error state
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div 
              className="w-6 h-6 rounded-full mx-auto mb-1 opacity-40"
              style={{ backgroundColor: category.color }}
            />
            <svg 
              className="w-5 h-5 text-gray-400 mx-auto" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>
      )}

      {/* Subtle overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
});

CategoryThumbnail.displayName = 'CategoryThumbnail';

export default CategoryThumbnail;