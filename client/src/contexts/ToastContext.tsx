import React, { createContext, useContext, useState, ReactNode } from 'react';
import SuccessToast from '../components/SuccessToast';

interface Toast {
  id: string;
  message: string;
  type: 'photo' | 'love' | 'general';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'photo' | 'love' | 'general', duration?: number) => void;
  showPhotoSuccess: (count: number) => void;
  showLoveSuccess: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'photo' | 'love' | 'general' = 'general', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
  };

  const showPhotoSuccess = (count: number) => {
    const message = count === 1 
      ? '📸 Photo uploaded successfully!' 
      : `📸 ${count} photos uploaded successfully!`;
    showToast(message, 'photo', 4000);
  };

  const showLoveSuccess = () => {
    const messages = [
      '💕 Love shared!',
      '❤️ Sending love!',
      '💖 Love you more!',
      '💝 Sweet love!',
      '💗 Love grows!',
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showToast(randomMessage, 'love', 2000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showPhotoSuccess, showLoveSuccess }}>
      {children}
      
      {/* Render toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ 
              transform: `translateY(${index * 80}px)`,
              zIndex: 50 - index 
            }}
          >
            <SuccessToast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
