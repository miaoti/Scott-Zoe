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
  console.log('SharedNotePad: Component function called');
  
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
  
  console.log('SharedNotePad: Store state - isConnected:', isConnected, 'isLoading:', isLoading, 'error:', error);
  
  // Connect to WebSocket on mount
  useEffect(() => {
    console.log('SharedNotePad component mounted');
    console.log('isConnected:', isConnected);
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    
    // Check if we have window and localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token && token.trim() !== '' && !isConnected && !isLoading) {
        console.log('Attempting to connect to WebSocket...');
        console.log('WebSocket URL will be:', 'ws://localhost:8080/ws');
        connect(token);
      } else if (!token) {
        console.warn('SharedNotePad: No valid token found for WebSocket connection');
      } else {
        console.log('SharedNotePad: Connection not attempted - isConnected:', isConnected, 'isLoading:', isLoading);
      }
    }
    
    return () => {
      console.log('SharedNotePad: Component unmounting');
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Handle text changes
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const currentContent = content;
    
    console.log('Text change detected:', {
      oldContent: currentContent,
      newContent: newContent,
      oldLength: currentContent.length,
      newLength: newContent.length,
      isConnected,
      cursorPosition
    });
    
    // Calculate the operation BEFORE updating local content
    const operation = calculateOperation(currentContent, newContent, cursorPosition);
    
    console.log('Calculated operation:', operation);
    
    if (operation && isConnected) {
      console.log('Sending operation to server:', operation);
      // Send operation to server for synchronization
      sendOperation(operation);
      
      // For DELETE operations, update local content immediately for better UX
      // The server confirmation will ensure consistency
      if (operation.operationType === 'DELETE') {
        console.log('DELETE operation - updating local content immediately for better UX');
        setContent(newContent);
      } else {
        // For INSERT operations, wait for server confirmation to prevent double application
        console.log('Operation sent to server, waiting for confirmation before updating content');
      }
    } else if (!isConnected) {
      // If not connected, just update locally
      setContent(newContent);
      console.log('Not connected - only updating local content');
    } else {
      console.log('No operation calculated - content unchanged or invalid');
      // Still update content even if no operation (e.g., for cursor movements)
      setContent(newContent);
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
    
  }, [content, cursorPosition, isTyping, isConnected, setContent, sendOperation, sendTypingIndicator]);
  
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
      {typingIndicators.filter(indicator => indicator.userId !== user?.id).length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingIndicators.filter(indicator => indicator.userId !== user?.id).map(t => t.username).join(', ')} 
              {typingIndicators.filter(indicator => indicator.userId !== user?.id).length === 1 ? ' is' : ' are'} typing...
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
          disabled={false}
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
    console.log('calculateOperation: No change detected, returning null');
    return null;
  }
  
  console.log('=== calculateOperation DEBUG START ===');
  console.log('calculateOperation called:', {
    oldContent: `"${oldContent}"`,
    newContent: `"${newContent}"`,
    cursorPos,
    oldLength: oldContent.length,
    newLength: newContent.length,
    lengthDiff: newContent.length - oldContent.length
  });
  
  if (newContent.length > oldContent.length) {
    // Insertion - find where the text was actually inserted
    const insertedLength = newContent.length - oldContent.length;
    
    console.log('INSERTION detected:', {
      insertedLength,
      cursorPos,
      oldContentLength: oldContent.length,
      newContentLength: newContent.length
    });
    
    // Find the insertion position by comparing old and new content
    let insertPosition = 0;
    let insertedText = '';
    
    // Find the first position where old and new content differ
    for (let i = 0; i < Math.min(oldContent.length, newContent.length); i++) {
      if (oldContent[i] !== newContent[i]) {
        insertPosition = i;
        break;
      }
    }
    
    // If no difference found in overlapping part, insertion is at the end
    if (insertPosition === 0 && oldContent.length > 0) {
      // Check if insertion is at the end
      if (newContent.startsWith(oldContent)) {
        insertPosition = oldContent.length;
        insertedText = newContent.slice(oldContent.length);
      } else {
        // Find insertion position by checking from the end
        let endMatch = 0;
        for (let i = 1; i <= Math.min(oldContent.length, newContent.length); i++) {
          if (oldContent[oldContent.length - i] === newContent[newContent.length - i]) {
            endMatch = i;
          } else {
            break;
          }
        }
        insertPosition = oldContent.length - endMatch;
        insertedText = newContent.slice(insertPosition, insertPosition + insertedLength);
      }
    } else {
      // Extract the inserted text at the found position
      insertedText = newContent.slice(insertPosition, insertPosition + insertedLength);
    }
    
    // Ensure position is within bounds
    insertPosition = Math.max(0, Math.min(insertPosition, oldContent.length));
    
    console.log('Insertion analysis:', {
      insertPosition,
      insertedText: `"${insertedText}"`,
      oldContent: `"${oldContent}"`,
      newContent: `"${newContent}"`,
      verification: {
        before: `"${oldContent.slice(0, insertPosition)}"`,
        inserted: `"${insertedText}"`,
        after: `"${oldContent.slice(insertPosition)}"`,
        reconstructed: `"${oldContent.slice(0, insertPosition) + insertedText + oldContent.slice(insertPosition)}"`,
        matches: (oldContent.slice(0, insertPosition) + insertedText + oldContent.slice(insertPosition)) === newContent
      }
    });
    
    const operation = {
      operationType: 'INSERT' as const,
      position: insertPosition,
      content: insertedText,
      length: insertedLength,
    };
    
    console.log('=== FINAL INSERT OPERATION ===:', operation);
    console.log('=== calculateOperation DEBUG END ===');
    
    return operation;
  } else if (newContent.length < oldContent.length) {
    // Deletion - use cursor position for deletion point
    const deletedLength = oldContent.length - newContent.length;
    let deletePosition = cursorPos;
    
    // Ensure position is within bounds
    deletePosition = Math.max(0, Math.min(deletePosition, oldContent.length - deletedLength));
    
    console.log('DELETE operation:', {
      position: deletePosition,
      length: deletedLength,
      oldContent: `"${oldContent}"`,
      newContent: `"${newContent}"`,
      cursorPos
    });
    
    return {
      operationType: 'DELETE',
      position: deletePosition,
      length: deletedLength,
    };
  }
  
  console.log('calculateOperation: No operation type matched, returning null');
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