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
  type: 'anniversary' | 'special_moment' | 'milestone';
  createdAt: string;
  creator: { name: string };
}

type MemoryFormData = {
  title: string;
  description: string;
  date: string;
  type: 'anniversary' | 'special_moment' | 'milestone';
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

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const response = await api.get('/api/memories');
      setMemories(response.data);
    } catch (error) {
      console.error('Error fetching memories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      if (editingMemory) {
        await api.put(`/api/memories/${editingMemory.id}`, formData);
      } else {
        await api.post('/api/memories', formData);
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
      type: memory.type,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      await api.delete(`/memories/${id}`);
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
      type: 'special_moment',
    });
    setEditingMemory(null);
    setShowForm(false);
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
      default:
        return <Gift className="h-5 w-5 text-purple-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'anniversary':
        return 'Anniversary';
      case 'milestone':
        return 'Milestone';
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
            <Clock className="h-5 w-5 mr-2 text-purple-500" />
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
                      <p className="text-xs text-purple-600 font-medium">
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
          <Calendar className="h-5 w-5 mr-2 text-purple-500" />
          All Memories
        </h2>
        
        {/* Filters and Sort */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 font-medium">Filter by type:</span>
            {['all', 'anniversary', 'milestone', 'special_moment'].map((type) => (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingMemory ? 'Edit Memory' : 'Add New Memory'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="special_moment">Special Moment</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 romantic-gradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingMemory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Memory Items */}
        {sortedMemories.length > 0 ? (
          <div className="space-y-4">
            {sortedMemories.map((memory) => (
              <div key={memory.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getTypeIcon(memory.type)}
                      <h3 className="text-lg font-semibold text-gray-800">{memory.title}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {getTypeLabel(memory.type)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{memory.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(memory.date).toLocaleDateString()}</span>
                      </div>
                      <span>•</span>
                      <span>Added by {memory.creator.name}</span>
                  
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(memory)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(memory.id)}
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
    </div>
  );
}

export default Memories;