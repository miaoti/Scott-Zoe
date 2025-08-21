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

  console.log('PhotoDetailModal rendered with photo:', photo);

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

      console.log('Saving photo with categories:', selectedCategories);
      console.log('Available categories:', availableCategories);

      // Update caption if it changed
      if (caption !== photo.caption) {
        try {
          await api.put(`/api/photos/${photo.id}/caption`, {
            caption: caption
          });
          console.log('Caption updated successfully');
        } catch (error) {
          console.error('Error updating caption:', error);
        }
      }

      // Update categories (this already works)
      try {
        await api.put(`/api/photos/${photo.id}/categories`, {
          categoryIds: selectedCategories
        });
        console.log('Categories updated successfully');
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

      console.log('Calling onPhotoUpdate with:', updatedPhoto);
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
    console.log('Toggling category:', categoryId, 'Current selected:', selectedCategories);

    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    console.log('New selected categories:', newCategories);
    setSelectedCategories(newCategories);

    // Auto-save the category changes to backend
    try {
      console.log('Saving categories to backend:', newCategories);

      const response = await api.put(`/api/photos/${photo.id}/categories`, {
        categoryIds: newCategories
      });

      console.log('Backend response:', response.data);

      // Update the photo with the response from backend
      onPhotoUpdate(response.data);
      console.log('Categories saved successfully');
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
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-6xl w-full h-full sm:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col sm:flex-row">
        {/* Mobile Header - Only visible on mobile */}
        <div className="sm:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Photo Details</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-all duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
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
        <div className="w-full sm:w-96 bg-white flex flex-col order-2 sm:order-none max-h-[40vh] sm:max-h-none">
            {/* Desktop Header - Hidden on mobile */}
            <div className="hidden sm:flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Photo Details</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-all duration-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      {formatDate(photo.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      Uploaded by {photo.uploader.name}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Caption</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600 transition-all duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                
                {isEditing ? (
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-white shadow-sm text-gray-900 placeholder-gray-500"
                    rows={3}
                  />
                ) : (
                  <div className="max-h-24 overflow-y-auto">
                    <p className="text-gray-700 text-sm p-4 bg-gray-50 rounded-xl break-words">
                      {caption || 'No caption added yet'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Categories</h3>
                  <Tag className="w-4 h-4 text-gray-500" />
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {availableCategories
                    .filter(category => category.name.toLowerCase() !== 'favorites')
                    .map(category => (
                    <label
                      key={category.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="w-4 h-4 text-blue-500 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
                      />
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-700 truncate font-medium">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setCaption(photo.caption || '');
                      setSelectedCategories(photo.categories?.map(c => c.id) || []);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all duration-200 min-h-[44px] flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200 min-h-[44px] shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleToggleFavorite}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 min-h-[44px]"
                  >
                    <Heart className={`w-4 h-4 ${photo.isFavorite ? 'text-red-500 fill-current' : ''}`} />
                    <span className="hidden sm:inline">{photo.isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
                    <span className="sm:hidden">{photo.isFavorite ? 'Favorited' : 'Favorite'}</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 min-h-[44px]"
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
