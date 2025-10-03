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
  User,
  Edit,
  DollarSign
} from 'lucide-react';
import { useSurpriseBoxStore, SurpriseBox } from '../stores/surpriseBoxStore';
import CountdownTimer from './CountdownTimer';
import { BoxEditForm } from './BoxEditForm';

// Utility function to safely parse dates from different formats
const parseDate = (dateInput: string | number[] | null | undefined): Date | null => {
  if (!dateInput) return null;
  
  try {
    // Handle array format from backend [year, month, day, hour, minute, second, nanosecond]
    if (Array.isArray(dateInput)) {
      const [year, month, day, hour = 0, minute = 0, second = 0, nanosecond = 0] = dateInput;
      // Note: JavaScript months are 0-indexed, but backend sends 1-indexed
      return new Date(year, month - 1, day, hour, minute, second, Math.floor(nanosecond / 1000000));
    }
    
    // Handle string formats
    const dateString = dateInput as string;
    
    // Handle ISO format with T and Z (e.g., "2025-10-02T11:50:49.491Z")
    if (dateString.includes('T')) {
      return new Date(dateString);
    }
    
    // Handle simple timestamp format (e.g., "2025-10-02 06:51:00")
    // Replace space with T to make it ISO compatible
    const isoString = dateString.replace(' ', 'T');
    return new Date(isoString);
  } catch (error) {
    console.error('Failed to parse date:', dateInput, error);
    return null;
  }
};

// Utility function to format date safely
const formatDate = (dateInput: string | number[] | null | undefined, includeTime = false): string => {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return includeTime ? date.toLocaleString() : date.toLocaleDateString();
};

interface SurpriseBoxCardProps {
  box: SurpriseBox;
  isOwner?: boolean;
}

