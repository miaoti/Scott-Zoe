import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const BoxDropManager: React.FC = () => {
  const [droppingBoxes, setDroppingBoxes] = useState<DroppingBoxData[]>([]);
  const [activeDrops, setActiveDrops] = useState<Set<number>>(new Set());
  const activeDropsRef = useRef<Set<number>>(new Set());
  const droppingBoxesRef = useRef<DroppingBoxData[]>([]);
  const { loadDroppingBoxes } = useSurpriseBoxStore();
  const { user } = useAuth();
  
  // console.log('BoxDropManager: Component mounted/rendered, user:', user);
  
  // Keep refs in sync with state
  useEffect(() => {
    activeDropsRef.current = activeDrops;
  }, [activeDrops]);
  
  useEffect(() => {
    droppingBoxesRef.current = droppingBoxes;
  }, [droppingBoxes]);

  // Check for boxes that should be dropping
  const checkForDroppingBoxes = useCallback(async () => {
    // console.log('BoxDropManager: Checking for dropping boxes, user:', user);
    
    if (!user?.id) {
      // console.log('BoxDropManager: No user ID, skipping check');
      return;
    }
    
    try {
      // console.log('BoxDropManager: Loading dropping boxes for user ID:', user.id);
      const boxes = await loadDroppingBoxes(user.id);
      
      // console.log('BoxDropManager: Received boxes from API:', boxes);
      
      // Filter out boxes that are already actively dropping or have been claimed
      const boxesToDrop = boxes.filter(box => {
        // Don't add if already actively dropping
        if (activeDropsRef.current.has(box.id)) {
          return false;
        }
        
        // Don't add if already in dropping boxes list
        const isAlreadyDropping = droppingBoxesRef.current.some(droppingBox => droppingBox.id === box.id);
        if (isAlreadyDropping) {
          return false;
        }
        
        // Only add boxes that should be dropping
        return true;
      });
      
      // console.log('BoxDropManager: Boxes ready to drop (filtered):', boxesToDrop);
      // console.log('BoxDropManager: Currently active drops:', Array.from(activeDropsRef.current));
      
      if (boxesToDrop.length > 0) {
        // console.log('BoxDropManager: Adding boxes to dropping animation');
        
        // Update active drops
        setActiveDrops(prev => {
          const newSet = new Set(prev);
          boxesToDrop.forEach(box => newSet.add(box.id));
          // console.log('BoxDropManager: Updated active drops:', Array.from(newSet));
          return newSet;
        });
        
        // Add boxes to dropping list
        setDroppingBoxes(prev => [...prev, ...boxesToDrop]);
      } else {
        // console.log('BoxDropManager: No new boxes to drop');
      }
    } catch (error) {

    }
  }, [loadDroppingBoxes, user?.id]);

  // Don't render if user is not logged in
  if (!user?.id) {
    return null;
  }

  // Check for dropping boxes every 5 seconds (reduced frequency to prevent spam)
  useEffect(() => {
    const interval = setInterval(checkForDroppingBoxes, 5000);
    
    // Initial check
    checkForDroppingBoxes();
    
    return () => clearInterval(interval);
  }, [checkForDroppingBoxes]);

  const handleBoxClaim = (boxId: number) => {
    // Remove the box from dropping boxes
    setDroppingBoxes(prev => prev.filter(box => box.id !== boxId));
    setActiveDrops(prev => {
      const newSet = new Set(prev);
      newSet.delete(boxId);
      return newSet;
    });
  };

  const handleAnimationComplete = (boxId: number) => {
    // Remove the box when animation completes (box reached bottom)
    setDroppingBoxes(prev => prev.filter(box => box.id !== boxId));
    setActiveDrops(prev => {
      const newSet = new Set(prev);
      newSet.delete(boxId);
      return newSet;
    });
  };

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
};

export default BoxDropManager;