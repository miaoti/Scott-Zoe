import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Helper function to get the proper WebSocket URL
const getWebSocketUrl = () => {
  // For production (non-localhost), always use the same origin as the current page
  if (window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  
  // For local development, check if we have a custom API URL
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // If the page is loaded over HTTPS, ensure the API URL is also HTTPS
    if (window.location.protocol === 'https:' && apiUrl.startsWith('http:')) {
      return apiUrl.replace('http:', 'https:');
    }
    return apiUrl;
  }
  
  // Local development default - use HTTPS if the page is loaded over HTTPS
  if (window.location.protocol === 'https:') {
    return 'https://localhost:8080';
  }
  
  return 'http://localhost:8080';
};

export interface NoteOperation {
  id?: number;
  noteId: number;
  userId: number;
  operationType: 'INSERT' | 'DELETE' | 'RETAIN';
  position: number;
  content?: string;
  length: number;
  createdAt: string;
  sequenceNumber: number;
}

export interface WindowPosition {
  id?: number;
  userId: number;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  updatedAt: string;
}

export interface CollaboratorCursor {
  userId: number;
  username: string;
  position: number;
  timestamp: string;
}

export interface TypingIndicator {
  userId: number;
  username: string;
  isTyping: boolean;
  timestamp: string;
}

interface SharedNoteState {
  // Note content and metadata
  noteId: number | null;
  content: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Window state
  windowPosition: WindowPosition | null;
  isWindowVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  
  // Collaboration state
  collaborators: CollaboratorCursor[];
  typingIndicators: TypingIndicator[];
  
  // WebSocket client
  stompClient: Client | null;
  
  // Actions
  setContent: (content: string) => void;
  setNoteId: (noteId: number) => void;
  setWindowPosition: (position: WindowPosition) => void;
  setWindowVisible: (visible: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setMaximized: (maximized: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // WebSocket actions
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  sendOperation: (operation: Omit<NoteOperation, 'id' | 'noteId' | 'userId' | 'createdAt' | 'sequenceNumber'>) => void;
  sendCursorPosition: (position: number) => void;
  sendTypingIndicator: (isTyping: boolean) => void;
  updateWindowPosition: (x: number, y: number, width: number, height: number) => void;
  
  // Collaboration actions
  updateCollaboratorCursor: (cursor: CollaboratorCursor) => void;
  updateTypingIndicator: (indicator: TypingIndicator) => void;
  removeCollaborator: (userId: number) => void;
}

export const useSharedNoteStore = create<SharedNoteState>((set, get) => ({
  // Initial state
  noteId: null,
  content: '',
  isConnected: false,
  isLoading: false,
  error: null,
  
  windowPosition: null,
  isWindowVisible: false,
  isMinimized: false,
  isMaximized: false,
  
  collaborators: [],
  typingIndicators: [],
  
  stompClient: null,
  
  // Basic actions
  setContent: (content: string) => set({ content }),
  setNoteId: (noteId: number) => set({ noteId }),
  setWindowPosition: (position: WindowPosition) => set({ windowPosition: position }),
  setWindowVisible: (visible: boolean) => set({ isWindowVisible: visible }),
  setMinimized: (minimized: boolean) => set({ isMinimized: minimized }),
  setMaximized: (maximized: boolean) => set({ isMaximized: maximized }),
  setError: (error: string | null) => set({ error }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  // WebSocket connection
  connect: async (token: string) => {
    const state = get();
    if (state.stompClient?.connected) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const wsUrl = getWebSocketUrl();
      const socket = new SockJS(`${wsUrl}/ws`);
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });
      
      client.onConnect = () => {
        console.log('Connected to shared note WebSocket');
        set({ isConnected: true, isLoading: false, stompClient: client });
        
        // Subscribe to shared note updates
        client.subscribe('/topic/shared-note/operations', (message) => {
          const data = JSON.parse(message.body);
          handleOperationMessage(data);
        });
        
        client.subscribe('/topic/shared-note/cursors', (message) => {
          const data = JSON.parse(message.body);
          handleCursorMessage(data);
        });
        
        client.subscribe('/topic/shared-note/typing', (message) => {
          const data = JSON.parse(message.body);
          handleTypingMessage(data);
        });
        
        client.subscribe('/topic/shared-note/sync', (message) => {
          const data = JSON.parse(message.body);
          handleSyncMessage(data);
        });
        
        // Subscribe to personal updates
        client.subscribe('/user/queue/shared-note/updates', (message) => {
          const data = JSON.parse(message.body);
          handlePersonalMessage(data);
        });
        
        // Send subscription message
        client.publish({
          destination: '/app/shared-note/subscribe',
          body: JSON.stringify({ timestamp: new Date().toISOString() }),
        });
      };
      
      client.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        set({ error: 'Connection error', isLoading: false, isConnected: false });
      };
      
      client.onDisconnect = () => {
        console.log('Disconnected from shared note WebSocket');
        set({ isConnected: false });
      };
      
      client.activate();
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      set({ error: 'Failed to connect', isLoading: false });
    }
  },
  
  disconnect: () => {
    const state = get();
    if (state.stompClient) {
      state.stompClient.deactivate();
      set({ stompClient: null, isConnected: false });
    }
  },
  
  // Operation sending
  sendOperation: (operation) => {
    const state = get();
    if (!state.stompClient?.connected) {
      console.warn('Cannot send operation: not connected');
      return;
    }
    
    state.stompClient.publish({
      destination: '/app/shared-note/operation',
      body: JSON.stringify(operation),
    });
  },
  
  sendCursorPosition: (position: number) => {
    const state = get();
    if (!state.stompClient?.connected) return;
    
    state.stompClient.publish({
      destination: '/app/shared-note/cursor',
      body: JSON.stringify({ position }),
    });
  },
  
  sendTypingIndicator: (isTyping: boolean) => {
    const state = get();
    if (!state.stompClient?.connected) return;
    
    state.stompClient.publish({
      destination: '/app/shared-note/typing',
      body: JSON.stringify({ isTyping }),
    });
  },
  
  updateWindowPosition: (x: number, y: number, width: number, height: number) => {
    const state = get();
    if (!state.stompClient?.connected) return;
    
    const position = {
      xPosition: x,
      yPosition: y,
      width,
      height,
    };
    
    state.stompClient.publish({
      destination: '/app/shared-note/window-position',
      body: JSON.stringify(position),
    });
    
    // Update local state
    set({
      windowPosition: {
        ...state.windowPosition,
        ...position,
        updatedAt: new Date().toISOString(),
      } as WindowPosition,
    });
  },
  
  // Collaboration actions
  updateCollaboratorCursor: (cursor: CollaboratorCursor) => {
    set((state) => ({
      collaborators: [
        ...state.collaborators.filter(c => c.userId !== cursor.userId),
        cursor,
      ],
    }));
  },
  
  updateTypingIndicator: (indicator: TypingIndicator) => {
    set((state) => ({
      typingIndicators: indicator.isTyping
        ? [...state.typingIndicators.filter(t => t.userId !== indicator.userId), indicator]
        : state.typingIndicators.filter(t => t.userId !== indicator.userId),
    }));
  },
  
  removeCollaborator: (userId: number) => {
    set((state) => ({
      collaborators: state.collaborators.filter(c => c.userId !== userId),
      typingIndicators: state.typingIndicators.filter(t => t.userId !== userId),
    }));
  },
}));

