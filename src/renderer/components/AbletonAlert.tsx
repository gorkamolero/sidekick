import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../lib/store';

export const AbletonAlert: React.FC = () => {
  const [isAbletonRunning, setIsAbletonRunning] = useState(false);
  const { linkState } = useStore();
  
  useEffect(() => {
    // Listen for Ableton running status
    const unsubscribe = window.electron.abletonLink.onAbletonStatus((isRunning: boolean) => {
      setIsAbletonRunning(isRunning);
    });
    
    return unsubscribe;
  }, []);

  // Show alert if Ableton is running but Link is not enabled or connected
  const showAlert = isAbletonRunning && (!linkState.isEnabled || !linkState.isConnected);

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute top-0 left-0 right-0 z-50"
        >
          <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-4 py-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-white rounded-full animate-ping absolute"></div>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span className="font-bold text-lg tracking-wide">
                  🎹 ABLETON LIVE DETECTED
                </span>
                <span className="text-sm opacity-90">
                  {!linkState.isEnabled 
                    ? "Enable Link to sync with your DAW" 
                    : "Waiting for Link connection..."}
                </span>
              </div>
              
              {!linkState.isEnabled && (
                <button
                  onClick={async () => {
                    await window.electron.abletonLink.enable();
                  }}
                  className="px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                >
                  ENABLE LINK NOW →
                </button>
              )}
            </div>
          </div>
          
          {/* Animated gradient border at bottom */}
          <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 animate-pulse"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};