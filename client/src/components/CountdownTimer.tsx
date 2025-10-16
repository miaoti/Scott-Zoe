import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string | number[];
  className?: string;
  onExpire?: () => void;
  showSeconds?: boolean;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = memo(({
  targetDate,
  className = '',
  onExpire,
  showSeconds = true,
  compact = false
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });
  const [hasExpired, setHasExpired] = useState(false);

  const calculateTimeLeft = (): TimeLeft => {
    let targetTime: Date;
    
    if (Array.isArray(targetDate)) {
      // Handle array format [year, month, day, hour, minute, second]
      const [year, month, day, hour = 0, minute = 0, second = 0] = targetDate;
      targetTime = new Date(year, month - 1, day, hour, minute, second);
    } else {
      // Handle string format
      targetTime = new Date(targetDate);
    }

    const now = new Date();
    const difference = targetTime.getTime() - now.getTime();

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference
      };
    } else {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0
      };
    }
  };

  useEffect(() => {
    // Optimized timer: Update every 5 seconds instead of every second to reduce CPU usage
    // For countdown timers, 5-second precision is usually acceptable
    const updateInterval = showSeconds ? 5000 : 60000; // 5s if showing seconds, 1min if not
    
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.total <= 0 && !hasExpired) {
        setHasExpired(true);
        if (onExpire) {
          onExpire();
        }
      }
    }, updateInterval);

    // Calculate initial time
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);
    
    if (initialTimeLeft.total <= 0) {
      setHasExpired(true);
      if (onExpire) {
        onExpire();
      }
    }

    return () => clearInterval(timer);
  }, [targetDate, onExpire, hasExpired, showSeconds]);

  const formatTime = (value: number): string => {
    return value.toString().padStart(2, '0');
  };

  const getUrgencyColor = (): string => {
    if (hasExpired) return 'text-red-600';
    if (timeLeft.total < 60 * 60 * 1000) return 'text-red-500'; // Less than 1 hour
    if (timeLeft.total < 24 * 60 * 60 * 1000) return 'text-amber-500'; // Less than 1 day
    return 'text-gray-600';
  };

  if (hasExpired) {
    return (
      <span className={`${className} text-red-600 font-medium`}>
        Expired
      </span>
    );
  }

  if (compact) {
    // Compact format for small spaces
    if (timeLeft.days > 0) {
      return (
        <span className={`${className} ${getUrgencyColor()}`}>
          {timeLeft.days}d {formatTime(timeLeft.hours)}h
        </span>
      );
    } else if (timeLeft.hours > 0) {
      return (
        <span className={`${className} ${getUrgencyColor()}`}>
          {timeLeft.hours}h {formatTime(timeLeft.minutes)}m
        </span>
      );
    } else {
      return (
        <span className={`${className} ${getUrgencyColor()}`}>
          {timeLeft.minutes}m {showSeconds ? `${formatTime(timeLeft.seconds)}s` : ''}
        </span>
      );
    }
  }

  // Full format with animated digits
  const timeUnits = [];
  
  if (timeLeft.days > 0) {
    timeUnits.push({ label: 'day', value: timeLeft.days, plural: 'days' });
  }
  
  if (timeLeft.hours > 0 || timeLeft.days > 0) {
    timeUnits.push({ label: 'hour', value: timeLeft.hours, plural: 'hours' });
  }
  
  timeUnits.push({ label: 'minute', value: timeLeft.minutes, plural: 'minutes' });
  
  if (showSeconds && timeLeft.days === 0) {
    timeUnits.push({ label: 'second', value: timeLeft.seconds, plural: 'seconds' });
  }

  return (
    <div className={`${className} flex items-center space-x-1`}>
      {timeUnits.map((unit, index) => (
        <React.Fragment key={unit.label}>
          <motion.div
            key={`${unit.label}-${unit.value}`}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center space-x-1"
          >
            <motion.span
              key={unit.value}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`font-mono font-bold ${getUrgencyColor()}`}
            >
              {formatTime(unit.value)}
            </motion.span>
            <span className={`text-xs ${getUrgencyColor()}`}>
              {unit.value === 1 ? unit.label : unit.plural}
            </span>
          </motion.div>
          {index < timeUnits.length - 1 && (
            <span className={`text-xs ${getUrgencyColor()}`}>:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CountdownTimer;