import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSurpriseBoxActions } from '../hooks/useSurpriseBoxActions';
import SurpriseBoxCard from './SurpriseBoxCard';
import BoxCreationForm from './BoxCreationForm';

const SurpriseBoxManager: React.FC = () => {
  const {
    ownedBoxes,
    receivedBoxes,
    isLoading,
    error,
    showCreateForm,
    isConnected,
    setShowCreateForm,
    loadOwnedBoxes,
    loadReceivedBoxes,
    connectWebSocket,
    disconnectWebSocket,
    getBoxesWaitingApproval,
    getActiveBoxesCount,
    setError
  } = useSurpriseBoxActions();

  const [activeTab, setActiveTab] = useState<'received' | 'owned'>('received');

  
  // Pagination state
  const [receivedPage, setReceivedPage] = useState(0);
  const [ownedPage, setOwnedPage] = useState(0);
  const BOXES_PER_PAGE = 6;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadOwnedBoxes();
      loadReceivedBoxes();
      connectWebSocket(token);
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

  // Pagination helpers
  const getPaginatedBoxes = (boxes: any[], page: number) => {
    const startIndex = page * BOXES_PER_PAGE;
    return boxes.slice(startIndex, startIndex + BOXES_PER_PAGE);
  };

  const getTotalPages = (boxes: any[]) => {
    return Math.ceil(boxes.length / BOXES_PER_PAGE);
  };

  const paginatedReceivedBoxes = getPaginatedBoxes(receivedBoxes, receivedPage);
  const paginatedOwnedBoxes = getPaginatedBoxes(ownedBoxes, ownedPage);
  const receivedTotalPages = getTotalPages(receivedBoxes);
  const ownedTotalPages = getTotalPages(ownedBoxes);

  return (
    <div className="min-h-screen bg-apple-system-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl apple-shadow border border-apple-separator p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-apple-purple/10 rounded-xl">
                <Gift className="w-8 h-8 text-apple-purple" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-apple-label">Surprise Boxes</h1>
                <p className="text-apple-secondary-label text-sm">
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
            
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {/* Create button - responsive */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 apple-shadow bg-apple-purple text-white hover:bg-apple-purple/90 min-w-0 flex-shrink-0"
                title="Create a new surprise box"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline font-medium">Create Box</span>
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



        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl apple-shadow border border-apple-separator overflow-hidden">
          <div className="flex border-b border-apple-separator">
            <button
              onClick={() => {
                setActiveTab('received');
                setReceivedPage(0);
              }}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-apple-purple/5 text-apple-purple border-b-2 border-apple-purple'
                  : 'text-apple-secondary-label hover:text-apple-purple hover:bg-apple-purple/5'
              }`}
            >
              Received ({receivedBoxes.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('owned');
                setOwnedPage(0);
              }}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'owned'
                  ? 'bg-apple-purple/5 text-apple-purple border-b-2 border-apple-purple'
                  : 'text-apple-secondary-label hover:text-apple-purple hover:bg-apple-purple/5'
              }`}
            >
              Created ({ownedBoxes.length})
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-purple" />
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
                          <Gift className="w-16 h-16 text-apple-tertiary-label mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-apple-secondary-label mb-2">No received boxes</h3>
                          <p className="text-apple-tertiary-label">Surprise boxes from your partner will appear here</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                            {paginatedReceivedBoxes.map((box) => {
                              const isOwner = false;
                              
                              console.log('📦 Received box debug:', {
                                boxId: box.id,
                                status: box.status,
                                isOwner,
                                currentUserId: (() => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    if (!token) return null;
                                    const payload = JSON.parse(atob(token.split('.')[1]));
                                    return payload.userId;
                                  } catch {
                                    return null;
                                  }
                                })(),
                                ownerId: box.owner?.id,
                                recipientId: box.recipient?.id,
                                rejectionReason: box.rejectionReason,
                                rejectionReasonType: typeof box.rejectionReason
                              });
                              
                              return (
                                <SurpriseBoxCard key={box.id} box={box} isOwner={isOwner} />
                              );
                            })}
                          </div>
                          
                          {/* Pagination for received boxes */}
                          {receivedTotalPages > 1 && (
                            <div className="flex items-center justify-center space-x-4 mt-6">
                              <button
                                onClick={() => setReceivedPage(Math.max(0, receivedPage - 1))}
                                disabled={receivedPage === 0}
                                className="p-2 rounded-lg text-apple-secondary-label hover:text-apple-purple hover:bg-apple-purple/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              
                              <span className="text-sm text-apple-secondary-label">
                                Page {receivedPage + 1} of {receivedTotalPages}
                              </span>
                              
                              <button
                                onClick={() => setReceivedPage(Math.min(receivedTotalPages - 1, receivedPage + 1))}
                                disabled={receivedPage >= receivedTotalPages - 1}
                                className="p-2 rounded-lg text-apple-secondary-label hover:text-apple-purple hover:bg-apple-purple/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div>
                      {ownedBoxes.length === 0 ? (
                        <div className="text-center py-12">
                          <Plus className="w-16 h-16 text-apple-tertiary-label mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-apple-secondary-label mb-2">No created boxes</h3>
                          <p className="text-apple-tertiary-label mb-4">Create your first surprise box for your partner</p>
                          <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-6 py-2 rounded-xl transition-all duration-200 bg-apple-purple text-white hover:bg-apple-purple/90 apple-shadow"
                            title="Create a new surprise box"
                          >
                            Create Box
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                            {paginatedOwnedBoxes.map((box) => (
                              <SurpriseBoxCard key={box.id} box={box} isOwner={true} />
                            ))}
                          </div>
                          
                          {/* Pagination for owned boxes */}
                          {ownedTotalPages > 1 && (
                            <div className="flex items-center justify-center space-x-4 mt-6">
                              <button
                                onClick={() => setOwnedPage(Math.max(0, ownedPage - 1))}
                                disabled={ownedPage === 0}
                                className="p-2 rounded-lg text-apple-secondary-label hover:text-apple-purple hover:bg-apple-purple/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              
                              <span className="text-sm text-apple-secondary-label">
                                Page {ownedPage + 1} of {ownedTotalPages}
                              </span>
                              
                              <button
                                onClick={() => setOwnedPage(Math.min(ownedTotalPages - 1, ownedPage + 1))}
                                disabled={ownedPage >= ownedTotalPages - 1}
                                className="p-2 rounded-lg text-apple-secondary-label hover:text-apple-purple hover:bg-apple-purple/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </>
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
      </AnimatePresence>
      

    </div>
  );
};

export default SurpriseBoxManager;