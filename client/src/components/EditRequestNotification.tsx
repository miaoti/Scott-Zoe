import React, { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  X, 
  Edit3,
  User
} from 'lucide-react';

interface EditRequestNotificationProps {
  type: 'request' | 'granted' | 'denied' | 'released' | 'timeout' | 'error';
  message: string;
  requesterName?: string;
  onAccept?: () => void;
  onDeny?: () => void;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const EditRequestNotification: React.FC<EditRequestNotificationProps> = ({
  type,
  message,
  requesterName,
  onAccept,
  onDeny,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);

  // Auto-close timer
  useEffect(() => {
    if (autoClose && type !== 'request') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose, type]);

  // Countdown timer for requests
  useEffect(() => {
    if (type === 'request' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (type === 'request' && timeLeft <= 0) {
      // Auto-deny when time runs out
      onDeny?.();
    }
  }, [type, timeLeft, onDeny]);

  const getNotificationStyle = () => {
    switch (type) {
      case 'request':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: Edit3,
          iconColor: 'text-blue-500'
        };
      case 'granted':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-500'
        };
      case 'denied':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: X,
          iconColor: 'text-red-500'
        };
      case 'released':
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: CheckCircle,
          iconColor: 'text-gray-500'
        };
      case 'timeout':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-800',
          icon: Clock,
          iconColor: 'text-orange-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: AlertCircle,
          iconColor: 'text-red-500'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: AlertCircle,
          iconColor: 'text-gray-500'
        };
    }
  };

  const style = getNotificationStyle();
  const Icon = style.icon;

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 max-w-md w-full ${style.bg} border rounded-lg shadow-lg z-50 animate-slide-in-right`}>
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <Icon className={`w-5 h-5 ${style.iconColor} mt-0.5 flex-shrink-0`} />
          
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${style.text}`}>
              {type === 'request' && requesterName && (
                <div className="flex items-center space-x-2 mb-1">
                  <User className="w-4 h-4" />
                  <span>Edit Request from {requesterName}</span>
                </div>
              )}
              
              <p className="break-words">{message}</p>
              
              {type === 'request' && timeLeft > 0 && (
                <div className="mt-2 flex items-center space-x-2 text-xs text-blue-600">
                  <Clock className="w-3 h-3" />
                  <span>Expires in {timeLeft}s</span>
                  <div className="flex-1 bg-blue-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${(timeLeft / (duration / 1000)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Action buttons for requests */}
            {type === 'request' && (onAccept || onDeny) && (
              <div className="mt-3 flex space-x-2">
                {onAccept && (
                  <button
                    onClick={onAccept}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    Grant Access
                  </button>
                )}
                {onDeny && (
                  <button
                    onClick={onDeny}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition-colors"
                  >
                    Deny
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Close button */}
          {onClose && (
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className={`${style.text} hover:opacity-70 transition-opacity flex-shrink-0`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditRequestNotification;