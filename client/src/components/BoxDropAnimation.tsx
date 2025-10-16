import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Heart } from 'lucide-react';

interface BoxDropAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
  boxTitle?: string;
  fromUser?: string;
  duration?: number;
}

const BoxDropAnimation: React.FC<BoxDropAnimationProps> = memo(({
  isVisible,
  onComplete,
  boxTitle = 'Surprise Box',
  fromUser = 'Someone Special',
  duration = 3000
}) => {
  const [showSparkles, setShowSparkles] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show sparkles after box lands
      const sparkleTimer = setTimeout(() => {
        setShowSparkles(true);
      }, 1500);

      // Show message after sparkles
      const messageTimer = setTimeout(() => {
        setShowMessage(true);
      }, 2000);

      // Complete animation
      const completeTimer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => {
        clearTimeout(sparkleTimer);
        clearTimeout(messageTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setShowSparkles(false);
      setShowMessage(false);
    }
  }, [isVisible, onComplete, duration]);

  const sparklePositions = [
    { top: '20%', left: '15%', delay: 0 },
    { top: '30%', left: '80%', delay: 0.2 },
    { top: '60%', left: '10%', delay: 0.4 },
    { top: '70%', left: '85%', delay: 0.6 },
    { top: '40%', left: '50%', delay: 0.8 },
    { top: '80%', left: '60%', delay: 1.0 },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        >
          {/* Background gradient */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20"
          />

          {/* Sparkles */}
          <AnimatePresence>
            {showSparkles && sparklePositions.map((pos, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1.5, 1, 0], 
                  opacity: [0, 1, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2, 
                  delay: pos.delay,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="absolute text-yellow-300"
                style={{ top: pos.top, left: pos.left }}
              >
                <Sparkles size={24} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Main animation container */}
          <div className="relative flex flex-col items-center">
            {/* Falling box */}
            <motion.div
              initial={{ y: -200, rotate: -10, scale: 0.5 }}
              animate={{ 
                y: 0, 
                rotate: [0, 5, -5, 0], 
                scale: 1 
              }}
              transition={{ 
                y: { duration: 1, ease: "easeOut" },
                rotate: { duration: 0.5, delay: 1, repeat: 2 },
                scale: { duration: 0.3, delay: 0.8 }
              }}
              className="relative"
            >
              {/* Box shadow */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.3 }}
                transition={{ delay: 1, duration: 0.3 }}
                className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full blur-sm"
              />

              {/* Gift box */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative bg-gradient-to-br from-pink-500 to-purple-600 p-8 rounded-2xl shadow-2xl"
              >
                {/* Box ribbon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
                  <div className="absolute w-4 h-full bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
                </div>

                {/* Gift icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    delay: 1.5
                  }}
                  className="relative z-10 text-white"
                >
                  <Gift size={48} />
                </motion.div>

                {/* Floating hearts */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="absolute -top-2 -right-2"
                >
                  <motion.div
                    animate={{ 
                      y: [-5, -15, -5],
                      x: [0, 5, 0],
                      rotate: [0, 10, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-red-400"
                  >
                    <Heart size={20} fill="currentColor" />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Message */}
            <AnimatePresence>
              {showMessage && (
                <motion.div
                  initial={{ y: 20, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -20, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8 text-center bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-sm mx-4"
                >
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-gray-800 mb-2"
                  >
                    {boxTitle}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 mb-4"
                  >
                    A surprise from {fromUser} has arrived!
                  </motion.p>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    className="flex justify-center space-x-1"
                  >
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                        className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                      />
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BoxDropAnimation;