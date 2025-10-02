import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

export interface SurpriseBox {
  id: number;
  prizeName: string;
  prizeDescription?: string;
  status: 'CREATED' | 'DROPPED' | 'WAITING_APPROVAL' | 'CLAIMED' | 'EXPIRED';
  completionType: 'PHOTO' | 'TEXT' | 'LOCATION' | 'TIMER';
  completionData?: string;
  dropAt: string;
  expiresAt: string;
  droppedAt?: string;
  openedAt?: string;
  completedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  isExpired: boolean;
  owner: {
    id: number;
    name: string;
    username: string;
  };
  recipient: {
    id: number;
    name: string;
    username: string;
  };
}

export interface PrizeHistory {
  id: number;
  prizeName: string;
  prizeDescription?: string;
  completionType: 'PHOTO' | 'TEXT' | 'LOCATION' | 'TIMER';
  completionData?: string;
  claimedAt: string;
  recipient: {
    id: number;
    name: string;
    username: string;
  };
  box: {
    id: number;
    owner: {
      id: number;
      name: string;
      username: string;
    };
  };
}

export interface PrizeHistoryStats {
  totalPrizes: number;
  prizesThisMonth: number;
  prizesThisWeek: number;
  favoriteCompletionType: string;
}

export interface WebSocketNotification {
  type: string;
  message: string;
  timestamp: string;
  box?: SurpriseBox;
  minutesRemaining?: number;
  rejectionReason?: string;
}

interface SurpriseBoxState {
  // Box data
  ownedBoxes: SurpriseBox[];
  receivedBoxes: SurpriseBox[];
  activeBox: SurpriseBox | null;
  prizeHistory: PrizeHistory[];
  prizeStats: PrizeHistoryStats | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  showCreateForm: boolean;
  showPrizeHistory: boolean;
  notifications: WebSocketNotification[];
  
  // WebSocket
  socket: Socket | null;
  isConnected: boolean;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setShowCreateForm: (show: boolean) => void;
  setShowPrizeHistory: (show: boolean) => void;
  
  // Box operations
  createBox: (boxData: Partial<SurpriseBox>) => Promise<void>;
  loadOwnedBoxes: () => Promise<void>;
  loadReceivedBoxes: () => Promise<void>;
  loadActiveBox: () => Promise<void>;
  openBox: (boxId: number, completionData: string) => Promise<void>;
  approveCompletion: (boxId: number) => Promise<void>;
  rejectCompletion: (boxId: number, reason: string) => Promise<void>;
  cancelBox: (boxId: number) => Promise<void>;
  
  // Prize history
  loadPrizeHistory: () => Promise<void>;
  loadPrizeStats: () => Promise<void>;
  
  // WebSocket
  connectWebSocket: (token: string) => void;
  disconnectWebSocket: () => void;
  addNotification: (notification: WebSocketNotification) => void;
  clearNotifications: () => void;
  
  // Utility
  getBoxById: (boxId: number) => SurpriseBox | null;
  getBoxesWaitingApproval: () => SurpriseBox[];
  getActiveBoxesCount: () => number;
}

// Use the same API URL logic as utils/api.ts
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:8080';
};

const API_BASE_URL = getApiUrl();
const WS_URL = import.meta.env.VITE_WS_URL || getApiUrl().replace('https://', 'wss://').replace('http://', 'ws://');

