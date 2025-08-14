import { useState, useEffect } from 'react';
import { Heart, ArrowLeft, Trophy, Gift, User, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import DeveloperSettings from './DeveloperSettings';
import WheelConfigManager from './WheelConfigManager';
import WheelPreview from './WheelPreview';

interface RelationshipInfo {
  startDate: string;
  daysTogether: number;
  names: string[];
}

interface WheelPrize {
  id: number;
  prizeType: string;
  prizeValue: number;
  prizeDescription: string;
  wonAt: string;
}

interface OtherUser {
  id: number;
  username: string;
  displayName: string;
}

interface PrizeTemplate {
  id?: number;
  prizeName: string;
  prizeDescription: string;
  prizeType: string;
  prizeValue: number;
  probability: number;
  color: string;
  displayOrder: number;
}

function Settings() {
  const { user } = useAuth();
  const [relationshipInfo, setRelationshipInfo] = useState<RelationshipInfo | null>(null);
  const [wheelPrizes, setWheelPrizes] = useState<WheelPrize[]>([]);
  const [prizeStats, setPrizeStats] = useState({ totalPrizes: 0, totalValue: 0 });
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [savedOpportunities, setSavedOpportunities] = useState(0);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [activeTab, setActiveTab] = useState<'my-wheel' | 'other-wheel'>('my-wheel');
  const [myWheelPrizes, setMyWheelPrizes] = useState<PrizeTemplate[]>([]);
  const [otherWheelPrizes, setOtherWheelPrizes] = useState<PrizeTemplate[]>([]);

  useEffect(() => {
    const fetchRelationshipInfo = async () => {
      try {
        const response = await api.get('/api/auth/relationship-info');
        setRelationshipInfo(response.data);
      } catch (error) {
        console.error('Error fetching relationship info:', error);
      }
    };

    const fetchWheelPrizes = async () => {
      try {
        setLoadingPrizes(true);
        const [prizesResponse, statsResponse] = await Promise.all([
          api.get('/api/wheel-prizes'),
          api.get('/api/wheel-prizes/stats')
        ]);
        setWheelPrizes(prizesResponse.data.prizes || []);
        setPrizeStats(statsResponse.data);
      } catch (error) {
        console.error('Error fetching wheel prizes:', error);
      } finally {
        setLoadingPrizes(false);
      }
    };

    const fetchUserData = async () => {
      try {
        setLoadingUserData(true);
        const response = await api.get('/api/opportunities/stats');
        setSavedOpportunities(response.data.unused || 0);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoadingUserData(false);
      }
    };

    const fetchOtherUser = async () => {
      try {
        const response = await api.get('/api/auth/other-user');
        setOtherUser(response.data);
      } catch (error) {
        console.error('Error fetching other user:', error);
      }
    };

    const fetchWheelConfigurations = async () => {
      try {
        // Fetch my wheel configuration
        const myWheelResponse = await api.get('/api/wheel-config/my-wheel');
        if (myWheelResponse.data.hasConfiguration && myWheelResponse.data.prizes) {
          setMyWheelPrizes(myWheelResponse.data.prizes);
        }

        // Fetch other user's wheel configuration
        if (otherUser) {
          const otherWheelResponse = await api.get(`/api/wheel-config/other-user-wheel/${otherUser.id}`);
          if (otherWheelResponse.data.hasConfiguration && otherWheelResponse.data.prizes) {
            setOtherWheelPrizes(otherWheelResponse.data.prizes);
          }
        }
      } catch (error) {
        console.error('Error fetching wheel configurations:', error);
      }
    };

    fetchRelationshipInfo();
    fetchWheelPrizes();
    fetchUserData();
    fetchOtherUser();
  }, []);

  useEffect(() => {
    if (otherUser) {
      const fetchWheelConfigurations = async () => {
        try {
          // Fetch my wheel configuration
          const myWheelResponse = await api.get('/api/wheel-config/my-wheel');
          if (myWheelResponse.data.hasConfiguration && myWheelResponse.data.prizes) {
            setMyWheelPrizes(myWheelResponse.data.prizes);
          }

          // Fetch other user's wheel configuration
          const otherWheelResponse = await api.get(`/api/wheel-config/other-user-wheel/${otherUser.id}`);
          if (otherWheelResponse.data.hasConfiguration && otherWheelResponse.data.prizes) {
            setOtherWheelPrizes(otherWheelResponse.data.prizes);
          }
        } catch (error) {
          console.error('Error fetching wheel configurations:', error);
        }
      };

      fetchWheelConfigurations();
    }
  }, [otherUser]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Settings functionality has been simplified - days together is now calculated in real-time

  return (
    <div className="min-h-screen bg-apple-secondary-background">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-apple-blue hover:text-apple-blue/80 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-apple-blue/10 p-4 rounded-2xl">
                <Heart className="h-8 w-8 text-apple-blue" fill="currentColor" />
              </div>
            </div>
            <h1 className="font-heading text-4xl font-semibold text-apple-label mb-3">
              Relationship Settings
            </h1>
            <p className="text-apple-secondary-label text-lg">
              Customize your love story timeline
            </p>
          </div>
        </div>

        {/* Settings Info */}
        <div className="apple-card apple-shadow p-8">
          <div className="text-center space-y-6">
            <div className="bg-apple-blue/5 border border-apple-blue/20 rounded-xl p-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-apple-blue mb-3">
                  💕
                </div>
                <div className="text-xl font-semibold text-apple-label mb-2">
                  Your Love Story
                </div>
                <div className="text-apple-secondary-label">
                  Started on {relationshipInfo ? formatDate(relationshipInfo.startDate) : 'June 8th, 2020'}
                </div>
                <div className="text-sm text-apple-tertiary-label mt-4">
                  Watch your days together count up in real-time in the header!
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-apple-secondary-label">
                Your relationship timeline is automatically calculated and updates every second.
              </p>
            </div>
          </div>
        </div>

        {/* User-Specific Stats */}
        <div className="mt-8">
          <div className="apple-card apple-shadow p-8">
            <div className="flex items-center justify-center mb-6">
              <div className={`p-3 rounded-2xl mr-4 ${
                user?.username === 'scott' ? 'bg-blue-100' : 'bg-pink-100'
              }`}>
                <User className={`h-6 w-6 ${
                  user?.username === 'scott' ? 'text-blue-600' : 'text-pink-600'
                }`} />
              </div>
              <h2 className="text-2xl font-semibold text-apple-label">
                {user?.name || user?.username || 'Your'} Stats
              </h2>
            </div>
            
            {loadingUserData ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                <div className="text-sm text-apple-secondary-label">Loading your stats...</div>
              </div>
            ) : (
              <div className="flex justify-center">
                {/* Saved Opportunities */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center max-w-sm">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {savedOpportunities}
                  </div>
                  <div className="text-yellow-700 font-medium mb-1">
                    Saved Opportunities
                  </div>
                  <div className="text-sm text-yellow-600">
                    Ready to use on prize wheel
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wheel Prize History */}
        <div className="mt-8">
          <div className="apple-card apple-shadow p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-purple-100 p-3 rounded-2xl mr-4">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-apple-label">
                Prize Wheel History
              </h2>
            </div>
            
            {/* Prize Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {prizeStats.totalPrizes}
                </div>
                <div className="text-sm text-purple-700">
                  Total Prizes Won
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {prizeStats.totalValue}
                </div>
                <div className="text-sm text-green-700">
                  Total Value
                </div>
              </div>
            </div>
            
            {/* Prize List */}
            {loadingPrizes ? (
              <div className="text-center py-8">
                <div className="text-apple-secondary-label">Loading prize history...</div>
              </div>
            ) : wheelPrizes.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {wheelPrizes.map((prize) => (
                  <div key={prize.id} className="bg-apple-secondary-background border border-apple-separator rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                          <Gift className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium text-apple-label">
                            {prize.prizeDescription}
                          </div>
                          <div className="text-sm text-apple-secondary-label">
                            {new Date(prize.wonAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          +{prize.prizeValue}
                        </div>
                        <div className="text-xs text-apple-tertiary-label">
                          {prize.prizeType}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-100 p-4 rounded-2xl mb-4 inline-block">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-apple-secondary-label mb-2">
                  No prizes won yet
                </div>
                <div className="text-sm text-apple-tertiary-label">
                  Start spinning the wheel to win prizes!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wheel Configuration Management */}
        <div className="mt-8">
          <div className="apple-card apple-shadow p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 p-3 rounded-2xl mr-4">
                <SettingsIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-apple-label">
                Wheel Configuration
              </h2>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-apple-secondary-label">
                Customize each other's prize wheels and adjust winning probabilities
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-apple-secondary-background rounded-lg p-1 flex">
                <button
                  onClick={() => setActiveTab('my-wheel')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'my-wheel'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-apple-secondary-label hover:text-apple-label'
                  }`}
                >
                  My Wheel
                </button>
                <button
                  onClick={() => setActiveTab('other-wheel')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'other-wheel'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-apple-secondary-label hover:text-apple-label'
                  }`}
                >
                  {otherUser?.displayName || otherUser?.username || 'Partner'}'s Wheel
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-8">
              {activeTab === 'my-wheel' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-apple-label mb-4">
                      Current Configuration
                    </h3>
                    <div className="flex justify-center">
                      <WheelPreview prizes={myWheelPrizes} size={250} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-apple-label mb-4">
                      Configuration Details
                    </h3>
                    <div className="bg-apple-secondary-background rounded-lg p-4">
                      {myWheelPrizes.length > 0 ? (
                        <div className="space-y-2">
                          {myWheelPrizes.map((prize, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-apple-separator last:border-b-0">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: prize.color }}
                                ></div>
                                <span className="font-medium">{prize.prizeName}</span>
                              </div>
                              <span className="text-sm text-apple-secondary-label">
                                {prize.probability.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-apple-secondary-label text-center py-4">
                          No configuration set yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <WheelConfigManager 
                    targetUserId={otherUser?.id} 
                    targetUserName={otherUser?.displayName || otherUser?.username}
                  />
                  
                  {otherWheelPrizes.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-apple-label mb-4 text-center">
                        Live Preview
                      </h3>
                      <div className="flex justify-center">
                        <WheelPreview prizes={otherWheelPrizes} size={300} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Developer Settings - Only for Scott */}
        {/* {user?.username === 'scott' && (
          <div className="mt-8">
            <DeveloperSettings />
          </div>
        )} */}

        {/* Additional Info */}
        {/* <div className="mt-8 text-center">
          <p className="text-sm text-apple-tertiary-label">
            Your love story began on {relationshipInfo ? formatDate(relationshipInfo.startDate) : 'June 8th, 2020'}. Every moment since then is precious! 💖
          </p>
        </div> */}
      </div>
    </div>
  );
}

export default Settings;