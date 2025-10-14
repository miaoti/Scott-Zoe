import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { isMobileDevice, getMobileWindowDimensions, getMobileWindowPosition } from '../utils/deviceDetection';

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

// Helper function to get API base URL
const getApiUrl = () => {
  const wsUrl = getWebSocketUrl();
  return `${wsUrl}/api`;
};

export interface EditSession {
  id: number;
  noteId: number;
  currentEditor: {
    id: number;
    username: string;
  };
  lockAcquiredAt: string;
  lastActivityAt: string;
  isActive: boolean;
}

export interface EditControlMessage {
  type: 'REQUEST_EDIT_CONTROL' | 'GRANT_EDIT_CONTROL' | 'DENY_EDIT_CONTROL' | 
        'RELEASE_EDIT_CONTROL' | 'EDIT_CONTROL_GRANTED' | 'EDIT_CONTROL_RELEASED' |
        'CONTENT_UPDATE' | 'TYPING_STATUS';
  noteId: number;
  userId: number;
  username?: string;
  sessionId?: string;
  content?: string;
  cursorPosition?: number;
  isTyping?: boolean;
  message?: string;
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

export interface TypingIndicator {
  userId: number;
  username: string;
  isTyping: boolean;
  timestamp: string;
}

interface TurnBasedNoteState {
  // Note content and metadata
  noteId: number | null;
  content: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Edit control state
  hasEditPermission: boolean;
  isLocked: boolean;
  currentEditor: { id: number; username: string } | null;
  isRequestingEdit: boolean;
  editRequestMessage: string | null;
  
  // Window state
  windowPosition: WindowPosition | null;
  isWindowVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  
  // Collaboration state
  typingIndicators: TypingIndicator[];
  
  // WebSocket client
  stompClient: Client | null;
  sessionId: string | null;
  
