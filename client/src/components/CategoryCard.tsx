import React, { memo } from 'react';
import { Category, CategoryCardProps } from '../types';
import CategoryThumbnail from './CategoryThumbnail';

const CategoryCard: React.FC<CategoryCardProps> = memo(({ category, onClick }) => {
  const handleClick = () => {
    onClick?.(category);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="apple-photos-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${category.name} category with ${category.photoCount} photos`}
    >
      {/* Thumbnail */}
      <div className="apple-photos-thumbnail">
        <CategoryThumbnail category={category} />
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="apple-photos-title truncate">
            {category.name}
          </h3>
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0 ml-2"
            style={{ backgroundColor: category.color }}
            aria-hidden="true"
          />
        </div>
        
        <p className="apple-photos-count">
          {category.photoCount === 1 ? '1 photo' : `${category.photoCount} photos`}
        </p>
      </div>
    </div>
  );
});

CategoryCard.displayName = 'CategoryCard';

export default CategoryCard;