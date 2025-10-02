import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, History, Bell, X, AlertCircle } from 'lucide-react';
import { useSurpriseBoxStore } from '../stores/surpriseBoxStore';
import BoxCreationForm from './BoxCreationForm';
import SurpriseBoxCard from './SurpriseBoxCard';
import PrizeHistory from './PrizeHistory';
import BoxDropAnimation from './BoxDropAnimation';
import CountdownTimer from './CountdownTimer';

const SurpriseBoxManager: React.FC = () => {
  const {
    ownedBoxes,
    receivedBoxes,
    activeBox,
    isLoading,
    error,
    showCreateForm,
    showPrizeHistory,
    notifications,
    isConnected,
    setShowCreateForm,
    setShowPrizeHistory,
    loadOwnedBoxes,
    loadReceivedBoxes,
    loadActiveBox,
    connectWebSocket,
    disconnectWebSocket,
    clearNotifications,
    getBoxesWaitingApproval,
    getActiveBoxesCount,
    setError
  } = useSurpriseBoxStore();

  const [activeTab, setActiveTab] = useState<'received' | 'owned'>('received');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      await Promise.all([
        loadOwnedBoxes(),
        loadReceivedBoxes(),
        loadActiveBox()
      ]);
    };
    
    loadData();
    
    // Connect WebSocket
    const token = localStorage.getItem('token');
    console.log('🔍 SurpriseBoxManager: Checking token for WebSocket connection:', token ? 'Token found' : 'No token');
    if (token) {
      console.log('✅ SurpriseBoxManager: Calling connectWebSocket with token');
      connectWebSocket(token);
    } else {
      console.log('🧪 SurpriseBoxManager: For testing, attempting WebSocket connection without token');
      connectWebSocket();
    }
    
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const boxesWaitingApproval = getBoxesWaitingApproval();
  const activeBoxesCount = getActiveBoxesCount();

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Surprise Boxes</h1>
                <p className="text-gray-600">
                  {activeBoxesCount > 0 ? `${activeBoxesCount} active boxes` : 'No active boxes'}
                  {isConnected && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                      Live
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800">Notifications</h3>
                          <button
                            onClick={clearNotifications}
                            className="text-sm text-purple-600 hover:text-purple-700"
                          >
                            Clear all
                          </button>
                        </div>
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No new notifications
                        </div>
                      ) : (
                        <div className="divide-y">
                          {notifications.map((notification, index) => (
                            <div key={index} className="p-4">
                              <p className="text-sm text-gray-800">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.timestamp && !isNaN(new Date(notification.timestamp).getTime())
                                  ? new Date(notification.timestamp).toLocaleString()
                                  : 'Invalid Date'
                                }
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Action buttons */}
              <button
                onClick={() => setShowPrizeHistory(true)}
                className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
              
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Create Box</span>
              </button>
            </div>
          </div>
          
          {/* Approval notifications */}
          {boxesWaitingApproval.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div className="flex items-center space-x-2 text-amber-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {boxesWaitingApproval.length} box{boxesWaitingApproval.length > 1 ? 'es' : ''} waiting for your approval
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
                <button
                  onClick={handleCloseError}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Box Display */}
        {activeBox && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <span>Active Surprise Box</span>
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <SurpriseBoxCard box={activeBox} />
                <div className="flex items-center justify-center">
                  <BoxDropAnimation isActive={true} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              Received Boxes ({receivedBoxes.length})
            </button>
            <button
              onClick={() => setActiveTab('owned')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'owned'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              Created Boxes ({ownedBoxes.length})
              {boxesWaitingApproval.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                  {boxesWaitingApproval.length} pending
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'received' ? (
                    <div>
                      {receivedBoxes.length === 0 ? (
                        <div className="text-center py-12">
                          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No received boxes</h3>
                          <p className="text-gray-500">Surprise boxes from your partner will appear here</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {receivedBoxes.map((box) => (
                            <SurpriseBoxCard key={box.id} box={box} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {ownedBoxes.length === 0 ? (
                        <div className="text-center py-12">
                          <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No created boxes</h3>
                          <p className="text-gray-500 mb-4">Create your first surprise box for your partner</p>
                          <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                          >
                            Create Box
                          </button>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {ownedBoxes.map((box) => (
                            <SurpriseBoxCard key={box.id} box={box} isOwner={true} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateForm && (
          <BoxCreationForm onClose={() => setShowCreateForm(false)} />
        )}
        
        {showPrizeHistory && (
          <PrizeHistory onClose={() => setShowPrizeHistory(false)} />
        )}
      </AnimatePresence>
      
      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default SurpriseBoxManager;