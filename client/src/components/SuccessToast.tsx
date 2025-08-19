import React, { useEffect, useState } from 'react';
import { CheckCircle, X, Heart, Camera } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  type?: 'photo' | 'love' | 'general';
  onClose: () => void;
  duration?: number;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ 
  message, 
  type = 'general', 
  onClose, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show animation
    setIsVisible(true);
    
    // Auto close
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'photo':
        return <Camera className="w-5 h-5 text-white" />;
      case 'love':
        return <Heart className="w-5 h-5 text-white fill-current" />;
      default:
        return <CheckCircle className="w-5 h-5 text-white" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'photo':
        return 'from-purple-400 to-purple-500';
      case 'love':
        return 'from-pink-500 to-red-500';
      default:
        return 'from-green-500 to-green-600';
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
        <div className={`bg-gradient-to-r ${getColors()} rounded-2xl p-4 apple-shadow-lg max-w-sm`}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{message}</p>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Animated elements for different types */}
          {type === 'love' && (
            <div className="absolute -top-1 -right-1">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Heart
                    key={i}
                    className="w-3 h-3 text-pink-300 fill-current animate-float-up"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {type === 'photo' && (
            <div className="absolute -top-1 -right-1">
              <div className="flex space-x-1">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-300 rounded-full animate-sparkle"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default SuccessToast;
