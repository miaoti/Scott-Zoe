import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Calendar, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Gift,
  Camera,
  MapPin,
  Clock,
  Type,
  Star,
  TrendingUp
} from 'lucide-react';
import { useSurpriseBoxStore } from '../stores/surpriseBoxStore';
import { format } from 'date-fns';

interface PrizeHistoryProps {
  recipientId?: string;
  className?: string;
}

const PrizeHistory: React.FC<PrizeHistoryProps> = ({ 
  recipientId, 
  className = '' 
}) => {
  const { 
    prizeHistory, 
    prizeStats, 
    loadPrizeHistory, 
    loadPrizeStats
  } = useSurpriseBoxStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    loadPrizeStats();
    handleSearch();
  }, [recipientId]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      await loadPrizeHistory();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    handleSearch();
  };

  const getCompletionTypeIcon = (type: string) => {
    if (!type) return <Gift size={16} className="text-gray-500" />;
    switch (type.toLowerCase()) {
      case 'photo':
        return <Camera size={16} className="text-blue-500" />;
      case 'location':
        return <MapPin size={16} className="text-green-500" />;
      case 'timer':
        return <Clock size={16} className="text-orange-500" />;
      case 'text':
        return <Type size={16} className="text-purple-500" />;
      default:
        return <Gift size={16} className="text-gray-500" />;
    }
  };

  const getCompletionTypeColor = (type: string) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    switch (type.toLowerCase()) {
      case 'photo':
        return 'bg-blue-100 text-blue-800';
      case 'location':
        return 'bg-green-100 text-green-800';
      case 'timer':
        return 'bg-orange-100 text-orange-800';
      case 'text':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHistory = prizeHistory.filter(item => {
    if (selectedType !== 'all' && item.completionType !== selectedType) {
      return false;
    }
    if (dateRange.start && new Date(item.completedAt) < new Date(dateRange.start)) {
      return false;
    }
    if (dateRange.end && new Date(item.completedAt) > new Date(dateRange.end)) {
      return false;
    }
    return true;
  });

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Trophy className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Prize History</h2>
            <p className="text-gray-600">Track your completed surprises</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Filter size={16} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </motion.button>
      </div>

      {/* Statistics */}
      {prizeStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Prizes</p>
                <p className="text-2xl font-bold">{prizeStats.totalPrizes}</p>
              </div>
              <Gift size={24} className="text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">This Month</p>
                <p className="text-2xl font-bold">{prizeStats.prizesThisMonth}</p>
              </div>
              <Calendar size={24} className="text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Favorite Type</p>
                <p className="text-lg font-bold capitalize">{prizeStats.favoriteCompletionType}</p>
              </div>
              <Star size={24} className="text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Streak</p>
                <p className="text-2xl font-bold">{prizeStats.prizesThisWeek}</p>
              </div>
              <TrendingUp size={24} className="text-orange-200" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-50 rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Prizes
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by prize name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="photo">Photo</option>
                  <option value="location">Location</option>
                  <option value="timer">Timer</option>
                  <option value="text">Text</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setDateRange({ start: '', end: '' });
                  handleFilterChange();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFilterChange}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Apply Filters
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : paginatedHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No prize history found</p>
            <p className="text-sm">Complete some surprise boxes to see your history here!</p>
          </div>
        ) : (
          <AnimatePresence>
            {paginatedHistory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {getCompletionTypeIcon(item.completionType)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{item.prizeName}</h3>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>
                            {item.completedAt && !isNaN(new Date(item.completedAt).getTime()) 
                              ? format(new Date(item.completedAt), 'MMM dd, yyyy')
                              : 'Invalid Date'
                            }
                          </span>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompletionTypeColor(item.completionType)}`}>
                          {item.completionType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">From</div>
                    <div className="font-medium text-gray-800">{item.fromUserName}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </motion.button>
          
          {[...Array(totalPages)].map((_, i) => (
            <motion.button
              key={i + 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-2 rounded-lg ${
                currentPage === i + 1
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </motion.button>
          ))}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default PrizeHistory;