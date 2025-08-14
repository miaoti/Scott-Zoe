import React from 'react';
import { X, Edit2, Trash2, Calendar, Heart, Star, Gift } from 'lucide-react';

interface Memory {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
  creator: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface DayMemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  memories: Memory[];
  onEdit: (memory: Memory) => void;
  onDelete: (id: number) => void;
}

const DayMemoriesModal: React.FC<DayMemoriesModalProps> = ({
  isOpen,
  onClose,
  date,
  memories,
  onEdit,
  onDelete
}) => {
  if (!isOpen) return null;
  
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
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Calendar className="h-6 w-6 mr-2 text-purple-500" />
              Memories for {formatDate(date)}
            </h2>
            <p className="text-gray-600 mt-1">
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'} on this day
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {memories.length > 0 ? (
          <div className="space-y-4">
            {memories.map((memory) => (
              <div key={memory.id} className="glass-effect rounded-lg p-4 border border-gray-200">
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
                      <span>Added by {memory.creator.name}</span>
                      <span>•</span>
                      <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        onEdit(memory);
                        onClose();
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit memory"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this memory?')) {
                          onDelete(memory.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete memory"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No memories on this day
            </h3>
            <p className="text-gray-500">
              Click "Add Memory" to create a memory for {formatDate(date)}
            </p>
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayMemoriesModal;