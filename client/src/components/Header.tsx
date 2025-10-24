import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Camera, Calendar, Home, Settings, LogOut, ChevronDown, Trash2, Gift, Menu, X } from 'lucide-react';
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

const Header = memo(function Header() {
  const { logout } = useAuth();
  const location = useLocation();
  const [relationshipInfo, setRelationshipInfo] = useState<RelationshipInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState<TimeElapsed>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const calculateTimeElapsed = useCallback(() => {
    if (!relationshipInfo?.startDate) {
      // Fallback to default date if no relationship info
      const startDate = new Date('2020-06-08T00:00:00');
      const now = new Date();
      const diffMs = now.getTime() - startDate.getTime();
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeElapsed({ days, hours, minutes, seconds });
      return;
    }

    const startDate = new Date(relationshipInfo.startDate);
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    setTimeElapsed({ days, hours, minutes, seconds });
  }, [relationshipInfo]);

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
  }, [fetchRelationshipInfo]);

  useEffect(() => {
    calculateTimeElapsed();
    
    // Optimized timer: Update every 5 seconds instead of every second to reduce CPU usage
    // For a relationship counter, 5-second precision is perfectly acceptable
    const updateInterval = showDropdown ? 1000 : 5000; // 1s when dropdown is open, 5s when closed
    const timer = setInterval(calculateTimeElapsed, updateInterval);
    
    // Set up global refresh function for settings updates
    (window as any).refreshRelationshipInfo = fetchRelationshipInfo;
    
    // Cleanup function to prevent memory leaks
    return () => {
      clearInterval(timer);
      delete (window as any).refreshRelationshipInfo;
    };
  }, [fetchRelationshipInfo, calculateTimeElapsed, showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.relationship-dropdown')) {
        setShowDropdown(false);
      }
      if (showMobileMenu && !(event.target as Element).closest('.mobile-menu')) {
        setShowMobileMenu(false);
      }
    };

    if (showDropdown || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showMobileMenu]);

  // Memoize the active path check to prevent unnecessary re-calculations
  const isActive = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  // Memoize the time display components to prevent unnecessary re-renders
  const timeDisplayComponents = useMemo(() => (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="bg-apple-purple/5 rounded-lg p-3">
        <div className="text-2xl font-bold text-apple-purple">{timeElapsed.days}</div>
        <div style={{ color: 'var(--apple-secondary-label)' }} className="text-xs">Days</div>
      </div>
      <div className="bg-apple-purple/5 rounded-lg p-3">
        <div className="text-2xl font-bold text-apple-purple">{timeElapsed.hours}</div>
        <div style={{ color: 'var(--apple-secondary-label)' }} className="text-xs">Hours</div>
      </div>
      <div className="bg-apple-purple/5 rounded-lg p-3">
        <div className="text-2xl font-bold text-apple-purple">{timeElapsed.minutes}</div>
        <div style={{ color: 'var(--apple-secondary-label)' }} className="text-xs">Minutes</div>
      </div>
      <div className="bg-apple-purple/5 rounded-lg p-3">
        <div className="text-2xl font-bold text-apple-purple">{timeElapsed.seconds}</div>
        <div style={{ color: 'var(--apple-secondary-label)' }} className="text-xs">Seconds</div>
      </div>
    </div>
  ), [timeElapsed]);





  return (
    <header style={{
      background: 'var(--apple-glass-bg)',
      borderBottom: '1px solid var(--apple-separator)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)'
    }} className="sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group flex-shrink-0">
            <Heart 
              className="h-6 w-6 sm:h-7 sm:w-7 text-apple-purple animate-heart-bounce hover-glow transition-all duration-500" 
              fill="currentColor"
              style={{
                filter: 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.4))'
              }}
            />
            <span style={{ color: 'var(--apple-label)' }} className="font-semibold text-lg sm:text-xl group-hover:text-apple-purple transition-colors duration-300 hidden xs:block">
              Scott &amp; Zoe
            </span>
          </Link>

          {/* Relationship Counter Dropdown - Desktop */}
          {relationshipInfo && (
            <div className="relative hidden lg:block relationship-dropdown">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  background: 'var(--apple-glass-bg)',
                  boxShadow: 'var(--apple-shadow)'
                }}
                className="flex items-center space-x-2 rounded-xl px-4 py-2 hover:bg-apple-gray-6/10 transition-all duration-200"
              >
                <Heart className="h-4 w-4 text-apple-purple" fill="currentColor" />
                <span style={{ color: 'var(--apple-label)' }} className="text-sm font-medium">Days Together</span>
                <ChevronDown style={{ color: 'var(--apple-secondary-label)' }} className={`h-4 w-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div style={{
                  background: 'var(--apple-glass-bg)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: 'var(--apple-shadow)',
                  border: '1px solid var(--apple-separator)'
                }} className="absolute top-full right-0 mt-2 rounded-xl p-6 min-w-[280px] z-40">
                  <div className="text-center">
                    {timeDisplayComponents}
                    <div style={{ 
                      color: 'var(--apple-secondary-label)',
                      borderTop: '1px solid var(--apple-separator)'
                    }} className="pt-3">
                      <div className="text-xs">Since June 8th, 2020</div>
                      <div style={{ color: 'var(--apple-label)' }} className="font-medium text-sm mt-1">
                        💕 Every second counts! 💕
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              style={{
                color: isActive('/') ? 'var(--apple-purple)' : 'var(--apple-secondary-label)',
                backgroundColor: isActive('/') ? 'rgba(168, 85, 247, 0.1)' : 'transparent'
              }}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-apple-gray-6/10"
              onMouseEnter={(e) => {
                if (!isActive('/')) {
                  e.currentTarget.style.color = 'var(--apple-label)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/')) {
                  e.currentTarget.style.color = 'var(--apple-secondary-label)';
                }
              }}
            >
              <Home className="h-4 w-4" />
              <span className="hidden lg:inline font-medium">Home</span>
            </Link>
            
            <Link
              to="/gallery"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/gallery') 
                  ? 'bg-apple-purple/10 text-apple-purple' 
                  : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span className="hidden lg:inline font-medium">Gallery</span>
            </Link>
            
            <Link
              to="/memories"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/memories') 
                  ? 'bg-apple-purple/10 text-apple-purple' 
                  : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline font-medium">Memories</span>
            </Link>
            
            <Link
              to="/surprise-boxes"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/surprise-boxes') 
                  ? 'bg-apple-purple/10 text-apple-purple' 
                  : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
              }`}
            >
              <Gift className="h-4 w-4" />
              <span className="hidden lg:inline font-medium">Surprises</span>
            </Link>
            
            <Link
              to="/settings"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/settings') 
                  ? 'bg-apple-purple/10 text-apple-purple' 
                  : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline font-medium">Settings</span>
            </Link>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-apple-secondary-label hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline font-medium">Logout</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden mobile-menu">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-apple-secondary-label hover:text-apple-purple hover:bg-apple-purple/5 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile Menu Dropdown */}
            {showMobileMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl apple-shadow border border-apple-separator z-50">
                <div className="p-2">
                  <Link
                    to="/"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive('/') 
                        ? 'bg-apple-purple/10 text-apple-purple' 
                        : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
                    }`}
                  >
                    <Home className="h-4 w-4" />
                    <span className="font-medium">Home</span>
                  </Link>
                  
                  <Link
                    to="/gallery"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive('/gallery') 
                        ? 'bg-apple-purple/10 text-apple-purple' 
                        : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
                    }`}
                  >
                    <Camera className="h-4 w-4" />
                    <span className="font-medium">Gallery</span>
                  </Link>
                  
                  <Link
                    to="/memories"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive('/memories') 
                        ? 'bg-apple-purple/10 text-apple-purple' 
                        : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Memories</span>
                  </Link>
                  
                  <Link
                    to="/surprise-boxes"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive('/surprise-boxes') 
                        ? 'bg-apple-purple/10 text-apple-purple' 
                        : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
                    }`}
                  >
                    <Gift className="h-4 w-4" />
                    <span className="font-medium">Surprises</span>
                  </Link>
                  
                  <Link
                    to="/settings"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive('/settings') 
                        ? 'bg-apple-purple/10 text-apple-purple' 
                        : 'text-apple-secondary-label hover:bg-apple-gray-6/10 hover:text-apple-label'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Settings</span>
                  </Link>
                  
                  <div className="border-t border-apple-separator my-2"></div>
                  
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-apple-secondary-label hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Relationship Counter - Only show when menu is closed */}
        {relationshipInfo && !showMobileMenu && (
          <div className="lg:hidden pb-4 text-center">
            <div className="relative inline-block relationship-dropdown">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 apple-glass-background rounded-xl px-4 py-2 apple-shadow hover:bg-apple-gray-6/10 transition-all duration-200"
              >
                <Heart className="h-4 w-4 text-apple-purple" fill="currentColor" />
                <span className="text-sm font-medium text-apple-label">Days Together</span>
                <ChevronDown className={`h-4 w-4 text-apple-secondary-label transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white/95 backdrop-blur-xl rounded-xl p-4 apple-shadow border border-apple-separator min-w-[200px] z-50">
                  <div className="text-center">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-apple-purple/5 rounded-lg p-2">
                        <div className="text-lg font-bold text-apple-purple">{timeElapsed.days}</div>
                        <div className="text-xs text-apple-secondary-label">Days</div>
                      </div>
                      <div className="bg-apple-purple/5 rounded-lg p-2">
                        <div className="text-lg font-bold text-apple-purple">{timeElapsed.hours}</div>
                        <div className="text-xs text-apple-secondary-label">Hours</div>
                      </div>
                      <div className="bg-apple-purple/5 rounded-lg p-2">
                        <div className="text-lg font-bold text-apple-purple">{timeElapsed.minutes}</div>
                        <div className="text-xs text-apple-secondary-label">Minutes</div>
                      </div>
                      <div className="bg-apple-purple/5 rounded-lg p-2">
                        <div className="text-lg font-bold text-apple-purple">{timeElapsed.seconds}</div>
                        <div className="text-xs text-apple-secondary-label">Seconds</div>
                      </div>
                    </div>
                    <div className="text-apple-secondary-label border-t border-apple-separator pt-3">
                      <div className="text-xs">Since June 8th, 2020</div>
                      <div className="font-medium text-apple-label text-sm mt-1">
                        💕 Every second counts! 💕
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
});

export default Header;