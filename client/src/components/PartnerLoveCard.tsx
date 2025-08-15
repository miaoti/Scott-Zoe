import React, { useState, useEffect, useRef } from 'react';
import { Heart, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface PartnerLoveData {
  partnerUsername: string;
  partnerLoveCount: number;
  partnerDisplayName: string;
}

const PartnerLoveCard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [partnerData, setPartnerData] = useState<PartnerLoveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Don't render if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchPartnerLoveCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/love/partner');
      setPartnerData(response.data);
    } catch (error) {
      console.error('Error fetching partner love count:', error);
      setError('Failed to load partner\'s love count');
    } finally {
      setLoading(false);
    }
  };

  const setupSSE = () => {
    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found for SSE');
        fetchPartnerLoveCount(); // Fallback to polling
        return;
      }
      
      const eventSource = new EventSource(`/api/love-updates/subscribe?token=${encodeURIComponent(token)}`, {
        withCredentials: true
      });
      
      eventSource.addEventListener('partner-love-update', (event) => {
        try {
          const data = JSON.parse(event.data);
          setPartnerData(data);
          setError(null);
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      });
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setError('Real-time connection lost');
        
        // Close the failed connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          console.log('Attempting to reconnect SSE...');
          setupSSE();
        }, 3000);
        
        // Fallback to polling in the meantime
        setTimeout(() => {
          fetchPartnerLoveCount();
        }, 1000);
      };
      
      eventSource.onopen = () => {
        console.log('SSE connection established');
        setError(null);
      };
      
      eventSourceRef.current = eventSource;
      
    } catch (err) {
      console.error('Error setting up SSE:', err);
      // Fallback to initial fetch
      fetchPartnerLoveCount();
      
      // Retry SSE setup after a delay
      setTimeout(() => {
        setupSSE();
      }, 5000);
    }
  };

  useEffect(() => {
    // Only setup if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }
    
    // Initial fetch
    fetchPartnerLoveCount();
    
    // Setup SSE for real-time updates
    setupSSE();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isAuthenticated, user]); // Re-run when authentication state changes

  if (loading && !partnerData) {
    return (
      <div className="apple-card apple-shadow p-6 text-center animate-pulse">
        <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="apple-card apple-shadow p-6 text-center">
        <div className="text-red-500 mb-2">❌</div>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!partnerData) {
    return null;
  }

  const isScott = user?.username === 'scott';
  const partnerColor = partnerData.partnerUsername === 'scott' ? 'blue' : 'pink';
  const heartColor = partnerData.partnerUsername === 'scott' ? 'text-blue-500' : 'text-pink-500';
  const bgColor = partnerData.partnerUsername === 'scott' ? 'bg-blue-50' : 'bg-pink-50';
  const borderColor = partnerData.partnerUsername === 'scott' ? 'border-blue-200' : 'border-pink-200';

  return (
    <div className={`apple-card apple-shadow p-6 text-center transition-all duration-300 cursor-pointer group pointer-events-auto relative ${bgColor} ${borderColor} border group-hover:shadow-lg`}>
      <div className="flex items-center justify-center mb-4">
        <div className={`p-3 rounded-full ${partnerData.partnerUsername === 'scott' ? 'bg-blue-100' : 'bg-pink-100'} transition-all duration-300 group-hover:scale-105`}>
          <Heart 
            className={`h-8 w-8 ${heartColor} transition-all duration-300 group-hover:scale-110`} 
            fill="currentColor"
          />
        </div>
      </div>
      
      <div className="text-3xl font-semibold text-apple-label mb-2 transition-all duration-300 group-hover:scale-105">
        {partnerData.partnerLoveCount.toLocaleString()}
      </div>
      
      <div className="text-apple-secondary-label transition-colors duration-300 group-hover:text-apple-blue-light mb-3">
        {partnerData.partnerDisplayName}'s Love
      </div>
      
      <div className="text-xs text-apple-tertiary-label mb-2">
        💕 Love shared by {partnerData.partnerDisplayName}
      </div>
      
      {loading && (
        <div className="text-xs text-apple-blue-light opacity-70">
          Updating...
        </div>
      )}
      
      <div className="mt-2 text-xs text-apple-blue-light font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
        Real-time sync ✨
      </div>
    </div>
  );
};

export default PartnerLoveCard;