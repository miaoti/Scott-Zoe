import React, { useState, useEffect } from 'react';
import { Gift, X } from 'lucide-react';
import { useSurpriseBoxStore } from '../stores/surpriseBoxStore';

interface DroppingBoxProps {
  box: {
    id: number;
    prizeName: string;
    prizeDescription?: string;
    owner: {
      id: number;
      name: string;
    };
  };
  onClaim: (boxId: number) => void;
  onAnimationComplete: () => void;
}

const DroppingBox: React.FC<DroppingBoxProps> = ({ box, onClaim, onAnimationComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClicked, setIsClicked] = useState(false);
  const { claimBox } = useSurpriseBoxStore();

  const handleClick = async () => {
    if (isClicked) return;
    
    setIsClicked(true);
    try {
      await claimBox(box.id);
      onClaim(box.id);
    } catch (error) {
      console.error('Failed to claim box:', error);
      setIsClicked(false);
    }
  };

  const handleAnimationEnd = () => {
    if (!isClicked) {
      setIsVisible(false);
      onAnimationComplete();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed z-50 cursor-pointer transform transition-all duration-300 ${
        isClicked ? 'scale-110 opacity-0' : 'hover:scale-105'
      }`}
      style={{
        left: `${Math.random() * 80 + 10}%`, // Random horizontal position (10-90%)
        animation: isClicked ? 'none' : 'dropBox 4s linear forwards',
      }}
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* Box container with glow effect */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl blur-lg opacity-60 animate-pulse"></div>
        
        {/* Main box */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 p-4 rounded-xl shadow-2xl border-2 border-yellow-300 transform rotate-3 hover:rotate-0 transition-transform duration-300">
          {/* Box decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
          
          {/* Gift icon */}
          <div className="relative flex items-center justify-center">
            <Gift className="h-8 w-8 text-white drop-shadow-lg" />
          </div>
          
          {/* Box info tooltip */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <div className="font-semibold">{box.prizeName}</div>
            <div className="text-gray-300">From {box.owner.name}</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
          </div>
        </div>
        
        {/* Sparkle effects */}
        <div className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-orange-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-red-300 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Click indicator */}
      {isClicked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-bounce">
            Claimed! 🎉
          </div>
        </div>
      )}
    </div>
  );
};

// CSS animation styles (to be added to global CSS)
const dropBoxAnimation = `
@keyframes dropBox {
  0% {
    top: -100px;
    transform: translateX(-50%) rotate(0deg);
  }
  25% {
    transform: translateX(-50%) rotate(5deg);
  }
  50% {
    transform: translateX(-50%) rotate(-3deg);
  }
  75% {
    transform: translateX(-50%) rotate(2deg);
  }
  100% {
    top: 100vh;
    transform: translateX(-50%) rotate(0deg);
  }
}
`;

export default DroppingBox;
export { dropBoxAnimation };