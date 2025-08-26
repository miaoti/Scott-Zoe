import React, { useState, useRef, useEffect } from 'react';
import { X, Gift, Sparkles, Star, DollarSign } from 'lucide-react';
import api from '../utils/api';

interface Prize {
  id: number;
  amount: number;
  color: string;
  probability: number;
  icon: React.ReactNode;
  prizeName: string;
  prizeDescription: string;
  prizeType: string;
}

interface PrizeWheelProps {
  onClose: () => void;
  level: number;
  onPrizeWon?: (amount: number) => void;
}

const PrizeWheel: React.FC<PrizeWheelProps> = ({ onClose, level, onPrizeWon }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hasUsedToday, setHasUsedToday] = useState(false);
  const [savedOpportunities, setSavedOpportunities] = useState(0);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Helper function to get icon for prize type and value
  const getIconForPrize = (prizeType: string, prizeValue: number) => {
    const iconSize = "w-5 h-5"; // Slightly larger for better visibility
    
    if (prizeType === 'MONEY') {
      if (prizeValue >= 500) {
        return <Sparkles className={`${iconSize} text-yellow-300 drop-shadow-lg`} />;
      } else if (prizeValue >= 100) {
        return <Sparkles className={`${iconSize} text-yellow-200 drop-shadow-lg`} />;
      } else if (prizeValue >= 50) {
        return <Star className={`${iconSize} text-yellow-200 drop-shadow-lg`} />;
      } else if (prizeValue >= 25) {
        return <DollarSign className={`${iconSize} text-green-200 drop-shadow-lg`} />;
      } else if (prizeValue >= 10) {
        return <DollarSign className={`${iconSize} text-green-600 drop-shadow-sm`} />;
      } else {
        return <DollarSign className={`${iconSize} text-green-700 drop-shadow-sm`} />;
      }
    } else if (prizeType === 'GIFT') {
      return <Gift className={`${iconSize} text-purple-200 drop-shadow-lg`} />;
    } else if (prizeType === 'EXPERIENCE') {
      return <Star className={`${iconSize} text-purple-200 drop-shadow-lg`} />;
    } else {
      return <Gift className={`${iconSize} text-white drop-shadow-lg`} />;
    }
  };

  // Default prizes fallback
  const getDefaultPrizes = (): Prize[] => [
    { id: 1, amount: 1, color: '#F3F4F6', probability: 45, prizeName: '$1', prizeDescription: 'Win $1 love points', prizeType: 'MONEY', icon: getIconForPrize('MONEY', 1) },
    { id: 2, amount: 5, color: '#E5E7EB', probability: 25, prizeName: '$5', prizeDescription: 'Win $5 love points', prizeType: 'MONEY', icon: getIconForPrize('MONEY', 5) },
    { id: 3, amount: 10, color: '#D1D5DB', probability: 15, prizeName: '$10', prizeDescription: 'Win $10 love points', prizeType: 'MONEY', icon: getIconForPrize('MONEY', 10) },
    { id: 4, amount: 25, color: '#9CA3AF', probability: 10, prizeName: '$25', prizeDescription: 'Win $25 love points', prizeType: 'MONEY', icon: getIconForPrize('MONEY', 25) },
    { id: 5, amount: 77, color: '#6B7280', probability: 2.5, prizeName: '$77', prizeDescription: 'Win $77 love points', prizeType: 'MONEY', icon: getIconForPrize('MONEY', 77) },
    { id: 6, amount: 100, color: '#4B5563', probability: 1.5, prizeName: '$100', prizeDescription: 'Win $100 love points', prizeType: 'MONEY', icon: getIconForPrize('MONEY', 100) },
    { id: 7, amount: 500, color: '#374151', probability: 0.5, prizeName: '$500', prizeDescription: 'Win $500 love points', prizeType: 'MONEY', icon: getIconForPrize('MONEY', 500) },
    { id: 8, amount: 1000, color: '#1F2937', probability: 0.5, prizeName: '$1000', prizeDescription: 'Win $1000 love points', prizeType: 'MONEY', icon: getIconForPrize('MONEY', 1000) },
  ];

  // Check if user has used wheel this week and load saved opportunities and wheel configuration
  useEffect(() => {
    const loadWheelData = async () => {
      try {
        const [wheelResponse, opportunitiesResponse, configResponse] = await Promise.all([
          api.get('/api/wheel/stats'),
          api.get('/api/opportunities/stats'),
          api.get('/api/wheel-config/my-wheel')
        ]);
        
        setHasUsedToday(!wheelResponse.data.canUseThisWeek);
        setSavedOpportunities(opportunitiesResponse.data.unused || 0);
        
        // Load wheel configuration
        if (configResponse.data.hasConfiguration && configResponse.data.prizes) {
          const dynamicPrizes = configResponse.data.prizes.map((prize: any, index: number) => ({
            id: prize.id || index + 1,
            amount: prize.prizeValue,
            color: prize.color,
            probability: parseFloat(prize.probability),
            prizeName: prize.prizeName,
            prizeDescription: prize.prizeDescription,
            prizeType: prize.prizeType,
            icon: getIconForPrize(prize.prizeType, prize.prizeValue)
          }));
          setPrizes(dynamicPrizes);
        } else {
          // Fallback to default prizes if no configuration
          setPrizes(getDefaultPrizes());
        }
        
        console.log('✅ Wheel data loaded:', {
          canUseThisWeek: wheelResponse.data.canUseThisWeek,
          savedOpportunities: opportunitiesResponse.data.unused,
          prizesCount: configResponse.data.prizes?.length || 0
        });
      } catch (error) {
        console.error('❌ Error loading wheel data from backend:', error);
        // Fallback to localStorage and default prizes
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekKey = startOfWeek.toDateString();
        const lastUsedWeek = localStorage.getItem('wheelLastUsedWeek');
        const opportunities = parseInt(localStorage.getItem('wheelOpportunities') || '0');
        
        if (lastUsedWeek === weekKey) {
          setHasUsedToday(true);
        }
        setSavedOpportunities(opportunities);
        
        setPrizes(getDefaultPrizes());
      } finally {
        setLoadingPrizes(false);
      }
    };
    
    loadWheelData();
  }, []);



  const selectPrize = (): Prize => {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const prize of prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return prize;
      }
    }
    
    return prizes[0]; // Fallback
  };

  const spinWheel = () => {
    if (isSpinning) return;

    // Check weekly limit
    if (hasUsedToday && savedOpportunities === 0) {
      alert('You can only use the wheel once per week! Come back next week or reach 520 love again for another opportunity.');
      return;
    }

    setIsSpinning(true);
    const selectedPrize = selectPrize();

    // Calculate rotation for smooth animation
    const prizeIndex = prizes.findIndex(p => p.id === selectedPrize.id);
    const sectionAngle = 360 / prizes.length;
    const targetAngle = (prizeIndex * sectionAngle) + (sectionAngle / 2);

    // More spins for dramatic effect with random variation
    const baseSpins = 5; // Reduced for better visual effect
    const extraSpins = Math.floor(Math.random() * 3) + 2; // 2-4 extra spins
    const totalSpins = baseSpins + extraSpins; // Total: 7-8 spins

    // Calculate final rotation to land on the selected prize
    // We want the wheel to stop with the prize at the top (12 o'clock position)
    const finalRotation = (totalSpins * 360) + (360 - targetAngle);

    // Set the rotation state to trigger CSS transition
    setRotation(finalRotation);

    // Show result after animation completes
    setTimeout(async () => {
      setIsSpinning(false);
      setWonPrize(selectedPrize);
      setShowResult(true);

      // Record wheel usage in backend AFTER the animation completes
      try {
        const source = savedOpportunities > 0 ? 'saved_opportunity' : 'weekly';
        await api.post('/api/wheel/use', {
          prizeAmount: selectedPrize.amount,
          source: source
        });
        console.log('✅ Wheel usage recorded in backend successfully');
      } catch (error) {
        console.error('❌ Error recording wheel usage in backend:', error);
        // Fallback to localStorage
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekKey = startOfWeek.toDateString();
        localStorage.setItem('wheelLastUsedWeek', weekKey);
      }

      // Note: Prize recording is handled in handleClaimPrize to avoid duplicates

      setHasUsedToday(true);

      // Use up one opportunity if available
      if (savedOpportunities > 0) {
        try {
          await api.post('/api/opportunities/use');
          // Reload opportunities from backend
          const opportunitiesResponse = await api.get('/api/opportunities/stats');
          setSavedOpportunities(opportunitiesResponse.data.unused || 0);
        } catch (error) {
          console.error('Error using saved opportunity in backend:', error);
          // Fallback to localStorage
          const newOpportunities = savedOpportunities - 1;
          localStorage.setItem('wheelOpportunities', newOpportunities.toString());
          setSavedOpportunities(newOpportunities);
        }
      }
    }, 3200); // Match the CSS animation duration + small buffer (3 seconds + buffer)
  };

  const handleClaimPrize = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isSpinning && wonPrize) {
      try {
        // Record the prize win in backend
        await api.post('/api/wheel-prizes', {
          prizeType: wonPrize.prizeType,
          prizeValue: wonPrize.amount,
          prizeDescription: wonPrize.prizeDescription
        });
        console.log('✅ Prize claimed and recorded:', wonPrize.amount);
        
        // Call onPrizeWon callback if provided
        if (onPrizeWon) {
          await onPrizeWon(wonPrize.amount);
        }
      } catch (error) {
        console.error('❌ Error recording prize:', error);
      }
      
      // Close the modal after claiming
      onClose();
    }
  };

  const handleClose = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isSpinning) {
      // If user closes without spinning and hasn't used today, save as opportunity
      if (!hasUsedToday && !showResult) {
        try {
          await api.post('/api/opportunities/create', {
            source: 'wheel_close_without_spin'
          });
          console.log('✅ Opportunity saved for later use');
        } catch (error) {
          console.error('❌ Error saving opportunity:', error);
          // Fallback to localStorage
          const currentOpportunities = parseInt(localStorage.getItem('wheelOpportunities') || '0');
          localStorage.setItem('wheelOpportunities', (currentOpportunities + 1).toString());
        }
      }
      onClose();
    }
  };

  const getPrizeColor = (amount: number) => {
    switch (amount) {
      case 1: return '#F3F4F6';    // Very light gray
      case 5: return '#E5E7EB';    // Light gray
      case 10: return '#D1D5DB';   // Gray
      case 25: return '#9CA3AF';   // Medium gray
      case 77: return '#6B7280';   // Dark gray
      case 100: return '#4B5563';  // Darker gray
      case 500: return '#374151';  // Darkest gray
      case 1000: return '#1F2937'; // Almost black
      default: return '#F3F4F6';   // Very light gray
    }
  };

  if (loadingPrizes) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 apple-shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 opacity-50" />
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8" />
              <div className="flex items-center space-x-2">
                <Gift className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-apple-label">Prize Wheel</h2>
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-apple-gray-6/10 hover:bg-apple-gray-6/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-apple-secondary-label" />
              </button>
            </div>
            <div className="py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-apple-secondary-label">Loading wheel configuration...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === e.currentTarget && !isSpinning) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-8 apple-shadow-lg relative overflow-hidden pointer-events-auto"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 opacity-50" />
        
        {/* Header */}
        <div className="relative z-10 text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8" /> {/* Spacer */}
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <Gift className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-apple-label">Prize Wheel</h2>
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
              {savedOpportunities > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  {savedOpportunities} saved opportunity{savedOpportunities > 1 ? 'ies' : 'y'} available
                </p>
              )}
              {hasUsedToday && savedOpportunities === 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  Used this week - come back next week!
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose(e);
              }}
              disabled={isSpinning}
              className="w-8 h-8 rounded-full bg-apple-gray-6/10 hover:bg-apple-gray-6/20 flex items-center justify-center transition-colors disabled:opacity-50 pointer-events-auto z-[10000]"
            >
              <X className="w-4 h-4 text-apple-secondary-label" />
            </button>
          </div>
          <p className="text-apple-secondary-label">
            Congratulations! You've reached level {level}!
          </p>
        </div>

        {/* Prize Wheel */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-64 h-64 mb-6">
            {/* Spinning Effect Overlay */}
            {isSpinning && (
              <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 animate-pulse opacity-20 z-10" />
            )}

            {/* Wheel */}
            <div
              ref={wheelRef}
              className={`w-full h-full rounded-full border-4 border-white apple-shadow-lg transition-transform duration-[3000ms] ${
                isSpinning ? 'ease-out' : 'hover:scale-105 ease-in-out duration-200'
              }`}
              style={{
                transform: `rotate(${rotation}deg)`,
                background: `conic-gradient(${prizes.map((prize, index) => {
                  const startAngle = (index / prizes.length) * 360;
                  const endAngle = ((index + 1) / prizes.length) * 360;
                  return `${prize.color} ${startAngle}deg ${endAngle}deg`;
                }).join(', ')})`
              }}
            >
              {/* Prize Labels */}
              {prizes.map((prize, index) => {
                const segmentAngle = 360 / prizes.length;
                const angle = (index * segmentAngle) + (segmentAngle / 2);
                
                // Simplified radius calculation for better text positioning
                const radius = prizes.length > 6 ? 50 : 65; // Closer to center for many prizes
                const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
                const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
                
                // Determine text color based on background
                const isLightBackground = prize.color === '#F3F4F6' || prize.color === '#E5E7EB' || prize.color === '#D1D5DB';
                const textColor = isLightBackground ? 'text-gray-800' : 'text-white';
                
                return (
                  <div
                    key={prize.id}
                    className="absolute flex flex-col items-center justify-center font-bold pointer-events-none text-white"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                      transformOrigin: 'center',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      fontSize: prizes.length > 8 ? '9px' : '11px'
                    }}
                  >
                    <div className="flex flex-col items-center space-y-0.5" style={{ transform: `rotate(-${angle}deg)` }}>
                      <div className="flex items-center justify-center mb-0.5">
                        <span className="text-base">{prize.prizeType === 'MONEY' ? '💰' : prize.prizeType === 'GIFT' ? '🎁' : '✨'}</span>
                      </div>
                      <span 
                        className="text-center leading-tight font-bold max-w-16 truncate block" 
                        style={{ fontSize: prizes.length > 8 ? '8px' : '10px' }}
                        title={prize.prizeName}
                      >
                        {prize.prizeName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500" />
            </div>
          </div>

          {/* Spin Button */}
          {!showResult && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                spinWheel();
              }}
              disabled={isSpinning || (hasUsedToday && savedOpportunities === 0)}
              className={`px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg pointer-events-auto z-[10000] relative ${
                isSpinning || (hasUsedToday && savedOpportunities === 0)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-xl hover:scale-105'
              }`}
            >
              {isSpinning ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Spinning... 🎰</span>
                </div>
              ) : (hasUsedToday && savedOpportunities === 0) ? (
                <div className="flex items-center space-x-2">
                  <span>Used This Week</span>
                  <span className="text-xl">⏰</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Spin the Wheel!</span>
                  <span className="text-xl">🎰</span>
                </div>
              )}
            </button>
          )}

          {/* Result */}
          {showResult && wonPrize && (
            <div className="text-center space-y-4 animate-bounce-in">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getPrizeColor(wonPrize.amount)} flex items-center justify-center mx-auto apple-shadow-lg`}>
                <div className="text-white text-2xl font-bold">
                  ${wonPrize.amount}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-apple-label mb-2">
                  Congratulations! 🎉
                </h3>
                <p className="text-apple-secondary-label mb-2">
                  You won {wonPrize.prizeName}!
                </p>
                <p className="text-sm text-apple-secondary-label mb-4">
                  {wonPrize.prizeDescription}
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClaimPrize();
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  💰 Claim ${wonPrize.amount} Prize
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrizeWheel;
