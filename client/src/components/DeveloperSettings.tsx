import React, { useState, useEffect } from 'react';
import { Settings, Lock, Users, Heart, Gift, Trash2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface DeveloperData {
  loveCount: number;
  scott: {
    opportunities: number;
    earningsHistory: any[];
  };
  zoe: {
    opportunities: number;
    earningsHistory: any[];
  };
}

const DeveloperSettings: React.FC = () => {
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DeveloperData | null>(null);
  const [error, setError] = useState('');
  
  // Form states
  const [newLoveCount, setNewLoveCount] = useState('');
  const [scottOpportunities, setScottOpportunities] = useState('');
  const [zoeOpportunities, setZoeOpportunities] = useState('');

  // Check if user is Scott
  const isScott = user?.username === 'scott';

  useEffect(() => {
    if (!isScott) {
      setError('Access denied. Only Scott can access developer settings.');
    }
  }, [isScott]);

  const verifyPassword = async () => {
    if (!password) {
      setError('Please enter the developer password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/developer/verify', { password });
      
      if (response.data.success) {
        setIsAuthenticated(true);
        await loadDeveloperData();
      } else {
        setError(response.data.message || 'Invalid password');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const loadDeveloperData = async () => {
    try {
      const response = await api.post('/api/developer/data', { password });
      setData(response.data);
      
      // Set form values
      setNewLoveCount(response.data.loveCount.toString());
      setScottOpportunities(response.data.scott.opportunities.toString());
      setZoeOpportunities(response.data.zoe.opportunities.toString());
    } catch (error: any) {
      setError('Failed to load developer data');
    }
  };

  const updateLoveCount = async () => {
    if (!newLoveCount || isNaN(Number(newLoveCount))) {
      setError('Please enter a valid love count');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/developer/love/set', {
        password,
        count: Number(newLoveCount)
      });
      
      await loadDeveloperData();
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update love count');
    } finally {
      setLoading(false);
    }
  };

  const updateOpportunities = async (targetUser: 'scott' | 'zoe') => {
    const count = targetUser === 'scott' ? scottOpportunities : zoeOpportunities;
    
    if (!count || isNaN(Number(count))) {
      setError(`Please enter a valid opportunity count for ${targetUser}`);
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/developer/opportunities/set', {
        password,
        targetUser,
        count: Number(count)
      });
      
      await loadDeveloperData();
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update opportunities');
    } finally {
      setLoading(false);
    }
  };

  const clearEarnings = async (targetUser: 'scott' | 'zoe') => {
    if (!confirm(`Are you sure you want to clear all earnings history for ${targetUser}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/developer/earnings/clear', {
        password,
        targetUser
      });
      
      await loadDeveloperData();
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to clear earnings');
    } finally {
      setLoading(false);
    }
  };

  if (!isScott) {
    return (
      <div className="apple-card p-6 text-center">
        <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-apple-label mb-2">Access Denied</h3>
        <p className="text-apple-secondary-label">Only Scott can access developer settings.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="apple-card p-6">
        <div className="text-center mb-6">
          <Settings className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-apple-label mb-2">Developer Settings</h3>
          <p className="text-apple-secondary-label">Enter the developer password to access advanced settings</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-apple-label mb-2">
              Developer Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
              className="w-full px-3 py-2 border border-apple-separator rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter password"
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          
          <button
            onClick={verifyPassword}
            disabled={loading}
            className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verifying...' : 'Access Developer Settings'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="apple-card p-6">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 text-purple-500 mr-3" />
          <h3 className="text-lg font-semibold text-apple-label">Developer Settings</h3>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {data && (
          <div className="space-y-8">
            {/* Love Counter Section */}
            <div className="border-b border-apple-separator pb-6">
              <div className="flex items-center mb-4">
                <Heart className="h-5 w-5 text-red-500 mr-2" />
                <h4 className="font-semibold text-apple-label">Love Counter</h4>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm text-apple-secondary-label mb-1">
                    Current: {data.loveCount.toLocaleString()}
                  </label>
                  <input
                    type="number"
                    value={newLoveCount}
                    onChange={(e) => setNewLoveCount(e.target.value)}
                    className="w-full px-3 py-2 border border-apple-separator rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="New love count"
                  />
                </div>
                <button
                  onClick={updateLoveCount}
                  disabled={loading}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Update
                </button>
              </div>
            </div>
            
            {/* Users Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Scott */}
              <div className="border border-purple-200 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <Users className="h-5 w-5 text-purple-500 mr-2" />
                  <h4 className="font-semibold text-purple-700">Scott</h4>
                </div>
                
                <div className="space-y-4">
                  {/* Opportunities */}
                  <div>
                    <label className="block text-sm text-apple-secondary-label mb-1">
                      Spin Opportunities (Current: {data.scott.opportunities})
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={scottOpportunities}
                        onChange={(e) => setScottOpportunities(e.target.value)}
                        className="flex-1 px-3 py-2 border border-apple-separator rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="New count"
                      />
                      <button
                        onClick={() => updateOpportunities('scott')}
                        disabled={loading}
                        className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors flex items-center"
                      >
                        <Gift className="h-4 w-4 mr-1" />
                        Set
                      </button>
                    </div>
                  </div>
                  
                  {/* Earnings */}
                  <div>
                    <label className="block text-sm text-apple-secondary-label mb-1">
                      Earnings History ({data.scott.earningsHistory.length} records)
                    </label>
                    <button
                      onClick={() => clearEarnings('scott')}
                      disabled={loading}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Zoe */}
              <div className="border border-pink-200 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <Users className="h-5 w-5 text-pink-500 mr-2" />
                  <h4 className="font-semibold text-pink-700">Zoe</h4>
                </div>
                
                <div className="space-y-4">
                  {/* Opportunities */}
                  <div>
                    <label className="block text-sm text-apple-secondary-label mb-1">
                      Spin Opportunities (Current: {data.zoe.opportunities})
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={zoeOpportunities}
                        onChange={(e) => setZoeOpportunities(e.target.value)}
                        className="flex-1 px-3 py-2 border border-apple-separator rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="New count"
                      />
                      <button
                        onClick={() => updateOpportunities('zoe')}
                        disabled={loading}
                        className="bg-pink-500 text-white px-3 py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center"
                      >
                        <Gift className="h-4 w-4 mr-1" />
                        Set
                      </button>
                    </div>
                  </div>
                  
                  {/* Earnings */}
                  <div>
                    <label className="block text-sm text-apple-secondary-label mb-1">
                      Earnings History ({data.zoe.earningsHistory.length} records)
                    </label>
                    <button
                      onClick={() => clearEarnings('zoe')}
                      disabled={loading}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperSettings;