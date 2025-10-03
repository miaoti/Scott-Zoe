import React, { useState, useEffect, useCallback } from 'react';
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
  const { loadDroppingBoxes } = useSurpriseBoxStore();
  const { user } = useAuth();
  
  console.log('BoxDropManager: Component mounted/rendered, user:', user);

  // Check for boxes that should be dropping
  const checkForDroppingBoxes = useCallback(async () => {
    console.log('BoxDropManager: Checking for dropping boxes, user:', user);
    
    if (!user?.id) {
      console.log('BoxDropManager: No user ID, skipping check');
      return;
    }
    
    try {
      console.log('BoxDropManager: Loading dropping boxes for user ID:', user.id);
      const boxes = await loadDroppingBoxes(user.id);
      
      console.log('BoxDropManager: Received boxes from API:', boxes);
      
      // The backend now returns only boxes that are ready to drop (dropAt time has passed)
      // Filter out boxes that are already actively dropping
      const boxesToDrop = boxes.filter(box => !activeDrops.has(box.id));
      
      console.log('BoxDropManager: Boxes ready to drop (filtered):', boxesToDrop);
      console.log('BoxDropManager: Currently active drops:', Array.from(activeDrops));
      
      if (boxesToDrop.length > 0) {
        console.log('BoxDropManager: Adding boxes to dropping animation');
        setDroppingBoxes(prev => {
          const existingIds = new Set(prev.map(box => box.id));
          const newBoxes = boxesToDrop.filter(box => !existingIds.has(box.id));
          console.log('BoxDropManager: New boxes to add:', newBoxes);
          return [...prev, ...newBoxes];
        });
        
        // Mark these boxes as actively dropping
        setActiveDrops(prev => {
          const newSet = new Set(prev);
          boxesToDrop.forEach(box => newSet.add(box.id));
          console.log('BoxDropManager: Updated active drops:', Array.from(newSet));
          return newSet;
        });
      } else {
        console.log('BoxDropManager: No new boxes to drop');
      }
    } catch (error) {
      console.error('BoxDropManager: Error checking for dropping boxes:', error);
    }
  }, [loadDroppingBoxes, user?.id, activeDrops]);

  // Don't render if user is not logged in
  if (!user?.id) {
    return null;
  }

  // Check for dropping boxes every 2 seconds
  useEffect(() => {
    const interval = setInterval(checkForDroppingBoxes, 2000);
    
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