export const useSurpriseBoxStore = create<SurpriseBoxState>((set, get) => ({
  // Initial state
  ownedBoxes: [],
  receivedBoxes: [],
  activeBox: null,
  prizeHistory: [],
  prizeStats: null,
  isLoading: false,
  error: null,
  showCreateForm: false,
  showPrizeHistory: false,
  notifications: [],
  socket: null,
  isConnected: false,
  
  // Basic setters
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setShowCreateForm: (show) => set({ showCreateForm: show }),
  setShowPrizeHistory: (show) => set({ showPrizeHistory: show }),
  
  // Box operations
  createBox: async (boxData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/surprise-boxes`, boxData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh owned boxes
      await get().loadOwnedBoxes();
      set({ showCreateForm: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create surprise box' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadOwnedBoxes: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/surprise-boxes/owned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ ownedBoxes: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load owned boxes' });
    }
  },
  
  loadReceivedBoxes: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/surprise-boxes/received`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ receivedBoxes: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load received boxes' });
    }
  },
  
  loadActiveBox: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/surprise-boxes/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ activeBox: response.data });
    } catch (error: any) {
      // No active box is not an error
      if (error.response?.status !== 404) {
        set({ error: error.response?.data?.message || 'Failed to load active box' });
      }
    }
  },
  
  openBox: async (boxId, completionData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/surprise-boxes/${boxId}/open`, 
        { completionData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh boxes
      await Promise.all([
        get().loadReceivedBoxes(),
        get().loadActiveBox()
      ]);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to open box' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  approveCompletion: async (boxId) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/surprise-boxes/${boxId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh boxes and prize history
      await Promise.all([
        get().loadOwnedBoxes(),
        get().loadPrizeHistory(),
        get().loadPrizeStats()
      ]);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to approve completion' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  rejectCompletion: async (boxId, reason) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/surprise-boxes/${boxId}/reject`, 
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh boxes
      await get().loadOwnedBoxes();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to reject completion' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  cancelBox: async (boxId) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/surprise-boxes/${boxId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh boxes
      await get().loadOwnedBoxes();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to cancel box' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Prize history
  loadPrizeHistory: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/prize-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ prizeHistory: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load prize history' });
    }
  },
  
  loadPrizeStats: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/prize-history/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ prizeStats: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load prize stats' });
    }
  },
  
  // WebSocket
  connectWebSocket: (token) => {
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('Connected to surprise box WebSocket');
      set({ isConnected: true });
      
      // Subscribe to surprise box updates
      socket.emit('/surprise-box/subscribe', {});
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from surprise box WebSocket');
      set({ isConnected: false });
    });
    
    socket.on('/queue/surprise-box/updates', (notification: WebSocketNotification) => {
      console.log('Received surprise box notification:', notification);
      get().addNotification(notification);
      
      // Refresh relevant data based on notification type
      switch (notification.type) {
        case 'BOX_DROPPED':
          get().loadReceivedBoxes();
          get().loadActiveBox();
          break;
        case 'BOX_OPENED':
          get().loadOwnedBoxes();
          break;
        case 'BOX_APPROVED':
          get().loadPrizeHistory();
          get().loadPrizeStats();
          break;
        case 'BOX_REJECTED':
        case 'BOX_EXPIRED':
        case 'BOX_CANCELLED':
          get().loadOwnedBoxes();
          get().loadReceivedBoxes();
          get().loadActiveBox();
          break;
      }
    });
    
    socket.on('/queue/surprise-box/pong', (data) => {
      console.log('WebSocket pong received:', data);
    });
    
    // Send periodic ping
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('/surprise-box/ping', { timestamp: new Date().toISOString() });
      }
    }, 30000); // Every 30 seconds
    
    socket.on('disconnect', () => {
      clearInterval(pingInterval);
    });
    
    set({ socket });
  },
  
  disconnectWebSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
  
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 10) // Keep last 10
    }));
  },
  
  clearNotifications: () => set({ notifications: [] }),
  
  // Utility functions
  getBoxById: (boxId) => {
    const { ownedBoxes, receivedBoxes } = get();
    return [...ownedBoxes, ...receivedBoxes].find(box => box.id === boxId) || null;
  },
  
  getBoxesWaitingApproval: () => {
    const { ownedBoxes } = get();
    return ownedBoxes.filter(box => box.status === 'WAITING_APPROVAL');
  },
  
  getActiveBoxesCount: () => {
    const { ownedBoxes, receivedBoxes } = get();
    return [...ownedBoxes, ...receivedBoxes].filter(
      box => !['CLAIMED', 'EXPIRED'].includes(box.status)
    ).length;
  }
}));