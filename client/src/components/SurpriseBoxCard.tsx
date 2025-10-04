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
  DollarSign,
  ChevronDown,
  ChevronUp
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
  const [showCongratsModal, setShowCongratsModal] = useState(false);
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
  // Recipients can complete if box is OPENED and not expired (including rejected boxes)
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
      setShowCongratsModal(true);
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
  
  // Only show expiration countdown for opened boxes that are not claimed or approved
  const shouldShowExpirationCountdown = box.openedAt && !isExpired && box.status !== 'COMPLETED' && box.status !== 'CLAIMED' && box.status !== 'APPROVED';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/90 backdrop-blur-sm rounded-lg apple-shadow border transition-all duration-200 hover:shadow-md ${
          // OPENED boxes get full size (2x2), WAITING_APPROVAL and APPROVED get reduced height (2x1)
          box.status === 'OPENED' ? 'md:col-span-2 md:row-span-2 border-indigo-300 shadow-lg' :
          ['WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'md:col-span-2 md:row-span-1 border-indigo-300 shadow-lg' :
          isExpired ? 'border-red-200 hover:border-red-300' :
          canOpen ? 'border-green-200 hover:border-green-300' :
          canComplete ? 'border-indigo-200 hover:border-indigo-300' :
          canApprove ? 'border-amber-200 hover:border-amber-300' :
          'border-gray-200 hover:border-purple-300'
        }`}
      >
        {/* Enhanced Header for OPENED, WAITING_APPROVAL, and APPROVED boxes, compact for others */}
        <div className={`${
          box.status === 'OPENED' ? 'px-4 py-3 md:px-6 md:py-4' :
          ['WAITING_APPROVAL', 'APPROVED', 'AVALIABLE'].includes(box.status) ? 'px-4 py-2 md:px-6 md:py-3' :
          'px-3 py-2'
        } rounded-t-lg ${
          isExpired ? 'bg-red-50' :
          canOpen ? 'bg-green-50' :
          canComplete ? 'bg-indigo-50' :
          canApprove ? 'bg-amber-50' :
          box.status === 'CLAIMED' ? 'bg-gradient-to-r from-purple-50 to-pink-50' :
          'bg-purple-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className={`${
                ['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'p-1.5 md:p-2' : 'p-1'
              } rounded-md flex-shrink-0 ${
                isExpired ? 'bg-red-200 text-red-700' :
                canOpen ? 'bg-green-200 text-green-700' :
                canComplete ? 'bg-indigo-200 text-indigo-700' :
                canApprove ? 'bg-amber-200 text-amber-700' :
                box.status === 'CLAIMED' ? 'bg-gradient-to-r from-purple-200 to-pink-200 text-purple-700' :
                'bg-purple-200 text-purple-700'
              }`}>
                <Gift className={['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'w-4 h-4 md:w-5 md:h-5' : 'w-3 h-3'} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-gray-800 leading-tight ${
                  ['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'text-base md:text-lg mb-1' : 'text-xs truncate'
                }`}>
                  {box.prizeName}
                </h3>
                
                {/* For CLAIMED boxes, don't show duplicate info here */}
                {box.status !== 'CLAIMED' && (
                  <div className={`flex items-center space-x-1 ${['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'mt-1' : 'mt-0.5'}`}>
                    <span className={`px-1 py-0.5 rounded font-medium ${
                      ['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'px-2 py-1 text-xs md:text-sm' : 'text-xs'
                    } ${getStatusColor(box.status)}`}>
                      {getStatusText(box.status)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Hide expand button for CLAIMED boxes, make it larger for OPENED boxes */}
            {box.status !== 'CLAIMED' && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ${
                  ['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'p-0.5 md:p-1' : 'p-0.5'
                }`}
              >
                {showDetails ? 
                  <ChevronUp className={['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'w-3 h-3 md:w-4 md:h-4' : 'w-3 h-3'} /> : 
                  <ChevronDown className={['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'w-3 h-3 md:w-4 md:h-4' : 'w-3 h-3'} />
                }
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Content for OPENED, WAITING_APPROVAL, and APPROVED boxes, compact for others */}
        <div className={
          box.status === 'OPENED' ? 'px-4 py-3 md:px-6 md:py-4' :
          ['WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'px-4 py-2 md:px-6 md:py-3' :
          'px-3 py-2'
        }>
          {/* For CLAIMED boxes, show only Prize and Price */}
          {box.status === 'CLAIMED' ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎁</div>
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Prize:</span> {box.prizeName}
                  </div>
                  {box.priceAmount && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Price:</span> ${box.priceAmount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Essential info - enhanced for OPENED boxes */}
              <div className={`flex items-center justify-between text-gray-600 mb-1 ${
                box.status === 'OPENED' ? 'text-xs md:text-sm mb-2 md:mb-3' : 'text-xs'
              }`}>
                <div className="flex items-center space-x-1 md:space-x-2">
                  <div className="flex items-center">
                    <User className={box.status === 'OPENED' ? 'w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1' : 'w-3 h-3 mr-0.5'} />
                    <span className={box.status === 'OPENED' ? 'max-w-20 md:max-w-32 truncate' : 'truncate max-w-16'}>
                      {isOwner ? box.recipient?.name || 'Unknown' : box.owner?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className={box.status === 'OPENED' ? 'w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1' : 'w-3 h-3 mr-0.5'} />
                    <span className="font-medium">${box.priceAmount || 0}</span>
                  </div>
                </div>
                
                {/* Compact timing info */}
                {box.status === 'CREATED' && timeUntilDrop > 0 && (
                  <div className="flex items-center text-blue-600">
                    <Clock className="w-3 h-3 mr-0.5" />
                    <CountdownTimer targetDate={box.dropAt} className="font-medium text-xs" />
                  </div>
                )}
                
                {/* Only show compact countdown for non-OPENED, non-WAITING_APPROVAL, and non-APPROVED boxes */}
                {shouldShowExpirationCountdown && !['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) && (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="w-3 h-3 mr-0.5" />
                    <CountdownTimer 
                      targetDate={box.expiresAt} 
                      className="font-medium text-xs" 
                      onExpire={() => window.location.reload()}
                    />
                  </div>
                )}
                
                {isExpired && (
                  <div className="flex items-center text-red-600">
                    <X className="w-3 h-3 mr-0.5" />
                    <span className="text-xs">Expired</span>
                  </div>
                )}
              </div>

              {/* Enhanced description for OPENED boxes */}
              {box.status === 'OPENED' && box.prizeDescription && (
                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs md:text-sm text-indigo-700">{box.prizeDescription}</p>
                </div>
              )}

              {/* Enhanced task description for OPENED boxes */}
              {box.status === 'OPENED' && box.taskDescription && (
                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-xs md:text-sm font-semibold text-blue-800 mb-1">Task:</h4>
                  <p className="text-xs md:text-sm text-blue-700">{box.taskDescription}</p>
                </div>
              )}

              {/* Rejection reason display for OPENED boxes */}
              {box.status === 'OPENED' && box.rejectionReason && (
                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-xs md:text-sm font-semibold text-red-800 mb-1 flex items-center">
                    <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    Rejection Feedback:
                  </h4>
                  <p className="text-xs md:text-sm text-red-700">{box.rejectionReason}</p>
                  <p className="text-xs text-red-600 mt-1 italic">Please complete the task again with the feedback above.</p>
                </div>
              )}

              {/* Expandable details */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`border-t border-gray-100 mt-2 pt-2 space-y-1 ${
                      box.status === 'OPENED' ? 'mt-4 pt-4 space-y-2' : ''
                    }`}
                  >
                    {box.prizeDescription && box.status !== 'OPENED' && (
                      <div>
                        <span className={`font-medium text-gray-700 ${
                          box.status === 'OPENED' ? 'text-sm' : 'text-xs'
                        }`}>Prize: </span>
                        <span className={box.status === 'OPENED' ? 'text-sm text-gray-600' : 'text-xs text-gray-600'}>
                          {box.prizeDescription}
                        </span>
                      </div>
                    )}
                    
                    {box.taskDescription && box.status !== 'OPENED' && (
                      <div>
                        <span className={`font-medium text-gray-700 ${
                          box.status === 'OPENED' ? 'text-sm' : 'text-xs'
                        }`}>Task: </span>
                        <span className={box.status === 'OPENED' ? 'text-sm text-gray-600' : 'text-xs text-gray-600'}>
                          {box.taskDescription}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex items-center justify-between ${
                      box.status === 'OPENED' ? 'text-sm' : 'text-xs'
                    } text-gray-500`}>
                      <div className="flex items-center">
                        <Calendar className={box.status === 'OPENED' ? 'w-4 h-4 mr-1' : 'w-3 h-3 mr-0.5'} />
                        <span>Drops: {formatDate(box.dropAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className={box.status === 'OPENED' ? 'w-4 h-4 mr-1' : 'w-3 h-3 mr-0.5'} />
                        <span>Expires: {formatDate(box.expiresAt)}</span>
                      </div>
                    </div>
                    
                    {/* Completion type */}
                    <div className={`flex items-center text-gray-500 ${
                      box.status === 'OPENED' ? 'text-sm' : 'text-xs'
                    }`}>
                      <CompletionIcon className={box.status === 'OPENED' ? 'w-4 h-4 mr-1' : 'w-3 h-3 mr-1'} />
                      <span>{box.completionType?.toLowerCase() || 'unknown'}</span>
                    </div>

                    {/* Status messages */}
                    {box.status === 'DROPPED' && !box.openedAt && !isExpired && (
                      <div className="bg-blue-50 rounded px-2 py-1">
                        <p className={box.status === 'OPENED' ? 'text-sm text-blue-600' : 'text-xs text-blue-600'}>
                          Tap to open and start timer
                        </p>
                      </div>
                    )}

                    {/* Completion data */}
                    {box.status === 'WAITING_APPROVAL' && box.completionData && (
                      <div className="bg-gray-50 rounded px-2 py-1">
                        <p className={box.status === 'OPENED' ? 'text-sm text-gray-800' : 'text-xs text-gray-800 line-clamp-2'}>
                          {box.completionData}
                        </p>
                      </div>
                    )}

                    {/* Rejection reason */}
                    {box.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded px-2 py-1">
                        <p className={box.status === 'OPENED' ? 'text-sm text-red-800' : 'text-xs text-red-800 line-clamp-2'}>
                          {box.rejectionReason}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expiration countdown - enhanced for OPENED, WAITING_APPROVAL, and APPROVED boxes */}
              {shouldShowExpirationCountdown && timeUntilExpiry > 0 && (
                <div className={`mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg ${
                  box.status === 'OPENED' ? 'mt-4 p-3' :
                  ['WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'mt-3 p-2' :
                  ''
                }`}>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className={['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'w-4 h-4 text-amber-600' : 'w-3 h-3 text-amber-600'} />
                    <span className={`font-medium text-amber-800 ${
                      ['OPENED', 'WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'text-sm' : 'text-xs'
                    }`}>
                      <CountdownTimer targetDate={expiresDate} />
                    </span>
                  </div>
                </div>
              )}

              {/* Enhanced action buttons for OPENED, WAITING_APPROVAL, and APPROVED boxes */}
              <div className={`flex items-center gap-2 mt-2 ${
                box.status === 'OPENED' ? 'mt-3 md:mt-4 gap-2 md:gap-3' :
                ['WAITING_APPROVAL', 'APPROVED'].includes(box.status) ? 'mt-2 gap-2' :
                ''
              }`}>
                {/* RECIPIENT ACTIONS */}
                {canOpen && (
                  <button
                    onClick={handleOpen}
                    disabled={isLoading}
                    className="flex-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded text-xs font-medium disabled:opacity-50 hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                  >
                    {isLoading ? 'Opening...' : 'Open'}
                  </button>
                )}
                
                {canComplete && (
                  <>
                    <button
                      onClick={() => setShowCompleteModal(true)}
                      className={`flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 ${
                        box.status === 'OPENED' ? 'px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm' : 'px-2 py-1 text-xs'
                      }`}
                    >
                      <span className="hidden sm:inline">Complete Task</span>
                      <span className="sm:hidden">Complete</span>
                    </button>
                    <button
                      onClick={() => {
                        setCompletionData(`Paid $${box.priceAmount || 0} for prize`);
                        setShowCompleteModal(true);
                      }}
                      className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded font-medium hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center space-x-1 ${
                        box.status === 'OPENED' ? 'px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm' : 'px-2 py-1 text-xs'
                      }`}
                    >
                      <DollarSign className={box.status === 'OPENED' ? 'w-3 h-3 md:w-4 md:h-4' : 'w-3 h-3'} />
                      <span>${box.priceAmount || 0}</span>
                    </button>
                  </>
                )}
                
                {canClaim && (
                  <button
                    onClick={handleClaim}
                    disabled={isLoading}
                    className="flex-1 px-2 py-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded text-xs font-medium hover:from-emerald-600 hover:to-green-600 transition-all duration-200 disabled:opacity-50"
                  >
                    Claim ${box.priceAmount || 0}
                  </button>
                )}
                
                {/* CREATOR ACTIONS */}
                {canApprove && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={isLoading}
                      className="flex-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded text-xs font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50"
                    >
                      {isLoading ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
                
                {canEdit && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-2 py-1 text-blue-600 hover:text-blue-700 rounded text-xs"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                )}
                
                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-2 py-1 text-red-600 hover:text-red-700 rounded text-xs disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                
                {/* Waiting messages for creators */}
                {shouldShowWaitingMessage && (
                  <div className="flex-1 text-center">
                    <span className="text-xs text-gray-500">
                      {box.status === 'DROPPED' ? 'Waiting for recipient to open' : 'Waiting for completion'}
                    </span>
                  </div>
                )}
                
                {/* Waiting message for recipients */}
                {shouldShowWaitingForApprovalMessage && (
                  <div className="flex-1 text-center">
                    <span className="text-xs text-amber-600">Waiting for approval</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>


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

      {/* Congratulations Modal */}
      <AnimatePresence>
        {showCongratsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && setShowCongratsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Celebration Header */}
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 p-8 text-center relative overflow-hidden">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  Congratulations!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-lg"
                >
                  You've earned your prize!
                </motion.p>
                
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 100, opacity: 0, rotate: 0 }}
                      animate={{ 
                        y: -100, 
                        opacity: [0, 1, 0], 
                        rotate: 360,
                        x: [0, Math.random() * 40 - 20]
                      }}
                      transition={{ 
                        duration: 3, 
                        delay: i * 0.2,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      className={`absolute text-2xl ${
                        i % 3 === 0 ? 'left-1/4' : i % 3 === 1 ? 'left-1/2' : 'left-3/4'
                      }`}
                      style={{ top: '100%' }}
                    >
                      {['✨', '🎊', '💎', '🏆', '🎁', '⭐'][i]}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Prize Details */}
              <div className="p-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 mb-6"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎁</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{box.prizeName}</h3>
                    {box.priceAmount && (
                      <div className="text-2xl font-bold text-purple-600">
                        ${box.priceAmount || 0}
                      </div>
                    )}
                    {box.prizeDescription && (
                      <p className="text-gray-600 text-sm mt-2">{box.prizeDescription}</p>
                    )}
                  </div>
                </motion.div>
                
                <motion.button
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.6 }}
                   onClick={() => setShowCongratsModal(false)}
                   className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
                 >
                   Awesome! 🎉
                 </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SurpriseBoxCard;