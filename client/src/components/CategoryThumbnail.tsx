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
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        {/* Background pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${category.color} 2px, transparent 2px), radial-gradient(circle at 80% 50%, ${category.color} 1px, transparent 1px)`,
            backgroundSize: '20px 20px, 15px 15px'
          }}
        />
        
        {/* Main content */}
        <div className="text-center z-10">
          {/* Category color indicator */}
          <div className="relative mb-3">
            <div 
              className="w-12 h-12 rounded-2xl mx-auto shadow-sm border-2 border-white flex items-center justify-center"
              style={{ backgroundColor: category.color }}
            >
              <svg 
                className="w-6 h-6 text-white drop-shadow-sm" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
            </div>
          </div>
          
          {/* Text */}
          <div className="px-2">
            <p className="text-xs font-medium text-gray-600 mb-1">Ready for photos</p>
            <p className="text-xs text-gray-400 leading-tight">Tap to add your first photo to this category</p>
          </div>
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