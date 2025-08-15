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
  
  // Advanced Fire Spreading System for rapid clicking
  const [isBurning, setIsBurning] = useState(false);
  const [fireParticles, setFireParticles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [clickTimes, setClickTimes] = useState<number[]>([]);
  const [rapidClickCount, setRapidClickCount] = useState(0);
  const [burningTimeoutId, setBurningTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Advanced fire spreading states
  const [fireIntensity, setFireIntensity] = useState(0); // 0-100 intensity level
  const [isFireSpreading, setIsFireSpreading] = useState(false);
  const [spreadingParticles, setSpreadingParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    size: number;
    opacity: number;
    speed: number;
    type: 'ember' | 'flame' | 'spark';
  }>>([]);
  const [dashboardFireLevel, setDashboardFireLevel] = useState(0); // 0-3 levels of fire spread

  // Process queued clicks with debouncing
  useEffect(() => {
    if (clickQueue > 0 && !isProcessing) {
      setIsProcessing(true);
      const clicksToProcess = clickQueue;
      setClickQueue(0);
      
      processLoveClicks(clicksToProcess);
    }
  }, [clickQueue, isProcessing]);

  // Cleanup burning timeout on unmount
  useEffect(() => {
    return () => {
      if (burningTimeoutId) {
        clearTimeout(burningTimeoutId);
      }
    };
  }, [burningTimeoutId]);

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
    
    // Trigger visual feedback immediately, but only if not burning
    if (!isBurning) {
      setIsAnimating(true);
      setShowHearts(true);

      // Reset animations quickly to allow rapid clicking
      setTimeout(() => {
        setIsAnimating(false);
        setShowHearts(false);
      }, 300);
    }

    // Queue the click for processing
    setClickQueue(prev => prev + 1);

    onLoveClick?.();
  };
  
  const triggerBurningEffect = () => {
    setIsBurning(true);
    
    // Clear existing timeout if user continues rapid clicking
    if (burningTimeoutId) {
      clearTimeout(burningTimeoutId);
    }
    
    // Increase fire intensity based on rapid clicking
    setFireIntensity(prev => {
      const newIntensity = Math.min(100, prev + 15);
      
      // Trigger fire spreading at different intensity levels
      if (newIntensity >= 30 && !isFireSpreading) {
        triggerFireSpreading(newIntensity);
      } else if (newIntensity >= 60) {
        escalateFireSpreading(newIntensity);
      }
      
      return newIntensity;
    });
    
    // Only create new particles if we don't have enough or if intensity is very low
    setFireParticles(prev => {
      if (prev.length < 3 || fireIntensity < 20) {
        const particleCount = Math.min(12, 4 + Math.floor(fireIntensity / 10));
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
          id: Date.now() + i + Math.random() * 1000,
          x: 30 + Math.random() * 40,
          y: 40 + Math.random() * 20
        }));
        return newParticles;
      }
      return prev;
    });
    
    // Extended burning effect duration for more fancy feel
    const timeoutId = setTimeout(() => {
      // Gradual cooldown instead of instant stop
      cooldownFireEffect();
    }, 4000);
    
    setBurningTimeoutId(timeoutId);
  };
  
  const triggerFireSpreading = (intensity: number) => {
    setIsFireSpreading(true);
    
    // Generate spreading particles that move beyond the card
    const spreadCount = Math.floor(intensity / 10) * 3;
    const newSpreadingParticles = Array.from({ length: spreadCount }, (_, i) => {
      const angle = (Math.PI * 2 * i) / spreadCount + Math.random() * 0.5;
      const distance = 200 + Math.random() * 300;
      
      return {
        id: Date.now() + i + 1000,
        x: 50, // Start from heart center
        y: 50,
        targetX: 50 + Math.cos(angle) * distance,
        targetY: 50 + Math.sin(angle) * distance,
        size: 8 + Math.random() * 12,
        opacity: 0.8 + Math.random() * 0.2,
        speed: 2 + Math.random() * 3,
        type: ['ember', 'flame', 'spark'][Math.floor(Math.random() * 3)] as 'ember' | 'flame' | 'spark'
      };
    });
    
    setSpreadingParticles(prev => [...prev, ...newSpreadingParticles]);
    
    // Set dashboard fire level based on intensity
    if (intensity >= 80) {
      setDashboardFireLevel(3); // Full dashboard fire
    } else if (intensity >= 60) {
      setDashboardFireLevel(2); // Spread to adjacent cards
    } else {
      setDashboardFireLevel(1); // Spread beyond current card
    }
  };
  
  const escalateFireSpreading = (intensity: number) => {
    // Add more particles for higher intensity
    const additionalParticles = Array.from({ length: 5 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 400;
      
      return {
        id: Date.now() + i + 2000,
        x: 50,
        y: 50,
        targetX: 50 + Math.cos(angle) * distance,
        targetY: 50 + Math.sin(angle) * distance,
        size: 12 + Math.random() * 16,
        opacity: 0.9,
        speed: 3 + Math.random() * 4,
        type: 'flame' as const
      };
    });
    
    setSpreadingParticles(prev => [...prev, ...additionalParticles]);
    
    // Update dashboard fire level
    if (intensity >= 90) {
      setDashboardFireLevel(3);
    } else if (intensity >= 70) {
      setDashboardFireLevel(2);
    }
  };
  
  const cooldownFireEffect = () => {
    // Gradual cooldown animation
    const cooldownInterval = setInterval(() => {
      setFireIntensity(prev => {
        const newIntensity = Math.max(0, prev - 8);
        
        if (newIntensity <= 0) {
          clearInterval(cooldownInterval);
          // Delay the state reset to ensure smooth transition
          setTimeout(() => {
            setIsBurning(false);
            setIsFireSpreading(false);
            setFireParticles([]);
            setSpreadingParticles([]);
            setDashboardFireLevel(0);
            setBurningTimeoutId(null);
          }, 100);
        } else if (newIntensity < 30) {
          setDashboardFireLevel(0);
        } else if (newIntensity < 60) {
          setDashboardFireLevel(1);
        }
        
        return newIntensity;
      });
    }, 200);
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
      {/* Dashboard-wide Fire Overlay */}
      {isFireSpreading && (
        <div 
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: dashboardFireLevel >= 3 
              ? 'radial-gradient(circle at center, rgba(255, 69, 0, 0.1) 0%, rgba(255, 140, 0, 0.05) 50%, transparent 100%)'
              : dashboardFireLevel >= 2
              ? 'radial-gradient(circle at 50% 50%, rgba(255, 69, 0, 0.05) 0%, transparent 60%)'
              : 'transparent',
            transition: 'all 0.5s ease-out'
          }}
        >
          {/* Spreading Fire Particles */}
          {spreadingParticles.map(particle => {
            const emoji = particle.type === 'flame' ? '🔥' : particle.type === 'ember' ? '✨' : '💥';
            const animationDuration = 2 + Math.random() * 3;
            
            return (
              <div
                key={particle.id}
                className="absolute animate-fire-spread"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  fontSize: `${particle.size}px`,
                  opacity: particle.opacity,
                  animation: `fire-spread-move ${animationDuration}s ease-out forwards`,
                  '--target-x': `${particle.targetX}%`,
                  '--target-y': `${particle.targetY}%`,
                  zIndex: 60
                } as React.CSSProperties}
              >
                {emoji}
              </div>
            );
          })}
          
          {/* Dashboard Fire Glow Effect */}
          {dashboardFireLevel >= 2 && (
            <div 
              className="absolute inset-0 animate-dashboard-fire-glow"
              style={{
                background: `radial-gradient(circle at center, 
                  rgba(255, 69, 0, ${dashboardFireLevel >= 3 ? '0.15' : '0.08'}) 0%, 
                  rgba(255, 140, 0, ${dashboardFireLevel >= 3 ? '0.1' : '0.05'}) 40%, 
                  transparent 70%)`,
                animation: `dashboard-fire-pulse ${dashboardFireLevel >= 3 ? '1s' : '1.5s'} ease-in-out infinite`
              }}
            />
          )}
        </div>
      )}
      
      <div className="relative pointer-events-auto touch-manipulation">
        {/* Love Counter Card */}
        <div className={`apple-card apple-card-hover p-6 text-center apple-shadow relative overflow-hidden transition-all duration-500 ${
          dashboardFireLevel >= 1 ? 'ring-2 ring-orange-400/50 shadow-orange-400/20' : ''
        } ${
          fireIntensity >= 80 ? 'ring-4 ring-yellow-400/70 shadow-yellow-400/40' :
          fireIntensity >= 60 ? 'ring-3 ring-orange-400/60 shadow-orange-400/30' :
          fireIntensity >= 40 ? 'ring-2 ring-red-400/50 shadow-red-400/20' : ''
        }`} style={{
          backgroundColor: fireIntensity >= 80 ? 'rgba(255, 248, 220, 0.3)' :
                          fireIntensity >= 60 ? 'rgba(255, 237, 213, 0.2)' :
                          fireIntensity >= 40 ? 'rgba(254, 226, 226, 0.1)' : 'transparent'
        }}>
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
              className={`group relative z-30 pointer-events-auto transition-all duration-500 touch-manipulation hover-bounce focus:outline-none ${
                isAnimating ? 'animate-cute-squish' : ''
              } ${
                isBurning ? 'animate-fire-glow' : ''
              } ${
                fireIntensity >= 70 ? 'animate-card-fire-expansion' : ''
              }`}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                filter: isBurning 
                  ? fireIntensity >= 80
                    ? 'drop-shadow(0 4px 16px rgba(255, 69, 0, 0.8)) drop-shadow(0 0 32px rgba(255, 140, 0, 0.6))'
                    : fireIntensity >= 60
                    ? 'drop-shadow(0 3px 12px rgba(255, 69, 0, 0.6)) drop-shadow(0 0 24px rgba(255, 140, 0, 0.4))'
                    : 'drop-shadow(0 2px 8px rgba(255, 69, 0, 0.4))'
                  : 'drop-shadow(0 2px 6px rgba(239, 68, 68, 0.2))',
                transform: fireIntensity >= 70 ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <Heart 
                className={`h-12 w-12 mx-auto mb-4 transition-all duration-500 ${
                  isBurning
                    ? fireIntensity >= 80
                      ? 'text-yellow-400 fill-current animate-fire-flicker'
                      : fireIntensity >= 60
                      ? 'text-orange-400 fill-current animate-fire-flicker'
                      : 'text-orange-500 fill-current animate-fire-flicker'
                    : isAnimating && !isBurning
                      ? 'text-red-500 fill-current animate-heart-bounce' 
                      : 'text-gradient fill-current group-hover:text-red-500 hover-glow'
                }`}
                style={{
                  filter: isBurning
                    ? fireIntensity >= 80
                      ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 40px rgba(255, 69, 0, 0.6))'
                      : fireIntensity >= 60
                      ? 'drop-shadow(0 0 16px rgba(255, 140, 0, 0.7)) drop-shadow(0 0 32px rgba(255, 69, 0, 0.5))'
                      : 'drop-shadow(0 0 12px rgba(255, 69, 0, 0.6))'
                    : isAnimating 
                      ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' 
                      : 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.3))',
                  fontSize: fireIntensity >= 70 ? '3.5rem' : '3rem'
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
              
              <div className={`absolute -inset-2 rounded-full opacity-0 group-hover:opacity-30 transition-all duration-300 pointer-events-none ${
                isBurning 
                  ? 'bg-gradient-to-r from-orange-400/10 to-red-400/10'
                  : 'bg-gradient-to-r from-red-400/8 to-pink-400/8'
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
