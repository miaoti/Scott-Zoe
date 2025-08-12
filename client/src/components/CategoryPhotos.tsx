import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Settings, Trash2, Check, Heart } from 'lucide-react';
import api from '../utils/api';
import PhotoDetailModal from './PhotoDetailModal';

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  caption?: string;
  createdAt: string;
  uploader: { name: string };
  categories: Category[];
  noteCount: number;
  isFavorite?: boolean;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

type ImageSize = 'small' | 'medium' | 'large';

function CategoryPhotos() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);

  useEffect(() => {
    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCategoryPhotos(),
        fetchCategoryInfo()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryPhotos = async () => {
    try {
      if (categoryId === '-1') {
        // Fetch favorite photos
        const response = await api.get('/api/photos/favorites');
        setPhotos(response.data);
      } else {
        // Fetch photos by category
        const response = await api.get(`/api/categories/${categoryId}/photos`);
        setPhotos(response.data);
      }
    } catch (error) {
      console.error('Error fetching category photos:', error);
      setPhotos([]);
    }
  };

  const fetchCategoryInfo = async () => {
    try {
      if (categoryId === '-1') {
        setCategory({
          id: -1,
          name: 'Favorites',
          color: '#ef4444'
        });
      } else {
        const response = await api.get(`/api/categories/${categoryId}`);
        setCategory(response.data);
      }
    } catch (error) {
      console.error('Error fetching category info:', error);
      setCategory(null);
    }
  };

  const toggleFavorite = async (photoId: number) => {
    try {
      const photo = photos.find(p => p.id === photoId);
      const newFavoriteStatus = !photo?.isFavorite;
      
      await api.post(`/api/photos/${photoId}/favorite`, {
        favorite: newFavoriteStatus
      });
      
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, isFavorite: newFavoriteStatus } : p
      ));
      
      // If we're viewing favorites and photo is unfavorited, remove it
      if (categoryId === '-1' && !newFavoriteStatus) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const togglePhotoSelection = (photoId: number) => {
    setSelectedPhotos(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(photoId)) {
        newSelection.delete(photoId);
      } else {
        newSelection.add(photoId);
      }
      return newSelection;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotos.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedPhotos.size} photo(s)?`)) {
      return;
    }

    try {
      await api.delete('/api/photos/bulk', {
        data: { photoIds: Array.from(selectedPhotos) }
      });
      
      setSelectedPhotos(new Set());
      setSelectionMode(false);
      await fetchCategoryPhotos();
    } catch (error) {
      console.error('Error deleting photos:', error);
      alert('Error deleting photos. Please try again.');
    }
  };

  const openPhotoDetail = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowPhotoDetail(true);
  };

  const handlePhotoUpdate = (updatedPhoto: Photo) => {
    setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
    setSelectedPhoto(updatedPhoto);
  };

  const handlePhotoDelete = (photoId: number) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setShowPhotoDetail(false);
    setSelectedPhoto(null);
  };

  const getImageSizeClass = () => {
    switch (imageSize) {
      case 'small': return 'w-32 h-32';
      case 'medium': return 'w-48 h-48';
      case 'large': return 'w-64 h-64';
      default: return 'w-48 h-48';
    }
  };

  const getGridCols = () => {
    switch (imageSize) {
      case 'small': return 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8';
      case 'medium': return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 'large': return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link 
            to="/photos" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center space-x-3">
            {category && (
              <div 
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: category.color }}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {category?.name || 'Category'}
              </h1>
              <p className="text-gray-600">{photos.length} photos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Size selector */}
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-gray-600" />
            <select
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value as ImageSize)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          
          {/* Selection mode toggle */}
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              setSelectedPhotos(new Set());
            }}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              selectionMode 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {selectionMode ? 'Cancel Selection' : 'Select Photos'}
          </button>
        </div>
        
        {/* Delete selected button */}
        {selectionMode && selectedPhotos.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected ({selectedPhotos.size})</span>
          </button>
        )}
      </div>

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <div className={`grid ${getGridCols()} gap-4`}>
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div 
                className={`${getImageSizeClass()} relative overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-105 ${
                  selectionMode && selectedPhotos.has(photo.id) ? 'ring-4 ring-blue-500' : ''
                }`}
                onClick={() => selectionMode ? togglePhotoSelection(photo.id) : openPhotoDetail(photo)}
              >
                <img
                  src={`/api/photos/image/${photo.filename}`}
                  alt={photo.originalName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Selection overlay */}
                {selectionMode && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    {selectedPhotos.has(photo.id) && (
                      <div className="bg-blue-500 text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Favorite button */}
                {!selectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(photo.id);
                    }}
                    className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Heart
                      className={`h-4 w-4 ${photo.isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                    />
                  </button>
                )}
              </div>
              
              {/* Photo info - only show caption if available */}
              {photo.caption && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {category && (
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: category.color }}
              >
                {category.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No photos in this category</h3>
          <p className="text-gray-500">
            Photos assigned to this category will appear here.
          </p>
        </div>
      )}

      {/* Photo Detail Modal */}
      {showPhotoDetail && selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          onClose={() => {
            setShowPhotoDetail(false);
            setSelectedPhoto(null);
          }}
          onPhotoUpdate={handlePhotoUpdate}
          onPhotoDelete={handlePhotoDelete}
        />
      )}
    </div>
  );
}

export default CategoryPhotos;