  // Actions
  setContent: (content: string) => void;
  setNoteId: (noteId: number) => void;
  setWindowPosition: (position: WindowPosition) => void;
  setWindowVisible: (visible: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setMaximized: (maximized: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Edit control actions
  requestEditControl: () => Promise<boolean>;
  releaseEditControl: () => Promise<void>;
  updateContent: (content: string) => Promise<void>;
  
  // WebSocket actions
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  sendTypingIndicator: (isTyping: boolean) => void;
  updateWindowPosition: (x: number, y: number, width: number, height: number) => void;
  
  // Collaboration actions
  updateTypingIndicator: (indicator: TypingIndicator) => void;
  removeTypingIndicator: (userId: number) => void;
  
  // API actions
  fetchEditStatus: () => Promise<void>;
  fetchNoteContent: () => Promise<void>;
}

export const useTurnBasedNoteStore = create<TurnBasedNoteState>((set, get) => ({
  // Initial state
  noteId: 1, // Default to note ID 1
  content: '',
  isConnected: false,
  isLoading: false,
  error: null,
  
  // Edit control state
  hasEditPermission: false,
  isLocked: false,
  currentEditor: null,
  isRequestingEdit: false,
  editRequestMessage: null,
  
  windowPosition: (() => {
    // Try to restore window position from localStorage
    try {
      const saved = localStorage.getItem('turnBasedNoteWindowPosition');
      if (saved) {
        return JSON.parse(saved) as WindowPosition;
      }
    } catch (error) {
      console.warn('Failed to restore window position from localStorage:', error);
    }
    
    // Check if mobile device and set appropriate default position
    if (isMobileDevice()) {
      const mobilePosition = getMobileWindowPosition();
      const mobileDimensions = getMobileWindowDimensions();
      
      return {
        userId: 0, // Will be updated when user is available
        xPosition: mobilePosition.x,
        yPosition: mobilePosition.y,
        width: mobileDimensions.width,
        height: mobileDimensions.height,
        updatedAt: new Date().toISOString(),
      };
    }
    
    // Default position for desktop: top-right corner, below page header
    return {
      userId: 0, // Will be updated when user is available
      xPosition: window.innerWidth - 370, // 350px width + 20px margin
      yPosition: 140, // Increased clearance for page header (Chrome compatibility)
      width: 350,
      height: 600,
      updatedAt: new Date().toISOString(),
    };
  })(),
  isWindowVisible: false,
  isMinimized: false,
  isMaximized: false,
  
  typingIndicators: [],
  
  stompClient: null,
  sessionId: null,
  
  // Basic actions
  setContent: (content: string) => set({ content }),
  setNoteId: (noteId: number) => set({ noteId }),
  setWindowPosition: (position: WindowPosition) => set({ windowPosition: position }),
  setWindowVisible: (visible: boolean) => set({ isWindowVisible: visible }),
  setMinimized: (minimized: boolean) => set({ isMinimized: minimized }),
  setMaximized: (maximized: boolean) => set({ isMaximized: maximized }),
  setError: (error: string | null) => set({ error }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  // Edit control actions
  requestEditControl: async () => {
    const state = get();
    if (!state.noteId || state.isRequestingEdit) return false;
    
    set({ isRequestingEdit: true, editRequestMessage: null });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await fetch(`${getApiUrl()}/edit-control/request/${state.noteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: state.sessionId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to request edit control');
      }
      
      const result = await response.json();
      
      if (result.granted) {
        set({
          hasEditPermission: true,
          isLocked: true,
          currentEditor: result.session.currentEditor,
          isRequestingEdit: false,
          editRequestMessage: null, // Remove the message
        });
        
        // Send WebSocket message for real-time updates
        if (state.stompClient?.connected) {
          state.stompClient.publish({
            destination: '/app/shared-note/edit-control',
            body: JSON.stringify({
              type: 'REQUEST_EDIT_CONTROL',
              noteId: state.noteId,
              sessionId: state.sessionId,
            }),
          });
        }
        
        return true;
      } else {
        set({
          hasEditPermission: false,
          currentEditor: result.currentEditor || null,
          isRequestingEdit: false,
          editRequestMessage: result.message || 'Edit control denied',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting edit control:', error);
      set({
        isRequestingEdit: false,
        editRequestMessage: 'Failed to request edit control',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  },
  
  releaseEditControl: async () => {
    const state = get();
    if (!state.noteId || !state.hasEditPermission) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await fetch(`${getApiUrl()}/edit-control/release/${state.noteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to release edit control');
      }
      
      set({
        hasEditPermission: false,
        isLocked: false,
        currentEditor: null,
        editRequestMessage: null, // Remove the message
      });
      
      // Send WebSocket message for real-time updates
      if (state.stompClient?.connected) {
        state.stompClient.publish({
          destination: '/app/shared-note/edit-control',
          body: JSON.stringify({
            type: 'RELEASE_EDIT_CONTROL',
            noteId: state.noteId,
            sessionId: state.sessionId,
          }),
        });
      }
      
    } catch (error) {
      console.error('Error releasing edit control:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  
  updateContent: async (content: string) => {
    const state = get();
    if (!state.noteId || !state.hasEditPermission) {
      console.warn('Cannot update content: no edit permission');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }
      
      // Don't update local content here - it's already updated in the component
      // This prevents overwriting user input during fast typing
      
      // Send to server
      const response = await fetch(`${getApiUrl()}/edit-control/content/${state.noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update content');
      }
      
      // Send WebSocket message for real-time updates
      if (state.stompClient?.connected) {
        state.stompClient.publish({
          destination: '/app/shared-note/edit-control',
          body: JSON.stringify({
            type: 'CONTENT_UPDATE',
            noteId: state.noteId,
            content,
            cursorPosition: 0, // TODO: Get actual cursor position
          }),
        });
      }
      
    } catch (error) {
      console.error('Error updating content:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  
  // WebSocket connection
  connect: async (token: string) => {
    console.log('TurnBasedNoteStore: connect() called');
    
    const state = get();
    if (state.stompClient?.connected || state.isLoading) {
      console.log('Already connected or connecting to WebSocket, skipping connection');
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const wsUrl = getWebSocketUrl();
      console.log('WebSocket URL:', wsUrl);
      
      const socket = new SockJS(`${wsUrl}/ws`);
      const sessionId = Date.now() + Math.random().toString(36);
      
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          // console.log('STOMP Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });
      
      client.onConnect = (frame) => {
        console.log('Connected to turn-based note WebSocket:', frame);
        set({ 
          isConnected: true, 
          isLoading: false, 
          stompClient: client,
          sessionId,
        });
        
        // Subscribe to edit control messages
        client.subscribe('/user/queue/shared-note/edit-control', (message) => {
          const data: EditControlMessage = JSON.parse(message.body);
          handleEditControlMessage(data);
        });
        
        // Subscribe to edit control broadcasts
        client.subscribe('/topic/shared-note/edit-control', (message) => {
          const data: EditControlMessage = JSON.parse(message.body);
          handleEditControlBroadcast(data);
        });
        
        // Subscribe to content updates
        client.subscribe('/topic/shared-note/content', (message) => {
          const data: EditControlMessage = JSON.parse(message.body);
          handleContentUpdate(data);
        });
        
        // Subscribe to typing indicators
        client.subscribe('/topic/shared-note/typing', (message) => {
          const data: EditControlMessage = JSON.parse(message.body);
          handleTypingUpdate(data);
        });
        
        // Removed automatic edit status and content fetching
        // Edit control should only be requested when user clicks edit button
        // setTimeout(() => {
        //   get().fetchEditStatus();
        //   get().fetchNoteContent();
        // }, 100);
      };
      
      client.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        set({ error: 'Connection error', isLoading: false, isConnected: false });
      };
      
      client.onDisconnect = () => {
        console.log('Disconnected from turn-based note WebSocket');
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
      set({ stompClient: null, isConnected: false, sessionId: null });
    }
  },
  
  sendTypingIndicator: (isTyping: boolean) => {
    const state = get();
    if (!state.stompClient?.connected || !state.hasEditPermission) return;
    
    state.stompClient.publish({
      destination: '/app/shared-note/edit-control',
      body: JSON.stringify({
        type: 'TYPING_STATUS',
        noteId: state.noteId,
        isTyping,
      }),
    });
  },
  
  updateWindowPosition: (x: number, y: number, width: number, height: number) => {
    const state = get();
    
    const position = {
      xPosition: x,
      yPosition: y,
      width,
      height,
    };
    
    const newWindowPosition = {
      ...state.windowPosition,
      ...position,
      updatedAt: new Date().toISOString(),
    } as WindowPosition;
    
    // Update local state
    set({
      windowPosition: newWindowPosition,
    });
    
    // Persist to localStorage for immediate recovery
    localStorage.setItem('turnBasedNoteWindowPosition', JSON.stringify(newWindowPosition));
  },
  
  // Collaboration actions
  updateTypingIndicator: (indicator: TypingIndicator) => {
    set((state) => ({
      typingIndicators: indicator.isTyping
        ? [...state.typingIndicators.filter(t => t.userId !== indicator.userId), indicator]
        : state.typingIndicators.filter(t => t.userId !== indicator.userId),
    }));
  },
  
  removeTypingIndicator: (userId: number) => {
    set((state) => ({
      typingIndicators: state.typingIndicators.filter(t => t.userId !== userId),
    }));
  },
  
  // API actions
  fetchEditStatus: async () => {
    const state = get();
    if (!state.noteId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${getApiUrl()}/edit-control/status/${state.noteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const status = await response.json();
        set({
          hasEditPermission: status.hasEditPermission,
          isLocked: status.isLocked,
          currentEditor: status.currentEditor,
        });
      }
    } catch (error) {
      console.error('Error fetching edit status:', error);
    }
  },
  
  fetchNoteContent: async () => {
    const state = get();
    if (!state.noteId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${getApiUrl()}/edit-control/content/${state.noteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        set({
          content: data.content,
          hasEditPermission: data.hasEditPermission,
        });
      }
    } catch (error) {
      console.error('Error fetching note content:', error);
    }
  },
}));

// Message handlers
function handleEditControlMessage(data: EditControlMessage) {
  console.log('Received edit control message:', data);
  
  const state = useTurnBasedNoteStore.getState();
  
  switch (data.type) {
    case 'GRANT_EDIT_CONTROL':
      set({
        hasEditPermission: true,
        isLocked: true,
        currentEditor: { id: data.userId, username: data.username || 'Unknown' },
        isRequestingEdit: false,
        editRequestMessage: null, // Remove the message
      });
      break;
      
    case 'DENY_EDIT_CONTROL':
      set({
        hasEditPermission: false,
        isRequestingEdit: false,
        editRequestMessage: data.message || 'Edit control denied',
      });
      break;
  }
}

function handleEditControlBroadcast(data: EditControlMessage) {
  console.log('Received edit control broadcast:', data);
  
  switch (data.type) {
    case 'EDIT_CONTROL_GRANTED':
      set({
        isLocked: true,
        currentEditor: { id: data.userId, username: data.userName || data.username || 'Unknown' },
      });
      break;
      
    case 'EDIT_CONTROL_RELEASED':
      set({
        isLocked: false,
        currentEditor: null,
      });
      break;
  }
}

function handleContentUpdate(data: EditControlMessage) {
  console.log('Received content update:', data);
  
  // Only update content from WebSocket if we don't have edit permission
  // This prevents overwriting local changes during fast typing
  const state = useTurnBasedNoteStore.getState();
  if (data.content !== undefined && !state.hasEditPermission) {
    set({ content: data.content });
  }
}

function handleTypingUpdate(data: EditControlMessage) {
  console.log('Received typing update:', data);
  
  if (data.username && data.isTyping !== undefined) {
    const indicator: TypingIndicator = {
      userId: data.userId,
      username: data.username,
      isTyping: data.isTyping,
      timestamp: new Date().toISOString(),
    };
    
    useTurnBasedNoteStore.getState().updateTypingIndicator(indicator);
  }
}

// Helper function to update state
function set(updates: Partial<TurnBasedNoteState>) {
  useTurnBasedNoteStore.setState(updates);
}