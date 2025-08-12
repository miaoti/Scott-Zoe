import { useState, useEffect } from 'react';
import { Plus, Upload, Heart, Settings, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import PhotoDetailModal from './PhotoDetailModal';
import PhotoUpload from './PhotoUpload';

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
  photos?: Photo[];
  photoCount?: number;
}

type ImageSize = 'small' | 'medium' | 'large';

function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  // const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (photos.length >= 0) {
      fetchCategories();
    }
  }, [photos]);

  const fetchPhotos = async () => {
    try {
      const response = await api.get('/api/photos?page=0&limit=100');
      const photosData = response.data.photos || response.data;
      setPhotos(photosData);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      const categoriesData = response.data;
      
      // Add favorites category if it doesn't exist
      const favoritesCategory = {
        id: -1,
        name: 'Favorites',
        color: '#ef4444',
        photos: photos.filter(photo => photo.isFavorite),
        photoCount: photos.filter(photo => photo.isFavorite).length
      };
      

      setCategories([favoritesCategory, ...categoriesData]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleUploadComplete = async () => {
    setShowUploadModal(false);
    await fetchPhotos();
    await fetchCategories();
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
      
      await fetchCategories();
    } catch (error) {
      console.error('Error toggling favorite:', error);
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

  const renderPhotoGrid = (photosToRender: Photo[], showAll = false) => {
    const displayPhotos = showAll ? photosToRender : photosToRender.slice(0, 5);
    
    return (
      <div className={`grid ${getGridCols()} gap-4`}>
        {displayPhotos.map((photo) => (
          <div key={photo.id} className="relative group">
            <div 
              className={`${getImageSizeClass()} relative overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-105`}
              onClick={() => openPhotoDetail(photo)}
            >
              <img
                src={`/api/photos/image/${photo.filename}`}
                alt={photo.originalName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Favorite button */}
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
            </div>
            
            {/* Photo info */}
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-800 truncate">{photo.originalName}</p>
              {photo.caption && (
                <p className="text-xs text-gray-600 truncate">{photo.caption}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
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
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Photo Gallery</h1>
          <p className="text-gray-600">Your beautiful memories organized by categories</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link
            to="/categories"
            className="bg-apple-gray-6 hover:bg-apple-gray-5 text-apple-label px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium border border-apple-separator"
          >
            <Settings className="w-5 h-5" />
            <span>Manage Categories</span>
          </Link>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-apple-gray-6 hover:bg-apple-gray-5 text-apple-label px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium border border-apple-separator"
          >
            <Plus className="w-5 h-5" />
            <span>Add Photos</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        {/* Size selector */}
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4 text-gray-600" />
          <select
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value as ImageSize)}
            className="px-3 py-1 border border-apple-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue bg-white"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      {/* All Photos */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-apple-label">All Photos</h2>
          <Link
            to="/photos"
            className="text-apple-blue hover:text-apple-blue-dark font-medium transition-colors"
          >
            View All ({photos.length})
          </Link>
        </div>
        
        {photos.length > 0 ? (
          <div>
            {renderPhotoGrid(photos.slice(0, 5))}
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No photos yet</h3>
            <p className="text-gray-500">Start uploading to create your gallery!</p>
          </div>
        )}
      </div>

      {/* Categories Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => {
            const categoryPhotos = category.id === -1 
              ? photos.filter(photo => photo.isFavorite)
              : photos.filter(photo => photo.categories.some(cat => cat.id === category.id));
            
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-apple-separator">
                {/* Category Header */}
                <div className="p-4 border-b border-apple-separator">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                    </div>
                    <span className="text-sm text-gray-500">({categoryPhotos.length})</span>
                  </div>
                </div>
                
                {/* Photo Preview Grid */}
                <div className="p-4">
                  {categoryPhotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {categoryPhotos.slice(0, 3).map((photo) => (
                        <div key={photo.id} className="aspect-square relative overflow-hidden rounded-lg">
                          <img
                            src={`/api/photos/image/${photo.filename}`}
                            alt={photo.originalName}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                            onClick={() => openPhotoDetail(photo)}
                          />
                        </div>
                      ))}
                      {categoryPhotos.length > 3 && (
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm text-gray-500 font-medium">+{categoryPhotos.length - 3}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
                      <p className="text-gray-400 text-sm">No photos yet</p>
                    </div>
                  )}
                  
                  {/* View All Button */}
                  {category.id === -1 ? (
                    <Link
                      to="/photos?filter=favorites"
                      className="block w-full text-center bg-apple-gray-6 hover:bg-apple-gray-5 text-apple-label py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium border border-apple-separator"
                    >
                      View All Favorites
                    </Link>
                  ) : (
                    <Link
                      to={`/category/${category.id}`}
                      className="block w-full text-center bg-apple-gray-6 hover:bg-apple-gray-5 text-apple-label py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium border border-apple-separator"
                    >
                      View All Photos
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No photos yet</h3>
          <p className="text-gray-500 mb-6">
            Start building your gallery by uploading your first photos!
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Photo
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <PhotoUpload
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
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

export default PhotoGallery;