// Message handlers
function handleOperationMessage(data: any) {
  const { setContent, content } = useSharedNoteStore.getState();
  
  if (data.type === 'OPERATION') {
    // Apply the operation to current content
    const newContent = applyOperation(content, data.operation);
    setContent(newContent);
  }
}

function handleCursorMessage(data: any) {
  const { updateCollaboratorCursor } = useSharedNoteStore.getState();
  
  if (data.type === 'CURSOR_POSITION') {
    updateCollaboratorCursor({
      userId: data.userId,
      username: data.username,
      position: data.position,
      timestamp: data.timestamp,
    });
  }
}

function handleTypingMessage(data: any) {
  const { updateTypingIndicator } = useSharedNoteStore.getState();
  
  if (data.type === 'TYPING_STATUS') {
    updateTypingIndicator({
      userId: data.userId,
      username: data.username,
      isTyping: data.isTyping,
      timestamp: data.timestamp,
    });
  }
}

function handleSyncMessage(data: any) {
  const { setContent, setNoteId } = useSharedNoteStore.getState();
  
  if (data.type === 'CONTENT_SYNC') {
    setContent(data.content);
    setNoteId(data.noteId);
  }
}

function handlePersonalMessage(data: any) {
  const { setContent, setNoteId } = useSharedNoteStore.getState();
  
  if (data.type === 'INITIAL_CONTENT') {
    setContent(data.content);
    setNoteId(data.noteId);
  }
}

// Helper function to apply operations to content
function applyOperation(content: string, operation: NoteOperation): string {
  try {
    switch (operation.operationType) {
      case 'INSERT':
        const insertPos = Math.max(0, Math.min(operation.position, content.length));
        return content.slice(0, insertPos) + (operation.content || '') + content.slice(insertPos);
      
      case 'DELETE':
        const deletePos = Math.max(0, Math.min(operation.position, content.length));
        const deleteLength = Math.max(0, Math.min(operation.length, content.length - deletePos));
        return content.slice(0, deletePos) + content.slice(deletePos + deleteLength);
      
      case 'RETAIN':
        return content; // RETAIN doesn't change content
      
      default:
        console.warn('Unknown operation type:', operation.operationType);
        return content;
    }
  } catch (error) {
    console.error('Error applying operation:', error);
    return content;
  }
}