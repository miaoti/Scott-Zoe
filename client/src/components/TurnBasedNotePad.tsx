import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Minimize2, 
  Users, 
  Wifi, 
  WifiOff,
  Edit3,
  Loader2,
  Lock,
  Unlock,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useTurnBasedNoteStore } from '../stores/turnBasedNoteStore';
import { useAuth } from '../contexts/AuthContext';

interface TurnBasedNotePadProps {
  onClose?: () => void;
}

const TurnBasedNotePad: React.FC<TurnBasedNotePadProps> = ({ onClose }) => {
  console.log('TurnBasedNotePad: Component function called');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { user } = useAuth();
  
  const {
    content,
    isConnected,
    isLoading,
    error,
    hasEditPermission,
    isLocked,
    currentEditor,
    isRequestingEdit,
    editRequestMessage,
    windowPosition,
    isMinimized,
    isMaximized,
    typingIndicators,
    
    setContent,
    setMinimized,
    setMaximized,
    connect,
    disconnect,
    requestEditControl,
    releaseEditControl,
    updateContent,
    sendTypingIndicator,
    updateWindowPosition,
  } = useTurnBasedNoteStore();
  
  console.log('TurnBasedNotePad: Store state - isConnected:', isConnected, 'hasEditPermission:', hasEditPermission);
  
  // Connect to WebSocket on mount
  useEffect(() => {
    console.log('TurnBasedNotePad component mounted');
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token && token.trim() !== '' && !isConnected && !isLoading) {
        console.log('Attempting to connect to WebSocket...');
        connect(token);
      } else if (!token) {
        console.warn('TurnBasedNotePad: No valid token found for WebSocket connection');
      }
    }
    
    return () => {
      console.log('TurnBasedNotePad: Component unmounting');
      disconnect();
    };
  }, []); // Remove dependencies to prevent infinite loop
  
  // Handle text changes (only when user has edit permission)
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!hasEditPermission) {
      console.warn('User attempted to edit without permission');
      return;
    }
    
    const newContent = e.target.value;
    console.log('Text change detected:', { newContent, hasEditPermission });
    
    // Update content locally and send to server
    updateContent(newContent);
    
    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }
    
    // Clear existing timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 1000);
    
  }, [hasEditPermission, updateContent, isTyping, sendTypingIndicator]);
  
  // Handle cursor position changes
  const handleCursorChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPosition = e.target.selectionStart;
    setCursorPosition(newPosition);
  }, []);
  
  // Handle edit control request
  const handleRequestEdit = useCallback(async () => {
    console.log('Requesting edit control...');
    const granted = await requestEditControl();
    console.log('Edit control request result:', granted);
  }, [requestEditControl]);
  
  // Handle edit control release
  const handleReleaseEdit = useCallback(async () => {
    console.log('Releasing edit control...');
    await releaseEditControl();
  }, [releaseEditControl]);
  
  // Handle window controls
  const handleMinimize = () => {
    setMinimized(!isMinimized);
  };
  
  // Drag functionality state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const titleBar = e.currentTarget as HTMLElement;
    const windowElement = titleBar.parentElement;
    if (windowElement) {
      const windowRect = windowElement.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - windowRect.left,
        y: e.clientY - windowRect.top,
      });
    }
  }, []);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Ensure window stays within viewport bounds
    const maxX = window.innerWidth - (windowPosition?.width || 400);
    const maxY = window.innerHeight - (windowPosition?.height || 300);
    
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));
    
    updateWindowPosition(
      clampedX,
      clampedY,
      windowPosition?.width || 400,
      windowPosition?.height || 300
    );
  }, [isDragging, dragOffset, windowPosition, updateWindowPosition]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Add mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // Get status indicator
  const getStatusIndicator = () => {
    if (isLoading) {
      return { icon: Loader2, color: 'text-blue-500', text: 'Connecting...', spin: true };
    }
    
    if (!isConnected) {
      return { icon: WifiOff, color: 'text-red-500', text: 'Disconnected' };
    }
    
    if (hasEditPermission) {
      return { icon: Edit3, color: 'text-green-500', text: 'Editing' };
    }
    
    if (isLocked && currentEditor) {
      return { icon: Lock, color: 'text-orange-500', text: `${currentEditor.username} is editing` };
    }
    
    return { icon: Eye, color: 'text-blue-500', text: 'Viewing' };
  };
  
  const statusInfo = getStatusIndicator();
  const StatusIcon = statusInfo.icon;
  
  // Get typing indicators text
  const getTypingText = () => {
    const typingUsers = typingIndicators.filter(t => t.isTyping && t.userId !== user?.id);
    if (typingUsers.length === 0) return null;
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing...`;
    }
    
    return `${typingUsers.length} users are typing...`;
  };
  
  const typingText = getTypingText();
  
  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow z-50"
        onClick={handleMinimize}
        style={{
          left: windowPosition?.xPosition || 'auto',
          top: windowPosition?.yPosition || 'auto',
        }}
      >
        <div className="p-3 flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${statusInfo.color} ${statusInfo.spin ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium text-gray-700">Shared Notes</span>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="fixed bg-white border border-gray-300 rounded-lg shadow-2xl z-50 flex flex-col"
      style={{
        left: windowPosition?.xPosition || 100,
        top: windowPosition?.yPosition || 100,
        width: windowPosition?.width || 500,
        height: windowPosition?.height || 400,
        minWidth: 300,
        minHeight: 200,
      }}
    >
      {/* Title Bar */}
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-t-lg cursor-move flex items-center justify-between select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${statusInfo.spin ? 'animate-spin' : ''}`} />
          <span className="font-medium">Shared Notes - {statusInfo.text}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMinimize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {isLocked && currentEditor && (
            <div className="flex items-center space-x-1">
              <Lock className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600">
                {currentEditor.id === user?.id ? 'You are editing' : `${currentEditor.username} is editing`}
              </span>
            </div>
          )}
        </div>
        
        {/* Edit Control Buttons */}
        <div className="flex items-center space-x-2">
          {!hasEditPermission && !isLocked && (
            <button
              onClick={handleRequestEdit}
              disabled={isRequestingEdit}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {isRequestingEdit ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3" />
                  <span>Request Edit</span>
                </>
              )}
            </button>
          )}
          
          {hasEditPermission && (
            <button
              onClick={handleReleaseEdit}
              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center space-x-1"
            >
              <Unlock className="w-3 h-3" />
              <span>Release Edit</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Error/Message Bar */}
      {(error || editRequestMessage) && (
        <div className={`px-3 py-2 border-b text-sm flex items-center space-x-2 ${
          error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {error ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <CheckCircle className="w-4 h-4 text-blue-500" />
          )}
          <span>{error || editRequestMessage}</span>
        </div>
      )}
      
      {/* Content Area */}
      <div className="flex-1 p-3 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onSelect={handleCursorChange}
          placeholder={
            hasEditPermission 
              ? "Start typing your shared notes here..." 
              : isLocked 
                ? `${currentEditor?.username || 'Another user'} is currently editing. You can view but not edit.`
                : "Click 'Request Edit' to start editing..."
          }
          className={`w-full h-full resize-none border-none outline-none text-gray-800 leading-relaxed ${
            !hasEditPermission ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
          }`}
          style={{ 
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '14px',
          }}
          disabled={!hasEditPermission}
        />
        
        {/* Typing Indicators */}
        {typingText && (
          <div className="absolute bottom-2 left-3 text-xs text-gray-500 italic flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>{typingText}</span>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 px-3 py-2 rounded-b-lg border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Turn-based collaborative editing</span>
          {user && (
            <span>Logged in as {user.username}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span>{content.length} characters</span>
          {hasEditPermission && (
            <div className="flex items-center space-x-1 text-green-600">
              <Edit3 className="w-3 h-3" />
              <span>Editing</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurnBasedNotePad;