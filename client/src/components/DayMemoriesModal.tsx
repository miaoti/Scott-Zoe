import React from 'react';
import { X, Edit2, Trash2, Calendar, Heart, Star, Gift } from 'lucide-react';

interface Memory {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'anniversary' | 'special_moment' | 'milestone';
  createdAt: string;
  creator: { name: string };
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
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'milestone':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'special_moment':
        return <Gift className="h-5 w-5 text-purple-400" />;
      default:
        return <Gift className="h-5 w-5 text-purple-400" />;
    }
  };

  const formatDate = (dateString: string) => {
  // Parse the date string and create a Date object in local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Memories for {formatDate(date)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'} found
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {memories.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No memories found for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(memory.type)}
                        <h3 className="font-semibold text-gray-800">{memory.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-3">{memory.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Added by {memory.creator.name}</span>
                        {/* <span>•</span>
                        <span>{new Date(memory.createdAt).toLocaleDateString()}</span> */}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => onEdit(memory)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit memory"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(memory.id)}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default DayMemoriesModal;