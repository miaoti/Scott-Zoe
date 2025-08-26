import React from 'react';
import { DollarSign, Gift, Star, Sparkles } from 'lucide-react';

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

interface WheelPreviewProps {
  prizes: PrizeTemplate[];
  size?: number;
}

const WheelPreview: React.FC<WheelPreviewProps> = ({ prizes, size = 300 }) => {
  const getIconForPrize = (prizeType: string, prizeValue: number) => {
    if (prizeType === 'MONEY') {
      if (prizeValue >= 500) {
        return <DollarSign className="w-4 h-4 text-yellow-400" />;
      } else if (prizeValue >= 100) {
        return <DollarSign className="w-4 h-4 text-white" />;
      } else if (prizeValue >= 50) {
        return <DollarSign className="w-4 h-4 text-white" />;
      } else if (prizeValue >= 25) {
        return <DollarSign className="w-4 h-4 text-white" />;
      } else if (prizeValue >= 10) {
        return <DollarSign className="w-4 h-4 text-gray-800" />;
      } else {
        return <DollarSign className="w-4 h-4 text-gray-600" />;
      }
    } else {
      return <Gift className="w-4 h-4 text-white" />;
    }
  };

  const getTextColor = (backgroundColor: string) => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;
  
  // Calculate angles for each prize with equal spacing
  const prizeSegments = prizes.map((prize, index) => {
    const segmentAngle = 360 / prizes.length;
    const startAngle = index * segmentAngle;
    const endAngle = (index + 1) * segmentAngle;
    
    return {
      ...prize,
      startAngle,
      endAngle,
      segmentAngle
    };
  });

  const createPath = (startAngle: number, endAngle: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + (radius - 20) * Math.cos(startAngleRad);
    const y1 = centerY + (radius - 20) * Math.sin(startAngleRad);
    const x2 = centerX + (radius - 20) * Math.cos(endAngleRad);
    const y2 = centerY + (radius - 20) * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    return [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius - 20} ${radius - 20} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
  };

  const getTextPosition = (startAngle: number, endAngle: number) => {
    const midAngle = (startAngle + endAngle) / 2;
    // Adjust text radius based on number of prizes for optimal centering
    const segmentAngle = endAngle - startAngle;
    const baseRadius = radius - 20; // Less margin from edge
    
    // Dynamic radius calculation based on segment angle for optimal text positioning
    // Formula: smaller segments need text closer to center, larger segments can have text further out
    // Using a smooth curve that adapts to any number of prizes
    const minMultiplier = 0.45; // Minimum for very small segments (many prizes)
    const maxMultiplier = 0.8;  // Maximum for large segments (few prizes)
    
    // Normalize segment angle to 0-1 range (0° to 180°)
    const normalizedAngle = Math.min(segmentAngle / 180, 1);
    
    // Use a smooth curve: smaller angles get smaller multipliers
    // Apply square root for better distribution across the range
    const radiusMultiplier = minMultiplier + (maxMultiplier - minMultiplier) * Math.sqrt(normalizedAngle);
    
    const textRadius = baseRadius * radiusMultiplier;
    // Account for the -90 degree rotation of the SVG wheel
    const adjustedMidAngle = midAngle - 90;
    const midAngleRad = (adjustedMidAngle * Math.PI) / 180;
    
    return {
      x: centerX + textRadius * Math.cos(midAngleRad),
      y: centerY + textRadius * Math.sin(midAngleRad)
    };
  };

  if (prizes.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-full border-4 border-gray-300"
        style={{ width: size, height: size }}
      >
        <p className="text-gray-500 text-center px-4">No prizes configured</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Wheel segments */}
        {prizeSegments.map((segment, index) => (
          <g key={index}>
            <path
              d={createPath(segment.startAngle, segment.endAngle)}
              fill={segment.color}
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        ))}
        
        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r="20"
          fill="#ffffff"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
      </svg>
      
      {/* Prize labels */}
      <div className="absolute inset-0">
        {prizeSegments.map((segment, index) => {
          const textPos = getTextPosition(segment.startAngle, segment.endAngle);
          const textColor = getTextColor(segment.color);
          
          return (
            <div
              key={index}
              className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
              style={{
                left: textPos.x,
                top: textPos.y,
                transform: 'translate(-50%, -50%)',
                color: textColor,
                minWidth: 'max-content'
              }}
            >
              <div className="flex flex-col items-center space-y-1 px-1">
                {getIconForPrize(segment.prizeType, segment.prizeValue)}
                <div className="text-xs font-medium max-w-16 truncate" title={segment.prizeName}>
                  {segment.prizeName}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Pointer */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1"
        style={{ marginTop: '10px' }}
      >
        <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500"></div>
      </div>
    </div>
  );
};

export default WheelPreview;