import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { useToast } from "../contexts/ToastContext";

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  caption?: string;
  size: number;
  mimeType: string;
  createdAt: string;
  deletedAt: string;
  uploader: {
    id: number;
    name: string;
  };
  categories: Array<{
    id: number;
    name: string;
    color: string;
  }>;
}

interface RecycleBinResponse {
  photos: Photo[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function RecycleBin() {
  const { showToast } = useToast();
  const [deletedPhotos, setDeletedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchDeletedPhotos();
  }, [currentPage]);

  const fetchDeletedPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/photos/recycle-bin?page=${currentPage}&size=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data: RecycleBinResponse = await response.json();
        setDeletedPhotos(data.photos);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } else {
          showToast('Failed to fetch deleted photos', 'general');
        }
      } catch (error) {
        console.error('Error fetching deleted photos:', error);
        showToast('Error loading recycle bin', 'general');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPhoto = (photoId: number) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPhotos.size === deletedPhotos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(deletedPhotos.map(photo => photo.id)));
    }
  };

  const handleRecoverPhoto = async (photoId: number) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/recover`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
          showToast('Photo recovered successfully', 'general');
          fetchDeletedPhotos();
          setSelectedPhotos(prev => {
            const newSet = new Set(prev);
            newSet.delete(photoId);
            return newSet;
          });
        } else {
          showToast('Failed to recover photo', 'general');
        }
      } catch (error) {
        console.error('Error recovering photo:', error);
        showToast('Error recovering photo', 'general');
    }
  };

  const handlePermanentDelete = async (photoId: number) => {
    if (!confirm('Are you sure you want to permanently delete this photo? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/photos/${photoId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
          showToast('Photo permanently deleted', 'general');
          fetchDeletedPhotos();
          setSelectedPhotos(prev => {
            const newSet = new Set(prev);
            newSet.delete(photoId);
            return newSet;
          });
        } else {
          showToast('Failed to delete photo', 'general');
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
        showToast('Error deleting photo', 'general');
    }
  };

  const handleBulkRecover = async () => {
      if (selectedPhotos.size === 0) {
        showToast('Please select photos to recover', 'general');
        return;
      }

    try {
      const response = await fetch('/api/photos/bulk/recover', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          photoIds: Array.from(selectedPhotos)
        }),
      });

      if (response.ok) {
          const data = await response.json();
          showToast(data.message, 'general');
          fetchDeletedPhotos();
          setSelectedPhotos(new Set());
        } else {
          showToast('Failed to recover photos', 'general');
        }
      } catch (error) {
        console.error('Error recovering photos:', error);
        showToast('Error recovering photos', 'general');
    }
  };

  const handleBulkPermanentDelete = async () => {
      if (selectedPhotos.size === 0) {
        showToast('Please select photos to delete', 'general');
        return;
      }

    if (!confirm(`Are you sure you want to permanently delete ${selectedPhotos.size} photo(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/photos/bulk/permanent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          photoIds: Array.from(selectedPhotos)
        }),
      });

      if (response.ok) {
          const data = await response.json();
          showToast(data.message, 'general');
          fetchDeletedPhotos();
          setSelectedPhotos(new Set());
        } else {
          showToast('Failed to delete photos', 'general');
        }
      } catch (error) {
        console.error('Error deleting photos:', error);
        showToast('Error deleting photos', 'general');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Recycle Bin</h1>
        <p className="text-gray-600">
          {totalElements} deleted photo{totalElements !== 1 ? 's' : ''} • Photos will be permanently deleted after 7 days
        </p>
      </div>

      {deletedPhotos.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Recycle bin is empty</h3>
          <p className="text-gray-500">Deleted photos will appear here</p>
        </div>
      ) : (
        <>
          {/* Bulk Actions */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {selectedPhotos.size === deletedPhotos.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Select All
            </button>
            
            {selectedPhotos.size > 0 && (
              <>
                <button
                  onClick={handleBulkRecover}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  Recover Selected ({selectedPhotos.size})
                </button>
                
                <button
                  onClick={handleBulkPermanentDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Permanently Delete ({selectedPhotos.size})
                </button>
              </>
            )}
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {deletedPhotos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden border">
                <div className="relative">
                  <img
                    src={`/api/photos/image/${photo.filename}`}
                    alt={photo.originalName}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <button
                      onClick={() => handleSelectPhoto(photo.id)}
                      className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100"
                    >
                      {selectedPhotos.has(photo.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1 truncate">
                    {photo.originalName}
                  </h3>
                  {photo.caption && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {photo.caption}
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-500 mb-3">
                    <p>Deleted: {formatDate(photo.deletedAt)}</p>
                    <p>Size: {formatFileSize(photo.size)}</p>
                    <p>By: {photo.uploader.name}</p>
                  </div>
                  
                  {photo.categories.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {photo.categories.map((category) => (
                          <span
                            key={category.id}
                            className="inline-block px-2 py-1 text-xs rounded-full text-white"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRecoverPhoto(photo.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Recover
                    </button>
                    
                    <button
                      onClick={() => handlePermanentDelete(photo.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RecycleBin;