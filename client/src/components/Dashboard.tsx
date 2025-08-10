import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, Heart, Image, Clock } from 'lucide-react';
import api from '../utils/api';
import LoveCounter from './LoveCounter';

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
    <div className="space-y-8 fade-in bg-apple-secondary-background min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
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
            className="apple-card apple-card-hover p-6 text-center apple-shadow transition-all duration-200 hover:scale-105 cursor-pointer group"
          >
            <Camera className="h-12 w-12 text-apple-blue mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
            <div className="text-3xl font-semibold text-apple-label mb-2">{stats.photos}</div>
            <div className="text-apple-secondary-label group-hover:text-apple-blue transition-colors duration-200 mb-3">Photos Shared</div>
            <div className="text-xs text-apple-tertiary-label">
              Capturing beautiful moments together
            </div>
            <div className="mt-2 text-xs text-apple-blue font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              View Gallery →
            </div>
          </Link>

          <Link
            to="/memories"
            className="apple-card apple-card-hover p-6 text-center apple-shadow transition-all duration-200 hover:scale-105 cursor-pointer group"
          >
            <Calendar className="h-12 w-12 text-apple-blue-light mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
            <div className="text-3xl font-semibold text-apple-label mb-2">{stats.memories}</div>
            <div className="text-apple-secondary-label group-hover:text-apple-blue-light transition-colors duration-200 mb-3">Memories Created</div>
            <div className="text-xs text-apple-tertiary-label">
              Special moments we'll never forget
            </div>
            <div className="mt-2 text-xs text-apple-blue-light font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Browse Memories →
            </div>
          </Link>
          
          <LoveCounter />
        </div>

        {/* Quick Actions */}
        <div className="apple-card apple-shadow p-8 mb-8">
          <h2 className="text-2xl font-semibold text-apple-label mb-6 text-center">
            Create New Memories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/gallery"
              className="bg-apple-blue/5 border border-apple-blue/20 rounded-xl p-6 hover:bg-apple-blue/10 transition-all duration-300 group"
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
              className="bg-apple-blue/5 border border-apple-blue/20 rounded-xl p-6 hover:bg-apple-blue/10 transition-all duration-300 group"
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

        {/* Recent Photos */}
        {recentPhotos.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-apple-label flex items-center">
                <Image className="h-6 w-6 mr-3 text-apple-blue" />
                Recent Photos
              </h2>
              <Link
                to="/gallery"
                className="text-apple-blue hover:text-apple-blue/80 font-medium transition-colors"
              >
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentPhotos.map((photo) => (
                <Link
                  key={photo.id}
                  to={`/photo/${photo.id}`}
                  className="group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden apple-card apple-shadow group-hover:apple-shadow-large transition-all duration-200">
                    <img
                      src={`http://localhost:3001/uploads/${photo.filename}`}
                      alt={photo.originalName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-apple-secondary-label mt-2 truncate">
                    {photo.caption || photo.originalName}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Memories */}
        {upcomingMemories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-apple-label flex items-center">
                <Clock className="h-6 w-6 mr-3 text-apple-blue-light" />
                Upcoming Anniversaries
              </h2>
              <Link
                to="/memories"
                className="text-apple-blue-light hover:text-apple-blue-light/80 font-medium transition-colors"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {upcomingMemories.map((memory) => (
                <div key={memory.id} className="apple-card apple-shadow p-6">
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
    </div>
  );
}

export default Dashboard;