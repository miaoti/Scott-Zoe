import { useState, useEffect } from 'react';
import { Plus, Upload, X, Heart, Search, Grid, List } from 'lucide-react';
import api from '../utils/api';

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  caption?: string;
  createdAt: string;
  uploader: { name: string };
  categories: Category[];
  noteCount: number;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPhotos();
    fetchCategories();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await api.get('/api/photos?page=1&limit=50');
      // Handle both old and new API response formats
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
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('photos', selectedFiles[i]);
    }

    try {
      await api.post('/api/photos/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setShowUploadModal(false);
      setSelectedFiles(null);
      await fetchPhotos();
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Error uploading photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleFavorite = async (photoId: number) => {
    try {
      await api.post(`/api/photos/${photoId}/favorite`);
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(photoId)) {
          newFavorites.delete(photoId);
        } else {
          newFavorites.add(photoId);
        }
        return newFavorites;
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = selectedCategory === 'all' || 
      photo.categories.some(cat => cat.id.toString() === selectedCategory);
    const matchesSearch = photo.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (photo.caption && photo.caption.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
          <p className="text-gray-600">Your beautiful memories captured in time</p>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors duration-200 border border-gray-300 hover:border-gray-400"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Add Photos
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search photos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id.toString()}>
                {category.name}
              </option>
            ))}
          </select>
          
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'} transition-colors`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'} transition-colors`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Upload Photos</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />
              </div>
              
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="text-sm text-gray-600">
                  {selectedFiles.length} file(s) selected
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos Grid/List */}
      {filteredPhotos.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className={viewMode === 'grid'
                ? "glass-effect rounded-xl overflow-hidden love-shadow hover:scale-105 transition-transform group"
                : "glass-effect rounded-xl p-4 love-shadow flex items-center space-x-4"
              }
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="relative">
                    <img
                      src={`/api/photos/image/${photo.filename}`}
                      alt={photo.originalName}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <button
                      onClick={() => toggleFavorite(photo.id)}
                      className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      <Heart
                        className={`h-4 w-4 ${favorites.has(photo.id) ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                      />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 truncate">{photo.originalName}</h3>
                    {photo.caption && (
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{photo.caption}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>By {photo.uploader.name}</span>
                      <span>{photo.noteCount} notes</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={`/api/photos/image/${photo.filename}`}
                    alt={photo.originalName}
                    className="w-16 h-16 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{photo.originalName}</h3>
                    {photo.caption && (
                      <p className="text-gray-600 text-sm mt-1">{photo.caption}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>By {photo.uploader.name}</span>
                      <span>{photo.noteCount} notes</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(photo.id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Heart
                      className={`h-4 w-4 ${favorites.has(photo.id) ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                    />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No photos yet</h3>
          <p className="text-gray-500 mb-6">
            Start building your gallery by uploading your first photos!
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Photo
          </button>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;