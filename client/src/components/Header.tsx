import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Camera, Calendar, Home, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface RelationshipInfo {
  startDate: string;
  daysTogether: number;
  names: string[];
}

interface TimeElapsed {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function Header() {
  const { logout } = useAuth();
  const location = useLocation();
  const [relationshipInfo, setRelationshipInfo] = useState<RelationshipInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState<TimeElapsed>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const calculateTimeElapsed = useCallback(() => {
    const startDate = new Date('2024-06-08T00:00:00');
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    setTimeElapsed({ days, hours, minutes, seconds });
  }, []);

  const fetchRelationshipInfo = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/relationship-info');
      setRelationshipInfo(response.data);
    } catch (error) {
      console.error('Error fetching relationship info:', error);
    }
  }, []);

  useEffect(() => {
    fetchRelationshipInfo();
    calculateTimeElapsed();
    
    // Set up real-time timer
    const timer = setInterval(calculateTimeElapsed, 1000);
    
    // Set up global refresh function for settings updates
    (window as any).refreshRelationshipInfo = fetchRelationshipInfo;
    
    // Cleanup function to prevent memory leaks
    return () => {
      clearInterval(timer);
      delete (window as any).refreshRelationshipInfo;
    };
  }, [fetchRelationshipInfo, calculateTimeElapsed]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.relationship-dropdown')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);



  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="apple-glass-effect border-b border-apple-separator sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <Heart className="h-7 w-7 text-apple-blue-light floating" fill="currentColor" />
            <span className="font-semibold text-xl text-apple-label">
              Scott &amp; Zoe
            </span>
          </Link>

          {/* Relationship Counter Dropdown */}
          {relationshipInfo && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 apple-glass-background rounded-xl px-4 py-2 apple-shadow hover:bg-apple-gray-6/10 transition-all duration-200"
              >
                <Heart className="h-4 w-4 text-apple-blue-light" fill="currentColor" />
                <span className="text-sm font-medium text-apple-label">Days Together</span>
                <ChevronDown className={`h-4 w-4 text-apple-secondary-label transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-xl p-6 apple-shadow border border-apple-separator min-w-[280px] z-50">
                  <div className="text-center">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-apple-blue/5 rounded-lg p-3">
                        <div className="text-2xl font-bold text-apple-blue">{timeElapsed.days}</div>
                        <div className="text-xs text-apple-secondary-label">Days</div>
                      </div>
                      <div className="bg-apple-blue/5 rounded-lg p-3">
                        <div className="text-2xl font-bold text-apple-blue">{timeElapsed.hours}</div>
                        <div className="text-xs text-apple-secondary-label">Hours</div>
                      </div>
                      <div className="bg-apple-blue/5 rounded-lg p-3">
                        <div className="text-2xl font-bold text-apple-blue">{timeElapsed.minutes}</div>
                        <div className="text-xs text-apple-secondary-label">Minutes</div>
                      </div>
                      <div className="bg-apple-blue/5 rounded-lg p-3">
                        <div className="text-2xl font-bold text-apple-blue">{timeElapsed.seconds}</div>
                        <div className="text-xs text-apple-secondary-label">Seconds</div>
                      </div>
                    </div>
                    <div className="text-apple-secondary-label border-t border-apple-separator pt-3">
                      <div className="text-xs">Since June 8th, 2024</div>
                      <div className="font-medium text-apple-label text-sm mt-1">
                        💕 Every second counts! 💕
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex items-center space-x-2">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-apple-blue-light/10 text-apple-blue-light' 
                  : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Home</span>
            </Link>
            
            <Link
              to="/gallery"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/gallery') 
                  ? 'bg-apple-blue-light/10 text-apple-blue-light' 
                  : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Gallery</span>
            </Link>
            
            <Link
              to="/memories"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/memories') 
                  ? 'bg-apple-blue-light/10 text-apple-blue-light' 
                  : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Memories</span>
            </Link>
            
            <Link
              to="/settings"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/settings') 
                  ? 'bg-apple-blue-light/10 text-apple-blue-light' 
                  : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Settings</span>
            </Link>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-apple-secondary-label hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </nav>
        </div>

        {/* Mobile Relationship Counter Dropdown */}
        {relationshipInfo && (
          <div className="md:hidden pb-4 text-center">
            <div className="relative inline-block">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 apple-glass-background rounded-xl px-4 py-2 apple-shadow hover:bg-apple-gray-6/10 transition-all duration-200"
              >
                <Heart className="h-4 w-4 text-apple-blue-light" fill="currentColor" />
                <span className="text-sm font-medium text-apple-label">Days Together</span>
                <ChevronDown className={`h-4 w-4 text-apple-secondary-label transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white/95 backdrop-blur-xl rounded-xl p-4 apple-shadow border border-apple-separator min-w-[200px] z-50">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-apple-blue-light mb-1">
                      {relationshipInfo.daysTogether}
                    </div>
                    <div className="text-sm text-apple-secondary-label mb-3">
                      Days Together
                    </div>
                    <div className="text-apple-secondary-label border-t border-apple-separator pt-3">
                      <div className="text-xs">Since</div>
                      <div className="font-medium text-apple-label">
                        {new Date(relationshipInfo.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;