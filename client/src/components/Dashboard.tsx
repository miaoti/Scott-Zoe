import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Calendar, Heart, Clock, Gift, Users, Star, MapPin, FileText } from 'lucide-react';
import api, { API_BASE_URL } from '../utils/api';
import PrizeWheel from './PrizeWheel';
import LoveCounter from './LoveCounter';
import PartnerLoveCard from './PartnerLoveCard';
import { useSurpriseBoxActions } from '../hooks/useSurpriseBoxActions';
import BoxDropManager from './BoxDropManager';
import TurnBasedNotePad from './TurnBasedNotePad';
import { usePageVisibility } from '../hooks/usePageVisibility';

// Utility function to safely parse dates from different formats
const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    // Handle ISO format with T and Z (e.g., "2025-10-02T11:50:49.491Z")
    if (dateString.includes('T')) {
      return new Date(dateString);
    }
    
    // Handle simple timestamp format (e.g., "2025-10-02 06:51:00")
    // Replace space with T to make it ISO compatible
    const isoString = dateString.replace(' ', 'T');
    return new Date(isoString);
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return null;
  }
};

// Utility function to format date safely
const formatDate = (dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
  const date = parseDate(dateString);
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString('en-US', options || { month: 'short', day: 'numeric' });
};

interface CatPosition {
  id: string;
  top: string;
  left: string;
  emoji: string;
  title: string;
  isJumping: boolean;
}

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  caption?: string;
  createdAt: string;
  uploader: { name: string };
}

interface Memory {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
  creator: { name: string };
}

function Dashboard() {
  const navigate = useNavigate();
  const isPageVisible = usePageVisibility();
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);
  const [randomPhotos, setRandomPhotos] = useState<Photo[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [upcomingMemories, setUpcomingMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState({ photos: 0, memories: 0, totalLove: 0 });
  const [catPositions, setCatPositions] = useState<CatPosition[]>([]);
  const [showWheel, setShowWheel] = useState(false);

  const {
    ownedBoxes,
    receivedBoxes,
    droppedBoxes,
    activeBox,
    loadOwnedBoxes,
    loadReceivedBoxes,
    loadActiveBox,
    loadDroppedBoxes,
    claimBox,
    connectWebSocket,
    disconnectWebSocket,
    isConnected,
    error,
    openSurpriseBox
  } = useSurpriseBoxActions();

  // Generate random positions for cats with minimum distance to avoid crowd
  const generateRandomPosition = (existingPositions: CatPosition[] = []): { top: string; left: string } => {
    let attempts = 0;
    let position;
    
    do {
      const top = Math.random() * 70 + 15; // 15% to 85% from top (more constrained)
      const left = Math.random() * 70 + 15; // 15% to 85% from left (more constrained)
      position = { top: `${top}%`, left: `${left}%` };
      
      // Check if position is far enough from existing cats
      const isFarEnough = existingPositions.every(existing => {
        const existingTop = parseFloat(existing.top);
        const existingLeft = parseFloat(existing.left);
        const distance = Math.sqrt(
          Math.pow(top - existingTop, 2) + Math.pow(left - existingLeft, 2)
        );
        return distance > 15; // Minimum 15% distance
      });
      
      if (isFarEnough || attempts > 20) break; // Give up after 20 attempts
      attempts++;
    } while (attempts <= 20);
    
    return position;
  };

  // Initialize cat positions
  useEffect(() => {
    const cats = [
      { emoji: '🐱', title: 'Meow! 🐱' },
      { emoji: '😸', title: 'Happy kitty! 😸' },
      { emoji: '😻', title: 'Love you! 😻' },
      { emoji: '🐾', title: 'Paw prints! 🐾' },
      { emoji: '😺', title: 'Cute cat! 😺' },
      { emoji: '💕', title: 'Love! 💕' }
    ];

    const initialPositions: CatPosition[] = [];
    cats.forEach((cat, index) => {
      const position = generateRandomPosition(initialPositions);
      initialPositions.push({
        id: `cat-${index}`,
        ...position,
        emoji: cat.emoji,
        title: cat.title,
        isJumping: false
      });
    });

    setCatPositions(initialPositions);
  }, []);

  // Handle wheel opportunity usage
  const handleUseOpportunity = async () => {
    try {
      // Use the saved opportunity
      await api.post('/api/opportunities/use');
      // Open the prize wheel
      setShowWheel(true);
    } catch (error) {
      console.error('Error using opportunity:', error);
    }
  };

  // Handle cat click - trigger jump and relocate
  const handleCatClick = (catId: string) => {
    setCatPositions(prev => prev.map(cat => 
      cat.id === catId 
        ? { ...cat, isJumping: true }
        : cat
    ));

    // After animation completes, relocate cat and reset jumping state
    setTimeout(() => {
      setCatPositions(prev => {
        const otherCats = prev.filter(cat => cat.id !== catId);
        const newPosition = generateRandomPosition(otherCats);
        return prev.map(cat => 
          cat.id === catId 
            ? { ...cat, ...newPosition, isJumping: false }
            : cat
        );
      });
    }, 1000); // Match animation duration
  };

  // Handle memory click - navigate to memories page and open detail
  const handleMemoryClick = (memoryId: number) => {
    // Store the memory ID in sessionStorage as a fallback
    sessionStorage.setItem('openMemoryId', memoryId.toString());
    navigate(`/memories?openMemory=${memoryId}`);
  };

  // Fetch random photos for carousel
  const fetchRandomPhotos = async () => {
    try {
      setCarouselLoading(true);
      const response = await api.get('/api/photos/random?limit=18');
      
      // Ensure we have valid photo data
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setRandomPhotos(response.data);
      } else {
        console.warn('No photos available for carousel');
        setRandomPhotos([]);
      }
    } catch (error) {
      console.error('Error fetching random photos:', error);
      // Fallback to empty array if API fails
      setRandomPhotos([]);
    } finally {
      setCarouselLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchRandomPhotos();
    loadOwnedBoxes();
    loadReceivedBoxes();
    loadDroppedBoxes();
    loadActiveBox();
    

  }, [loadOwnedBoxes, loadReceivedBoxes, loadDroppedBoxes, loadActiveBox]);

  // Handle claiming a box
  const handleClaimBox = async (boxId: number) => {
    try {
      await claimBox(boxId);
    } catch (error) {
      console.error('Failed to claim box:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch recent photos with pagination
      const photosResponse = await api.get('/api/photos?page=0&limit=50');
      console.log('Dashboard photos response:', photosResponse.data);

      // Handle both old and new API response formats
      const photosData = photosResponse.data.photos || photosResponse.data;
      const totalPhotos = photosResponse.data.pagination?.total || photosData.length;

      setRecentPhotos(photosData.slice(0, 6));
      setStats(prev => ({ ...prev, photos: totalPhotos }));

      // Fetch upcoming memories for dashboard (excluding event type)
      try {
        const memoriesResponse = await api.get('/api/memories/dashboard/upcoming?limit=3');
        setUpcomingMemories(memoriesResponse.data);
      } catch (memError) {
        console.log('No upcoming memories endpoint, skipping');
        setUpcomingMemories([]);
      }

      // Fetch all memories for count
      try {
        const allMemoriesResponse = await api.get('/api/memories');
        setStats(prev => ({ ...prev, memories: allMemoriesResponse.data.length }));
      } catch (memError) {
        console.log('No memories endpoint, setting count to 0');
        setStats(prev => ({ ...prev, memories: 0 }));
      }

      // Fetch total love count
      try {
        const loveResponse = await api.get('/api/love');
        setStats(prev => ({ ...prev, totalLove: loveResponse.data.totalCount || 0 }));
      } catch (loveError) {
        console.log('No love stats endpoint, setting count to 0');
        setStats(prev => ({ ...prev, totalLove: 0 }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="relative space-y-8 fade-in min-h-screen overflow-hidden bg-white">
      {/* Interactive Animated Cat Components */}
      <div className={`fixed inset-0 z-0 pointer-events-auto ${showWheel ? 'opacity-20' : ''}`}>
        {catPositions.map((cat, index) => {
          const baseAnimations = [
            'animate-float hover-bounce', 
            'animate-float-slow hover-wiggle', 
            'animate-pulse-glow hover-glow',
            'animate-wiggle hover-bounce',
            'animate-playful-spin hover-glow',
            'animate-heart-bounce hover-wiggle'
          ];
          const baseAnimation = baseAnimations[index % baseAnimations.length];
          const textSizes = ['text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-2xl', 'text-xl', 'text-lg'];
          const textSize = textSizes[index % textSizes.length];
          
          return (
            <div
              key={cat.id}
              className={`absolute ${textSize} ${cat.isJumping ? 'animate-jump-bounce' : baseAnimation} cursor-pointer select-none transition-all duration-500 ease-out`}
              style={{
                top: cat.top,
                left: cat.left,
                animationDelay: `${index * 0.8}s`,
                zIndex: cat.isJumping ? 10 : 1,
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))'
              }}
              title={cat.title}
              onClick={() => handleCatClick(cat.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.3) rotate(10deg)';
                e.currentTarget.style.filter = 'drop-shadow(0 4px 16px rgba(255, 182, 193, 0.6))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.filter = 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))';
              }}
            >
              {cat.emoji}
            </div>
          );
        })}
      </div>
      
      <div className={`relative max-w-6xl mx-auto px-6 py-8 z-20 pointer-events-none ${showWheel ? 'opacity-30 pointer-events-none' : ''}`}>
        {/* Infinite Sliding Photo Carousel */}
        <div className="slide-up mb-12">
          <div className="relative h-32 md:h-36 overflow-hidden rounded-2xl apple-shadow group">
            {carouselLoading ? (
              /* Loading State */
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-pink-400 rounded-full animate-bounce"></div>
                  <div className="w-4 h-4 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-4 h-4 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              ) : randomPhotos.length === 0 ? (
                /* No Photos Fallback */
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-gray-600 text-sm">No photos yet - start creating memories!</p>
                  </div>
                </div>
              ) : (
                /* Dynamic Multi-Photo Carousel */
                <>
                  <div className={`absolute inset-0 flex gap-2 ${isPageVisible ? 'animate-infinite-slide-multi' : ''}`}>
                    {/* First Set of Random Photos */}
                    {randomPhotos.map((photo, index) => (
                      <div key={`first-${photo.id}`} className="w-48 md:w-56 h-full flex-shrink-0 relative rounded-lg overflow-hidden shadow-md">
                        <img
                          src={`${API_BASE_URL}/api/photos/image/${photo.filename}?size=medium`}
                          alt={photo.caption || 'Beautiful moment from our love story'}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            // Fallback to a placeholder if image fails to load
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0NCIgdmlld0JveD0iMCAwIDIwMCAxNDQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTQ0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzJDMTAwI...
                          }}
                        />
                        {/* Elegant overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        
                        {/* Decorative element */}
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-80">
                          <span className="text-white text-xs">{index % 3 === 0 ? '✨' : index % 3 === 1 ? '💕' : '🌟'}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Second Set for Seamless Loop */}
                    {randomPhotos.map((photo, index) => (
                      <div key={`second-${photo.id}`} className="w-48 md:w-56 h-full flex-shrink-0 relative rounded-lg overflow-hidden shadow-md">
                        <img
                          src={`${API_BASE_URL}/api/photos/image/${photo.filename}?size=medium`}
                          alt={photo.caption || 'Beautiful moment from our love story'}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            // Fallback to a placeholder if image fails to load
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0NCIgdmlld0JveD0iMCAwIDIwMCAxNDQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTQ0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzJDMTAwI...
                          }}
                        />
                        {/* Elegant overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        
                        {/* Decorative element */}
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-80">
                          <span className="text-white text-xs">{index % 3 === 0 ? '✨' : index % 3 === 1 ? '💕' : '🌟'}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Third Set for Extra Seamless Loop */}
                    {randomPhotos.map((photo, index) => (
                      <div key={`third-${photo.id}`} className="w-48 md:w-56 h-full flex-shrink-0 relative rounded-lg overflow-hidden shadow-md">
                        <img
                          src={`${API_BASE_URL}/api/photos/image/${photo.filename}?size=medium`}
                          alt={photo.caption || 'Beautiful moment from our love story'}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            // Fallback to a placeholder if image fails to load
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0NCIgdmlld0JveD0iMCAwIDIwMCAxNDQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTQ0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzJDMTAwI...
                          }}
                        />
                        {/* Elegant overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        
                        {/* Decorative element */}
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-80">
                          <span className="text-white text-xs">{index % 3 === 0 ? '✨' : index % 3 === 1 ? '💕' : '🌟'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Caption Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/40 to-transparent">
                    <p className="text-white text-xs font-medium text-center">
                      Our beautiful journey together ✨
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes infinite-slide-multi {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-33.333%); }
          }
          
          .animate-infinite-slide-multi {
            animation: infinite-slide-multi 45s linear infinite;
            will-change: transform;
            transform: translate3d(0, 0, 0);
          }
          
          .animate-infinite-slide-multi:hover {
            animation-play-state: paused;
          }
        `}</style>

        {/* Love Share Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <LoveCounter />
          <PartnerLoveCard />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/gallery"
            className="apple-card apple-card-hover p-6 apple-shadow transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100/50 pointer-events-auto"
          >
            {/* Lovely background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-100/30 to-purple-100/30 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform duration-700"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-pink-500 to-purple-400 p-2 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-500 bg-clip-text text-transparent">{stats.photos}</div>
              </div>
              
              <div className="text-lg font-semibold text-gray-800 group-hover:text-pink-600 transition-colors duration-200 mb-4 text-left flex items-center">
                💕 Photos Shared
              </div>
              
              {/* Recent Photos Thumbnails with lovely styling */}
              {recentPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {recentPhotos.slice(0, 4).map((photo, index) => (
                    <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-white shadow-sm border-2 border-pink-100 group-hover:border-pink-200 transition-all duration-300" style={{animationDelay: `${index * 100}ms`}}>
                      <img
                        src={`${API_BASE_URL}/api/photos/image/${photo.filename}?size=thumbnail`}
                        alt={photo.caption || 'Recent photo'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-sm text-gray-600 text-left mb-3">
                {recentPhotos.length > 0 ? '✨ Latest memories captured with love' : '🌟 Ready to capture beautiful moments together'}
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="text-xs text-pink-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  View Gallery →
                </div>
                <div className="text-xs text-gray-400">
                  💖 Made with love
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/memories"
            className="apple-card apple-card-hover apple-shadow transition-all duration-200 hover:scale-105 cursor-pointer group pointer-events-auto relative z-10 overflow-hidden"
          >
            {/* Background decorations */}
            <div className="absolute inset-0 bg-gradient-to-br from-apple-blue/5 to-apple-purple/5 opacity-60"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-apple-blue/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-apple-purple/10 rounded-full blur-xl"></div>
            
            <div className="relative p-6">
              {/* Header with icon and stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="bg-apple-blue/10 p-3 rounded-xl group-hover:bg-apple-blue/20 transition-colors duration-200">
                  <Calendar className="h-6 w-6 text-apple-blue" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-apple-label">{stats.memories}</div>
                  <div className="text-xs text-apple-tertiary-label">Total</div>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-apple-label mb-3 group-hover:text-apple-blue transition-colors duration-200">
                Memories Created
              </h3>
              
              {/* Upcoming memories grid */}
              {upcomingMemories.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs text-apple-tertiary-label font-medium">Upcoming:</div>
                  <div className="grid grid-cols-1 gap-2">
                    {upcomingMemories.slice(0, 3).map((memory, index) => (
                      <div
                        key={memory.id}
                        className="bg-apple-gray-6/20 backdrop-blur-sm rounded-lg p-2.5 transform transition-all duration-300 hover:bg-apple-blue/10 hover:scale-105 cursor-pointer"
                        style={{
                          animationDelay: `${index * 0.1}s`
                        }}
                        onClick={() => handleMemoryClick(memory.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-apple-label truncate flex-1 mr-2">
                            {memory.title}
                          </div>
                          <div className="text-xs text-apple-tertiary-label whitespace-nowrap">
                            {(() => {
                              try {
                                // Handle array format [year, month, day] from Java LocalDate
                                let year, month, day;
                                if (Array.isArray(memory.date)) {
                                  [year, month, day] = memory.date;
                                } else if (typeof memory.date === 'string') {
                                  const dateStr = memory.date.includes('T') ? memory.date.split('T')[0] : memory.date;
                                  [year, month, day] = dateStr.split('-').map(Number);
                                } else {
                                  return 'Invalid Date';
                                }
                                
                                const date = new Date(year, month - 1, day);
                                return !isNaN(date.getTime()) ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Invalid Date';
                              } catch (error) {
                                return 'Invalid Date';
                              }
                            })()} 
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-sm text-apple-tertiary-label mb-2">No upcoming memories</div>
                  <div className="text-xs text-apple-quaternary-label">Create your first memory</div>
                </div>
              )}
              
              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-apple-separator/30">
                <div className="text-xs text-apple-tertiary-label text-center">
                  Special moments we'll never forget
                </div>
                <div className="mt-1 text-xs text-apple-blue font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Browse All Memories →
                </div>
              </div>
            </div>
          </Link>
        </div>



        {/* Quick Actions */}
        <div className="apple-card apple-shadow p-8 mb-8 pointer-events-auto">
          <h2 className="text-2xl font-semibold text-apple-label mb-6 text-center">
            Create New Memories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/gallery"
              className="bg-apple-blue/5 border border-apple-blue/20 rounded-xl p-6 hover:bg-apple-blue/10 transition-all duration-300 group pointer-events-auto"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-apple-blue/10 p-3 rounded-xl group-hover:bg-apple-blue/20 transition-colors">
                  <Camera className="h-6 w-6 text-apple-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-apple-label">Upload Photos</h3>
                  <p className="text-sm text-apple-secondary-label">Add new memories to your gallery</p>
                </div>
              </div>
            </Link>

            <Link
              to="/memories"
              className="bg-apple-blue/5 border border-apple-blue/20 rounded-xl p-6 hover:bg-apple-blue/10 transition-all duration-300 group pointer-events-auto"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-apple-blue/10 p-3 rounded-xl group-hover:bg-apple-blue/20 transition-colors">
                  <Calendar className="h-6 w-6 text-apple-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-apple-label">Add Memory</h3>
                  <p className="text-sm text-apple-secondary-label">Create a special moment</p>
                </div>
              </div>
            </Link>



          </div>
        </div>





        {/* Empty State */}
        {recentPhotos.length === 0 && upcomingMemories.length === 0 && (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-apple-blue/30 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-apple-label mb-4">
              Start Your Love Story
            </h3>
            <p className="text-apple-secondary-label mb-8 max-w-md mx-auto">
              Your beautiful journey together begins here. Use the quick actions above to upload your first photos and create special memories.
            </p>
          </div>
        )}
      </div>

      {/* Box Drop Manager */}
      <BoxDropManager />

      {/* Prize Wheel Modal */}
      {showWheel && (
        <PrizeWheel
          onClose={() => setShowWheel(false)}
          level={1}
          onPrizeWon={async (amount: number) => {
            console.log('Prize won:', amount);
            // The prize is automatically saved by the PrizeWheel component
          }}
        />
      )}


    </div>
  );
}

export default Dashboard;