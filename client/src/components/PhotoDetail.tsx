import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Tag, Calendar, User, Plus, X, Edit2 } from 'lucide-react';
import api, { API_BASE_URL } from '../utils/api';

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
  color: string;
}

interface Note {
  id: number;
  content: string;
  createdAt: string;
  author: { name: string };
}

function PhotoDetail() {
  const { id } = useParams<{ id: string }>();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  useEffect(() => {
    if (id) {
      fetchPhoto();
      fetchNotes();
      fetchCategories();
    }
  }, [id]);

  const fetchPhoto = async () => {
    try {
      const response = await api.get(`/api/photos/${id}`);
      setPhoto(response.data);
      setSelectedCategories(response.data.categories.map((cat: Category) => cat.id));
    } catch (error) {
      console.error('Error fetching photo:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await api.get(`/api/photos/${id}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
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

  const toggleFavorite = async () => {
    try {
      await api.post(`/api/photos/${id}/favorite`);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      await api.post(`/api/photos/${id}/notes`, {
        content: newNote.trim()
      });
      setNewNote('');
      await fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note. Please try again.');
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpdateCategories = async () => {
    try {
      await api.put(`/api/photos/${id}/categories`, {
        categoryIds: selectedCategories
      });
      setShowCategoryModal(false);
      await fetchPhoto();
    } catch (error) {
      console.error('Error updating categories:', error);
      alert('Error updating categories. Please try again.');
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Photo not found</h2>
        <Link
          to="/gallery"
          className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/gallery"
          className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Gallery
        </Link>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFavorite}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Heart
              className={`h-5 w-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`}
            />
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Tag className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Photo */}
        <div className="glass-effect rounded-xl overflow-hidden love-shadow">
          <img
            src={`${API_BASE_URL}/api/photos/image/${photo.filename}`}
            alt={photo.originalName}
            className="w-full h-auto max-h-96 object-contain bg-gray-50"
          />
        </div>

        {/* Photo Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="glass-effect rounded-xl p-6 love-shadow">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{photo.originalName}</h1>
            
            {photo.caption && (
              <p className="text-gray-600 mb-4">{photo.caption}</p>
            )}
            
            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>Uploaded by {photo.uploader.name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="glass-effect rounded-xl p-6 love-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Categories</h3>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
            
            {photo.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {photo.categories.map(category => (
                  <span
                    key={category.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No categories assigned</p>
            )}
          </div>

          {/* Notes */}
          <div className="glass-effect rounded-xl p-6 love-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Notes</h3>
              <MessageCircle className="h-5 w-5 text-gray-500" />
            </div>
            
            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="mb-6">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingNote ? '...' : <Plus className="h-4 w-4" />}
                </button>
              </div>
            </form>
            
            {/* Notes List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notes.length > 0 ? (
                notes.map(note => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-800 mb-2">{note.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>By {note.author.name}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No notes yet. Be the first to add one!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Manage Categories</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
              {categories.map(category => (
                <label
                  key={category.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="rounded border-gray-300 text-gray-600 focus:ring-gray-400"
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-gray-800">{category.name}</span>
                </label>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCategories}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoDetail;