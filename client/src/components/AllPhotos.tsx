import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart, Settings, Plus, Trash2, Check, Tag } from 'lucide-react';
import api, { API_BASE_URL } from '../utils/api';
import PhotoDetailModal from './PhotoDetailModal';
import PhotoUpload from './PhotoUpload';

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  caption?: string;
  isFavorite?: boolean;
  createdAt: string;
  uploader: { name: string; };
  categories: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  noteCount: number;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

type ImageSize = 'small' | 'medium' | 'large';

function AllPhotos() {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');
  const isFavoritesView = filter === 'favorites';
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [page, isFavoritesView]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const endpoint = isFavoritesView 
        ? `/api/photos/favorites?page=${page}&limit=20`
        : `/api/photos?page=${page}&limit=20`;
      const response = await api.get(endpoint);
      
      if (isFavoritesView) {
        // Check if response has pagination structure (new format) or is array (legacy)
        if (response.data.photos) {
          // New paginated format
          setPhotos(response.data.photos);
          setTotalPages(response.data.pagination.totalPages);
          setTotalPhotos(response.data.pagination.total);
        } else {
          // Legacy format - array directly
          setPhotos(response.data);
          setTotalPhotos(response.data.length);
          setTotalPages(1);
        }
      } else {
        setPhotos(response.data.photos);
        setTotalPages(response.data.pagination.totalPages);
        setTotalPhotos(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
      await fetchPhotos();
    } catch (error) {
      console.error('Error deleting photos:', error);
      alert('Error deleting photos. Please try again.');
    }
  };

  const handleAssignCategories = async (categoryIds: number[]) => {
    if (selectedPhotos.size === 0) return;

    try {
      await api.put('/api/photos/bulk/categories', {
        photoIds: Array.from(selectedPhotos),
        categoryIds: categoryIds
      });
      
      setSelectedPhotos(new Set());
      setSelectionMode(false);
      setShowCategoryModal(false);
      await fetchPhotos();
    } catch (error) {
      console.error('Error assigning categories:', error);
      alert('Error assigning categories. Please try again.');
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

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    fetchPhotos();
  };

  const getGridCols = () => {
    switch (imageSize) {
      case 'small': return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10';
      case 'medium': return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7';
      case 'large': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
      default: return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7';
    }
  };

  const getImageSizeClass = () => {
    switch (imageSize) {
      case 'small': return 'aspect-square w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32';
      case 'medium': return 'aspect-square w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48';
      case 'large': return 'aspect-square w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 lg:w-64 lg:h-64';
      default: return 'aspect-square w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48';
    }
  };

  if (loading && page === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link 
            to="/gallery" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-apple-label">{isFavoritesView ? 'Favorites' : 'All Photos'}</h1>
            <p className="text-apple-secondary-label">{totalPhotos} photos</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!selectionMode ? (
            <>
              <button
                onClick={() => setSelectionMode(true)}
                className="bg-apple-gray-6 hover:bg-apple-gray-5 text-apple-label px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium border border-apple-separator"
              >
                <Check className="w-5 h-5" />
                <span>Select</span>
              </button>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-apple-gray-6 hover:bg-apple-gray-5 text-apple-label px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium border border-apple-separator"
              >
                <Plus className="w-5 h-5" />
                <span>Add Photos</span>
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-apple-secondary-label">
                {selectedPhotos.size} selected
              </span>
              
              {selectedPhotos.size > 0 && (
                <>
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                  
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Tag className="w-4 h-4" />
                    <span>Assign Categories</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedPhotos(new Set());
                }}
                className="bg-apple-gray-6 hover:bg-apple-gray-5 text-apple-label px-4 py-2 rounded-lg transition-colors border border-apple-separator"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4 text-gray-600" />
          <select
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value as ImageSize)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <div className={`grid ${getGridCols()} gap-2 sm:gap-3 md:gap-4 px-2 sm:px-0`}>
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div 
                className={`${getImageSizeClass()} relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg shadow-sm bg-white`}
                onClick={() => selectionMode ? togglePhotoSelection(photo.id) : openPhotoDetail(photo)}
              >
                <img
                  src={`${API_BASE_URL}/api/photos/image/${photo.filename}`}
                  alt={photo.originalName}
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                />
                
                {/* Selection checkbox */}
                {selectionMode && (
                  <div className="absolute top-2 left-2 p-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-sm">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      selectedPhotos.has(photo.id) 
                        ? 'bg-blue-500 border-blue-500 scale-110' 
                        : 'border-gray-300 bg-white hover:border-blue-400'
                    }`}>
                      {selectedPhotos.has(photo.id) && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  </div>
                )}
                
                {/* Favorite button - hidden on mobile, visible on desktop */}
                {!selectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(photo.id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 hidden md:block"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors duration-200 ${photo.isFavorite ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-400'}`}
                    />
                  </button>
                )}
              </div>
               

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <div className="text-gray-300 mb-6">
            <Plus className="w-20 h-20 mx-auto mb-6 stroke-1" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">No photos yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            Start building your gallery by uploading your first photos!
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Photo
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-apple-gray-6 hover:bg-apple-gray-5 disabled:opacity-50 disabled:cursor-not-allowed text-apple-label rounded-lg transition-colors border border-apple-separator"
          >
            Previous
          </button>
          
          <span className="text-apple-secondary-label">
            Page {page + 1} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-apple-gray-6 hover:bg-apple-gray-5 disabled:opacity-50 disabled:cursor-not-allowed text-apple-label rounded-lg transition-colors border border-apple-separator"
          >
            Next
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

      {/* Category Assignment Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Assign Categories</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select categories to assign to {selectedPhotos.size} photo(s):
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                   <input
                     type="checkbox"
                     className="rounded"
                     value={category.id}
                   />
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm">{category.name}</span>
                </label>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const checkedInputs = document.querySelectorAll('input[type="checkbox"]:checked');
                  const categoryIds = Array.from(checkedInputs).map((input: any) => parseInt(input.value));
                  handleAssignCategories(categoryIds);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllPhotos;