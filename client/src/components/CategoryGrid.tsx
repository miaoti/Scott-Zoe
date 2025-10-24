import React, { memo } from 'react';
import { Category, CategoryGridProps } from '../types';
import CategoryCard from './CategoryCard';

const CategoryGrid: React.FC<CategoryGridProps> = memo(({ categories, loading = false, onCategoryClick }) => {
  if (loading) {
    return (
      <div className="apple-photos-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="apple-photos-card">
            <div className="apple-photos-thumbnail apple-skeleton" />
            <div className="p-4 space-y-2">
              <div className="h-4 apple-skeleton rounded" />
              <div className="h-3 apple-skeleton rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <h3 className="apple-photos-title mb-2">No categories yet</h3>
        <p className="apple-photos-subtitle">Create categories to organize your photos</p>
      </div>
    );
  }

  return (
    <div className="apple-photos-grid">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onClick={onCategoryClick}
        />
      ))}
    </div>
  );
});

CategoryGrid.displayName = 'CategoryGrid';

export default CategoryGrid;