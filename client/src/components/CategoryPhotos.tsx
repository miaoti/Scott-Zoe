import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Tag, Plus, X } from 'lucide-react';
import api from '../utils/api';

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  caption?: string;
  createdAt: string;
  uploader: { name: string };
  categories: Category[];
}

interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  photos: Photo[];
}

function CategoryPhotos() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);

  useEffect(() => {
    if (categoryId) {
      fetchCategoryPhotos();
      fetchAllPhotos();
    }
  }, [categoryId]);

  const fetchCategoryPhotos = async () => {
    try {
      const response = await api.get(`/categories/${categoryId}`);
      setCategory(response.data);
    } catch (error) {
      console.error('Error fetching category photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPhotos = async () => {
    try {
      const response = await api.get('/api/photos');
      setAllPhotos(response.data);
    } catch (error) {
      console.error('Error fetching all photos:', error);
    }
  };

  const handleAddPhotos = async () => {
    try {
      for (const photoId of selectedPhotos) {
        await api.post(`/categories/${categoryId}/photos/${photoId}`);
      }
      await fetchCategoryPhotos();
      setSelectedPhotos([]);
      setShowAddPhotos(false);
    } catch (error: any) {
      console.error('Error adding photos to category:', error);
      alert(error.response?.data?.message || 'Error adding photos to category');
    }
  };

  const handleRemovePhoto = async (photoId: number) => {
    if (!confirm('Remove this photo from the category?')) return;

    try {
      await api.delete(`/categories/${categoryId}/photos/${photoId}`);
      await fetchCategoryPhotos();
    } catch (error) {
      console.error('Error removing photo from category:', error);
      alert('Error removing photo from category');
    }
  };

  const togglePhotoSelection = (photoId: number) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Get photos that are not already in this category
  const availablePhotos = allPhotos.filter(photo => 
    !category?.photos.some(categoryPhoto => categoryPhoto.id === photo.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Category not found</h2>
        <Link
          to="/categories"
          className="text-pink-600 hover:text-pink-700 font-medium"
        >
          Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/categories"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Categories</span>
          </Link>
        </div>
        
        <button
          onClick={() => setShowAddPhotos(true)}
          className="flex items-center space-x-2 romantic-gradient text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Add Photos</span>
        </button>
      </div>

      {/* Category Info */}
      <div className="glass-effect rounded-xl p-6 love-shadow">
        <div className="flex items-center space-x-3 mb-4">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: category.color }}
          ></div>
          <h1 className="text-3xl font-bold text-gray-800">{category.name}</h1>
        </div>
        
        {category.description && (
          <p className="text-gray-600 mb-4">{category.description}</p>
        )}
        
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Tag className="h-4 w-4" />
          <span>{category.photos.length} photos in this category</span>
        </div>
      </div>

      {/* Add Photos Modal */}
      {showAddPhotos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Add Photos to Category</h3>
              <button
                onClick={() => setShowAddPhotos(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availablePhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availablePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                        selectedPhotos.includes(photo.id)
                          ? 'ring-4 ring-pink-500 scale-95'
                          : 'hover:scale-105'
                      }`}
                      onClick={() => togglePhotoSelection(photo.id)}
                    >
                      <div className="aspect-square">
                        <img
                          src={`http://localhost:3001/photos/uploads/${photo.filename}`}
                          alt={photo.originalName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {selectedPhotos.includes(photo.id) && (
                        <div className="absolute inset-0 bg-pink-500 bg-opacity-30 flex items-center justify-center">
                          <div className="bg-pink-500 text-white rounded-full p-1">
                            <Plus className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                        <p className="text-xs truncate">{photo.caption || photo.originalName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">All photos are already in this category!</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center p-6 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                {selectedPhotos.length} photos selected
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddPhotos(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPhotos}
                  disabled={selectedPhotos.length === 0}
                  className="px-4 py-2 romantic-gradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Selected Photos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {category.photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {category.photos.map((photo) => (
            <div key={photo.id} className="group relative">
              <Link to={`/photo/${photo.id}`} className="block">
                <div className="glass-effect rounded-xl overflow-hidden love-shadow group-hover:scale-105 transition-transform">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={`http://localhost:3001/photos/uploads/${photo.filename}`}
                      alt={photo.originalName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 truncate">
                      {photo.caption || photo.originalName}
                    </h3>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>by {photo.uploader.name}</span>
                      <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
              
              <button
                onClick={() => handleRemovePhoto(photo.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove from category"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No photos in this category</h3>
          <p className="text-gray-500 mb-6">
            Add some photos to start building this collection!
          </p>
          <button
            onClick={() => setShowAddPhotos(true)}
            className="inline-flex items-center px-6 py-3 romantic-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add First Photos
          </button>
        </div>
      )}
    </div>
  );
}

export default CategoryPhotos;