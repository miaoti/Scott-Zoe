import React, { useState, useEffect } from 'react';
import { Heart, Gift, Sparkles, Star } from 'lucide-react';
import PrizeWheel from './PrizeWheel';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

interface LoveCounterProps {
  onLoveClick?: () => void;
}

interface LoveStats {
  count: number;
  totalCount: number;
  nextMilestone: number;
  remainingToMilestone: number;
  currentLevel: number;
  progressPercent: number;
  isMilestoneReached: boolean;
}

const LoveCounter: React.FC<LoveCounterProps> = ({ onLoveClick }) => {
  const [loveStats, setLoveStats] = useState<LoveStats>({
    count: 0,
    totalCount: 0,
    nextMilestone: 520,
    remainingToMilestone: 520,
    currentLevel: 1,
    progressPercent: 0,
    isMilestoneReached: false
  });
  const [showWheel, setShowWheel] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [savedOpportunities, setSavedOpportunities] = useState(0);
  const [canUseWheelThisWeek, setCanUseWheelThisWeek] = useState(true);
  const { showLoveSuccess, showToast } = useToast();

  // Load love stats from backend on component mount
  useEffect(() => {
    fetchLoveStats();
    fetchEarnings();
    loadSavedOpportunities();
    fetchWheelUsageStatus();
  }, []);

  const loadSavedOpportunities = () => {
    const opportunities = parseInt(localStorage.getItem('wheelOpportunities') || '0');
    setSavedOpportunities(opportunities);
  };

  const fetchWheelUsageStatus = async () => {
    try {
      const response = await api.get('/api/wheel/stats');
      setCanUseWheelThisWeek(response.data.canUseThisWeek);
    } catch (error) {
      console.error('Error fetching wheel usage status:', error);
      // Fallback to localStorage check
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekKey = startOfWeek.toDateString();
      const lastUsedWeek = localStorage.getItem('wheelLastUsedWeek');
      setCanUseWheelThisWeek(lastUsedWeek !== weekKey);
    }
  };

  const useSavedOpportunity = async () => {
    if (savedOpportunities > 0) {
      try {
        // Check wheel usage status from backend
        const response = await api.get('/api/wheel/stats');
        const wheelStats = response.data;

        if (!wheelStats.canUseThisWeek) {
          // Still the same week - can't use saved opportunities yet
          alert('🚫 Saved opportunities can only be used next week! Come back after the week resets.');
          return;
        }

        // It's a new week - can use saved opportunity
        setShowWheel(true);
      } catch (error) {
        console.error('Error checking wheel usage status:', error);
        // Fallback to localStorage check
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekKey = startOfWeek.toDateString();
        const lastUsedWeek = localStorage.getItem('wheelLastUsedWeek');

        if (lastUsedWeek === weekKey) {
          alert('🚫 Saved opportunities can only be used next week! Come back after the week resets.');
          return;
        }

        setShowWheel(true);
      }
    }
  };

  const fetchEarnings = async () => {
    try {
      // Try to fetch from backend first
      const response = await api.get('/api/user/earnings');
      setTotalEarnings(response.data.total || 0);
      // Sync with localStorage
      localStorage.setItem('totalEarnings', (response.data.total || 0).toString());
    } catch (error) {
      console.log('Backend earnings endpoint not available, using localStorage');
      // Fallback to localStorage
      const savedEarnings = localStorage.getItem('totalEarnings');
      if (savedEarnings) {
        setTotalEarnings(parseInt(savedEarnings));
      }
    }
  };

  const fetchLoveStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/love');
      setLoveStats(response.data);
    } catch (error) {
      console.error('Error fetching love stats:', error);
      // Fallback to default values
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeWon = async (amount: number) => {
    console.log('🎰 Claiming prize:', amount);

    // Save to backend first
    try {
      const response = await api.post('/api/user/earnings', {
        amount: amount,
        source: 'prize_wheel'
      });

      console.log('✅ Prize earnings saved to backend successfully:', response.data);

      // Update frontend with backend response (more reliable)
      const backendTotal = response.data.total;
      setTotalEarnings(backendTotal);
      localStorage.setItem('totalEarnings', backendTotal.toString());

      // Show success feedback to user
      showToast(`💰 $${amount} prize saved to your account! Total: $${backendTotal}`, 'general', 5000);

      // Refresh earnings from backend to ensure consistency
      await fetchEarnings();

    } catch (error) {
      console.error('❌ Error saving prize earnings to backend:', error);

      // Fallback to localStorage
      const newTotal = totalEarnings + amount;
      setTotalEarnings(newTotal);
      localStorage.setItem('totalEarnings', newTotal.toString());

      // Still show success to user since localStorage worked
      showToast(`💰 $${amount} prize claimed! Total: $${newTotal} (saved locally)`, 'general', 5000);
    }
  };

  const handleLoveClick = async () => {
    // Allow rapid clicking - don't prevent if already animating

    // Trigger visual feedback immediately
    setIsAnimating(true);
    setShowHearts(true);

    // Reset animations quickly to allow rapid clicking
    setTimeout(() => {
      setIsAnimating(false);
      setShowHearts(false);
    }, 300); // Reduced from 1000ms to 300ms

    try {
      // Increment love count on backend
      const response = await api.post('/api/love/increment');
      const newStats = response.data;

      // Update local state
      setLoveStats({
        count: newStats.count,
        totalCount: newStats.totalCount,
        nextMilestone: newStats.nextMilestone,
        remainingToMilestone: newStats.remainingToMilestone,
        currentLevel: newStats.currentLevel,
        progressPercent: newStats.progressPercent,
        isMilestoneReached: newStats.isMilestoneReached
      });

      // Show love success toast (but not too frequently)
      if (Math.random() < 0.3) { // Only show toast 30% of the time for rapid clicking
        showLoveSuccess();
      }

      // Check if we've reached a milestone
      if (newStats.justReachedMilestone) {
        try {
          // Check wheel usage status from backend
          const wheelResponse = await api.get('/api/wheel/stats');
          const wheelStats = wheelResponse.data;

          if (!wheelStats.canUseThisWeek) {
            // Already used this week, save opportunity for next week
            const currentOpportunities = parseInt(localStorage.getItem('wheelOpportunities') || '0');
            localStorage.setItem('wheelOpportunities', (currentOpportunities + 1).toString());
            loadSavedOpportunities(); // Refresh the count in UI
            alert('🎉 You reached 520 love! Since you already used the wheel this week, this opportunity has been saved for next week!');
          } else {
            // Can use immediately
            setTimeout(() => {
              setShowWheel(true);
            }, 500);
          }
        } catch (error) {
          console.error('Error checking wheel usage status for milestone:', error);
          // Fallback to localStorage logic
          const today = new Date();
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          const weekKey = startOfWeek.toDateString();
          const lastUsedWeek = localStorage.getItem('wheelLastUsedWeek');

          if (lastUsedWeek === weekKey) {
            const currentOpportunities = parseInt(localStorage.getItem('wheelOpportunities') || '0');
            localStorage.setItem('wheelOpportunities', (currentOpportunities + 1).toString());
            loadSavedOpportunities();
            alert('🎉 You reached 520 love! Since you already used the wheel this week, this opportunity has been saved for next week!');
          } else {
            setTimeout(() => {
              setShowWheel(true);
            }, 500);
          }
        }
      }

    } catch (error) {
      console.error('Error incrementing love count:', error);
      // Don't show alert for rapid clicking - just log the error
    }

    onLoveClick?.();
  };

  // Loading state
  if (loading) {
    return (
      <div className="apple-card apple-card-hover p-6 text-center apple-shadow relative overflow-hidden">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-apple-gray-6/20 rounded-full mx-auto mb-4"></div>
          <div className="w-16 h-8 bg-apple-gray-6/20 rounded mx-auto mb-2"></div>
          <div className="w-20 h-4 bg-apple-gray-6/20 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Love Counter Card */}
        <div className="apple-card apple-card-hover p-6 text-center apple-shadow relative overflow-hidden">
          {/* Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-red-50 opacity-50" />
          
          {/* Floating Hearts Animation */}
          {showHearts && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <Heart
                  key={i}
                  className={`absolute w-4 h-4 text-red-500 fill-current animate-float-up`}
                  style={{
                    left: `${20 + i * 10}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Main Content */}
          <div className="relative z-10">
            <button
              onClick={handleLoveClick}
              className={`group relative transition-all duration-300 ${
                isAnimating ? 'scale-125' : 'hover:scale-110'
              }`}
            >
              <Heart 
                className={`h-12 w-12 mx-auto mb-4 transition-all duration-300 ${
                  isAnimating 
                    ? 'text-red-500 fill-current animate-pulse' 
                    : 'text-gradient fill-current group-hover:text-red-500'
                }`}
              />
              <div className="absolute -inset-2 bg-red-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <div className="text-3xl font-semibold text-apple-label mb-2">
              {loveStats.count.toLocaleString()}
            </div>
            <div className="text-apple-secondary-label mb-2">Love Shared</div>

            {/* Earnings Display */}
            {totalEarnings > 0 && (
              <div className="mb-4 p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 font-medium">
                  💰 {totalEarnings} Zoe Total Earned
                </div>
              </div>
            )}

            {/* Saved Opportunities Display */}
            {savedOpportunities > 0 && (() => {
              // Use backend state for wheel usage status
              const canUseThisWeek = canUseWheelThisWeek;

              return (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-700 font-medium">
                        🎰 {savedOpportunities} Saved Spin{savedOpportunities > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {canUseThisWeek
                          ? 'Ready to use this week!'
                          : 'Available next week!'
                        }
                      </div>
                    </div>
                    <button
                      onClick={useSavedOpportunity}
                      disabled={!canUseThisWeek}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        canUseThisWeek
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canUseThisWeek ? 'Use Now' : 'Next Week'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Progress to Next Milestone */}
            {loveStats.count > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-apple-secondary-label">
                  <span>Level {loveStats.currentLevel}</span>
                  <span>{loveStats.remainingToMilestone} to next prize</span>
                </div>
                <div className="w-full bg-apple-gray-6/20 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${loveStats.progressPercent}%` }}
                  />
                </div>
                {loveStats.remainingToMilestone <= 50 && (
                  <div className="flex items-center justify-center space-x-1 text-xs text-red-500 animate-pulse">
                    <Gift className="w-3 h-3" />
                    <span>Prize wheel coming soon!</span>
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Milestone Achievements */}
        {loveStats.count >= 520 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-yellow-700 font-medium">
                Milestone Level {loveStats.currentLevel} Achieved!
              </span>
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            </div>
            <div className="text-center text-xs text-yellow-600 mt-1">
              You've unlocked {Math.floor(loveStats.count / 520)} prize wheel{Math.floor(loveStats.count / 520) > 1 ? 's' : ''}!
            </div>
          </div>
        )}
      </div>

      {/* Prize Wheel Modal */}
      {showWheel && (
        <PrizeWheel
          onClose={() => {
            setShowWheel(false);
            loadSavedOpportunities(); // Refresh saved opportunities count
            fetchEarnings(); // Refresh earnings from backend
            fetchWheelUsageStatus(); // Refresh wheel usage status
          }}
          level={loveStats.currentLevel}
          onPrizeWon={handlePrizeWon}
        />
      )}
    </>
  );
};

export default LoveCounter;
