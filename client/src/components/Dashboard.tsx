import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, Heart, Clock } from 'lucide-react';
import api, { API_BASE_URL } from '../utils/api';
import LoveCounter from './LoveCounter';
import PrizeWheel from './PrizeWheel';

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
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);
  const [upcomingMemories, setUpcomingMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState({ photos: 0, memories: 0, totalLove: 0 });
  const [catPositions, setCatPositions] = useState<CatPosition[]>([]);
  const [showWheel, setShowWheel] = useState(false);

  // Generate random positions for cats with minimum distance to avoid crowding
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

      // Fetch upcoming memories
      try {
        const memoriesResponse = await api.get('/api/memories/upcoming');
        setUpcomingMemories(memoriesResponse.data.slice(0, 3));
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
      <div className="fixed inset-0 z-0 pointer-events-auto">
        {catPositions.map((cat, index) => {
          const baseAnimations = ['animate-float', 'animate-float-slow', 'animate-pulse-glow'];
          const baseAnimation = baseAnimations[index % baseAnimations.length];
          const textSizes = ['text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-2xl', 'text-xl', 'text-lg'];
          const textSize = textSizes[index % textSizes.length];
          
          return (
            <div
              key={cat.id}
              className={`absolute ${textSize} ${cat.isJumping ? 'animate-jump-bounce' : baseAnimation} cursor-pointer hover:scale-150 hover:rotate-12 transition-all duration-300 select-none`}
              style={{
                top: cat.top,
                left: cat.left,
                animationDelay: `${index * 0.5}s`,
                zIndex: cat.isJumping ? 10 : 1
              }}
              title={cat.title}
              onClick={() => handleCatClick(cat.id)}
            >
              {cat.emoji}
            </div>
          );
        })}
      </div>
      
      <div className="relative max-w-6xl mx-auto px-6 py-8 z-20 pointer-events-none">
        {/* Welcome Section */}
        <div className="text-center slide-up mb-12">
          <h1 className="font-heading text-5xl font-semibold text-apple-label mb-6">
            Welcome to Our Love Story
          </h1>
          <p className="text-xl text-apple-secondary-label max-w-3xl mx-auto leading-relaxed">
            A private sanctuary where we celebrate our precious moments, memories, and the beautiful journey of our love ✨
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/gallery"
            className="apple-card apple-card-hover p-6 apple-shadow transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100/50 pointer-events-auto"
          >
            {/* Lovely background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-100/30 to-purple-100/30 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-2 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{stats.photos}</div>
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
                        src={`${API_BASE_URL}/api/photos/image/${photo.filename}`}
                        alt={photo.caption || 'Recent photo'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-sm text-gray-600 text-left mb-2">
                {recentPhotos.length > 0 ? '✨ Latest memories captured with love' : '🌟 Ready to capture beautiful moments together'}
              </div>
              
              <div className="flex items-center justify-between">
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
            className="apple-card apple-card-hover p-6 text-center apple-shadow transition-all duration-200 hover:scale-105 cursor-pointer group pointer-events-auto relative z-10"
          >
            <Calendar className="h-12 w-12 text-apple-blue-light mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
            <div className="text-3xl font-semibold text-apple-label mb-2">{stats.memories}</div>
            <div className="text-apple-secondary-label group-hover:text-apple-blue-light transition-colors duration-200 mb-3">Memories Created</div>
            
            {/* Recent memories preview */}
            {upcomingMemories.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs text-apple-tertiary-label mb-2">Recent:</div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {upcomingMemories.slice(0, 2).map((memory, index) => (
                    <div
                      key={memory.id}
                      className="bg-apple-gray-6/10 rounded-lg px-2 py-1 text-xs text-apple-secondary-label transform transition-all duration-300 hover:bg-apple-blue/10 hover:text-apple-blue"
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      {memory.title.length > 12 ? `${memory.title.substring(0, 12)}...` : memory.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-apple-tertiary-label mt-3">
              Special moments we'll never forget
            </div>
            <div className="mt-2 text-xs text-apple-blue-light font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Browse Memories →
            </div>
          </Link>
          
          <div className="relative z-20 pointer-events-auto">
            <LoveCounter />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="apple-card apple-shadow p-8 mb-8 pointer-events-auto">
          <h2 className="text-2xl font-semibold text-apple-label mb-6 text-center">
            Create New Memories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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



        {/* Upcoming Memories */}
        {upcomingMemories.length > 0 && (
          <div className="mb-8 pointer-events-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-apple-label flex items-center">
                <Clock className="h-6 w-6 mr-3 text-apple-blue-light" />
                Upcoming Anniversaries
              </h2>
              <Link
                to="/memories"
                className="text-apple-blue-light hover:text-apple-blue-light/80 font-medium transition-colors pointer-events-auto"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {upcomingMemories.map((memory) => (
                <div key={memory.id} className="apple-card apple-shadow p-6 pointer-events-auto">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-apple-label">{memory.title}</h3>
                      <p className="text-apple-secondary-label text-sm mt-1">{memory.description}</p>
                    </div>
                    <div className="text-right text-sm text-apple-tertiary-label">
                      {new Date(memory.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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