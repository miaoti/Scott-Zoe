import { create } from 'zustand';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

export interface SurpriseBox {
  id: number;
  prizeName: string;
  prizeDescription?: string;
  taskDescription?: string;
  status: 'CREATED' | 'DROPPED' | 'OPENED' | 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CLAIMED' | 'EXPIRED';
  completionType: 'PHOTO' | 'TEXT' | 'LOCATION' | 'TIMER';
  completionData?: string;
  priceAmount?: number;
  dropAt: string | number[];
  expiresAt: string | number[];
  droppedAt?: string | number[];
  openedAt?: string | number[];
  completedAt?: string | number[];
  approvedAt?: string | number[];
  rejectionReason?: string;
  isExpired: boolean;
  isDropping?: boolean;
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
  droppedBoxes: SurpriseBox[];
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
  stompClient: Client | null;
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
  loadDroppedBoxes: () => Promise<void>;
  loadDroppingBoxes: (userId: number) => Promise<SurpriseBox[]>;
  activateBox: (boxId: number) => Promise<void>;
  claimBox: (boxId: number) => Promise<void>;
  openBox: (boxId: number, completionData: string) => Promise<void>;
  completeBox: (boxId: number, completionData: string) => Promise<void>;
  approveCompletion: (boxId: number) => Promise<void>;
  rejectCompletion: (boxId: number, reason: string) => Promise<void>;
  cancelBox: (boxId: number) => Promise<void>;
  updateBox: (boxId: number, boxData: any) => Promise<any>;
  
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

// Determine API URL - Railway production vs local development
const getApiUrl = () => {
  // If deployed on Railway, use the same domain
  if (window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  // Local development
  return import.meta.env.VITE_API_URL || 'http://localhost:8080';
};

// Helper function to get the proper WebSocket URL
const getWebSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // If we have a custom API URL, use it as-is (SockJS handles protocol conversion)
  if (apiUrl) {
    return apiUrl;
  }
  
  // For production (non-localhost), use the same protocol as the current page
  if (window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  
  // Local development default
  return 'http://localhost:8080';
};

const API_BASE_URL = `${getApiUrl()}/api`;
const WS_URL = getWebSocketUrl();

// Debounce utility to prevent rapid successive calls
const debounceMap = new Map<string, NodeJS.Timeout>();
const debounce = (key: string, fn: () => void, delay: number = 1000) => {
  if (debounceMap.has(key)) {
    clearTimeout(debounceMap.get(key)!);
  }
  const timeoutId = setTimeout(() => {
    fn();
    debounceMap.delete(key);
  }, delay);
  debounceMap.set(key, timeoutId);
};

export const useSurpriseBoxStore = create<SurpriseBoxState>((set, get) => ({
  // Initial state
  ownedBoxes: [],
  receivedBoxes: [],
  droppedBoxes: [],
  activeBox: null,
  prizeHistory: [],
  prizeStats: null,
  isLoading: false,
  error: null,
  showCreateForm: false,
  showPrizeHistory: false,
  notifications: [],
  stompClient: null,
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
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get user info from token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId; // Use userId claim, not sub (which is username)
      const username = payload.sub; // Username is in sub claim
      
      if (!userId || !username) {
        throw new Error('User information not found in token');
      }
      
      // Get the other user's ID (Scott's boxes go to Zoe, Zoe's boxes go to Scott)
      const otherUserResponse = await axios.get(`${API_BASE_URL}/auth/other-user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const recipientId = otherUserResponse.data.id;
      
      // Add ownerId and recipientId to the request
      const requestData = {
        ...boxData,
        ownerId: userId,
        recipientId: recipientId // Correct recipient - the other user
      };
      
      const response = await axios.post(`${API_BASE_URL}/surprise-boxes`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Manually refresh data after box creation since WebSocket doesn't handle BOX_CREATED events
      await Promise.all([
        get().loadOwnedBoxes(),
        get().loadReceivedBoxes(),
        get().loadActiveBox()
      ]);
      
      set({ showCreateForm: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create surprise box' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadOwnedBoxes: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      // Get user ID from token payload
      const payload = JSON.parse(atob(token?.split('.')[1] || ''));
      const userId = payload.userId; // Use userId claim, not sub (which is username)
      
      const response = await fetch(`${API_BASE_URL}/surprise-boxes/owned/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load owned boxes');
      }
      
      const boxes = await response.json();
      set({ ownedBoxes: boxes, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load owned boxes', isLoading: false });
    }
  },
  
  loadReceivedBoxes: async () => {
    console.log('loadReceivedBoxes: Starting to load received boxes');
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      // Get user ID from token payload
      const payload = JSON.parse(atob(token?.split('.')[1] || ''));
      const userId = payload.userId; // Use userId claim, not sub (which is username)
      
      console.log('loadReceivedBoxes: Loading for userId:', userId);
      const response = await fetch(`${API_BASE_URL}/surprise-boxes/received/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load received boxes');
      }
      
      const boxes = await response.json();
      console.log('loadReceivedBoxes: Received boxes from API:', boxes);
      set({ receivedBoxes: boxes, isLoading: false });
    } catch (error) {
      console.error('loadReceivedBoxes: Error loading received boxes:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load received boxes', isLoading: false });
    }
  },
  
  loadActiveBox: async () => {
    try {
      const token = localStorage.getItem('token');
      // Get user ID from token payload
      const payload = JSON.parse(atob(token?.split('.')[1] || ''));
      const userId = payload.userId; // Use userId claim, not sub (which is username)
      
      // First check if user has an active box using the has-active endpoint
      const hasActiveResponse = await axios.get(`${API_BASE_URL}/surprise-boxes/has-active/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (hasActiveResponse.data.hasActiveBox) {
        // User has an active box, now get the actual box data
        const response = await axios.get(`${API_BASE_URL}/surprise-boxes/active/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Check if response contains a valid box or just a message
        if (response.data && response.data.id && response.data.owner && response.data.recipient) {
          console.log('🎯 Active box loaded:', {
            id: response.data.id,
            status: response.data.status,
            rejectionReason: response.data.rejectionReason,
            isExpired: response.data.isExpired,
            owner: response.data.owner,
            recipient: response.data.recipient
          });
          set({ activeBox: response.data });
        } else {
          console.log('⚠️ Active box response invalid:', response.data);
          // Fallback: user has active box but couldn't get data, set a placeholder
          set({ activeBox: { hasActive: true } });
        }
      } else {
        // No active box found
        set({ activeBox: null });
      }
    } catch (error: any) {
      // No active box is not an error
      if (error.response?.status !== 404) {
        set({ error: error.response?.data?.message || 'Failed to load active box' });
      }
      set({ activeBox: null });
    }
  },

  loadDroppedBoxes: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      // Get user ID from token payload
      const payload = JSON.parse(atob(token?.split('.')[1] || ''));
      const userId = payload.userId;
      
      const response = await fetch(`${API_BASE_URL}/surprise-boxes/dropped/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load dropped boxes');
      }
      
      const boxes = await response.json();
      set({ droppedBoxes: boxes, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load dropped boxes', isLoading: false });
    }
  },

  loadDroppingBoxes: async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/surprise-boxes/dropping/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load dropping boxes');
      }
      
      const boxes = await response.json();
      return boxes;
    } catch (error) {
      console.error('Failed to load dropping boxes:', error);
      return [];
    }
  },

  activateBox: async (boxId) => {
    console.log('activateBox: Starting activation process for boxId:', boxId);
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get user ID from token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      
      if (!userId) {
        throw new Error('User information not found in token');
      }
      
      console.log('activateBox: Calling API to activate box', boxId, 'for user', userId);
      const response = await axios.post(`${API_BASE_URL}/surprise-boxes/activate/${boxId}?userId=${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('activateBox: API response:', response.data);
      
      // Refresh boxes and active box
      console.log('activateBox: Refreshing box data after activation');
      await Promise.all([
        get().loadDroppedBoxes(),
        get().loadReceivedBoxes(),
        get().loadActiveBox()
      ]);
      
      console.log('activateBox: Activation process completed successfully');
    } catch (error: any) {
      console.error('activateBox: Error during activation process:', error);
      set({ error: error.response?.data?.message || 'Failed to activate box' });
    } finally {
      set({ isLoading: false });
    }
  },

  claimBox: async (boxId) => {
    console.log('claimBox: Starting claim process for boxId:', boxId);
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get user ID from token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      
      if (!userId) {
        throw new Error('User information not found in token');
      }
      
      console.log('claimBox: Calling API to claim box', boxId, 'for user', userId);
      const response = await axios.post(`${API_BASE_URL}/surprise-boxes/claim/${boxId}?userId=${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('claimBox: API response:', response.data);
      
      // Refresh boxes and active box
      console.log('claimBox: Refreshing box data after claim');
      await Promise.all([
        get().loadDroppedBoxes(),
        get().loadReceivedBoxes(),
        get().loadActiveBox()
      ]);
      
      console.log('claimBox: Claim process completed successfully');
    } catch (error: any) {
      console.error('claimBox: Error during claim process:', error);
      set({ error: error.response?.data?.message || 'Failed to claim box' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  openBox: async (boxId, completionData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token?.split('.')[1] || ''));
      const username = payload.sub;
      
      await axios.post(`${API_BASE_URL}/surprise-boxes/${boxId}/open`, 
        { username },
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
  
  completeBox: async (boxId, completionData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token?.split('.')[1] || ''));
      const username = payload.sub;
      
      await axios.post(`${API_BASE_URL}/surprise-boxes/${boxId}/complete`, 
        { username, completionData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh boxes
      await Promise.all([
        get().loadReceivedBoxes(),
        get().loadActiveBox()
      ]);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to complete box' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  approveCompletion: async (boxId) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get user ID from token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      
      if (!userId) {
        throw new Error('User information not found in token');
      }
      
      await axios.post(`${API_BASE_URL}/surprise-boxes/${boxId}/approve`, {
        ownerId: userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh boxes and prize history for both owner and recipient
      await Promise.all([
        get().loadOwnedBoxes(),
        get().loadReceivedBoxes(), // Add this to refresh recipient's view
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
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get user ID from token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      
      if (!userId) {
        throw new Error('User information not found in token');
      }
      
      await axios.post(`${API_BASE_URL}/surprise-boxes/${boxId}/reject`, 
        { 
          ownerId: userId,
          rejectionReason: reason 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh boxes for both owner and recipient
      await Promise.all([
        get().loadOwnedBoxes(),
        get().loadReceivedBoxes() // Add this to refresh recipient's view
      ]);
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
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get user ID from token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      
      if (!userId) {
        throw new Error('User information not found in token');
      }
      
      await axios.delete(`${API_BASE_URL}/surprise-boxes/${boxId}?ownerId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh boxes for both owner and recipient
      await Promise.all([
        get().loadOwnedBoxes(),
        get().loadReceivedBoxes() // Add this to refresh recipient's view
      ]);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to cancel box' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateBox: async (boxId, boxData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get user ID from token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      
      if (!userId) {
        throw new Error('User information not found in token');
      }
      
      // Add ownerId to the request
      const requestData = {
        ...boxData,
        ownerId: userId
      };
      
      const response = await axios.put(`${API_BASE_URL}/surprise-boxes/${boxId}`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh data after box update
      await Promise.all([
        get().loadOwnedBoxes(),
        get().loadReceivedBoxes()
      ]);
      
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update surprise box' });
      throw error;
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
      
      // Handle both array and paginated response formats
      let historyData = response.data;
      if (historyData && typeof historyData === 'object' && historyData.content) {
        // Paginated response - extract the content array
        historyData = historyData.content;
      }
      
      // Ensure we always set an array
      set({ prizeHistory: Array.isArray(historyData) ? historyData : [] });
    } catch (error: any) {
      console.error('Failed to load prize history:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to load prize history',
        prizeHistory: [] // Set empty array on error
      });
    }
  },
  
  loadPrizeStats: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/prize-history/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ prizeStats: response.data || null });
    } catch (error: any) {
      console.error('Failed to load prize stats:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to load prize stats',
        prizeStats: null
      });
    }
  },
  
  // WebSocket
  connectWebSocket: (token?: string) => {
    // Get token from parameter or localStorage
    const authToken = token || localStorage.getItem('token');
    
    console.log('🔌 Attempting WebSocket connection...');
    console.log('Token present:', !!authToken);
    console.log('Token value:', authToken ? `${authToken.substring(0, 20)}...` : 'null');
    console.log('WebSocket URL:', `${WS_URL}/ws`);
    
    const { stompClient } = get();
    
    if (!authToken) {
      console.log('❌ No authentication token found, cannot connect to WebSocket');
      console.log('💡 Please log in first to enable real-time notifications');
      console.log('🧪 For testing purposes, attempting connection without token...');
      // For testing, we'll continue without token to see connection behavior
    }
    
    if (stompClient && stompClient.connected) {
      console.log('✅ Already connected to WebSocket');
      return; // Already connected
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      connectHeaders: authToken ? {
        Authorization: `Bearer ${authToken}`
      } : {},
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('✅ Connected to surprise box WebSocket:', frame);
      set({ stompClient: client, isConnected: true });
      
      // Subscribe to user-specific updates
      const subscription = client.subscribe('/user/queue/surprise-box/updates', (message) => {
        console.log('📨 Received WebSocket notification:', message.body);
        const notification: WebSocketNotification = JSON.parse(message.body);
        const { notifications } = get();
        set({ notifications: [notification, ...notifications] });
        
        // Refresh relevant data based on notification type with debouncing
        switch (notification.type) {
          case 'BOX_DROPPED':
            console.log('🎁 BOX_DROPPED notification - triggering refresh');
            debounce('loadReceivedBoxes', () => get().loadReceivedBoxes(), 1000);
            debounce('loadActiveBox', () => get().loadActiveBox(), 1000);
            break;
          case 'BOX_OPENED':
            console.log('📦 BOX_OPENED notification - triggering refresh');
            debounce('loadOwnedBoxes', () => get().loadOwnedBoxes(), 1000);
            break;
          case 'BOX_APPROVED':
            console.log('✅ BOX_APPROVED notification - triggering refresh');
            debounce('loadPrizeHistory', () => get().loadPrizeHistory(), 1000);
            debounce('loadPrizeStats', () => get().loadPrizeStats(), 1000);
            break;
          case 'BOX_REJECTED':
            console.log('❌ BOX_REJECTED notification - triggering refresh');
            debounce('loadOwnedBoxes', () => get().loadOwnedBoxes(), 1000);
            break;
          case 'BOX_EXPIRED':
            console.log('⏰ BOX_EXPIRED notification - triggering refresh');
            debounce('loadOwnedBoxes', () => get().loadOwnedBoxes(), 1000);
            break;
          case 'BOX_CANCELLED':
            console.log('🚫 BOX_CANCELLED notification - triggering refresh');
            debounce('loadOwnedBoxes', () => get().loadOwnedBoxes(), 1000);
            break;
          default:
            console.log('🤷 Unknown notification type:', notification.type);
        }
      });
      console.log('📡 WebSocket subscription established');
      
      // Subscribe to ping responses
      const pongSubscription = client.subscribe('/user/queue/surprise-box/pong', (message) => {
        console.log('🏓 Received pong:', message.body);
      });
      console.log('📡 Subscribed to ping responses');
      
      // Send initial subscription message
      client.publish({
        destination: '/app/surprise-box/subscribe',
        body: JSON.stringify({ action: 'subscribe' })
      });
      console.log('📤 Sent initial subscription message');
      
      // Set up periodic ping
      const pingInterval = setInterval(() => {
        if (client.connected) {
          client.publish({
            destination: '/app/surprise-box/ping',
            body: JSON.stringify({ timestamp: Date.now() })
          });
          console.log('🏓 Sent ping');
        }
      }, 30000); // Every 30 seconds
      
      // Store interval for cleanup
      (client as any).pingInterval = pingInterval;
    };

    client.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame);
      set({ isConnected: false });
    };

    client.onDisconnect = () => {
      console.log('🔌 Disconnected from surprise box WebSocket');
      set({ isConnected: false });
      
      // Clear ping interval if it exists
      if ((client as any).pingInterval) {
        clearInterval((client as any).pingInterval);
      }
    };

    console.log('🚀 Activating STOMP client...');
    set({ stompClient: client });
    client.activate();
  },
  
  disconnectWebSocket: () => {
    const { stompClient } = get();
    if (stompClient) {
      // Clear ping interval if it exists
      if ((stompClient as any).pingInterval) {
        clearInterval((stompClient as any).pingInterval);
      }
      stompClient.deactivate();
      set({ stompClient: null, isConnected: false });
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
      box => {
        // Exclude boxes with inactive statuses
        if (['CLAIMED', 'EXPIRED', 'REJECTED'].includes(box.status)) {
          return false;
        }
        
        // Check if box is expired based on expiration time
        if (box.openedAt && box.expirationMinutes) {
          const openedTime = new Date(box.openedAt);
          const expirationTime = new Date(openedTime.getTime() + box.expirationMinutes * 60000);
          const now = new Date();
          if (now > expirationTime) {
            return false; // Exclude expired boxes
          }
        }
        
        return true;
      }
    ).length;
  }
}));