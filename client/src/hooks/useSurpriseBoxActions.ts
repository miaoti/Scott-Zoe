import { useCallback } from 'react';
import { useSurpriseBoxStore } from '../stores/surpriseBoxStore';

/**
 * Custom hook that provides stable references to surprise box store actions
 * This prevents infinite re-renders caused by changing function references
 */
export const useSurpriseBoxActions = () => {
  const store = useSurpriseBoxStore();

  // Create stable references to store actions
  const loadOwnedBoxes = useCallback(() => {
    store.loadOwnedBoxes();
  }, []);

  const loadReceivedBoxes = useCallback(() => {
    store.loadReceivedBoxes();
  }, []);

  const loadActiveBox = useCallback(() => {
    store.loadActiveBox();
  }, []);

  const connectWebSocket = useCallback((token: string) => {
    store.connectWebSocket(token);
  }, []);

  const disconnectWebSocket = useCallback(() => {
    store.disconnectWebSocket();
  }, []);

  const createBox = useCallback((boxData: any) => {
    return store.createBox(boxData);
  }, []);

  const openBox = useCallback((boxId: string) => {
    return store.openBox(boxId);
  }, []);

  const approveBox = useCallback((boxId: string) => {
    return store.approveBox(boxId);
  }, []);

  const rejectBox = useCallback((boxId: string) => {
    return store.rejectBox(boxId);
  }, []);

  const cancelBox = useCallback((boxId: string) => {
    return store.cancelBox(boxId);
  }, []);

  const loadPrizeHistory = useCallback(() => {
    store.loadPrizeHistory();
  }, []);

  const loadPrizeStats = useCallback(() => {
    store.loadPrizeStats();
  }, []);

  const clearNotifications = useCallback(() => {
    store.clearNotifications();
  }, []);

  const setError = useCallback((error: string | null) => {
    store.setError(error);
  }, []);

  return {
    // State (these are fine as they are)
    ownedBoxes: store.ownedBoxes,
    receivedBoxes: store.receivedBoxes,
    activeBox: store.activeBox,
    notifications: store.notifications,
    isConnected: store.isConnected,
    error: store.error,
    isLoading: store.isLoading,
    prizeHistory: store.prizeHistory,
    prizeStats: store.prizeStats,
    
    // Stable action references
    loadOwnedBoxes,
    loadReceivedBoxes,
    loadActiveBox,
    connectWebSocket,
    disconnectWebSocket,
    createBox,
    openBox,
    approveBox,
    rejectBox,
    cancelBox,
    loadPrizeHistory,
    loadPrizeStats,
    clearNotifications,
    setError,
    
    // Utility functions (these are also fine)
    getBoxById: store.getBoxById,
    getBoxesWaitingApproval: store.getBoxesWaitingApproval,
    getActiveBoxesCount: store.getActiveBoxesCount
  };
};