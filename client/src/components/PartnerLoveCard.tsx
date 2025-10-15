import React, { useState, useEffect, useRef } from 'react';
import { Heart, User, Zap, Calendar, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface PartnerLoveData {
  partnerUsername: string;
  partnerLoveCount: number;
  partnerDisplayName: string;
}

interface PartnerStats {
  weeklyLove: number;
  loveStreak: number;
  lastActiveTime: string;
  favoriteTime: string;
  loveLevel: number;
}

const PartnerLoveCard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [partnerData, setPartnerData] = useState<PartnerLoveData | null>(null);
  const [partnerStats, setPartnerStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<Array<{id: number, x: number, y: number}>>([]);
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
      
      // Generate mock stats for now (in a real app, this would come from the API)
      const mockStats: PartnerStats = {
        weeklyLove: Math.floor(Math.random() * 50) + 10,
        loveStreak: Math.floor(Math.random() * 14) + 1,
        lastActiveTime: getRandomRecentTime(),
        favoriteTime: Math.random() > 0.5 ? 'Morning' : 'Evening',
        loveLevel: Math.floor(response.data.partnerLoveCount / 100) + 1
      };
      setPartnerStats(mockStats);
    } catch (error) {
      console.error('Error fetching partner love count:', error);
      setError('Failed to load partner\'s love count');
    } finally {
      setLoading(false);
    }
  };

  const getRandomRecentTime = () => {
    const times = ['2 hours ago', '5 hours ago', '1 day ago', '3 hours ago', 'Just now', '30 minutes ago'];
    return times[Math.floor(Math.random() * times.length)];
  };

  const createFloatingHeart = () => {
    const newHeart = {
      id: Date.now(),
      x: Math.random() * 200,
      y: Math.random() * 100
    };
    setFloatingHearts(prev => [...prev, newHeart]);
    
    // Remove heart after animation
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
    }, 3000);
  };

  // Create floating hearts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 2 seconds
        createFloatingHeart();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
          // Trigger a floating heart when partner's love updates
          createFloatingHeart();
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
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
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

  if (!partnerData || !partnerStats) {
    return null;
  }

  const isScott = user?.username === 'scott';
  const partnerColor = partnerData.partnerUsername === 'scott' ? 'blue' : 'pink';
  const heartColor = partnerData.partnerUsername === 'scott' ? 'text-purple-400' : 'text-pink-500';
  const bgColor = partnerData.partnerUsername === 'scott' ? 'bg-purple-50' : 'bg-pink-50';
  const borderColor = partnerData.partnerUsername === 'scott' ? 'border-purple-200' : 'border-pink-200';
  const accentColor = partnerData.partnerUsername === 'scott' ? 'text-purple-600' : 'text-pink-600';
  const progressColor = partnerData.partnerUsername === 'scott' ? 'bg-purple-400' : 'bg-pink-400';

  return (
    <div className={`apple-card apple-shadow p-6 text-center transition-all duration-300 cursor-pointer group pointer-events-auto relative overflow-hidden ${bgColor} ${borderColor} border group-hover:shadow-lg`}>
      {/* Floating Hearts Animation */}
      {floatingHearts.map(heart => (
        <div
          key={heart.id}
          className="absolute pointer-events-none animate-bounce"
          style={{
            left: `${heart.x}px`,
            top: `${heart.y}px`,
            animation: 'floatUp 3s ease-out forwards'
          }}
        >
          <Heart className={`w-4 h-4 ${heartColor} opacity-60`} fill="currentColor" />
        </div>
      ))}

      {/* Main Heart Icon */}
      <div className="flex items-center justify-center mb-4">
        <div className={`p-3 rounded-full ${partnerData.partnerUsername === 'scott' ? 'bg-purple-100' : 'bg-pink-100'} transition-all duration-300 group-hover:scale-105 relative`}>
          <Heart 
            className={`h-8 w-8 ${heartColor} transition-all duration-300 group-hover:scale-110`} 
            fill="currentColor"
          />
          {/* Love Level Badge */}
          <div className={`absolute -top-1 -right-1 w-5 h-5 ${progressColor} rounded-full flex items-center justify-center`}>
            <span className="text-white text-xs font-bold">{partnerStats.loveLevel}</span>
          </div>
        </div>
      </div>
      
      {/* Love Count */}
      <div className="text-3xl font-semibold text-apple-label mb-2 transition-all duration-300 group-hover:scale-105">
        {partnerData.partnerLoveCount.toLocaleString()}
      </div>
      
      {/* Partner Name */}
      <div className="text-apple-secondary-label transition-colors duration-300 group-hover:text-apple-blue-light mb-3">
        {partnerData.partnerDisplayName}'s Love
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Weekly Love */}
        <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className={`w-3 h-3 ${accentColor} mr-1`} />
            <span className="text-xs font-medium text-apple-secondary-label">This Week</span>
          </div>
          <div className={`text-sm font-semibold ${accentColor}`}>
            {partnerStats.weeklyLove}
          </div>
        </div>

        {/* Love Streak */}
        <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
          <div className="flex items-center justify-center mb-1">
            <Zap className={`w-3 h-3 ${accentColor} mr-1`} />
            <span className="text-xs font-medium text-apple-secondary-label">Streak</span>
          </div>
          <div className={`text-sm font-semibold ${accentColor}`}>
            {partnerStats.loveStreak} days
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/30 rounded-lg p-2 mb-3 backdrop-blur-sm">
        <div className="flex items-center justify-center mb-1">
          <Clock className={`w-3 h-3 ${accentColor} mr-1`} />
          <span className="text-xs font-medium text-apple-secondary-label">Last Active</span>
        </div>
        <div className="text-xs text-apple-tertiary-label">
          {partnerStats.lastActiveTime}
        </div>
      </div>

      {/* Favorite Time */}
      <div className="flex items-center justify-center mb-3">
        <Calendar className={`w-3 h-3 ${accentColor} mr-1`} />
        <span className="text-xs text-apple-tertiary-label">
          Loves sharing in the {partnerStats.favoriteTime.toLowerCase()}
        </span>
      </div>
      
      {/* Progress Bar for Daily Goal */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-apple-tertiary-label">Daily Goal</span>
          <span className="text-xs text-apple-tertiary-label">75%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${progressColor} transition-all duration-500`}
            style={{ width: '75%' }}
          ></div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-xs text-apple-blue-light opacity-70 mb-2">
          Updating...
        </div>
      )}
      
      {/* Real-time Sync Indicator */}
      <div className="mt-2 text-xs text-apple-blue-light font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
        Real-time sync ✨
      </div>

      {/* Custom CSS for floating animation */}
      <style jsx>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-40px) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PartnerLoveCard;