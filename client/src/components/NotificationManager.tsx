import React, { useEffect, useState } from 'react';
import EditRequestNotification from './EditRequestNotification';
import { useTurnBasedNoteStore } from '../stores/turnBasedNoteStore';

interface Notification {
  id: string;
  type: 'request' | 'granted' | 'denied' | 'released' | 'timeout' | 'error';
  message: string;
  requesterName?: string;
  timestamp: number;
  duration?: number;
}

const NotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const {
    editRequestMessage,
    error,
    hasEditPermission,
    isLocked,
    currentEditor,
    grantEditControl,
    denyEditControl,
    clearEditRequestMessage,
    clearError
  } = useTurnBasedNoteStore();

  // Handle edit request messages
  useEffect(() => {
    if (editRequestMessage) {
      const notification: Notification = {
        id: `edit-request-${Date.now()}`,
        type: 'request',
        message: editRequestMessage,
        requesterName: 'User', // This would come from the WebSocket message
        timestamp: Date.now(),
        duration: 30000 // 30 seconds for edit requests
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto-clear the message after showing notification
      setTimeout(() => {
        clearEditRequestMessage();
      }, 100);
    }
  }, [editRequestMessage, clearEditRequestMessage]);

  // Handle errors
  useEffect(() => {
    if (error) {
      const notification: Notification = {
        id: `error-${Date.now()}`,
        type: 'error',
        message: error,
        timestamp: Date.now(),
        duration: 5000
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto-clear the error after showing notification
      setTimeout(() => {
        clearError();
      }, 100);
    }
  }, [error, clearError]);

  // Handle edit permission changes
  useEffect(() => {
    if (hasEditPermission) {
      const notification: Notification = {
        id: `granted-${Date.now()}`,
        type: 'granted',
        message: 'Edit access granted! You can now edit the document.',
        timestamp: Date.now(),
        duration: 3000
      };
      
      setNotifications(prev => [...prev, notification]);
    }
  }, [hasEditPermission]);

  // Handle edit lock changes
  useEffect(() => {
    if (isLocked && currentEditor && !hasEditPermission) {
      const notification: Notification = {
        id: `locked-${Date.now()}`,
        type: 'denied',
        message: `${currentEditor.username} is now editing the document.`,
        timestamp: Date.now(),
        duration: 3000
      };
      
      setNotifications(prev => [...prev, notification]);
    }
    // Removed "Document is now available for editing" notification as requested
    // } else if (!isLocked && !hasEditPermission) {
    //   const notification: Notification = {
    //     id: `released-${Date.now()}`,
    //     type: 'released',
    //     message: 'Document is now available for editing.',
    //     timestamp: Date.now(),
    //     duration: 3000
    //   };
    //   
    //   setNotifications(prev => [...prev, notification]);
    // }
  }, [isLocked, currentEditor, hasEditPermission]);

  const handleAcceptRequest = (notificationId: string) => {
    grantEditControl();
    removeNotification(notificationId);
  };

  const handleDenyRequest = (notificationId: string) => {
    denyEditControl();
    removeNotification(notificationId);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      <div className="flex flex-col space-y-2 p-4 pointer-events-auto">
        {notifications.map((notification) => (
          <EditRequestNotification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            requesterName={notification.requesterName}
            onAccept={notification.type === 'request' ? () => handleAcceptRequest(notification.id) : undefined}
            onDeny={notification.type === 'request' ? () => handleDenyRequest(notification.id) : undefined}
            onClose={() => removeNotification(notification.id)}
            duration={notification.duration}
            autoClose={notification.type !== 'request'}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationManager;