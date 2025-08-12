import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Plus, Edit2, Trash2, Eye, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import CategoryManager from './CategoryManager';

interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  photoCount: number;
}

function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? This will not delete the photos, only remove them from this category.')) {
      return;
    }

    try {
      await api.delete(`/api/categories/${categoryId}`);
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const handleCategoryUpdated = () => {
    fetchCategories();
    setShowManager(false);
    setEditingCategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowManager(true);
  };

  const handleCreateNew = () => {
    setEditingCategory(null);
    setShowManager(true);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/gallery"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Photo Categories</h1>
            <p className="text-gray-600">Organize your memories by themes and moments</p>
          </div>
        </div>
        
        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Category Manager Modal */}
      {showManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <CategoryManager
              category={editingCategory}
              onClose={() => {
                setShowManager(false);
                setEditingCategory(null);
              }}
              onCategoryUpdated={handleCategoryUpdated}
            />
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="glass-effect rounded-xl p-6 love-shadow hover:scale-105 transition-transform group"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <h3 className="font-semibold text-gray-800 truncate">{category.name}</h3>
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Edit category"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Category Description */}
              {category.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>
              )}

              {/* Photo Count */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Tag className="h-4 w-4" />
                  <span>
                    {category.photoCount} {category.photoCount === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
              </div>

              {/* View Category Button */}
              <Link
                to={`/categories/${category.id}`}
                className="flex items-center justify-center space-x-2 w-full py-2 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors font-medium"
              >
                <Eye className="h-4 w-4" />
                <span>View Photos</span>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No categories yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first category to start organizing your photos!
          </p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create First Category
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {categories.length > 0 && (
        <div className="glass-effect rounded-xl p-6 love-shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{categories.length}</div>
              <div className="text-sm text-gray-600">Total Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {categories.reduce((sum, cat) => sum + cat.photoCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Categorized Photos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {categories.filter(cat => cat.photoCount > 0).length}
              </div>
              <div className="text-sm text-gray-600">Active Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(categories.reduce((sum, cat) => sum + cat.photoCount, 0) / categories.length) || 0}
              </div>
              <div className="text-sm text-gray-600">Avg Photos/Category</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;