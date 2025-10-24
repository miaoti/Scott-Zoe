// Centralized type definitions for the Scott-Zoe application

export interface User {
  id: number;
  username: string;
  displayName?: string;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  photoCount: number;
  photos?: Photo[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Photo {
  id: number;
  filename: string;
  originalName: string;
  caption?: string;
  createdAt: string;
  uploader: User;
  categories: Category[];
  noteCount: number;
  isFavorite?: boolean;
}

export interface Note {
  id: number;
  content: string;
  createdAt: string | number[];
  author: User;
}

// Image size types for gallery display
export type ImageSize = 'small' | 'medium' | 'large';

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Component prop types
export interface CategoryGridProps {
  categories: Category[];
  loading?: boolean;
  onCategoryClick?: (category: Category) => void;
}

export interface CategoryCardProps {
  category: Category;
  onClick?: (category: Category) => void;
}

export interface CategoryThumbnailProps {
  category: Category;
}