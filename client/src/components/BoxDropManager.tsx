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

  // Check for boxes that should be dropping
  const checkForDroppingBoxes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const boxes = await loadDroppingBoxes(user.id);
      const now = new Date();
      
      // Filter boxes that should drop now (20 seconds after creation)
      const boxesToDrop = boxes.filter(box => {
        const createdTime = new Date(box.createdAt);
        const dropTime = new Date(createdTime.getTime() + 20 * 1000); // 20 seconds after creation
        return dropTime <= now && !activeDrops.has(box.id);
      });
      
      // Add new dropping boxes
      boxesToDrop.forEach(box => {
        if (!activeDrops.has(box.id)) {
          setDroppingBoxes(prev => [...prev, box]);
          setActiveDrops(prev => new Set([...prev, box.id]));
        }
      });
    } catch (error) {
      console.error('Error checking for dropping boxes:', error);
    }
  }, [user?.id, loadDroppingBoxes, activeDrops]);

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
        <DroppingBox
          key={`dropping-${box.id}`}
          box={box}
          onClaim={handleBoxClaim}
          onAnimationComplete={() => handleAnimationComplete(box.id)}
        />
      ))}
    </div>
  );
};

export default BoxDropManager;