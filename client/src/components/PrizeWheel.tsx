import React, { useState, useRef, useEffect } from 'react';
import { X, Gift, Sparkles, Star, DollarSign } from 'lucide-react';
import api from '../utils/api';

interface Prize {
  id: number;
  amount: number;
  color: string;
  probability: number;
  icon: React.ReactNode;
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
  const wheelRef = useRef<HTMLDivElement>(null);

  // Check if user has used wheel this week and load saved opportunities
  useEffect(() => {
    const loadWheelStatus = async () => {
      try {
        // Check wheel usage status from backend
        const wheelResponse = await api.get('/api/wheel/stats');
        setHasUsedToday(!wheelResponse.data.canUseThisWeek);
        
        // Load saved opportunities from backend
        const opportunitiesResponse = await api.get('/api/opportunities/stats');
        setSavedOpportunities(opportunitiesResponse.data.unused || 0);
      } catch (error) {
        console.error('Error loading wheel status from backend:', error);
        // Fallback to localStorage
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekKey = startOfWeek.toDateString();
        const lastUsedWeek = localStorage.getItem('wheelLastUsedWeek');
        const opportunities = parseInt(localStorage.getItem('wheelOpportunities') || '0');
        
        if (lastUsedWeek === weekKey) {
          setHasUsedToday(true);
        }
        setSavedOpportunities(opportunities);
      }
    };
    
    loadWheelStatus();
  }, []);

  const prizes: Prize[] = [
    { id: 1, amount: 1, color: '#F3F4F6', probability: 45, icon: <DollarSign className="w-4 h-4 text-gray-600" /> },
    { id: 2, amount: 5, color: '#E5E7EB', probability: 25, icon: <DollarSign className="w-4 h-4 text-gray-700" /> },
    { id: 3, amount: 10, color: '#D1D5DB', probability: 15, icon: <DollarSign className="w-4 h-4 text-gray-800" /> },
    { id: 4, amount: 25, color: '#9CA3AF', probability: 10, icon: <DollarSign className="w-4 h-4 text-white" /> },
    { id: 5, amount: 77, color: '#6B7280', probability: 2.5, icon: <Star className="w-4 h-4 text-white" /> },
    { id: 6, amount: 100, color: '#4B5563', probability: 1.5, icon: <Star className="w-4 h-4 text-white" /> },
    { id: 7, amount: 500, color: '#374151', probability: 0.5, icon: <Sparkles className="w-4 h-4 text-white" /> },
    { id: 8, amount: 1000, color: '#1F2937', probability: 0.5, icon: <Sparkles className="w-4 h-4 text-yellow-400" /> },
  ];

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
    const baseSpins = 5;
    const extraSpins = Math.floor(Math.random() * 496) + 0; // 0-495 extra spins
    const totalSpins = baseSpins + extraSpins; // Total: 5-500 spins

    // Add some randomness to make it feel more natural
    const randomOffset = (Math.random() - 0.5) * 20; // ±10 degrees
    const finalRotation = (totalSpins * 360) + (360 - targetAngle) + randomOffset;

    if (wheelRef.current) {
      // Reset any previous transform first
      wheelRef.current.style.transform = 'rotate(0deg)';

      // Force a reflow to ensure the reset takes effect
      wheelRef.current.offsetHeight;

      // Apply the final rotation
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
    }

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
    }, 6500); // Match the CSS animation duration + small buffer (6 seconds + buffer)
  };

  const handleClaimPrize = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isSpinning && wonPrize) {
      // Call onPrizeWon to save earnings to backend
      if (onPrizeWon) {
        await onPrizeWon(wonPrize.amount);
        console.log('✅ Prize claimed and saved:', wonPrize.amount);
      }
      // Close the modal after claiming
      onClose();
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isSpinning) {
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

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-8 apple-shadow-lg relative overflow-hidden"
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
                handleClose();
              }}
              disabled={isSpinning}
              className="w-8 h-8 rounded-full bg-apple-gray-6/10 hover:bg-apple-gray-6/20 flex items-center justify-center transition-colors disabled:opacity-50"
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
              className={`w-full h-full rounded-full border-4 border-white apple-shadow-lg transition-transform duration-[6000ms] ${
                isSpinning ? 'ease-out' : 'hover:scale-105 ease-in-out duration-200'
              }`}
              style={{
                background: `conic-gradient(${prizes.map((prize, index) => {
                  const startAngle = (index / prizes.length) * 360;
                  const endAngle = ((index + 1) / prizes.length) * 360;
                  return `${prize.color} ${startAngle}deg ${endAngle}deg`;
                }).join(', ')})`
              }}
            >
              {/* Prize Labels */}
              {prizes.map((prize, index) => {
                const angle = (index / prizes.length) * 360 + (360 / prizes.length / 2);
                const radius = 80;
                const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
                const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
                
                return (
                  <div
                    key={prize.id}
                    className="absolute flex flex-col items-center justify-center text-white font-bold text-sm"
                    style={{
                      left: `calc(50% + ${x}px - 20px)`,
                      top: `calc(50% + ${y}px - 15px)`,
                      width: '40px',
                      height: '30px',
                      transform: `rotate(${angle}deg)`
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      {prize.icon}
                      <span>${prize.amount}</span>
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
              disabled={isSpinning}
              className={`px-8 py-4 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-800 rounded-xl font-semibold transition-all duration-200 shadow-sm ${
                isSpinning
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 hover:scale-105'
              }`}
            >
              {isSpinning ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span>Spinning... 🎰</span>
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
                <p className="text-apple-secondary-label mb-4">
                  You won ${wonPrize.amount}!
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClaimPrize();
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
