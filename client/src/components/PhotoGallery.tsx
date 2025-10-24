import { useState, useEffect } from 'react';
import { Plus, Upload, Heart, Settings, Camera, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../utils/api';
import PhotoDetailModal from './PhotoDetailModal';
import PhotoUpload from './PhotoUpload';
import CategoryGrid from './CategoryGrid';
import { Photo, Category } from '../types';

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
  const [totalPhotos, setTotalPhotos] = useState(0);

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
      setLoading(true);
      const response = await api.get('/api/photos/all');
      setPhotos(response.data);
      setTotalPhotos(response.data.length);
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
      case 'small': return 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32';
      case 'medium': return 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48';
      case 'large': return 'w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 lg:w-64 lg:h-64';
      default: return 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48';
    }
  };

  const getGridCols = () => {
    switch (imageSize) {
      case 'small': return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10';
      case 'medium': return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7';
      case 'large': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
      default: return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7';
    }
  };

  const renderPhotoGrid = (photosToRender: Photo[], showAll = false) => {
    // Calculate how many photos to show based on grid size and available photos
    const getPreviewCount = () => {
      if (showAll) return photosToRender.length;
      
      // Show only one row of photos based on image size and screen size
      switch (imageSize) {
        case 'small': return Math.min(8, photosToRender.length); // One row for small size (8 photos on xl screens)
        case 'medium': return Math.min(6, photosToRender.length); // One row for medium size (6 photos on xl screens)  
        case 'large': return Math.min(5, photosToRender.length);  // One row for large size (5 photos on xl screens)
        default: return Math.min(6, photosToRender.length);
      }
    };
    
    const displayPhotos = photosToRender.slice(0, getPreviewCount());
    
    return (
      <div className={`grid ${getGridCols()} gap-4`}>
        {displayPhotos.map((photo) => (
          <div key={photo.id} className="relative group">
            <div 
              className={`${getImageSizeClass()} relative overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-105`}
              onClick={() => openPhotoDetail(photo)}
            >
              <img
                src={`${API_BASE_URL}/api/photos/image/${photo.filename}?size=thumbnail`}
                alt={photo.originalName}
                className="w-full h-full object-cover"
                loading="lazy"
                onClick={() => openModal(photo)}
              />
              
              {/* Favorite button - hidden on mobile, visible on desktop */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(photo.id);
                }}
                style={{
                  background: 'var(--apple-glass-bg)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: 'var(--apple-shadow)'
                }}
                className="absolute top-3 left-3 p-2 rounded-full hover:bg-white active:scale-95 transition-all duration-200 opacity-0 group-hover:opacity-100 hidden md:block"
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-200 ${photo.isFavorite ? 'text-red-500 fill-current scale-110' : 'text-gray-600 hover:text-red-400'}`}
                />
              </button>
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
          <h1 style={{ color: 'var(--apple-label)' }} className="text-3xl font-bold mb-2">Photo Gallery</h1>
          <p style={{ color: 'var(--apple-secondary-label)' }}>Your beautiful memories organized by categories</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
          <Link
            to="/recycle-bin"
            style={{
              background: 'var(--apple-glass-bg)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: 'var(--apple-label)',
              border: '1px solid var(--apple-separator)',
              boxShadow: 'var(--apple-shadow)'
            }}
            className="group hover:bg-white/90 active:bg-gray-50 px-4 py-3 sm:px-5 sm:py-2.5 rounded-2xl sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 sm:gap-2 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
          >
            <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-gray-700 transition-colors" />
            <span className="hidden sm:inline">Recycle Bin</span>
            <span className="sm:hidden">Recycle</span>
          </Link>
          <Link
            to="/categories"
            style={{
              background: 'var(--apple-glass-bg)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: 'var(--apple-label)',
              border: '1px solid var(--apple-separator)',
              boxShadow: 'var(--apple-shadow)'
            }}
            className="group hover:bg-white/90 active:bg-gray-50 px-4 py-3 sm:px-5 sm:py-2.5 rounded-2xl sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 sm:gap-2 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
          >
            <Settings className="w-4 h-4 text-gray-600 group-hover:text-gray-700 transition-colors" />
            <span className="hidden sm:inline">Manage Categories</span>
            <span className="sm:hidden">Categories</span>
          </Link>
          <button
            onClick={() => setShowUploadModal(true)}
            className="group bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 py-3 sm:px-5 sm:py-2.5 rounded-2xl sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 sm:gap-2 shadow-sm hover:shadow-md font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Add Photos</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        {/* Size selector */}
        <div className="flex items-center gap-3">
          <Settings className="h-4 w-4 text-gray-500" />
          <select
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value as ImageSize)}
            style={{
              background: 'var(--apple-glass-bg)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: 'var(--apple-label)',
              border: '1px solid var(--apple-separator)',
              boxShadow: 'var(--apple-shadow)'
            }}
            className="px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 font-medium"
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
            View All ({totalPhotos})
          </Link>
        </div>
        
        {photos.length > 0 ? (
          <div>
            {renderPhotoGrid(photos, false)}
            

          </div>
        ) : (
          <div style={{
            background: 'var(--apple-gray-6)',
            border: '2px dashed var(--apple-separator)',
            color: 'var(--apple-secondary-label)'
          }} className="rounded-xl p-12 text-center">
            <Camera className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--apple-tertiary-label)' }} />
            <h3 style={{ color: 'var(--apple-secondary-label)' }} className="text-lg font-semibold mb-2">No photos yet</h3>
            <p style={{ color: 'var(--apple-tertiary-label)' }}>Start uploading to create your gallery!</p>
          </div>
        )}
      </div>

      {/* Categories Grid - Apple Photos Style */}
      <div className="mb-8">
        <h2 style={{ color: 'var(--apple-label)' }} className="text-2xl font-bold mb-6">Categories</h2>
        <CategoryGrid 
          categories={categories.map(category => ({
            ...category,
            photos: category.id === -1 
              ? photos.filter(photo => photo.isFavorite)
              : photos.filter(photo => photo.categories.some(cat => cat.id === category.id)),
            photoCount: category.id === -1 
              ? photos.filter(photo => photo.isFavorite).length
              : photos.filter(photo => photo.categories.some(cat => cat.id === category.id)).length
          }))}
          loading={loading}
          onCategoryClick={(category) => {
            if (category.id === -1) {
              window.location.href = '/photos?filter=favorites';
            } else {
              window.location.href = `/category/${category.id}`;
            }
          }}
        />
      </div>

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <Upload className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--apple-tertiary-label)' }} />
          <h3 style={{ color: 'var(--apple-secondary-label)' }} className="text-xl font-semibold mb-2">No photos yet</h3>
          <p style={{ color: 'var(--apple-tertiary-label)' }} className="mb-6">
            Start building your gallery by uploading your first photos!
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="group inline-flex items-center px-8 py-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-2xl transition-all duration-200 font-medium shadow-sm hover:shadow-md gap-3"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
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