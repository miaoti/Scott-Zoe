import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Heart, Star, Gift, Clock, ArrowUpDown } from 'lucide-react';
import api from '../utils/api';
import CalendarComponent from './Calendar';
import DayMemoriesModal from './DayMemoriesModal';

interface Memory {
  id: number;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  type: 'anniversary' | 'special_moment' | 'milestone' | 'event';
  createdAt: string;
  creator: { name: string };
  photos?: Array<{
    id: number;
    filename: string;
    originalName: string;
    caption: string;
  }>;
}

type MemoryFormData = {
  title: string;
  description: string;
  date: string;
  endDate?: string;
  type: 'anniversary' | 'special_moment' | 'milestone' | 'event';
  selectedPhotos?: number[];
};

function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [formData, setFormData] = useState<MemoryFormData>({
    title: '',
    description: '',
    date: '',
    type: 'special_moment',
  });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDayMemories, setSelectedDayMemories] = useState<Memory[]>([]);
  const [showDayModal, setShowDayModal] = useState(false);
  const [availablePhotos, setAvailablePhotos] = useState<Array<{
    id: number;
    filename: string;
    originalName: string;
    caption?: string;
  }>>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{id: number; filename: string; originalName: string; caption: string} | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    fetchMemories();
    fetchPhotos();
  }, []);

  const fetchMemories = async () => {
    try {
      const response = await api.get('/api/memories');
      setMemories(response.data);
    } catch (error) {
      console.error('Error fetching memories:', error);
    }
  };

  const fetchPhotos = async () => {
    try {
      const response = await api.get('/api/photos?limit=100');
      setAvailablePhotos(response.data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      let memoryResponse;
      if (editingMemory) {
        memoryResponse = await api.put(`/api/memories/${editingMemory.id}`, formData);
      } else {
        memoryResponse = await api.post('/api/memories', formData);
      }
      
      // Handle photo associations for event type memories
      if (formData.type === 'event' && formData.selectedPhotos && formData.selectedPhotos.length > 0) {
        const memoryId = editingMemory ? editingMemory.id : memoryResponse.data.memory.id;
        await api.post(`/api/memories/${memoryId}/photos`, formData.selectedPhotos);
      }
      
      await fetchMemories();
      resetForm();
    } catch (error) {
      console.error('Error saving memory:', error);
      alert('Error saving memory. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setFormData({
      title: memory.title,
      description: memory.description,
      date: memory.date.includes('T') ? memory.date.split('T')[0] : memory.date, // Format for date input
      endDate: memory.endDate ? (memory.endDate.includes('T') ? memory.endDate.split('T')[0] : memory.endDate) : undefined,
      type: memory.type,
      selectedPhotos: memory.photos ? memory.photos.map(photo => photo.id) : [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      await api.delete(`/api/memories/${id}`);
      await fetchMemories();
    } catch (error) {
      console.error('Error deleting memory:', error);
      alert('Error deleting memory. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      endDate: undefined,
      type: 'special_moment',
      selectedPhotos: [],
    });
    setEditingMemory(null);
    setShowForm(false);
  };

  const openMemoryDetail = (memory: Memory) => {
    setSelectedMemory(memory);
    setShowDetailModal(true);
  };

  const closeMemoryDetail = () => {
    setSelectedMemory(null);
    setShowDetailModal(false);
  };

  const openPhotoViewer = (photo: {id: number; filename: string; originalName: string; caption: string}) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  const closePhotoViewer = () => {
    setSelectedPhoto(null);
    setShowPhotoModal(false);
  };

  const handleDayClick = (date: string, memories: Memory[]) => {
    setSelectedDate(date);
    setSelectedDayMemories(memories);
    setShowDayModal(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anniversary':
        return <Heart className="h-5 w-5 text-red-500" fill="currentColor" />;
      case 'milestone':
        return <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <Gift className="h-5 w-5 text-purple-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'anniversary':
        return 'Anniversary';
      case 'milestone':
        return 'Milestone';
      case 'event':
        return 'Event';
      default:
        return 'Special Moment';
    }
  };

  const filteredMemories = memories.filter((memory) => {
    if (filter === 'all') return true;
    return memory.type === filter;
  });

  const sortedMemories = filteredMemories.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const upcomingMemories = memories
    .filter((memory) => memory.type !== 'event') // Exclude event type memories
    .map((memory) => {
      const memoryDate = new Date(memory.date);
      const today = new Date();
      const thisYear = today.getFullYear();
      const anniversaryThisYear = new Date(thisYear, memoryDate.getMonth(), memoryDate.getDate());
      const nextAnniversary = anniversaryThisYear >= today ? anniversaryThisYear : new Date(thisYear + 1, memoryDate.getMonth(), memoryDate.getDate());
      
      return {
        ...memory,
        nextAnniversaryDate: nextAnniversary,
        daysUntil: Math.ceil((nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl text-gray-800 mb-2">Our Memories</h1>
          <p className="text-lg text-gray-600">
            Special moments and milestones in our journey together
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 romantic-gradient text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-5 w-5" />
          <span>Add Memory</span>
        </button>
      </div>

      {/* Upcoming Anniversaries */}
      {upcomingMemories.length > 0 && (
        <div className="glass-effect rounded-xl p-6 love-shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-purple-400" />
            Upcoming Anniversaries
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingMemories.map((memory) => {
              const memoryDate = new Date(memory.date);
              const yearsAgo = memory.nextAnniversaryDate.getFullYear() - memoryDate.getFullYear();
              
              return (
                <div key={memory.id} className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
                  <div className="flex items-start justify-between mb-2">
                    {getTypeIcon(memory.type)}
                    <span className="text-xs text-gray-500">
                      {memory.nextAnniversaryDate.toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{memory.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{memory.description}</p>
                  <div className="flex items-center justify-between">
                    {yearsAgo > 0 && (
                      <p className="text-xs text-purple-500 font-medium">
                        {yearsAgo} year{yearsAgo !== 1 ? 's' : ''} anniversary
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {memory.daysUntil === 0 ? 'Today!' : `${memory.daysUntil} days`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar */}
      <CalendarComponent
          onDayClick={handleDayClick}
        />

      {/* Memories List */}
      <div className="glass-effect rounded-xl p-6 love-shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-purple-400" />
          All Memories
        </h2>
        
        {/* Filters and Sort */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 font-medium">Filter by type:</span>
            {['all', 'anniversary', 'milestone', 'special_moment', 'event'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === type
                    ? 'romantic-gradient text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : getTypeLabel(type)}
              </button>
            ))}
          </div>
          
          <button
            onClick={toggleSortOrder}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowUpDown className="h-4 w-4" />
            {/* <span>Sort by Date ({sortOrder === 'asc' ? 'Oldest First' : 'Newest First'})</span> */}
          </button>
        </div>

      {/* Memory Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingMemory ? 'Edit Memory' : 'Create Memory'}
              </h3>
              <button
                onClick={resetForm}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      placeholder="Enter memory title"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📅 {formData.type === 'event' ? 'Start Date' : 'Date'}
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      >
                        <option value="special_moment">Special Moment</option>
                        <option value="anniversary">Anniversary</option>
                        <option value="milestone">Milestone</option>
                        <option value="event">Event</option>
                      </select>
                    </div>
                  </div>

                  {/* End Date for Event Type */}
                  {formData.type === 'event' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📅 End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.endDate || ''}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                        min={formData.date}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty for single-day events
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                      placeholder="Share the story behind this memory..."
                      required
                    />
                  </div>

                  {/* Photo Selection for Event Type */}
                  {formData.type === 'event' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Select Photos ({formData.selectedPhotos?.length || 0} selected)
                        </label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="max-h-64 overflow-y-auto p-3">
                            <div className="grid grid-cols-3 gap-3">
                              {availablePhotos.map((photo) => (
                                <div
                                  key={photo.id}
                                  className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                                    formData.selectedPhotos?.includes(photo.id)
                                      ? 'border-pink-500 ring-2 ring-pink-200'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => {
                                    const currentSelected = formData.selectedPhotos || [];
                                    const isSelected = currentSelected.includes(photo.id);
                                    const newSelected = isSelected
                                      ? currentSelected.filter(id => id !== photo.id)
                                      : [...currentSelected, photo.id];
                                    setFormData({ ...formData, selectedPhotos: newSelected });
                                  }}
                                >
                                  <img
                                    src={`/api/photos/image/${photo.filename}`}
                                    alt={photo.originalName}
                                    className="w-full h-20 object-cover rounded-lg"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-lg transition-all" />
                                  {formData.selectedPhotos?.includes(photo.id) && (
                                    <div className="absolute top-1 right-1 bg-pink-500 text-white rounded-full p-1">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  {photo.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                                      {photo.caption}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          {availablePhotos.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              No photos available. Upload some photos first!
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </form>
            </div>
            
            <div className="flex space-x-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 romantic-gradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? (editingMemory ? 'Updating...' : 'Creating...') : (editingMemory ? 'Update Memory' : 'Create Memory')}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Memory Items */}
        {sortedMemories.length > 0 ? (
          <div className="space-y-4">
            {sortedMemories.map((memory) => (
              <div key={memory.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => openMemoryDetail(memory)}>
                    <div className="flex items-center space-x-3 mb-2">
                      {getTypeIcon(memory.type)}
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{memory.title}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {getTypeLabel(memory.type)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{memory.description}</p>
                    
                    {/* Display photos for event type memories */}
                    {memory.type === 'event' && memory.photos && memory.photos.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {memory.photos.slice(0, 4).map((photo) => (
                            <div key={photo.id} className="relative">
                              <img
                                src={`/api/photos/image/${photo.filename}`}
                                alt={photo.originalName}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                title={photo.caption || photo.originalName}
                              />
                            </div>
                          ))}
                          {memory.photos.length > 4 && (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-500 font-medium">
                                +{memory.photos.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {memory.photos.length} photo{memory.photos.length !== 1 ? 's' : ''} attached
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {memory.type === 'event' && memory.endDate ? (
                            `${new Date(memory.date).toLocaleDateString()} - ${new Date(memory.endDate).toLocaleDateString()}`
                          ) : (
                            new Date(memory.date).toLocaleDateString()
                          )}
                        </span>
                      </div>
                      <span>•</span>
                      <span>Added by {memory.creator.name}</span>
                  
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(memory);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(memory.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-pink-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {filter === 'all' ? 'No memories yet' : `No ${getTypeLabel(filter).toLowerCase()}s yet`}
            </h3>
            <p className="text-gray-500 mb-6">
              Start documenting your special moments and milestones!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 romantic-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add First Memory
            </button>
          </div>
        )}
      </div>

      {/* Day Memories Modal */}
      <DayMemoriesModal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        date={selectedDate}
        memories={selectedDayMemories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Memory Detail Modal */}
      {showDetailModal && selectedMemory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800">{selectedMemory.title}</h3>
              <button
                onClick={closeMemoryDetail}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedMemory.type)}
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {getTypeLabel(selectedMemory.type)}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600 leading-relaxed">{selectedMemory.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Date</h4>
                    <p className="text-gray-600">
                      {selectedMemory.type === 'event' && selectedMemory.endDate ? (
                        `${new Date(selectedMemory.date).toLocaleDateString()} - ${new Date(selectedMemory.endDate).toLocaleDateString()}`
                      ) : (
                        new Date(selectedMemory.date).toLocaleDateString()
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Added by</h4>
                    <p className="text-gray-600">{selectedMemory.creator.name}</p>
                  </div>
                </div>
                
                {selectedMemory.type === 'event' && selectedMemory.photos && selectedMemory.photos.length > 0 && (
                   <div>
                     <h4 className="text-sm font-medium text-gray-700 mb-3">Photos ({selectedMemory.photos.length})</h4>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                       {selectedMemory.photos.map((photo) => (
                         <div key={photo.id} className="relative group cursor-pointer" onClick={() => openPhotoViewer(photo)}>
                           <img
                             src={`/api/photos/image/${photo.filename}`}
                             alt={photo.originalName}
                             className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200"
                           />
                           <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                             <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                               <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                               </svg>
                             </div>
                           </div>
                           {photo.caption && (
                             <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 rounded-b-lg">
                               <p className="truncate">{photo.caption}</p>
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
            </div>
            
            <div className="flex space-x-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  closeMemoryDetail();
                  handleEdit(selectedMemory);
                }}
                className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Memory</span>
              </button>
              <button
                onClick={closeMemoryDetail}
                className="flex-1 px-6 py-3 romantic-gradient text-white rounded-lg hover:opacity-90 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
         </div>
       )}

       {/* Full-Size Photo Viewer Modal */}
       {showPhotoModal && selectedPhoto && (
         <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
           <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
             <button
               onClick={closePhotoViewer}
               className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-colors z-10"
             >
               ✕
             </button>
             
             <div className="relative max-w-full max-h-full">
               <img
                 src={`/api/photos/image/${selectedPhoto.filename}`}
                 alt={selectedPhoto.originalName}
                 className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
               />
               
               {selectedPhoto.caption && (
                 <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 rounded-b-lg">
                   <p className="text-center text-sm">{selectedPhoto.caption}</p>
                 </div>
               )}
             </div>
             
             <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
               {selectedPhoto.originalName}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

export default Memories;