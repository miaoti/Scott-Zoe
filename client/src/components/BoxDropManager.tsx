import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import DroppingBox from './DroppingBox';
import { useSurpriseBoxStore } from '../stores/surpriseBoxStore';
import { useAuth } from "../contexts/AuthContext";

interface DroppingBoxData {
  id: number;
  prizeName: string;
  prizeDescription?: string;
  owner: {
    id: number;
    name: string;
  };
  dropAt: string;
  createdAt: string;
  recipient: {
    id: number;
    name: string;
  };
}

const BoxDropManager: React.FC = memo(() => {
  const [droppingBoxes, setDroppingBoxes] = useState<DroppingBoxData[]>([]);
  const [activeDrops, setActiveDrops] = useState<Set<number>>(new Set());
  const [checkInterval, setCheckInterval] = useState(30000); // Start with 30s
  const [consecutiveEmptyChecks, setConsecutiveEmptyChecks] = useState(0);
  const activeDropsRef = useRef<Set<number>>(new Set());
  const droppingBoxesRef = useRef<DroppingBoxData[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { loadDroppingBoxes } = useSurpriseBoxStore();
  const { user } = useAuth();
  
  // Keep refs in sync with state
  useEffect(() => {
    activeDropsRef.current = activeDrops;
  }, [activeDrops]);
  
  useEffect(() => {
    droppingBoxesRef.current = droppingBoxes;
  }, [droppingBoxes]);

  // Check for boxes that should be dropping with exponential backoff
  const checkForDroppingBoxes = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    
    try {
      const boxes = await loadDroppingBoxes(user.id);
      
      // Filter out boxes that are already actively dropping or have been claimed
      const boxesToDrop = boxes.filter(box => {
        if (activeDropsRef.current.has(box.id)) {
          return false;
        }
        
        const isAlreadyDropping = droppingBoxesRef.current.some(droppingBox => droppingBox.id === box.id);
        if (isAlreadyDropping) {
          return false;
        }
        
        return true;
      });
      
      if (boxesToDrop.length > 0) {
        // Reset consecutive empty checks when boxes are found
        setConsecutiveEmptyChecks(0);
        setCheckInterval(30000); // Reset to 30s when boxes are found
        
        // Update active drops
        setActiveDrops(prev => {
          const newSet = new Set(prev);
          boxesToDrop.forEach(box => newSet.add(box.id));
          return newSet;
        });
        
        // Add boxes to dropping list
        setDroppingBoxes(prev => [...prev, ...boxesToDrop]);
      } else {
        // Implement exponential backoff when no boxes are found
        setConsecutiveEmptyChecks(prev => {
          const newCount = prev + 1;
          
          // Exponential backoff: 30s -> 60s -> 120s -> 300s (5min) max
          if (newCount >= 1 && newCount < 3) {
            setCheckInterval(60000); // 1 minute after 1-2 empty checks
          } else if (newCount >= 3 && newCount < 6) {
            setCheckInterval(120000); // 2 minutes after 3-5 empty checks
          } else if (newCount >= 6) {
            setCheckInterval(300000); // 5 minutes after 6+ empty checks
          }
          
          return newCount;
        });
      }
    } catch (error) {
      // On error, increase interval to reduce load
      setConsecutiveEmptyChecks(prev => prev + 1);
    }
  }, [loadDroppingBoxes, user?.id]);

  // Don't render if user is not logged in
  if (!user?.id) {
    return null;
  }

  // Dynamic interval checking with exponential backoff
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up new interval with current checkInterval
    intervalRef.current = setInterval(checkForDroppingBoxes, checkInterval);
    
    // Initial check
    checkForDroppingBoxes();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkForDroppingBoxes, checkInterval]);

  const handleBoxClaim = useCallback((boxId: number) => {
    // Remove the box from dropping boxes
    setDroppingBoxes(prev => prev.filter(box => box.id !== boxId));
    setActiveDrops(prev => {
      const newSet = new Set(prev);
      newSet.delete(boxId);
      return newSet;
    });
    
    // Reset backoff when user interacts
    setConsecutiveEmptyChecks(0);
    setCheckInterval(30000);
  }, []);

  const handleAnimationComplete = useCallback((boxId: number) => {
    // Remove the box when animation completes (box reached bottom)
    setDroppingBoxes(prev => prev.filter(box => box.id !== boxId));
    setActiveDrops(prev => {
      const newSet = new Set(prev);
      newSet.delete(boxId);
      return newSet;
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {droppingBoxes.map((box) => (
        <div key={`dropping-${box.id}`} className="pointer-events-auto">
          <DroppingBox
            box={box}
            onClaim={handleBoxClaim}
            onAnimationComplete={() => handleAnimationComplete(box.id)}
          />
        </div>
      ))}
    </div>
  );
});

BoxDropManager.displayName = 'BoxDropManager';

export default BoxDropManager;