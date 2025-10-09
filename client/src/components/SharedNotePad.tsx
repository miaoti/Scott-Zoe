import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Minimize2, 
  Users, 
  Wifi, 
  WifiOff,
  Edit3,
  Loader2
} from 'lucide-react';
import { useSharedNoteStore } from '../stores/sharedNoteStore';
import { useAuth } from '../contexts/AuthContext';

interface SharedNotePadProps {
  onClose?: () => void;
}

const SharedNotePad: React.FC<SharedNotePadProps> = ({ onClose }) => {
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
    windowPosition,
    isMinimized,
    isMaximized,
    collaborators,
    typingIndicators,
    
    setContent,
    setMinimized,
    setMaximized,
    connect,
    disconnect,
    sendOperation,
    sendCursorPosition,
    sendTypingIndicator,
    updateWindowPosition,
  } = useSharedNoteStore();
  
  // Connect to WebSocket on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token && token.trim() !== '') {
        connect(token);
      } else {
        console.warn('SharedNotePad: No valid token found for WebSocket connection');
      }
    } catch (error) {
      console.error('SharedNotePad: Error connecting to WebSocket:', error);
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Handle text changes
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const currentContent = content;
    
    // Calculate the operation
    const operation = calculateOperation(currentContent, newContent, cursorPosition);
    
    if (operation) {
      // DON'T update local content immediately - let the server handle it
      // This prevents duplicate characters and local echo issues
      
      // Send operation to server
      sendOperation(operation);
    }
    
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
    
  }, [content, cursorPosition, isTyping, sendOperation, sendTypingIndicator]);
  
  // Handle cursor position changes
  const handleCursorChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPosition = e.target.selectionStart;
    setCursorPosition(newPosition);
    sendCursorPosition(newPosition);
  }, [sendCursorPosition]);
  
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
    
    // Get the window's current position from the parent element (the actual window div)
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
  
  // Add global mouse event listeners for dragging
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
  
  // Window position and size - default to top-right corner
  const windowStyle = {
    position: 'fixed' as const,
    left: windowPosition?.xPosition !== undefined ? windowPosition.xPosition : window.innerWidth - 420,
    top: windowPosition?.yPosition || 80,
    width: windowPosition?.width || 400,
    height: windowPosition?.height || 300,
    zIndex: 1000,
    opacity: isDragging ? 0.8 : 1,
  };
  
  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
        className="bg-white border border-gray-300 rounded-lg shadow-lg p-2 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={handleMinimize}
      >
        <div className="flex items-center space-x-2">
          <Edit3 className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">Shared Notes</span>
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div
      style={windowStyle}
      className="bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 flex items-center justify-between cursor-move select-none"
      >
        <div className="flex items-center space-x-2">
          <Edit3 className="w-4 h-4" />
          <span className="font-medium">Shared Notes</span>
          
          {/* Connection Status */}
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isConnected ? (
            <Wifi className="w-3 h-3 text-green-200" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-200" />
          )}
          
          {/* Collaborators Count */}
          {collaborators.length > 0 && (
            <div className="flex items-center space-x-1 text-xs bg-white/20 rounded-full px-2 py-1">
              <Users className="w-3 h-3" />
              <span>{collaborators.length}</span>
            </div>
          )}
        </div>
        
        {/* Window Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleMinimize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {/* Typing Indicators */}
      {typingIndicators.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingIndicators.map(t => t.username).join(', ')} 
              {typingIndicators.length === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        </div>
      )}
      
      {/* Text Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onSelect={handleCursorChange}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          placeholder="Start typing your shared notes here..."
          className="w-full h-full p-4 border-none outline-none resize-none font-mono text-sm leading-relaxed"
          disabled={!isConnected}
        />
        
        {/* Collaborator Cursors */}
        {collaborators.map((collaborator) => (
          <CollaboratorCursor
            key={collaborator.userId}
            collaborator={collaborator}
            textareaRef={textareaRef}
          />
        ))}
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Characters: {content.length}</span>
          <span>Lines: {content.split('\n').length}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <span className="text-green-600">Connected</span>
          ) : (
            <span className="text-red-600">Disconnected</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Collaborator Cursor Component
interface CollaboratorCursorProps {
  collaborator: {
    userId: number;
    username: string;
    position: number;
    timestamp: string;
  };
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const CollaboratorCursor: React.FC<CollaboratorCursorProps> = ({ collaborator, textareaRef }) => {
  const [cursorStyle, setCursorStyle] = useState<React.CSSProperties>({});
  
  useEffect(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const position = Math.min(collaborator.position, textarea.value.length);
    
    // Create a temporary element to measure text position
    const div = document.createElement('div');
    const computedStyle = window.getComputedStyle(textarea);
    
    // Copy textarea styles to div
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.font = computedStyle.font;
    div.style.padding = computedStyle.padding;
    div.style.border = computedStyle.border;
    div.style.width = computedStyle.width;
    
    // Add text up to cursor position
    div.textContent = textarea.value.substring(0, position);
    
    // Add a span to measure cursor position
    const span = document.createElement('span');
    span.textContent = '|';
    div.appendChild(span);
    
    document.body.appendChild(div);
    
    const spanRect = span.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    
    setCursorStyle({
      position: 'absolute',
      left: spanRect.left - textareaRect.left,
      top: spanRect.top - textareaRect.top,
      width: '2px',
      height: '1.2em',
      backgroundColor: getCollaboratorColor(collaborator.userId),
      pointerEvents: 'none',
      zIndex: 10,
    });
    
    document.body.removeChild(div);
  }, [collaborator.position, collaborator.userId, textareaRef]);
  
  return (
    <>
      <div style={cursorStyle} />
      <div
        style={{
          position: 'absolute',
          left: cursorStyle.left,
          top: (cursorStyle.top as number) - 20,
          backgroundColor: getCollaboratorColor(collaborator.userId),
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          pointerEvents: 'none',
          zIndex: 11,
          whiteSpace: 'nowrap',
        }}
      >
        {collaborator.username}
      </div>
    </>
  );
};

// Helper function to calculate operation from content changes
function calculateOperation(
  oldContent: string, 
  newContent: string, 
  cursorPos: number
): { operationType: 'INSERT' | 'DELETE' | 'RETAIN'; position: number; content?: string; length: number } | null {
  
  if (oldContent === newContent) {
    return null;
  }
  
  // Simple diff algorithm - can be improved with more sophisticated algorithms
  if (newContent.length > oldContent.length) {
    // Insertion
    const insertedText = newContent.slice(cursorPos - (newContent.length - oldContent.length), cursorPos);
    return {
      operationType: 'INSERT',
      position: cursorPos - (newContent.length - oldContent.length),
      content: insertedText,
      length: insertedText.length,
    };
  } else if (newContent.length < oldContent.length) {
    // Deletion
    const deletedLength = oldContent.length - newContent.length;
    return {
      operationType: 'DELETE',
      position: cursorPos,
      length: deletedLength,
    };
  }
  
  return null;
}

// Helper function to get consistent colors for collaborators
function getCollaboratorColor(userId: number): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[userId % colors.length];
}

export default SharedNotePad;