const SurpriseBoxCard: React.FC<SurpriseBoxCardProps> = ({ box, isOwner = false }) => {
  const {
    openBox,
    completeBox,
    approveCompletion,
    rejectCompletion,
    cancelBox,
    claimBox,
    isLoading
  } = useSurpriseBoxStore();
  
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionData, setCompletionData] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const getCompletionIcon = (type: string) => {
    switch (type) {
      case 'PHOTO': return Camera;
      case 'TASK': return Type;
      case 'LOCATION': return MapPin;
      case 'TIME': return Timer;
      case 'PAYMENT': return DollarSign;
      default: return Gift;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-blue-100 text-blue-800';
      case 'DROPPED': return 'bg-green-100 text-green-800';
      case 'OPENED': return 'bg-indigo-100 text-indigo-800';
      case 'WAITING_APPROVAL': return 'bg-amber-100 text-amber-800';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CLAIMED': return 'bg-purple-100 text-purple-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CREATED': return 'Scheduled';
      case 'DROPPED': return 'Available';
      case 'OPENED': return 'Opened';
      case 'WAITING_APPROVAL': return 'Pending Approval';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'CLAIMED': return 'Claimed';
      case 'EXPIRED': return 'Expired';
      default: return status;
    }
  };

  // For RECIPIENTS (not owner)
  const canOpen = !isOwner && box.status === 'DROPPED' && !box.isExpired;
  const canComplete = !isOwner && box.status === 'OPENED' && !box.isExpired;
  
  // For recipients: can claim if box is approved and not expired
  // TEMPORARY: Simplified condition for debugging
  const canClaim = !isOwner && box.status === 'APPROVED';
  
  // Debug logging for canClaim conditions when not owner and status is APPROVED
  if (!isOwner && box.status === 'APPROVED') {
    console.log('🔍 canClaim debug for APPROVED box (SIMPLIFIED):', {
      boxId: box.id,
      isOwner,
      status: box.status,
      rejectionReason: box.rejectionReason,
      rejectionReasonType: typeof box.rejectionReason,
      isExpired: box.isExpired,
      isExpiredType: typeof box.isExpired,
      canClaim
    });
  }
  
  // For CREATORS (owner)
  const canApprove = isOwner && box.status === 'WAITING_APPROVAL';
  const canCancel = isOwner && ['CREATED', 'DROPPED'].includes(box.status);
  const canEdit = isOwner && box.status === 'CREATED';
  
  // Status messages for creators when they can't take action
  const shouldShowWaitingMessage = isOwner && ['DROPPED', 'OPENED'].includes(box.status) && !box.isExpired;
  
  // Messages for recipients when waiting
  const shouldShowWaitingForApprovalMessage = !isOwner && box.status === 'WAITING_APPROVAL' && box.rejectionReason === null;

  const handleOpen = async () => {
    try {
      await openBox(box.id);
      setShowOpenModal(false);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleComplete = async () => {
    if (!completionData.trim()) return;
    
    try {
      await completeBox(box.id, completionData);
      setShowCompleteModal(false);
      setCompletionData('');
    } catch (error) {
      // Error handled by store
    }
  };

  const handleCloseCompleteModal = () => {
    setShowCompleteModal(false);
    setCompletionData('');
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

  const handleClaim = async () => {
    try {
      await claimBox(box.id);
    } catch (error) {
      // Error handled by store
    }
  };

  const CompletionIcon = getCompletionIcon(box.completionType);
  const expiresDate = parseDate(box.expiresAt);
  const dropDate = parseDate(box.dropAt);
  // Claimed boxes should never show as expired
  const isExpired = box.status !== 'CLAIMED' && (box.isExpired || false);
  const isDropping = box.isDropping;
  const timeUntilDrop = dropDate ? dropDate.getTime() - new Date().getTime() : 0;
  const timeUntilExpiry = expiresDate ? expiresDate.getTime() - new Date().getTime() : 0;
  
  // Only show expiration countdown for opened boxes that are not claimed
  const shouldShowExpirationCountdown = box.openedAt && !isExpired && box.status !== 'COMPLETED' && box.status !== 'CLAIMED';

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
          canComplete ? 'border-indigo-200 hover:border-indigo-300' :
          canApprove ? 'border-amber-200 hover:border-amber-300' :
          'border-gray-200 hover:border-purple-300'
        }`}
      >
        {/* Header */}
        <div className={`p-4 ${
          isExpired ? 'bg-red-50' :
          canOpen ? 'bg-green-50' :
          canComplete ? 'bg-indigo-50' :
          canApprove ? 'bg-amber-50' :
          'bg-purple-50'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${
                isExpired ? 'bg-red-200 text-red-700' :
                canOpen ? 'bg-green-200 text-green-700' :
                canComplete ? 'bg-indigo-200 text-indigo-700' :
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
            
            {shouldShowExpirationCountdown && (
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
            
            {box.status === 'DROPPED' && !box.openedAt && !isExpired && (
              <div className="flex items-center text-sm text-blue-600">
                <Gift className="w-4 h-4 mr-2" />
                <span>Open the box to start the countdown timer</span>
              </div>
            )}
            
            {isExpired && (
              <div className="flex items-center text-sm text-red-600">
                <X className="w-4 h-4 mr-2" />
                <span>Expired on {formatDate(box.expiresAt)}</span>
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
              <span>{formatDate(box.dropAt)}</span>
            </div>
          </div>

          {/* Task description for opened boxes */}
          {box.status === 'OPENED' && box.taskDescription && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-indigo-600 mb-1">Your Task:</p>
              <p className="text-sm text-indigo-800">{box.taskDescription}</p>
            </div>
          )}

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
            {/* RECIPIENT ACTIONS */}
            {canOpen && (
              <button
                onClick={handleOpen}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium disabled:opacity-50"
              >
                {isLoading ? 'Opening...' : 'Open Box'}
              </button>
            )}
            
            {canComplete && (
              <>
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 font-medium"
                >
                  Complete Task
                </button>
                <button
                  onClick={() => {
                    setCompletionData(`Paid $${box.priceAmount} for prize`);
                    setShowCompleteModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 font-medium flex items-center justify-center space-x-1"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Pay ${box.priceAmount}</span>
                </button>
              </>
            )}
            
            {shouldShowWaitingForApprovalMessage && (
              <div className="flex-1 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <span className="text-amber-700 text-sm font-medium">Waiting for approval...</span>
              </div>
            )}
            
            {canClaim && (
              <button
                onClick={handleClaim}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                <Gift className="w-4 h-4" />
                <span>{isLoading ? 'Claiming...' : 'Claim Prize'}</span>
              </button>
            )}
            
            {/* CREATOR ACTIONS */}
            {shouldShowWaitingMessage && (
              <div className="flex-1 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <span className="text-blue-700 text-sm font-medium">
                  {box.status === 'DROPPED' ? 'Waiting for recipient to open...' : 'Waiting for recipient to complete task...'}
                </span>
              </div>
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
            
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit box"
              >
                <Edit className="w-4 h-4" />
              </button>
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
                    <p>{formatDate(box.createdAt, true)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Expires:</span>
                    <p>{box.openedAt ? formatDate(box.expiresAt, true) : `${box.expirationMinutes || 1440} minutes after opening`}</p>
                  </div>
                  {box.droppedAt && (
                    <div>
                      <span className="font-medium">Dropped:</span>
                      <p>{formatDate(box.droppedAt, true)}</p>
                    </div>
                  )}
                  {box.openedAt && (
                    <div>
                      <span className="font-medium">Opened:</span>
                      <p>{formatDate(box.openedAt, true)}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Complete Box Modal */}
      <AnimatePresence>
        {showCompleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && handleCloseCompleteModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    completionData.startsWith('Paid $') ? 'bg-yellow-100' : 'bg-indigo-100'
                  }`}>
                    <CompletionIcon className={`w-6 h-6 ${
                      completionData.startsWith('Paid $') ? 'text-yellow-600' : 'text-indigo-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {completionData.startsWith('Paid $') ? 'Pay for Prize' : 'Complete Task'}
                    </h3>
                    <p className="text-sm text-gray-600">{box.prizeName}</p>
                  </div>
                </div>
                
                {/* Task Description */}
                {box.taskDescription && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Task:</h4>
                    <p className="text-sm text-blue-700">{box.taskDescription}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {completionData.startsWith('Paid $') ? 'Confirm payment details:' :
                     box.completionType === 'PHOTO' ? 'Describe the photo you took:' :
                     box.completionType === 'TEXT' ? 'Enter your response:' :
                     box.completionType === 'LOCATION' ? 'Confirm your location:' :
                     box.completionType === 'TIMER' ? 'Confirm completion:' :
                     'Complete the challenge:'}
                  </label>
                  <textarea
                    value={completionData}
                    onChange={(e) => setCompletionData(e.target.value)}
                    placeholder={
                      completionData.startsWith('Paid $') ? 'Enter payment confirmation or receipt details...' :
                      box.completionType === 'PHOTO' ? 'Describe what you photographed...' :
                      box.completionType === 'TASK' ? 'Enter your answer...' :
                      box.completionType === 'LOCATION' ? 'Confirm you are at the location...' :
                      box.completionType === 'TIME' ? 'Confirm you have completed the challenge...' :
                      'Enter completion details...'
                    }
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent resize-none ${
                      completionData.startsWith('Paid $') ? 'focus:ring-yellow-500' : 'focus:ring-indigo-500'
                    }`}
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCloseCompleteModal}
                    className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!completionData.trim() || isLoading}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      completionData.startsWith('Paid $') 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
                    }`}
                  >
                    {isLoading ? 'Submitting...' : (completionData.startsWith('Paid $') ? 'Confirm Payment' : 'Submit Completion')}
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

      {/* Edit Box Modal */}
      {showEditModal && (
        <BoxEditForm
          box={box}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            // Data will be refreshed automatically by the updateBox action
          }}
        />
      )}
    </>
  );
};

export default SurpriseBoxCard;