import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface User {
  id: string;
  username: string;
}

interface RelationshipInfo {
  coupleNames: string;
  startDate: Date;
  daysTogether: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  relationshipInfo: RelationshipInfo | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'https://scott-zoe-production.up.railway.app';
const TOKEN_KEY = 'authToken';

const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const setToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [relationshipInfo, setRelationshipInfo] = useState<RelationshipInfo | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username,
          password 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await setToken(data.token);
        setIsAuthenticated(true);
        setUser({ id: '1', username: 'Scott & Zoe' });
        await fetchRelationshipInfo(data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      setIsAuthenticated(false);
      setUser(null);
      setRelationshipInfo(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchRelationshipInfo = async (token?: string) => {
    try {
      const authToken = token || await getToken();
      if (!authToken) return;

      const response = await fetch(`${API_BASE_URL}/api/auth/relationship-info`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRelationshipInfo({
          coupleNames: data.coupleNames || 'Scott & Zoe',
          startDate: new Date(data.startDate || '2020-06-08'),
          daysTogether: data.daysTogether || calculateDaysTogether(new Date(data.startDate || '2020-06-08')),
        });
      }
    } catch (error) {
      console.error('Error fetching relationship info:', error);
      // Set default values
      setRelationshipInfo({
        coupleNames: 'Scott & Zoe',
        startDate: new Date('2020-06-08'),
        daysTogether: calculateDaysTogether(new Date('2020-06-08')),
      });
    }
  };

  const calculateDaysTogether = (startDate: Date): number => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      if (token) {
        // Validate token with backend
        const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
          setUser({ id: '1', username: 'Scott & Zoe' });
          await fetchRelationshipInfo(token);
        } else {
          // Token is invalid, remove it
          await removeToken();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    relationshipInfo,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}