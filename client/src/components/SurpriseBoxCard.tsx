import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Clock,
  Calendar,
  Camera,
  Type,
  MapPin,
  Timer,
  Check,
  X,
  Eye,
  AlertCircle,
  Trash2,
  User
} from 'lucide-react';
import { useSurpriseBoxStore, SurpriseBox } from '../stores/surpriseBoxStore';
import CountdownTimer from './CountdownTimer';

interface SurpriseBoxCardProps {
  box: SurpriseBox;
  isOwner?: boolean;
}

const SurpriseBoxCard: React.FC<SurpriseBoxCardProps> = ({ box, isOwner = false }) => {
  const {
    openBox,
    approveCompletion,
    rejectCompletion,
    cancelBox,
    isLoading
  } = useSurpriseBoxStore();
  
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [completionData, setCompletionData] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const getCompletionIcon = (type: string) => {
    switch (type) {
      case 'PHOTO': return Camera;
      case 'TEXT': return Type;
      case 'LOCATION': return MapPin;
      case 'TIMER': return Timer;
      default: return Gift;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-blue-100 text-blue-800';
      case 'DROPPED': return 'bg-green-100 text-green-800';
      case 'WAITING_APPROVAL': return 'bg-amber-100 text-amber-800';
      case 'CLAIMED': return 'bg-purple-100 text-purple-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CREATED': return 'Scheduled';
      case 'DROPPED': return 'Available';
      case 'WAITING_APPROVAL': return 'Pending Approval';
      case 'CLAIMED': return 'Claimed';
      case 'EXPIRED': return 'Expired';
      default: return status;
    }
  };

  const canOpen = !isOwner && box.status === 'DROPPED' && !box.isExpired;
  const canApprove = isOwner && box.status === 'WAITING_APPROVAL';
  const canCancel = isOwner && ['CREATED', 'DROPPED'].includes(box.status);

  const handleOpen = async () => {
    if (!completionData.trim()) return;
    
    try {
      await openBox(box.id, completionData);
      setShowOpenModal(false);
      setCompletionData('');
    } catch (error) {
      // Error handled by store
    }
  };

  const handleApprove = async () => {
    try {
      await approveCompletion(box.id);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    
    try {
      await rejectCompletion(box.id, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      // Error handled by store
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this surprise box?')) {
      try {
        await cancelBox(box.id);
      } catch (error) {
        // Error handled by store
      }
    }
  };

  const CompletionIcon = getCompletionIcon(box.completionType);
  const isExpired = box.isExpired || new Date(box.expiresAt) < new Date();
  const isDropped = box.status === 'DROPPED';
  const timeUntilDrop = new Date(box.dropAt).getTime() - new Date().getTime();
  const timeUntilExpiry = new Date(box.expiresAt).getTime() - new Date().getTime();

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -2 }}
        className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-200 overflow-hidden ${
          isExpired ? 'border-red-200' : 
          canOpen ? 'border-green-200 hover:border-green-300' :
          canApprove ? 'border-amber-200 hover:border-amber-300' :
          'border-gray-200 hover:border-purple-300'
        }`}
      >
        {/* Header */}
        <div className={`p-4 ${
          isExpired ? 'bg-red-50' :
          canOpen ? 'bg-green-50' :
          canApprove ? 'bg-amber-50' :
          'bg-purple-50'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${
                isExpired ? 'bg-red-200 text-red-700' :
                canOpen ? 'bg-green-200 text-green-700' :
                canApprove ? 'bg-amber-200 text-amber-700' :
                'bg-purple-200 text-purple-700'
              }`}>
                <Gift className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 line-clamp-1">{box.prizeName}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(box.status)}`}>
                    {getStatusText(box.status)}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <CompletionIcon className="w-3 h-3 mr-1" />
                    {box.completionType?.toLowerCase() || 'unknown'}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Timing info */}
          <div className="space-y-2 mb-4">
            {box.status === 'CREATED' && timeUntilDrop > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>Drops in: </span>
                <CountdownTimer targetDate={box.dropAt} className="ml-1 font-medium" />
              </div>
            )}
            
            {isDropped && !isExpired && (
              <div className="flex items-center text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>Expires in: </span>
                <CountdownTimer 
                  targetDate={box.expiresAt} 
                  className="ml-1 font-medium text-red-600" 
                  onExpire={() => window.location.reload()}
                />
              </div>
            )}
            
            {isExpired && (
              <div className="flex items-center text-sm text-red-600">
                <X className="w-4 h-4 mr-2" />
                <span>Expired on {new Date(box.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span>{isOwner ? `For: ${box.recipient?.name || 'Unknown'}` : `From: ${box.owner?.name || 'Unknown'}`}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{new Date(box.dropAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Completion data for waiting approval */}
          {box.status === 'WAITING_APPROVAL' && box.completionData && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 mb-1">Completion submission:</p>
              <p className="text-sm text-gray-800">{box.completionData}</p>
            </div>
          )}

          {/* Rejection reason */}
          {box.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600 mb-1">Rejection reason:</p>
              <p className="text-sm text-red-800">{box.rejectionReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {canOpen && (
              <button
                onClick={() => setShowOpenModal(true)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium"
              >
                Open Box
              </button>
            )}
            
            {canApprove && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t bg-gray-50 overflow-hidden"
            >
              <div className="p-4 space-y-2 text-sm">
                {box.prizeDescription && (
                  <div>
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="text-gray-600 mt-1">{box.prizeDescription}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Created:</span>
                    <p>{new Date(box.dropAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Expires:</span>
                    <p>{new Date(box.expiresAt).toLocaleString()}</p>
                  </div>
                  {box.droppedAt && (
                    <div>
                      <span className="font-medium">Dropped:</span>
                      <p>{new Date(box.droppedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {box.openedAt && (
                    <div>
                      <span className="font-medium">Opened:</span>
                      <p>{new Date(box.openedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Open Box Modal */}
      <AnimatePresence>
        {showOpenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && setShowOpenModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CompletionIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Open Surprise Box</h3>
                    <p className="text-sm text-gray-600">{box.prizeName}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {box.completionType === 'PHOTO' && 'Describe the photo you took:'}
                    {box.completionType === 'TEXT' && 'Enter your response:'}
                    {box.completionType === 'LOCATION' && 'Confirm your location:'}
                    {box.completionType === 'TIMER' && 'Confirm completion:'}
                    {!box.completionType && 'Complete the challenge:'}
                  </label>
                  <textarea
                    value={completionData}
                    onChange={(e) => setCompletionData(e.target.value)}
                    placeholder={
                      box.completionType === 'PHOTO' ? 'Describe what you photographed...' :
                      box.completionType === 'TEXT' ? 'Enter your answer...' :
                      box.completionType === 'LOCATION' ? 'Confirm you are at the location...' :
                      box.completionType === 'TIMER' ? 'Confirm you have completed the challenge...' :
                      'Enter completion details...'
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowOpenModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOpen}
                    disabled={!completionData.trim() || isLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Opening...' : 'Open Box'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Reject Completion</h3>
                    <p className="text-sm text-gray-600">{box.prizeName}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for rejection:
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this completion doesn't meet the requirements..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason.trim() || isLoading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SurpriseBoxCard;