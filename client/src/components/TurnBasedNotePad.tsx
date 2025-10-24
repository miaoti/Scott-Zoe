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
import { isMobileDevice, getMobileWindowDimensions, getMobileWindowPosition } from '../utils/deviceDetection';

interface TurnBasedNotePadProps {
  onClose?: () => void;
}

const TurnBasedNotePad: React.FC<TurnBasedNotePadProps> = ({ onClose }) => {
  // console.log('TurnBasedNotePad: Component function called');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Drag state for minimized button - moved to top level to avoid conditional hook calls
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const minimizedButtonRef = useRef<HTMLDivElement>(null);
  
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
    minimizedButtonPosition,
    isMinimized,
    isMaximized,
    typingIndicators,
    
    setContent,
    setMinimized,
    setMaximized,
    setMinimizedButtonPosition,
    connect,
    disconnect,
    requestEditControl,
    releaseEditControl,
    updateContent,
    sendTypingIndicator,
    updateWindowPosition,
  } = useTurnBasedNoteStore();
  
  // console.log('TurnBasedNotePad: Store state - isConnected:', isConnected, 'hasEditPermission:', hasEditPermission);
  
  // Connect to WebSocket on mount
  useEffect(() => {
    // console.log('TurnBasedNotePad component mounted');
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      // console.log('Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token && token.trim() !== '' && !isConnected && !isLoading) {
        // console.log('Attempting to connect to WebSocket...');
        connect(token);
      } else if (!token) {
        // console.warn('TurnBasedNotePad: No valid token found for WebSocket connection');
      }
    }
    
    return () => {
      // console.log('TurnBasedNotePad: Component unmounting');
      disconnect();
    };
  }, []); // Remove dependencies to prevent infinite loop
  
  // Debounced content update to prevent race conditions during fast typing
  const debouncedUpdateRef = useRef<NodeJS.Timeout>();
  
  // Handle text changes (only when user has edit permission)
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!hasEditPermission) {
      console.warn('User attempted to edit without permission');
      return;
    }
    
    const newContent = e.target.value;
    // console.log('Text change detected:', { newContent, hasEditPermission });
    
    // Update local content immediately for responsive UI
    setContent(newContent);
    
    // Clear existing debounced update
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }
    
    // Debounce server updates to prevent race conditions during fast typing
    debouncedUpdateRef.current = setTimeout(() => {
      updateContent(newContent);
    }, 300); // 300ms debounce delay
    
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
    
  }, [hasEditPermission, setContent, updateContent, isTyping, sendTypingIndicator]);
  
  // Handle cursor position changes
  const handleCursorChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPosition = e.target.selectionStart;
    setCursorPosition(newPosition);
  }, []);
  
  // Handle edit control request
  const handleRequestEdit = useCallback(async () => {
    // console.log('Requesting edit control...');
    const granted = await requestEditControl();
    // console.log('Edit control request result:', granted);
  }, [requestEditControl]);
  
  // Handle edit control release
  const handleReleaseEdit = useCallback(async () => {
    // console.log('Releasing edit control...');
    await releaseEditControl();
  }, [releaseEditControl]);
  
  // Handle window controls
  const handleMinimize = useCallback(() => {
    setMinimized(!isMinimized);
  }, [isMinimized, setMinimized]);
  
  // Drag functionality state (removed duplicate - using the ones declared at top level)
  
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

  // Touch drag handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const touch = e.touches[0];
    const titleBar = e.currentTarget as HTMLElement;
    const windowElement = titleBar.parentElement;
    if (windowElement) {
      const windowRect = windowElement.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - windowRect.left,
        y: touch.clientY - windowRect.top,
      });
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Get current window dimensions (preserve existing size)
    const currentWidth = windowPosition?.width || 350;
    const currentHeight = windowPosition?.height || 600;
    
    // Ensure window stays within viewport bounds
    const maxX = window.innerWidth - currentWidth;
    const maxY = window.innerHeight - currentHeight;
    
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));
    
    updateWindowPosition(
      clampedX,
      clampedY,
      currentWidth,
      currentHeight
    );
  }, [isDragging, dragOffset, windowPosition, updateWindowPosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault(); // Prevent default touch behavior
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;
    
    // Get current window dimensions (preserve existing size)
    const currentWidth = windowPosition?.width || 350;
    const currentHeight = windowPosition?.height || 600;
    
    // Ensure window stays within viewport bounds
    const maxX = window.innerWidth - currentWidth;
    const maxY = window.innerHeight - currentHeight;
    
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));
    
    updateWindowPosition(
      clampedX,
      clampedY,
      currentWidth,
      currentHeight
    );
  }, [isDragging, dragOffset, windowPosition, updateWindowPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Add mouse and touch event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);
  
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
  
  // Minimized button drag handlers - moved to top level to avoid conditional hook calls
  const handleMinimizedMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    e.stopPropagation();
    
    const rect = minimizedButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  }, []);

  const handleMinimizedMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Constrain to viewport bounds
    const buttonWidth = 100;
    const buttonHeight = 60;
    const constrainedX = Math.max(0, Math.min(window.innerWidth - buttonWidth, newX));
    const constrainedY = Math.max(0, Math.min(window.innerHeight - buttonHeight, newY));
    
    setMinimizedButtonPosition({ x: constrainedX, y: constrainedY });
  }, [isDragging, dragOffset, setMinimizedButtonPosition]);

  const handleMinimizedMouseUp = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setIsDragging(false);
      // Check if it was a click (minimal movement)
      const rect = minimizedButtonRef.current?.getBoundingClientRect();
      if (rect) {
        const moveDistance = Math.sqrt(
          Math.pow(e.clientX - (rect.left + dragOffset.x), 2) + 
          Math.pow(e.clientY - (rect.top + dragOffset.y), 2)
        );
        if (moveDistance < 5) {
          // It was a click, not a drag
          handleMinimize();
        }
      }
    }
  }, [isDragging, dragOffset, handleMinimize]);

  // Touch drag handlers for mobile
  const handleMinimizedTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const rect = minimizedButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
      setIsDragging(true);
    }
  }, []);

  const handleMinimizedTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;
    
    // Constrain to viewport bounds
    const buttonWidth = 100;
    const buttonHeight = 60;
    const constrainedX = Math.max(0, Math.min(window.innerWidth - buttonWidth, newX));
    const constrainedY = Math.max(0, Math.min(window.innerHeight - buttonHeight, newY));
      
      setMinimizedButtonPosition({ x: constrainedX, y: constrainedY });
    }, [isDragging, dragOffset, setMinimizedButtonPosition]);

  const handleMinimizedTouchEnd = useCallback((e: TouchEvent) => {
    if (isDragging) {
      setIsDragging(false);
      // Check if it was a tap (minimal movement)
      const touch = e.changedTouches[0];
      const rect = minimizedButtonRef.current?.getBoundingClientRect();
      if (rect) {
        const moveDistance = Math.sqrt(
          Math.pow(touch.clientX - (rect.left + dragOffset.x), 2) + 
          Math.pow(touch.clientY - (rect.top + dragOffset.y), 2)
        );
        if (moveDistance < 5) {
          // It was a tap, not a drag
          handleMinimize();
        }
      }
    }
  }, [isDragging, dragOffset, handleMinimize]);

  // Add global event listeners for minimized button drag
  useEffect(() => {
    if (isDragging && isMinimized) {
      document.addEventListener('mousemove', handleMinimizedMouseMove);
      document.addEventListener('mouseup', handleMinimizedMouseUp);
      document.addEventListener('touchmove', handleMinimizedTouchMove, { passive: false });
      document.addEventListener('touchend', handleMinimizedTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMinimizedMouseMove);
        document.removeEventListener('mouseup', handleMinimizedMouseUp);
        document.removeEventListener('touchmove', handleMinimizedTouchMove);
        document.removeEventListener('touchend', handleMinimizedTouchEnd);
      };
    }
  }, [isDragging, isMinimized, handleMinimizedMouseMove, handleMinimizedMouseUp, handleMinimizedTouchMove, handleMinimizedTouchEnd]);

  if (isMinimized) {
    // Get default position if not set
    const defaultPosition = minimizedButtonPosition || { 
      x: window.innerWidth - 120, // 100px button width + 20px margin
      y: window.innerHeight - 80   // 60px button height + 20px margin
    };

    return (
      <div 
        ref={minimizedButtonRef}
        className={`fixed cursor-pointer z-50 apple-shadow select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${defaultPosition.x}px`,
          top: `${defaultPosition.y}px`,
          backgroundColor: 'var(--apple-glass-bg)',
          border: '1px solid var(--apple-glass-border)',
          borderRadius: '12px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: isDragging ? 'none' : 'all 0.3s ease',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
        }}
        onMouseDown={handleMinimizedMouseDown}
        onTouchStart={handleMinimizedTouchStart}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--apple-glass-shadow)';
          }
        }}
      >
        <div className="p-3 flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${statusInfo.color} ${statusInfo.spin ? 'animate-spin' : ''}`} />
          <span 
            className="text-sm font-medium"
            style={{ 
              color: 'var(--apple-label)',
              fontFamily: 'var(--font-body)'
            }}
          >
            Notes
          </span>
        </div>
      </div>
    );
  }
  
  // Mobile detection and dimensions
  const isMobile = isMobileDevice();
  const mobileWindowDimensions = isMobile ? getMobileWindowDimensions() : null;
  
  return (
    <div 
      className="fixed z-50 flex flex-col apple-shadow"
      style={{
        left: windowPosition?.xPosition || 100,
        top: windowPosition?.yPosition || 100,
        width: isMobile ? (mobileWindowDimensions?.width || 280) : (windowPosition?.width || 350),
        height: isMobile ? (mobileWindowDimensions?.height || 400) : (windowPosition?.height || 600),
        minWidth: isMobile ? 250 : 300,
        minHeight: isMobile ? 300 : 400,
        maxWidth: isMobile ? '95vw' : '90vw',
        maxHeight: isMobile ? '85vh' : '90vh',
        backgroundColor: 'var(--apple-system-background)',
        border: '1px solid var(--apple-glass-border)',
        borderRadius: isMobile ? '8px' : '12px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        fontFamily: 'var(--font-body)',
        overflow: 'hidden',
        // Mobile-specific touch optimizations
        ...(isMobile && {
          touchAction: 'manipulation',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }),
      }}
    >
      {/* Header/Title Bar */}
      <div 
        className="cursor-move flex items-center justify-between select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          backgroundColor: 'var(--apple-secondary-background)',
          color: 'var(--apple-label)',
          padding: '12px 16px',
          borderRadius: '12px 12px 0 0',
          borderBottom: '1px solid var(--apple-separator)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-base">
            Notes
          </span>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              ) : isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm" style={{ color: 'var(--apple-secondary-label)' }}>
                {isLoading ? 'Connecting' : isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="w-px h-4" style={{ backgroundColor: 'var(--apple-separator)' }}></div>
            <div className="flex items-center space-x-1">
              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
              <span className="text-sm" style={{ color: 'var(--apple-secondary-label)' }}>
                {statusInfo.text}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMinimize();
            }}
            className="p-2 rounded-full transition-all duration-200"
            title="Minimize"
            style={{ 
              color: 'var(--apple-secondary-label)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--apple-gray-5)';
              e.currentTarget.style.color = 'var(--apple-label)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--apple-secondary-label)';
            }}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-all duration-200 text-lg font-medium"
              title="Close"
              style={{ 
                color: 'var(--apple-secondary-label)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--apple-gray-5)';
                e.currentTarget.style.color = 'var(--apple-label)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--apple-secondary-label)';
              }}
            >
              ×
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
            borderBottom: '1px solid var(--apple-separator)',
            backgroundColor: error ? '#FFEBEE' : '#E3F2FD',
            color: error ? '#FF3B30' : 'var(--apple-blue)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {error ? (
            <AlertCircle className="w-4 h-4" style={{ color: '#FF3B30' }} />
          ) : (
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--apple-blue)' }} />
          )}
          <span>{error || editRequestMessage}</span>
        </div>
      )}
      
      {/* Content Area */}
      <div 
        className="flex-1 relative"
        style={{
          backgroundColor: 'var(--apple-system-background)',
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
                ? `${currentEditor?.username || 'Another user'} is currently editing. You can read but not edit.`
                : "Click 'Request Edit' to start editing..."
          }
          className="w-full h-full resize-none border-none outline-none"
          style={{ 
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            lineHeight: '1.5',
            padding: '16px',
            paddingBottom: '60px', // Extra padding for floating buttons
            backgroundColor: 'transparent',
            color: 'var(--apple-label)', // Always use normal text color, not grayed out
            cursor: 'text', // Always allow text cursor for selection
          }}
          readOnly={!hasEditPermission} // Use readOnly instead of disabled to allow text selection
        />
        
        {/* Floating Edit Control Buttons */}
        <div 
          className="absolute flex items-center space-x-2"
          style={{
            bottom: '16px',
            right: '16px',
            zIndex: 10,
          }}
        >
          {!hasEditPermission && !isLocked && (
            <button
              onClick={handleRequestEdit}
              disabled={isRequestingEdit}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 shadow-lg"
              style={{
                backgroundColor: isRequestingEdit ? 'var(--apple-gray-3)' : 'var(--apple-blue)',
                color: 'white',
                border: 'none',
                fontFamily: 'var(--font-body)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              title={isRequestingEdit ? "Requesting edit permission..." : "Request edit permission"}
            >
              {isRequestingEdit ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Requesting</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </>
              )}
            </button>
          )}
          
          {hasEditPermission && (
            <button
              onClick={handleReleaseEdit}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 shadow-lg"
              style={{
                backgroundColor: '#FF3B30',
                color: 'white',
                border: 'none',
                fontFamily: 'var(--font-body)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF6B60';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FF3B30';
              }}
              title="Stop editing and release control"
            >
              <Unlock className="w-3 h-3" />
              <span>Stop</span>
            </button>
          )}
        </div>
        
        {/* Typing Indicators */}
        {typingText && (
          <div 
            className="absolute flex items-center space-x-2 text-sm"
            style={{
              bottom: '12px',
              left: '16px',
              color: 'var(--apple-secondary-label)',
              backgroundColor: 'var(--apple-glass-bg)',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--apple-glass-border)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--apple-blue)', animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--apple-blue)', animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--apple-blue)', animationDelay: '300ms' }}></div>
            </div>
            <span>{typingText}</span>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div 
        className="flex items-center justify-between text-xs"
        style={{
          backgroundColor: 'var(--apple-secondary-background)',
          padding: '8px 16px',
          borderTop: '1px solid var(--apple-separator)',
          borderRadius: '0 0 12px 12px',
          color: 'var(--apple-secondary-label)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div className="flex items-center space-x-4">
          {/* <span>Shared Notes</span> */}
          {user && (
            <span>{user.username}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <span>{content.length} characters</span>
          {hasEditPermission && (
            <div className="flex items-center space-x-1 font-medium" style={{ color: 'var(--apple-blue)' }}>
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