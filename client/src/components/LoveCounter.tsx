import React, { useState, useEffect } from 'react';
import { Heart, Gift, Sparkles, Star } from 'lucide-react';
import PrizeWheel from './PrizeWheel';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();
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

  const [savedOpportunities, setSavedOpportunities] = useState(0);
  const [canUseWheelThisWeek, setCanUseWheelThisWeek] = useState(true);
  const { showLoveSuccess, showToast } = useToast();

  // Load love stats from backend on component mount
  useEffect(() => {
    fetchLoveStats();
    loadSavedOpportunities();
    fetchWheelUsageStatus();
  }, []);

  const loadSavedOpportunities = async () => {
    try {
      const response = await api.get('/api/opportunities/stats');
      setSavedOpportunities(response.data.unused || 0);
    } catch (error) {
      console.error('Error loading saved opportunities from backend:', error);
      // Fallback to localStorage
      const opportunities = parseInt(localStorage.getItem('wheelOpportunities') || '0');
      setSavedOpportunities(opportunities);
    }
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

  const useSavedOpportunity = async (event?: React.MouseEvent) => {
    // Prevent event bubbling to parent elements
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
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
    // Prize recording is now handled by PrizeWheel component's handleClaimPrize
    console.log('Prize won:', amount);
  };

  const [clickQueue, setClickQueue] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fire effect states for rapid clicking
  const [isBurning, setIsBurning] = useState(false);
  const [fireParticles, setFireParticles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [clickTimes, setClickTimes] = useState<number[]>([]);
  const [rapidClickCount, setRapidClickCount] = useState(0);

  // Process queued clicks with debouncing
  useEffect(() => {
    if (clickQueue > 0 && !isProcessing) {
      setIsProcessing(true);
      const clicksToProcess = clickQueue;
      setClickQueue(0);
      
      processLoveClicks(clicksToProcess);
    }
  }, [clickQueue, isProcessing]);

  const processLoveClicks = async (clickCount: number) => {
    try {
      // Process multiple clicks in a single request
      const promises = [];
      for (let i = 0; i < clickCount; i++) {
        promises.push(api.post('/api/love/increment'));
      }
      
      const responses = await Promise.allSettled(promises);
      const successfulResponses = responses
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);
      
      if (successfulResponses.length > 0) {
        // Use the last successful response for UI update
        const lastResponse = successfulResponses[successfulResponses.length - 1];
        const newStats = lastResponse.data;

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

        // Show love success toast occasionally
        if (Math.random() < 0.2) {
          showLoveSuccess();
        }

        // Check if we've reached a milestone
        if (newStats.justReachedMilestone) {
          await handleMilestoneReached();
        }
      }
    } catch (error) {
      console.error('Error processing love clicks:', error);
      showToast('Failed to share love. Please try again.', 'general');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMilestoneReached = async () => {
    try {
      // Check wheel usage status from backend
      const wheelResponse = await api.get('/api/wheel/stats');
      const wheelStats = wheelResponse.data;

      if (!wheelStats.canUseThisWeek) {
        // Already used this week, save opportunity for next week in backend
        try {
          await api.post('/api/opportunities/create', {
            source: 'milestone_520'
          });
          await loadSavedOpportunities();
          showToast('🎉 You reached 520 love! Opportunity saved for next week!', 'general');
        } catch (opportunityError) {
          console.error('Error saving opportunity to backend:', opportunityError);
          // Fallback to localStorage
          const currentOpportunities = parseInt(localStorage.getItem('wheelOpportunities') || '0');
          localStorage.setItem('wheelOpportunities', (currentOpportunities + 1).toString());
          await loadSavedOpportunities();
          showToast('🎉 You reached 520 love! Opportunity saved for next week!', 'general');
        }
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
        try {
          await api.post('/api/opportunities/create', {
            source: 'milestone_520'
          });
          await loadSavedOpportunities();
          showToast('🎉 You reached 520 love! Opportunity saved for next week!', 'general');
        } catch (opportunityError) {
          console.error('Error saving opportunity to backend:', opportunityError);
          // Final fallback to localStorage
          const currentOpportunities = parseInt(localStorage.getItem('wheelOpportunities') || '0');
          localStorage.setItem('wheelOpportunities', (currentOpportunities + 1).toString());
          await loadSavedOpportunities();
          showToast('🎉 You reached 520 love! Opportunity saved for next week!', 'general');
        }
      } else {
        setTimeout(() => {
          setShowWheel(true);
        }, 500);
      }
    }
  };

  const handleLoveClick = async (event?: React.MouseEvent) => {
    // Prevent event bubbling to parent elements
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const currentTime = Date.now();
    
    // Update click times for rapid click detection
    setClickTimes(prev => {
      const newTimes = [...prev, currentTime].filter(time => currentTime - time < 2000); // Keep clicks from last 2 seconds
      
      // Check for rapid clicking (5+ clicks in 2 seconds)
      if (newTimes.length >= 5) {
        triggerBurningEffect();
        setRapidClickCount(prev => prev + 1);
      }
      
      return newTimes;
    });
    
    // Trigger visual feedback immediately
    setIsAnimating(true);
    setShowHearts(true);

    // Reset animations quickly to allow rapid clicking
    setTimeout(() => {
      setIsAnimating(false);
      setShowHearts(false);
    }, 300);

    // Queue the click for processing
    setClickQueue(prev => prev + 1);

    onLoveClick?.();
  };
  
  const triggerBurningEffect = () => {
    setIsBurning(true);
    
    // Create fire particles
    const particles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: 30 + Math.random() * 40, // Random position around the heart
      y: 40 + Math.random() * 20
    }));
    
    setFireParticles(particles);
    
    // Reset burning effect after animation
    setTimeout(() => {
      setIsBurning(false);
      setFireParticles([]);
    }, 2000);
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
      <div className="relative pointer-events-auto touch-manipulation">
        {/* Love Counter Card */}
        <div className="apple-card apple-card-hover p-6 text-center apple-shadow relative overflow-hidden">
          {/* Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-red-50 opacity-50" />
          
          {/* Simplified Floating Hearts Animation - contained within card */}
          {showHearts && (
            <div className="absolute inset-4 pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <Heart
                  key={i}
                  className={`absolute w-3 h-3 fill-current animate-float-up ${
                    isBurning ? 'text-orange-400' : 'text-red-400'
                  }`}
                  style={{
                    left: `${20 + i * 15}%`,
                    top: '80%',
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Simplified Fire Effects when burning - contained within card */}
          {isBurning && (
            <div className="absolute inset-4 pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <span
                  key={`fire-${i}`}
                  className="absolute animate-fire-particles text-sm"
                  style={{
                    left: `${25 + i * 20}%`,
                    top: '75%',
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '1.2s'
                  }}
                >
                  🔥
                </span>
              ))}
            </div>
          )}
          
          {/* Main Content */}
          <div className="relative z-10">
            <button
              onClick={(e) => handleLoveClick(e)}
              className={`group relative z-30 pointer-events-auto transition-all duration-500 touch-manipulation hover-bounce ${
                isAnimating ? 'animate-cute-squish' : ''
              } ${
                isBurning ? 'animate-fire-glow' : ''
              }`}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                filter: isBurning 
                  ? 'drop-shadow(0 2px 8px rgba(255, 69, 0, 0.4))'
                  : 'drop-shadow(0 2px 6px rgba(239, 68, 68, 0.2))'
              }}
            >
              <Heart 
                className={`h-12 w-12 mx-auto mb-4 transition-all duration-500 ${
                  isBurning
                    ? 'text-orange-500 fill-current animate-fire-flicker'
                    : isAnimating 
                      ? 'text-red-500 fill-current animate-heart-bounce' 
                      : 'text-gradient fill-current group-hover:text-red-500 hover-glow'
                }`}
                style={{
                  filter: isBurning
                    ? 'drop-shadow(0 0 12px rgba(255, 69, 0, 0.6))'
                    : isAnimating 
                      ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' 
                      : 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.3))'
                }}
              />
              
              {/* Simplified Fire Particles - contained within button area */}
              {isBurning && fireParticles.slice(0, 3).map(particle => (
                <div
                  key={particle.id}
                  className="absolute animate-fire-particles pointer-events-none"
                  style={{
                    left: `${Math.max(10, Math.min(90, particle.x))}%`,
                    top: `${Math.max(10, Math.min(90, particle.y))}%`,
                    fontSize: '12px',
                    zIndex: 40
                  }}
                >
                  🔥
                </div>
              ))}
              
              <div className={`absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                isBurning 
                  ? 'bg-gradient-to-r from-orange-400/20 to-red-400/20'
                  : 'bg-gradient-to-r from-red-400/15 to-pink-400/15'
              }`} />
            </button>
            
            <div className="text-3xl font-semibold text-apple-label mb-2">
              {loveStats.count.toLocaleString()}
            </div>
            <div className="text-apple-secondary-label mb-2">Love Shared</div>

            {/* Earnings Display - Removed as requested */}

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
                      onClick={(e) => useSavedOpportunity(e)}
                      disabled={!canUseThisWeek}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors relative z-30 pointer-events-auto touch-manipulation ${
                        canUseThisWeek
                          ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
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
