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
    let date: Date;
    
    if (Array.isArray(dateInput)) {
      // Handle array format: [year, month, day, hour, minute, second, nanoseconds]
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
      date = new Date(year, month - 1, day, hour, minute, second); // month is 0-indexed in Date constructor
    } else {
      // Handle string format
      date = new Date(dateInput);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden apple-shadow-lg">
        <div className="flex h-full">
          {/* Image Section */}
          <div className="flex-1 bg-black flex items-center justify-center">
            <img
              src={`${API_BASE_URL}/api/photos/image/${photo.filename}`}
              alt={photo.originalName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          {/* Details Section */}
          <div className="w-96 bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-apple-separator">
              <h2 className="text-xl font-semibold text-apple-label">Photo Details</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-apple-gray-6/10 hover:bg-apple-gray-6/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-apple-secondary-label" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-medium text-apple-label mb-3">Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-apple-secondary-label" />
                    <span className="text-apple-secondary-label">
                      {formatDate(photo.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-apple-secondary-label" />
                    <span className="text-apple-secondary-label">
                      Uploaded by {photo.uploader.name}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-apple-label">Caption</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-purple-500 hover:text-purple-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                
                {isEditing ? (
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full p-3 border border-apple-separator rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                    rows={3}
                  />
                ) : (
                  <div className="max-h-24 overflow-y-auto">
                    <p className="text-apple-secondary-label text-sm p-3 bg-apple-gray-6/5 rounded-xl break-words">
                      {caption || 'No caption added yet'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-apple-label">Categories</h3>
                  <Tag className="w-4 h-4 text-apple-secondary-label" />
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {availableCategories
                    .filter(category => category.name.toLowerCase() !== 'favorites')
                    .map(category => (
                    <label
                      key={category.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-apple-gray-6/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-apple-label truncate">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-apple-separator bg-apple-gray-6/5">
              {isEditing ? (
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setCaption(photo.caption || '');
                      setSelectedCategories(photo.categories?.map(c => c.id) || []);
                    }}
                    className="flex-1 px-4 py-3 bg-apple-gray-6/10 hover:bg-apple-gray-6/20 text-apple-label rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleToggleFavorite}
                    className="flex-1 px-4 py-3 bg-apple-gray-6/10 hover:bg-apple-gray-6/20 text-apple-label rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${photo.isFavorite ? 'text-red-500 fill-current' : ''}`} />
                    {photo.isFavorite ? 'Favorited' : 'Add to Favorites'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoDetailModal;
