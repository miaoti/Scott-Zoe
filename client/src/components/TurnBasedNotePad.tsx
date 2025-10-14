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
      className="fixed z-50 flex flex-col notebook-container"
      style={{
        left: windowPosition?.xPosition || 100,
        top: windowPosition?.yPosition || 100,
        width: windowPosition?.width || 600,
        height: windowPosition?.height || 500,
        minWidth: 400,
        minHeight: 300,
        backgroundColor: '#f8f0e0',
        border: '1px solid #d4c5a9',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.05)',
        fontFamily: '"Courier New", "American Typewriter", Courier, monospace',
      }}
    >
      {/* Notebook Header/Title Bar */}
      <div 
        className="cursor-move flex items-center justify-between select-none notebook-header"
        onMouseDown={handleMouseDown}
        style={{
          backgroundColor: '#8b5a2b',
          color: '#f8f0e0',
          padding: '12px 16px',
          borderRadius: '8px 8px 0 0',
          borderBottom: '2px solid #6b4425',
          background: 'linear-gradient(45deg, #8b5a2b 0%, #a0672f 50%, #8b5a2b 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center space-x-3">
          <StatusIcon className={`w-5 h-5 ${statusInfo.spin ? 'animate-spin' : ''}`} />
          <span className="font-bold text-lg tracking-wide" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
            📝 Shared Notebook - {statusInfo.text}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMinimize}
            className="p-2 hover:bg-black/20 rounded transition-colors"
            title="Minimize"
            style={{ color: '#f8f0e0' }}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/20 rounded transition-colors text-xl font-bold"
              title="Close"
              style={{ color: '#f8f0e0' }}
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {/* Status Bar - Styled like notebook tab */}
      <div 
        className="flex items-center justify-between text-sm"
        style={{
          backgroundColor: '#e8daba',
          padding: '8px 16px',
          borderBottom: '1px solid #d4c5a9',
          color: '#5d4e37',
        }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className={isConnected ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          
          {isLocked && currentEditor && (
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-orange-600" />
              <span className="text-orange-700 font-medium">
                {currentEditor.id === user?.id ? '✏️ You are writing' : `✏️ ${currentEditor.username} is writing`}
              </span>
            </div>
          )}
        </div>
        
        {/* Edit Control Buttons - Styled like notebook elements */}
        <div className="flex items-center space-x-2">
          {!hasEditPermission && !isLocked && (
            <button
              onClick={handleRequestEdit}
              disabled={isRequestingEdit}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              style={{
                backgroundColor: '#8b5a2b',
                color: '#f8f0e0',
                border: '1px solid #6b4425',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              onMouseEnter={(e) => {
                if (!isRequestingEdit) {
                  e.currentTarget.style.backgroundColor = '#a0672f';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRequestingEdit) {
                  e.currentTarget.style.backgroundColor = '#8b5a2b';
                }
              }}
            >
              {isRequestingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>Request to Write</span>
                </>
              )}
            </button>
          )}
          
          {hasEditPermission && (
            <button
              onClick={handleReleaseEdit}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2"
              style={{
                backgroundColor: '#a34c4c',
                color: '#f8f0e0',
                border: '1px solid #8b3a3a',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b85555';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#a34c4c';
              }}
            >
              <Unlock className="w-4 h-4" />
              <span>Stop Writing</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Error/Message Bar */}
      {(error || editRequestMessage) && (
        <div 
          className="flex items-center space-x-2 text-sm"
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid #d4c5a9',
            backgroundColor: error ? '#f8d7da' : '#d1ecf1',
            color: error ? '#721c24' : '#0c5460',
          }}
        >
          {error ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <CheckCircle className="w-4 h-4 text-blue-600" />
          )}
          <span>{error || editRequestMessage}</span>
        </div>
      )}
      
      {/* Notebook Paper Content Area */}
      <div 
        className="flex-1 relative notebook-paper"
        style={{
          backgroundColor: '#f8f0e0',
          backgroundImage: `
            linear-gradient(to right, #f8d3d3 40px, transparent 40px),
            linear-gradient(to bottom, transparent 0px, transparent 29px, #e7eff8 30px, transparent 31px)
          `,
          backgroundSize: '100% 30px',
          backgroundPosition: '0 0',
          backgroundAttachment: 'local',
        }}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onSelect={handleCursorChange}
          placeholder={
            hasEditPermission 
              ? "Start writing your shared notes here..." 
              : isLocked 
                ? `${currentEditor?.username || 'Another user'} is currently writing. You can read but not write.`
                : "Click 'Request to Write' to start writing..."
          }
          className="w-full h-full resize-none border-none outline-none notebook-textarea"
          style={{ 
            fontFamily: '"Courier New", "American Typewriter", Courier, monospace',
            fontSize: '16px',
            lineHeight: '30px',
            padding: '15px 20px 15px 60px',
            backgroundColor: 'transparent',
            color: hasEditPermission ? '#2a1a0a' : '#666',
            cursor: !hasEditPermission ? 'not-allowed' : 'text',
          }}
          disabled={!hasEditPermission}
        />
        
        {/* Typing Indicators - Styled for notebook */}
        {typingText && (
          <div 
            className="absolute flex items-center space-x-2 text-sm italic"
            style={{
              bottom: '12px',
              left: '60px',
              color: '#8b5a2b',
              backgroundColor: 'rgba(248, 240, 224, 0.9)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #d4c5a9',
            }}
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>✍️ {typingText}</span>
          </div>
        )}
      </div>
      
      {/* Footer - Styled like notebook binding */}
      <div 
        className="flex items-center justify-between text-xs"
        style={{
          backgroundColor: '#e8daba',
          padding: '8px 16px',
          borderTop: '1px solid #d4c5a9',
          borderRadius: '0 0 8px 8px',
          color: '#5d4e37',
          background: 'linear-gradient(to bottom, #e8daba, #ddd0b4)',
        }}
      >
        <div className="flex items-center space-x-4">
          <span>📚 Collaborative Notebook</span>
          {user && (
            <span>👤 {user.username}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <span>{content.length} characters</span>
          {hasEditPermission && (
            <div className="flex items-center space-x-1 text-green-700 font-medium">
              <Edit3 className="w-3 h-3" />
              <span>Writing</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurnBasedNotePad;