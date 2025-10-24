import React, { useState, useEffect } from 'react';
import { X, Heart, Calendar, User, Tag, Edit3, Save, Trash2 } from 'lucide-react';
import api, { API_BASE_URL } from '../utils/api';

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  caption?: string;
  createdAt: string | number[];
  uploader: { name: string };
  categories: { id: number; name: string; color: string }[];
  noteCount: number;
  isFavorite?: boolean;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

interface PhotoDetailModalProps {
  photo: Photo;
  onClose: () => void;
  onPhotoUpdate: (updatedPhoto: Photo) => void;
  onPhotoDelete: (photoId: number) => void;
}

const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  onClose,
  onPhotoUpdate,
  onPhotoDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption || '');
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    photo.categories?.map(c => c.id) || []
  );
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // console.log('PhotoDetailModal rendered with photo:', photo);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setAvailableCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
// 
      // console.log('Saving photo with categories:', selectedCategories);
      // console.log('Available categories:', availableCategories);

      // Update caption if it changed
      if (caption !== photo.caption) {
        try {
          await api.put(`/api/photos/${photo.id}/caption`, {
            caption: caption
          });
          // console.log('Caption updated successfully');
        } catch (error) {
          console.error('Error updating caption:', error);
        }
      }

      // Update categories (this already works)
      try {
        await api.put(`/api/photos/${photo.id}/categories`, {
          categoryIds: selectedCategories
        });
        // console.log('Categories updated successfully');
      } catch (error) {
        console.error('Error updating categories:', error);
      }

      // Update local state
      const updatedCategories = availableCategories.filter(cat => selectedCategories.includes(cat.id));
      const updatedPhoto = {
        ...photo,
        caption: caption,
        categories: updatedCategories
      };

      // console.log('Calling onPhotoUpdate with:', updatedPhoto);
      onPhotoUpdate(updatedPhoto);
      setIsEditing(false);

      // Show success message
      alert('Photo details updated successfully!');

    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Failed to update photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const newFavoriteStatus = !photo.isFavorite;
      
      await api.post(`/api/photos/${photo.id}/favorite`, {
        favorite: newFavoriteStatus
      });
      
      const updatedPhoto = { ...photo, isFavorite: newFavoriteStatus };
      onPhotoUpdate(updatedPhoto);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        setLoading(true);
        await api.delete(`/api/photos/${photo.id}`);
        onPhotoDelete(photo.id);
        onClose();
        alert('Photo deleted successfully!');
      } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Failed to delete photo. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleCategory = async (categoryId: number) => {
    // console.log('Toggling category:', categoryId, 'Current selected:', selectedCategories);

    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    // console.log('New selected categories:', newCategories);
    setSelectedCategories(newCategories);

    // Auto-save the category changes to backend
    try {
      // console.log('Saving categories to backend:', newCategories);

      const response = await api.put(`/api/photos/${photo.id}/categories`, {
        categoryIds: newCategories
      });

      // console.log('Backend response:', response.data);

      // Update the photo with the response from backend
      onPhotoUpdate(response.data);
      // console.log('Categories saved successfully');
    } catch (error) {
      console.error('Error saving categories to backend:', error);
      // Revert the selection on error
      setSelectedCategories(selectedCategories);
    }
  };

  const formatDate = (dateInput: string | number[]) => {
    try {
      let date: Date;
      
      if (Array.isArray(dateInput)) {
        // Handle array format: [year, month, day, hour, minute, second, nanoseconds]
        const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
        date = new Date(year, month - 1, day, hour, minute, second); // month is 0-indexed in Date constructor
      } else {
        // Handle string format - extract date part if it includes time
        const dateStr = dateInput.includes('T') ? dateInput.split('T')[0] : dateInput;
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div style={{ backgroundColor: 'var(--apple-glass-bg)', boxShadow: 'var(--apple-shadow)' }} className="rounded-2xl sm:rounded-3xl max-w-6xl w-full h-full sm:max-h-[95vh] overflow-hidden flex flex-col sm:flex-row"
           data-backdrop-filter="blur(20px)"
           onLoad={(e) => {
             const element = e.target as HTMLElement;
             element.style.backdropFilter = 'blur(20px)';
           }}>
        {/* Mobile Header - Only visible on mobile */}
        <div style={{ borderBottomColor: 'var(--apple-separator)', backgroundColor: 'var(--apple-glass-bg)' }} className="sm:hidden flex items-center justify-between p-4 border-b">
          <h2 style={{ color: 'var(--apple-label)' }} className="text-lg font-semibold">Photo Details</h2>
          <button
            onClick={onClose}
            style={{ backgroundColor: 'var(--apple-gray-6)' }}
            className="w-10 h-10 rounded-full hover:opacity-80 active:opacity-60 flex items-center justify-center transition-all duration-200"
          >
            <X style={{ color: 'var(--apple-secondary-label)' }} className="w-5 h-5" />
          </button>
        </div>

        {/* Image Section */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-0 order-1 sm:order-none">
          <img
            src={`${API_BASE_URL}/api/photos/image/${photo.filename}`}
            alt={photo.originalName}
            className="max-w-full max-h-full object-contain w-full h-full sm:w-auto sm:h-auto"
          />
        </div>
        
        {/* Details Section */}
        <div style={{ backgroundColor: 'var(--apple-glass-bg)' }} className="w-full sm:w-96 flex flex-col order-2 sm:order-none max-h-[40vh] sm:max-h-none">
            {/* Desktop Header - Hidden on mobile */}
            <div style={{ borderBottomColor: 'var(--apple-separator)' }} className="hidden sm:flex items-center justify-between p-6 border-b">
              <h2 style={{ color: 'var(--apple-label)' }} className="text-xl font-semibold">Photo Details</h2>
              <button
                onClick={onClose}
                style={{ backgroundColor: 'var(--apple-gray-6)' }}
                className="w-10 h-10 rounded-full hover:opacity-80 active:opacity-60 flex items-center justify-center transition-all duration-200"
              >
                <X style={{ color: 'var(--apple-secondary-label)' }} className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Basic Info */}
              <div>
                <h3 style={{ color: 'var(--apple-label)' }} className="font-semibold mb-3 text-base sm:text-lg">Information</h3>
                <div className="space-y-3 text-sm">
                  <div style={{ backgroundColor: 'var(--apple-gray-6)' }} className="flex items-center gap-3 p-3 rounded-xl">
                    <Calendar style={{ color: 'var(--apple-tertiary-label)' }} className="w-4 h-4 flex-shrink-0" />
                    <span style={{ color: 'var(--apple-secondary-label)' }}>
                      {formatDate(photo.createdAt)}
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--apple-gray-6)' }} className="flex items-center gap-3 p-3 rounded-xl">
                    <User style={{ color: 'var(--apple-tertiary-label)' }} className="w-4 h-4 flex-shrink-0" />
                    <span style={{ color: 'var(--apple-secondary-label)' }}>
                      Uploaded by {photo.uploader?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ color: 'var(--apple-label)' }} className="font-semibold text-base sm:text-lg">Caption</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    style={{ backgroundColor: 'rgba(0, 122, 255, 0.1)', color: 'var(--apple-blue)' }}
                    className="p-2 rounded-full hover:opacity-80 active:opacity-60 transition-all duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                
                {isEditing ? (
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    style={{ 
                      borderColor: 'var(--apple-separator)', 
                      backgroundColor: 'var(--apple-glass-bg)', 
                      color: 'var(--apple-label)',
                      boxShadow: 'var(--apple-shadow)'
                    }}
                    className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none placeholder-gray-500"
                    rows={3}
                  />
                ) : (
                  <div className="max-h-24 overflow-y-auto">
                    <p style={{ color: 'var(--apple-secondary-label)', backgroundColor: 'var(--apple-gray-6)' }} className="text-sm p-4 rounded-xl break-words">
                      {caption || 'No caption added yet'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ color: 'var(--apple-label)' }} className="font-semibold text-base sm:text-lg">Categories</h3>
                  <Tag style={{ color: 'var(--apple-tertiary-label)' }} className="w-4 h-4" />
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {availableCategories
                    .filter(category => category.name?.toLowerCase() !== 'favorites')
                    .map(category => (
                    <label
                      key={category.id}
                      style={{ borderColor: 'transparent' }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-200 border"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--apple-gray-6)';
                        e.currentTarget.style.borderColor = 'var(--apple-separator)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        style={{ 
                          accentColor: 'var(--apple-blue)',
                          backgroundColor: 'var(--apple-glass-bg)',
                          borderColor: 'var(--apple-separator)'
                        }}
                        className="w-4 h-4 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
                      />
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <span style={{ color: 'var(--apple-secondary-label)' }} className="text-sm truncate font-medium">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div 
              style={{ 
                borderTopColor: 'var(--apple-separator)', 
                backgroundColor: 'var(--apple-glass-bg)',
                backdropFilter: 'blur(20px)'
              }} 
              className="p-4 sm:p-6 border-t"
            >
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setCaption(photo.caption || '');
                      setSelectedCategories(photo.categories?.map(c => c.id) || []);
                    }}
                    style={{ backgroundColor: 'var(--apple-gray-6)', color: 'var(--apple-secondary-label)' }}
                    className="flex-1 px-4 py-3 hover:opacity-80 active:opacity-60 rounded-xl font-semibold transition-all duration-200 min-h-[44px] flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{ backgroundColor: 'var(--apple-blue)', color: 'white', boxShadow: 'var(--apple-shadow)' }}
                    className="flex-1 px-4 py-3 hover:opacity-90 active:opacity-80 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200 min-h-[44px]"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleToggleFavorite}
                    style={{ backgroundColor: 'var(--apple-gray-6)', color: 'var(--apple-secondary-label)' }}
                    className="flex-1 px-4 py-3 hover:opacity-80 active:opacity-60 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 min-h-[44px]"
                  >
                    <Heart className={`w-4 h-4 ${photo.isFavorite ? 'text-red-500 fill-current' : ''}`} />
                    <span className="hidden sm:inline">{photo.isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
                    <span className="sm:hidden">{photo.isFavorite ? 'Favorited' : 'Favorite'}</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', color: 'var(--apple-red)' }}
                    className="px-4 py-3 hover:opacity-80 active:opacity-60 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 min-h-[44px]"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoDetailModal;
