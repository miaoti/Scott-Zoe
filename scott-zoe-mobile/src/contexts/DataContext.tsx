import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Photo {
  id: string;
  url: string;
  caption?: string;
  category?: string;
  isFavorite: boolean;
  uploadDate: Date;
}

interface Memory {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'FIRST_DATE' | 'ANNIVERSARY' | 'SPECIAL_MOMENT' | 'MILESTONE' | 'OTHER';
}

interface Category {
  id: string;
  name: string;
  photoCount: number;
}

interface LoveStats {
  dailyLove: number;
  totalLove: number;
  lastUpdated: Date;
}

interface WheelStats {
  totalSpins: number;
  lastSpinDate?: Date;
  canSpin: boolean;
}

interface DashboardStats {
  totalPhotos: number;
  totalMemories: number;
  totalLove: number;
  totalCategories: number;
}

interface DataContextType {
  photos: Photo[];
  memories: Memory[];
  categories: Category[];
  loveStats: LoveStats;
  wheelStats: WheelStats;
  dashboardStats: DashboardStats;
  isLoading: boolean;
  
  // Photo methods
  fetchPhotos: () => Promise<void>;
  uploadPhoto: (uri: string, caption?: string, category?: string) => Promise<boolean>;
  toggleFavorite: (photoId: string) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  
  // Memory methods
  fetchMemories: () => Promise<void>;
  createMemory: (memory: Omit<Memory, 'id'>) => Promise<boolean>;
  updateMemory: (memory: Memory) => Promise<boolean>;
  deleteMemory: (memoryId: string) => Promise<void>;
  
  // Category methods
  fetchCategories: () => Promise<void>;
  
  // Love counter methods
  fetchLoveStats: () => Promise<void>;
  incrementLove: () => Promise<void>;
  
  // Wheel methods
  fetchWheelStats: () => Promise<void>;
  spinWheel: () => Promise<string | null>;
  
  // Dashboard methods
  fetchDashboardStats: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_BASE_URL = 'https://scott-zoe-production.up.railway.app';

export function DataProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loveStats, setLoveStats] = useState<LoveStats>({
    dailyLove: 0,
    totalLove: 0,
    lastUpdated: new Date(),
  });
  const [wheelStats, setWheelStats] = useState<WheelStats>({
    totalSpins: 0,
    canSpin: true,
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPhotos: 0,
    totalMemories: 0,
    totalLove: 0,
    totalCategories: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const getAuthToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync('authToken');
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });
    return response;
  };

  // Photo methods
  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('/api/photos');
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.map((photo: any) => ({
          ...photo,
          uploadDate: new Date(photo.uploadDate),
        })));
      } else {
        // Fallback to local storage or mock data
        const localPhotos = await AsyncStorage.getItem('localPhotos');
        if (localPhotos) {
          setPhotos(JSON.parse(localPhotos));
        }
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async (uri: string, caption?: string, category?: string): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      if (caption) formData.append('caption', caption);
      if (category) formData.append('category', category);

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/photos/upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      if (response.ok) {
        await fetchPhotos();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return false;
    }
  };

  const toggleFavorite = async (photoId: string) => {
    try {
      const response = await apiCall(`/api/photos/${photoId}/favorite`, {
        method: 'PUT',
      });
      if (response.ok) {
        setPhotos(prev => prev.map(photo => 
          photo.id === photoId ? { ...photo, isFavorite: !photo.isFavorite } : photo
        ));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const response = await apiCall(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  // Memory methods
  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('/api/memories');
      if (response.ok) {
        const data = await response.json();
        setMemories(data.map((memory: any) => ({
          ...memory,
          date: new Date(memory.date),
        })));
      } else {
        const localMemories = await AsyncStorage.getItem('localMemories');
        if (localMemories) {
          setMemories(JSON.parse(localMemories));
        }
      }
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createMemory = async (memory: Omit<Memory, 'id'>): Promise<boolean> => {
    try {
      const response = await apiCall('/api/memories', {
        method: 'POST',
        body: JSON.stringify(memory),
      });
      if (response.ok) {
        await fetchMemories();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating memory:', error);
      return false;
    }
  };

  const updateMemory = async (memory: Memory): Promise<boolean> => {
    try {
      const response = await apiCall(`/api/memories/${memory.id}`, {
        method: 'PUT',
        body: JSON.stringify(memory),
      });
      if (response.ok) {
        await fetchMemories();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating memory:', error);
      return false;
    }
  };

  const deleteMemory = async (memoryId: string) => {
    try {
      const response = await apiCall(`/api/memories/${memoryId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setMemories(prev => prev.filter(memory => memory.id !== memoryId));
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  // Category methods
  const fetchCategories = async () => {
    try {
      const response = await apiCall('/api/categories/');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Love counter methods
  const fetchLoveStats = async () => {
    try {
      const response = await apiCall('/api/love/stats');
      if (response.ok) {
        const data = await response.json();
        setLoveStats({
          dailyLove: data.dailyLove || 0,
          totalLove: data.totalLove || 0,
          lastUpdated: new Date(data.lastUpdated || Date.now()),
        });
      } else {
        // Fallback to local storage
        const localStats = await AsyncStorage.getItem('localLoveStats');
        if (localStats) {
          setLoveStats(JSON.parse(localStats));
        }
      }
    } catch (error) {
      console.error('Error fetching love stats:', error);
    }
  };

  const incrementLove = async () => {
    try {
      const response = await apiCall('/api/love/increment', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchLoveStats();
      } else {
        // Local fallback
        setLoveStats(prev => ({
          ...prev,
          dailyLove: prev.dailyLove + 1,
          totalLove: prev.totalLove + 1,
          lastUpdated: new Date(),
        }));
      }
    } catch (error) {
      console.error('Error incrementing love:', error);
    }
  };

  // Wheel methods
  const fetchWheelStats = async () => {
    try {
      const response = await apiCall('/api/wheel/stats');
      if (response.ok) {
        const data = await response.json();
        setWheelStats({
          totalSpins: data.totalSpins || 0,
          lastSpinDate: data.lastSpinDate ? new Date(data.lastSpinDate) : undefined,
          canSpin: data.canSpin !== false,
        });
      }
    } catch (error) {
      console.error('Error fetching wheel stats:', error);
    }
  };

  const spinWheel = async (): Promise<string | null> => {
    try {
      const response = await apiCall('/api/wheel/spin', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        await fetchWheelStats();
        return data.prize || 'Love Points';
      }
      return null;
    } catch (error) {
      console.error('Error spinning wheel:', error);
      return null;
    }
  };

  // Dashboard methods
  const fetchDashboardStats = async () => {
    try {
      const response = await apiCall('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      } else {
        // Calculate from existing data
        setDashboardStats({
          totalPhotos: photos.length,
          totalMemories: memories.length,
          totalLove: loveStats.totalLove,
          totalCategories: categories.length,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const value: DataContextType = {
    photos,
    memories,
    categories,
    loveStats,
    wheelStats,
    dashboardStats,
    isLoading,
    fetchPhotos,
    uploadPhoto,
    toggleFavorite,
    deletePhoto,
    fetchMemories,
    createMemory,
    updateMemory,
    deleteMemory,
    fetchCategories,
    fetchLoveStats,
    incrementLove,
    fetchWheelStats,
    spinWheel,
    fetchDashboardStats,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}